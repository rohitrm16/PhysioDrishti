// Eval runner. Runs the golden set (eval_questions) through the SAME pipeline as
// /api/ask, scores each answer, and saves one row per question to eval_results.
//
//   Start a run (auto-continues in the browser until done):
//     /api/eval?key=YOUR_SECRET&auto=1
//   Options: &limit=3 (questions per batch)  &only=q01,q27 (subset)
import { admin } from '../lib/db.js'
import { isAuthorised, setEvalSessionCookie } from '../lib/auth.js'
import { answerQuestion } from '../lib/rag.js'
import { judgeGroundedness } from '../lib/judge.js'
import { scoreRetrieval, scoreRefusal } from '../lib/evalScore.js'
import { GEN_MODEL } from '../lib/gemini.js'

export const config = { maxDuration: 60 }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function newRunId() {
  const d = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 13)
  return `run_${d}_${GEN_MODEL}`
}

export async function evaluateOne(q, runId) {
  let r
  try {
    r = await answerQuestion(q.question)
  } catch (err) {
    return {
      question_id: q.id, run_id: runId, model: GEN_MODEL, refused: null, reason: 'error',
      answer: null, retrieval_hit: null, refusal_correct: false, groundedness: null,
      notes: 'pipeline error: ' + String(err.message || err).slice(0, 300),
    }
  }

  const retrieval = scoreRetrieval(q.expected_source_ids, r.retrieved, q.should_refuse)
  const refusal_correct = scoreRefusal(q, r)

  let groundedness = null
  let judge_rationale = null
  let judge_cost_usd = 0
  if (!r.refused && r.answer && r.context) {
    try {
      const j = await judgeGroundedness(r.context, r.answer)
      groundedness = j.score
      judge_rationale = j.rationale + (j.unsupported.length ? ' | Unsupported: ' + j.unsupported.join('; ') : '')
      judge_cost_usd = j.cost_usd
    } catch (err) {
      judge_rationale = 'judge error: ' + String(err.message || err).slice(0, 200)
    }
  }

  return {
    question_id: q.id,
    run_id: runId,
    session_id: r.session,
    model: r.model || GEN_MODEL,
    refused: r.refused,
    reason: r.reason,
    answer: r.answer,
    retrieved_ids: retrieval.retrieved_ids,
    retrieval_hit: retrieval.retrieval_hit,
    retrieval_rank: retrieval.retrieval_rank,
    refusal_correct,
    groundedness,
    judge_rationale,
    judge_cost_usd,
    tool_calls: r.tool_calls,
    latency_ms: r.latency_ms,
    tokens_in: r.tokens_in,
    tokens_out: r.tokens_out,
    cost_usd: r.cost_usd,
    notes: q.category,
  }
}

function page(title, body, refreshUrl) {
  const meta = refreshUrl ? `<meta http-equiv="refresh" content="2;url=${refreshUrl}">` : ''
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">${meta}
<title>${title}</title></head><body style="font-family:system-ui,sans-serif;padding:24px;max-width:640px;margin:auto;line-height:1.5">
<h2 style="color:#12382A">${title}</h2>${body}</body></html>`
}

export default async function handler(req, res) {
  if (!isAuthorised(req)) return res.status(401).json({ error: 'unauthorised' })
  // Set cookie on first auth so key never appears in subsequent redirect URLs
  if (req.query.key) setEvalSessionCookie(res, String(process.env.EVAL_SECRET || process.env.INGEST_SECRET || ''))

  const runId = String(req.query.run || newRunId())
  const offset = Math.max(0, Number(req.query.offset) || 0)
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 3), 8)
  const only = req.query.only ? String(req.query.only).split(',').map((s) => s.trim()) : null
  const auto = req.query.auto === '1'

  try {
    let query = admin.from('eval_questions')
      .select('id, external_id, question, category, should_refuse, expected_reason, expected_source_ids')
      .order('external_id')
    if (only) query = query.in('external_id', only)
    const { data: all, error } = await query
    if (error) throw error
    if (!all.length) throw new Error('No questions found. Run sql/seed_eval_questions.sql first.')

    const batch = all.slice(offset, offset + limit)
    const done = []
    for (const q of batch) {
      const row = await evaluateOne(q, runId)
      const { error: insErr } = await admin.from('eval_results').insert(row)
      if (insErr) throw insErr
      done.push({ id: q.external_id, refusal_correct: row.refusal_correct, retrieval_hit: row.retrieval_hit, groundedness: row.groundedness })
      await sleep(1500)   // stay under free-tier rate limits
    }

    const nextOffset = offset + batch.length
    const remaining = Math.max(0, all.length - nextOffset)
    // key intentionally excluded — subsequent redirects authenticate via cookie
    const params = new URLSearchParams({ run: runId, offset: String(nextOffset), limit: String(limit) })
    if (only) params.set('only', only.join(','))
    if (auto) params.set('auto', '1')
    const nextUrl = `/api/eval?${params.toString()}`

    if (!auto) {
      return res.status(200).json({ run_id: runId, processed: done, next_offset: nextOffset, remaining, next_url: remaining ? nextUrl : null })
    }

    const progress = `<p><b>Run:</b> ${runId}</p><p><b>Done:</b> ${nextOffset} of ${all.length}</p>`
    if (remaining) {
      res.setHeader('Content-Type', 'text/html')
      return res.status(200).send(page('Running evals…', progress + '<p>Keep this tab open. It continues automatically.</p>', nextUrl))
    }
    res.setHeader('Content-Type', 'text/html')
    return res.status(200).send(page('Eval run complete ✅', progress + '<p>Open the dashboard → Evals tab to see scores and failures.</p>'))
  } catch (err) {
    console.error(err)
    const msg = String(err.message || err)
    if (auto) {
      res.setHeader('Content-Type', 'text/html')
      return res.status(500).send(page('Eval run stopped', `<p>${msg.replace(/</g, '&lt;')}</p><p>Reload this page to retry this batch.</p>`))
    }
    return res.status(500).json({ error: msg })
  }
}
