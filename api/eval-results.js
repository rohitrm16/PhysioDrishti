// GET  /api/eval-results            -> latest run: aggregate scores, failures, review queue
// GET  /api/eval-results?run=RUN_ID -> a specific run
// POST /api/eval-results  { key, result_id, human_groundedness, human_notes }  -> save a human review
//
// GET returns only synthetic eval data (no patient data). POST requires the admin secret.
import { admin } from '../lib/db.js'
import { isAuthorised } from '../lib/auth.js'
import { aggregate, isFailure, needsReview } from '../lib/evalScore.js'

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      if (!isAuthorised(req)) return res.status(401).json({ error: 'unauthorised' })
      const { result_id, human_groundedness, human_notes } = req.body || {}
      if (![0, 0.5, 1].includes(Number(human_groundedness))) {
        return res.status(400).json({ error: 'human_groundedness must be 0, 0.5 or 1' })
      }
      const { error } = await admin.from('eval_results').update({
        human_groundedness: Number(human_groundedness),
        human_notes: human_notes ? String(human_notes).slice(0, 500) : null,
        reviewed_at: new Date().toISOString(),
      }).eq('id', Number(result_id))
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    // Recent runs (newest first)
    const { data: recent, error: e1 } = await admin
      .from('eval_results').select('run_id, run_at').order('run_at', { ascending: false }).limit(1000)
    if (e1) throw e1
    const runs = [...new Set(recent.map((r) => r.run_id).filter(Boolean))].slice(0, 10)
    const runId = String(req.query.run || runs[0] || '')
    if (!runId) return res.status(200).json({ runs: [], run_id: null, summary: null, rows: [] })

    const { data, error } = await admin
      .from('eval_results')
      .select('*, eval_questions(external_id, question, category, should_refuse, expected_reason, expected_source_ids)')
      .eq('run_id', runId)
      .order('id')
    if (error) throw error

    const rows = data.map((r) => ({
      ...r,
      external_id: r.eval_questions?.external_id,
      question: r.eval_questions?.question,
      category: r.eval_questions?.category,
      should_refuse: r.eval_questions?.should_refuse,
      expected_reason: r.eval_questions?.expected_reason,
      expected_source_ids: r.eval_questions?.expected_source_ids,
      eval_questions: undefined,
      tool_calls: undefined,
    }))

    res.status(200).json({
      runs,
      run_id: runId,
      summary: aggregate(rows),
      failures: rows.filter(isFailure),
      review_queue: rows.filter(needsReview),
      rows,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err.message || err) })
  }
}
