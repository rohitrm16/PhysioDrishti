// Pure scoring + aggregation functions (no network), so they are easy to unit-test.

// Retrieval: did any expected document appear in the retrieved list? At what rank?
export function scoreRetrieval(expectedIds, retrieved, shouldRefuse) {
  if (shouldRefuse || !expectedIds?.length) return { retrieval_hit: null, retrieval_rank: null, retrieved_ids: uniqDocs(retrieved) }
  const ids = uniqDocs(retrieved)
  const idx = ids.findIndex((id) => expectedIds.map(Number).includes(Number(id)))
  return { retrieval_hit: idx >= 0, retrieval_rank: idx >= 0 ? idx + 1 : null, retrieved_ids: ids }
}

function uniqDocs(retrieved) {
  return [...new Set((retrieved || []).map((r) => Number(r.document_id)))]
}

// Refusal: correct if refused exactly when it should, and for the right reason when one is expected.
export function scoreRefusal(question, result) {
  if (Boolean(result.refused) !== Boolean(question.should_refuse)) return false
  if (question.should_refuse && question.expected_reason) return result.reason === question.expected_reason
  return true
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const pct = (xs, p) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]
}

// A row "needs human review" if the judge was unsure or it falls in a 1-in-4 sample.
export function needsReview(row) {
  if (row.groundedness === null || row.groundedness === undefined) return false
  if (row.human_groundedness !== null && row.human_groundedness !== undefined) return false
  return Number(row.groundedness) < 1 || Number(row.id) % 4 === 0
}

export function aggregate(rows) {
  const num = (v) => (v === null || v === undefined ? null : Number(v))
  const ret = rows.filter((r) => r.retrieval_hit !== null && r.retrieval_hit !== undefined)
  const grounded = rows.map((r) => num(r.groundedness)).filter((v) => v !== null)
  const finalGrounded = rows
    .map((r) => num(r.human_groundedness) ?? num(r.groundedness))
    .filter((v) => v !== null)
  const reviewed = rows.filter((r) => num(r.human_groundedness) !== null)
  const agree = reviewed.filter((r) => num(r.groundedness) === num(r.human_groundedness))
  const lat = rows.map((r) => num(r.latency_ms)).filter((v) => v !== null)

  const byCategory = {}
  for (const r of rows) {
    const c = r.category || 'unknown'
    byCategory[c] ||= { n: 0, refusal_correct: 0, retrieval_hits: 0, retrieval_n: 0 }
    byCategory[c].n += 1
    if (r.refusal_correct) byCategory[c].refusal_correct += 1
    if (r.retrieval_hit !== null && r.retrieval_hit !== undefined) {
      byCategory[c].retrieval_n += 1
      if (r.retrieval_hit) byCategory[c].retrieval_hits += 1
    }
  }

  return {
    n: rows.length,
    retrieval_hit_rate: ret.length ? ret.filter((r) => r.retrieval_hit).length / ret.length : null,
    mrr: ret.length ? mean(ret.map((r) => (r.retrieval_rank ? 1 / r.retrieval_rank : 0))) : null,
    groundedness_judge: mean(grounded),
    groundedness_final: mean(finalGrounded),
    human_reviewed: reviewed.length,
    judge_human_agreement: reviewed.length ? agree.length / reviewed.length : null,
    refusal_accuracy: rows.length ? rows.filter((r) => r.refusal_correct).length / rows.length : null,
    latency_avg_ms: mean(lat),
    latency_p95_ms: pct(lat, 95),
    cost_total_usd: rows.reduce((a, r) => a + (num(r.cost_usd) || 0), 0),
    judge_cost_total_usd: rows.reduce((a, r) => a + (num(r.judge_cost_usd) || 0), 0),
    by_category: byCategory,
  }
}

export function isFailure(row) {
  const g = row.human_groundedness ?? row.groundedness
  return row.retrieval_hit === false || row.refusal_correct === false || (g !== null && g !== undefined && Number(g) < 1)
                                                                          }
