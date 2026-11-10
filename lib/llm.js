// Provider-agnostic chat with tool calling. Same interface for Gemini and Claude:
//   const chat = createChat({ system, tools })
//   chat.addHistory(turns); chat.addUser(text)
//   const r = await chat.step()   -> { text, calls:[{id,name,args}], tokensIn, tokensOut, costUsd, model }
//   chat.addToolResults([{ id, name, result }])
import { GEN_MODEL, costUsd as geminiCost } from './gemini.js'

export const PROVIDER = String(process.env.LLM_PROVIDER || 'gemini').toLowerCase()
export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function postJson(url, headers, body, label, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
    if (res.ok) return res.json()
    if ((res.status === 429 || res.status >= 500) && i < tries - 1) { await sleep(1000 * 2 ** i); continue }
    throw new Error(`${label} ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
}

// Gemini expects upper-case schema types (OBJECT, STRING, ...)
function toGeminiSchema(s) {
  if (!s || typeof s !== 'object') return s
  const out = {}
  for (const [k, v] of Object.entries(s)) {
    if (k === 'type') out.type = String(v).toUpperCase()
    else if (k === 'properties') out.properties = Object.fromEntries(Object.entries(v).map(([p, ps]) => [p, toGeminiSchema(ps)]))
    else if (k === 'items') out.items = toGeminiSchema(v)
    else out[k] = v
  }
  return out
}

// Keep history alternating user/assistant and starting with the user
function cleanHistory(turns = []) {
  const out = []
  for (const t of turns.slice(-8)) {
    const role = t.role === 'assistant' ? 'assistant' : 'user'
    const text = String(t.text || '').slice(0, 500)
    if (!text) continue
    if (!out.length && role === 'assistant') continue
    if (out.length && out[out.length - 1].role === role) out[out.length - 1].text += '\n' + text
    else out.push({ role, text })
  }
  if (out.length && out[out.length - 1].role === 'user') out.pop()   // current message is added separately
  return out
}

function geminiChat({ system, tools }) {
  const contents = []
  const decl = tools.map((t) => ({ name: t.name, description: t.description, parameters: toGeminiSchema(t.schema) }))
  return {
    model: GEN_MODEL,
    addHistory(turns) { for (const t of cleanHistory(turns)) contents.push({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.text }] }) },
    addUser(text) { contents.push({ role: 'user', parts: [{ text }] }) },
    async step() {
      const data = await postJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEN_MODEL}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY || '')}`,
        {},
        { systemInstruction: { parts: [{ text: system }] }, contents, tools: [{ functionDeclarations: decl }], generationConfig: { temperature: 0.2, maxOutputTokens: 600 } },
        'Gemini'
      )
      const parts = data.candidates?.[0]?.content?.parts || []
      if (parts.length) contents.push({ role: 'model', parts })
      const calls = parts.filter((p) => p.functionCall).map((p, i) => ({ id: String(i), name: p.functionCall.name, args: p.functionCall.args || {} }))
      const text = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join('')
      const u = data.usageMetadata || {}
      const tokensIn = u.promptTokenCount || 0
      const tokensOut = u.candidatesTokenCount || 0
      return { text, calls, tokensIn, tokensOut, costUsd: geminiCost(tokensIn, tokensOut), model: GEN_MODEL }
    },
    addToolResults(results) {
      contents.push({ role: 'user', parts: results.map((r) => ({ functionResponse: { name: r.name, response: { result: r.result } } })) })
    },
  }
}

function claudeChat({ system, tools }) {
  const messages = []
  const defs = tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.schema }))
  const pin = process.env.CLAUDE_PRICE_IN_PER_M
  const pout = process.env.CLAUDE_PRICE_OUT_PER_M
  return {
    model: CLAUDE_MODEL,
    addHistory(turns) { for (const t of cleanHistory(turns)) messages.push({ role: t.role, content: t.text }) },
    addUser(text) { messages.push({ role: 'user', content: text }) },
    async step() {
      const data = await postJson(
        'https://api.anthropic.com/v1/messages',
        { 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01' },
        { model: CLAUDE_MODEL, max_tokens: 600, temperature: 0.2, system, tools: defs, messages },
        'Claude'
      )
      const blocks = data.content || []
      messages.push({ role: 'assistant', content: blocks })
      const calls = blocks.filter((b) => b.type === 'tool_use').map((b) => ({ id: b.id, name: b.name, args: b.input || {} }))
      const text = blocks.filter((b) => b.type === 'text').map((b) => b.text).join('')
      const tokensIn = data.usage?.input_tokens || 0
      const tokensOut = data.usage?.output_tokens || 0
      const cost = pin && pout ? (tokensIn * Number(pin) + tokensOut * Number(pout)) / 1e6 : null
      return { text, calls, tokensIn, tokensOut, costUsd: cost, model: CLAUDE_MODEL }
    },
    addToolResults(results) {
      messages.push({ role: 'user', content: results.map((r) => ({ type: 'tool_result', tool_use_id: r.id, content: JSON.stringify(r.result) })) })
    },
  }
}

export function createChat({ system, tools, provider = PROVIDER }) {
  return provider === 'claude' ? claudeChat({ system, tools }) : geminiChat({ system, tools })
}
