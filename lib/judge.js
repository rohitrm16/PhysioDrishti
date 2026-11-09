// LLM-as-judge for groundedness. Uses a fixed rubric and returns 1, 0.5 or 0.
// Same-family judges can be lenient on their own answers, so a human reviews
// a sample of these scores in the Evals dashboard.
import { generate, costUsd } from './gemini.js'

const RUBRIC = [
  'You are a strict evaluator. Judge whether the ANSWER is supported by the SOURCES.',
  'Score 1.0 if every factual or medical claim is directly supported by the sources.',
  'Score 0.5 if it is mostly supported but includes one minor detail not found in the sources, and nothing contradicts them.',
  'Score 0.0 if any claim contradicts the sources, if it gives medical advice not in the sources, or if most of it is unsupported.',
  'Ignore citation markers like [1] and generic closing lines suggesting a free call or seeing a doctor.',
  'Return ONLY a JSON object, no other text:',
  '{"score": 1.0, "unsupported_claims": ["..."], "rationale": "one sentence"}',
].join(' ')

export async function judgeGroundedness(context, answer) {
  const out = await generate(RUBRIC, `SOURCES:\n${context}\n\nANSWER:\n${answer}`)
  let parsed = null
  const match = out.text.match(/\{[\s\S]*\}/)
  if (match) {
    try { parsed = JSON.parse(match[0]) } catch { parsed = null }
  }
  const s = Number(parsed?.score)
  return {
    score: [0, 0.5, 1].includes(s) ? s : null,
    rationale: parsed?.rationale || 'Judge output could not be parsed: ' + out.text.slice(0, 120),
    unsupported: Array.isArray(parsed?.unsupported_claims) ? parsed.unsupported_claims : [],
    cost_usd: costUsd(out.tokensIn, out.tokensOut),
  }
}
