const BASE = 'https://generativelanguage.googleapis.com/v1beta'

export const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001'
export const GEN_MODEL   = process.env.GEMINI_MODEL       || 'gemini-3.5-flash-lite'
export const DIMS        = 768   // must match vector(768) in the chunks table

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// POST with retry on rate limits (429) and server errors (5xx)
async function call(path, body, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(`${BASE}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
    })
    if (res.ok) return res.json()
    if ((res.status === 429 || res.status >= 500) && i < tries - 1) {
      await sleep(1000 * 2 ** i)
      continue
    }
    const text = await res.text()
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`)
  }
}

// Embed document chunks (task type RETRIEVAL_DOCUMENT), 10 per request
export async function embedDocuments(texts) {
  const out = []
  for (let i = 0; i < texts.length; i += 10) {
    const batch = texts.slice(i, i + 10)
    const data = await call(`models/${EMBED_MODEL}:batchEmbedContents`, {
      requests: batch.map((t) => ({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text: t }] },
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: DIMS,
      })),
    })
    out.push(...data.embeddings.map((e) => e.values))
    if (i + 10 < texts.length) await sleep(1200)   // be gentle with free-tier limits
  }
  return out
}

// Embed a user question (task type RETRIEVAL_QUERY)
export async function embedQuery(text) {
  const data = await call(`models/${EMBED_MODEL}:embedContent`, {
    content: { parts: [{ text }] },
    taskType: 'RETRIEVAL_QUERY',
    outputDimensionality: DIMS,
  })
  return data.embedding.values
}

// Generate an answer
export async function generate(system, prompt) {
  const data = await call(`models/${GEN_MODEL}:generateContent`, {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
  })
  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text).join('')
  const u = data.usageMetadata || {}
  return { text, tokensIn: u.promptTokenCount || 0, tokensOut: u.candidatesTokenCount || 0 }
}

// Multi-turn chat with optional Gemini function calling.
// contents: Gemini contents array built by the caller.
// toolDefs: array of { name, description, schema } from TOOL_DEFS.
// Returns: { text, functionCall, role, parts, tokensIn, tokensOut }
export async function chat(system, contents, toolDefs = []) {
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
  }
  if (toolDefs.length) {
    body.tools = [{ functionDeclarations: toolDefs.map((t) => ({ name: t.name, description: t.description, parameters: t.schema })) }]
  }
  const data = await call(`models/${GEN_MODEL}:generateContent`, body)
  const candidate = data.candidates?.[0]?.content
  const parts = candidate?.parts || []
  const functionCall = parts.find((p) => p.functionCall)?.functionCall || null
  const text = parts.filter((p) => p.text).map((p) => p.text).join('')
  const u = data.usageMetadata || {}
  return { text, functionCall, role: candidate?.role || 'model', parts, tokensIn: u.promptTokenCount || 0, tokensOut: u.candidatesTokenCount || 0 }
}

// Equivalent paid-tier cost. Override prices with PRICE_IN_PER_M / PRICE_OUT_PER_M
// (USD per million tokens). Defaults are placeholders; check Google's pricing page.
export function costUsd(tokensIn, tokensOut) {
  const pin  = Number(process.env.PRICE_IN_PER_M  ?? 0.10)
  const pout = Number(process.env.PRICE_OUT_PER_M ?? 0.40)
  return (tokensIn * pin + tokensOut * pout) / 1e6
}
