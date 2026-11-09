/**
 * PhysioDrishti — Evals tab
 * Shows aggregate eval scores, per-category results, failures, and a
 * human-review queue for groundedness (LLM judges can be inconsistent).
 * Data comes from /api/eval-results (server-side; no keys in the browser).
 */
import { useState, useEffect } from 'react'

const C = {
  forest:'#12382A', teal:'#0A6B5E', mint:'#3A9A6B', saffron:'#D4510E',
  ink:'#0D1520', gray:'#5C6878', light:'#F3F6FA', border:'#DDE4EF',
  red:'#B83232', green:'#177A45', amber:'#C47D10',
}
const font = "'Plus Jakarta Sans',sans-serif"
const pct = (v) => (v === null || v === undefined ? '—' : Math.round(v * 100) + '%')
const num = (v, d = 2) => (v === null || v === undefined ? '—' : Number(v).toFixed(d))
const ms = (v) => (v === null || v === undefined ? '—' : (v / 1000).toFixed(1) + 's')
const usd = (v) => (v === null || v === undefined ? '—' : '$' + Number(v).toFixed(4))

function Card({ label, value, sub, tone }) {
  const col = tone === 'good' ? C.green : tone === 'bad' ? C.red : C.ink
  return (
    <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 16px' }}>
      <div style={{ fontFamily:font, fontSize:11, fontWeight:700, color:C.gray, textTransform:'uppercase', letterSpacing:1 }}>{label}</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.6rem', fontWeight:900, color:col, marginTop:4 }}>{value}</div>
      {sub && <div style={{ fontFamily:font, fontSize:11, color:C.gray, marginTop:2 }}>{sub}</div>}
    </div>
  )
}

function tone(v, good, ok) {
  if (v === null || v === undefined) return null
  return v >= good ? 'good' : v >= ok ? null : 'bad'
}

function Badge({ text, color }) {
  return (
    <span style={{ fontFamily:font, fontSize:10, fontWeight:700, color, border:`1px solid ${color}`, borderRadius:20, padding:'2px 8px', marginRight:6, whiteSpace:'nowrap' }}>
      {text}
    </span>
  )
}

function whyFailed(r) {
  const out = []
  if (r.retrieval_hit === false) out.push(['Retrieval miss', C.red])
  if (r.refusal_correct === false) {
    if (r.should_refuse && !r.refused) out.push(['Should have refused', C.red])
    else if (!r.should_refuse && r.refused) out.push(['Wrongly refused', C.red])
    else out.push(['Wrong refusal reason', C.amber])
  }
  const g = r.human_groundedness ?? r.groundedness
  if (g !== null && g !== undefined && Number(g) < 1) out.push([`Groundedness ${g}`, C.amber])
  return out
}

export default function Evals() {
  const [data, setData] = useState(null)
  const [run, setRun] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [secret, setSecret] = useState('')
  const [notes, setNotes] = useState({})
  const [saving, setSaving] = useState(null)

  const load = async (runId) => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/eval-results' + (runId ? '?run=' + encodeURIComponent(runId) : ''))
      const text = await res.text()
      let json
      try { json = JSON.parse(text) } catch {
        throw new Error('Eval API did not return JSON (status ' + res.status + '). Check that api/eval-results.js is deployed.')
      }
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setData(json)
      if (!runId && json.run_id) setRun(json.run_id)
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load('') }, [])

  const review = async (row, score) => {
    if (!secret) { setError('Enter the admin secret above to save reviews.'); return }
    setSaving(row.id); setError('')
    try {
      const res = await fetch('/api/eval-results', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ key: secret, result_id: row.id, human_groundedness: score, human_notes: notes[row.id] || '' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      await load(run)
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setSaving(null)
    }
  }

  const s = data?.summary
  const box = { background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:18, marginBottom:18 }
  const h = { fontFamily:font, fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:C.saffron, marginBottom:10 }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12, marginBottom:18 }}>
        <div>
          <div style={h}>RAG evaluation</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.25rem', fontWeight:800 }}>Golden set results</div>
          <div style={{ fontFamily:font, fontSize:12, color:C.gray, marginTop:4 }}>40 questions · retrieval, groundedness, refusals, latency and cost</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {data?.runs?.length > 0 && (
            <select value={run} onChange={(e) => { setRun(e.target.value); load(e.target.value) }}
              style={{ fontFamily:font, fontSize:12, padding:'8px 10px', borderRadius:7, border:`1px solid ${C.border}` }}>
              {data.runs.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
          <button onClick={() => load(run)} style={{ fontFamily:font, fontSize:12, fontWeight:700, padding:'8px 14px', borderRadius:7, border:'none', background:C.forest, color:'#fff', cursor:'pointer' }}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div style={{ ...box, borderColor:C.red, color:C.red, fontFamily:font, fontSize:13 }}>⚠️ {error}</div>}
      {loading && <div style={{ fontFamily:font, color:C.gray }}>Loading…</div>}

      {!loading && !s && !error && (
        <div style={{ ...box, fontFamily:font, fontSize:14, color:C.gray, lineHeight:1.7 }}>
          No eval runs yet. Start one by opening <b>/api/eval?key=YOUR_SECRET&amp;auto=1</b> in a new tab, then press Refresh here.
        </div>
      )}

      {s && (
        <>
          {/* Metric cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:12, marginBottom:18 }}>
            <Card label="Retrieval hit @5" value={pct(s.retrieval_hit_rate)} sub={`MRR ${num(s.mrr)}`} tone={tone(s.retrieval_hit_rate, 0.9, 0.75)} />
            <Card label="Groundedness" value={num(s.groundedness_final)} sub={`Judge only ${num(s.groundedness_judge)}`} tone={tone(s.groundedness_final, 0.9, 0.75)} />
            <Card label="Refusal accuracy" value={pct(s.refusal_accuracy)} sub={`${s.n} questions`} tone={tone(s.refusal_accuracy, 0.95, 0.85)} />
            <Card label="Human reviewed" value={s.human_reviewed} sub={`Judge agreement ${pct(s.judge_human_agreement)}`} />
            <Card label="Latency" value={ms(s.latency_avg_ms)} sub={`p95 ${ms(s.latency_p95_ms)}`} />
            <Card label="Cost (paid-tier est.)" value={usd(s.cost_total_usd)} sub={`Judge ${usd(s.judge_cost_total_usd)}`} />
          </div>

          {/* By category */}
          <div style={box}>
            <div style={h}>By category</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:font, fontSize:13 }}>
                <thead>
                  <tr style={{ textAlign:'left', color:C.gray, fontSize:11, textTransform:'uppercase' }}>
                    <th style={{ padding:8 }}>Category</th><th style={{ padding:8 }}>Questions</th>
                    <th style={{ padding:8 }}>Refusal correct</th><th style={{ padding:8 }}>Retrieval hits</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(s.by_category).map(([cat, v]) => (
                    <tr key={cat} style={{ borderTop:`1px solid ${C.border}` }}>
                      <td style={{ padding:8, fontWeight:700 }}>{cat}</td>
                      <td style={{ padding:8 }}>{v.n}</td>
                      <td style={{ padding:8, color: v.refusal_correct === v.n ? C.green : C.red }}>{v.refusal_correct}/{v.n}</td>
                      <td style={{ padding:8 }}>{v.retrieval_n ? `${v.retrieval_hits}/${v.retrieval_n}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Failures */}
          <div style={box}>
            <div style={h}>Failures ({data.failures.length})</div>
            {data.failures.length === 0 && <div style={{ fontFamily:font, fontSize:13, color:C.green }}>No failures in this run 🎉</div>}
            {data.failures.map((r) => (
              <div key={r.id} style={{ borderTop:`1px solid ${C.border}`, padding:'12px 0' }}>
                <div style={{ marginBottom:6 }}>
                  <Badge text={r.external_id} color={C.forest} />
                  <Badge text={r.category} color={C.gray} />
                  {whyFailed(r).map(([t, c]) => <Badge key={t} text={t} color={c} />)}
                </div>
                <div style={{ fontFamily:font, fontSize:14, fontWeight:700, color:C.ink, marginBottom:4 }}>{r.question}</div>
                <div style={{ fontFamily:font, fontSize:12, color:C.gray, lineHeight:1.6 }}>
                  Expected: {r.should_refuse ? `refuse${r.expected_reason ? ' (' + r.expected_reason + ')' : ''}` : `answer from docs [${(r.expected_source_ids || []).join(', ')}]`}
                  {' · '}Got: {r.refused ? `refused (${r.reason})` : `answered from docs [${(r.retrieved_ids || []).join(', ')}]`}
                </div>
                {r.answer && <div style={{ fontFamily:font, fontSize:12, color:C.ink, background:C.light, borderRadius:7, padding:10, marginTop:6, lineHeight:1.6 }}>{r.answer.slice(0, 400)}</div>}
                {r.judge_rationale && <div style={{ fontFamily:font, fontSize:11, color:C.amber, marginTop:6 }}>Judge: {r.judge_rationale}</div>}
                {r.human_notes && <div style={{ fontFamily:font, fontSize:11, color:C.teal, marginTop:4 }}>Reviewer: {r.human_notes}</div>}
              </div>
            ))}
          </div>

          {/* Human review */}
          <div style={box}>
            <div style={h}>Human review queue ({data.review_queue.length})</div>
            <div style={{ fontFamily:font, fontSize:12, color:C.gray, marginBottom:10, lineHeight:1.6 }}>
              Every answer the judge scored below 1, plus a 1-in-4 sample of the rest. Check the answer against the sources and give your own score.
            </div>
            <input type="password" placeholder="Admin secret (needed to save)" value={secret} onChange={(e) => setSecret(e.target.value)}
              style={{ fontFamily:font, fontSize:13, padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:7, width:'100%', maxWidth:320, marginBottom:12 }} />
            {data.review_queue.length === 0 && <div style={{ fontFamily:font, fontSize:13, color:C.green }}>Nothing waiting for review.</div>}
            {data.review_queue.map((r) => (
              <div key={r.id} style={{ borderTop:`1px solid ${C.border}`, padding:'12px 0' }}>
                <div style={{ marginBottom:6 }}>
                  <Badge text={r.external_id} color={C.forest} />
                  <Badge text={`Judge ${r.groundedness}`} color={Number(r.groundedness) < 1 ? C.amber : C.green} />
                </div>
                <div style={{ fontFamily:font, fontSize:14, fontWeight:700, marginBottom:6 }}>{r.question}</div>
                <div style={{ fontFamily:font, fontSize:12, background:C.light, borderRadius:7, padding:10, lineHeight:1.6 }}>{r.answer}</div>
                {r.judge_rationale && <div style={{ fontFamily:font, fontSize:11, color:C.amber, marginTop:6 }}>Judge: {r.judge_rationale}</div>}
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginTop:8 }}>
                  <input placeholder="Notes (optional)" value={notes[r.id] || ''} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                    style={{ fontFamily:font, fontSize:12, padding:'7px 10px', border:`1px solid ${C.border}`, borderRadius:7, flex:1, minWidth:160 }} />
                  {[1, 0.5, 0].map((v) => (
                    <button key={v} disabled={saving === r.id} onClick={() => review(r, v)}
                      style={{ fontFamily:font, fontSize:12, fontWeight:700, padding:'7px 14px', borderRadius:7, cursor:'pointer',
                               border:`1px solid ${v === 1 ? C.green : v === 0 ? C.red : C.amber}`, background:'#fff',
                               color: v === 1 ? C.green : v === 0 ? C.red : C.amber }}>
                      {saving === r.id ? '…' : v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
