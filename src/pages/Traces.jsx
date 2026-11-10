/**
 * PhysioDrishti — Traces tab (staff only)
 * Every request as a session: question, tools called, sources, latency,
 * model, tokens, estimated cost and the final answer.
 * Data comes from /api/traces, which checks your Supabase login.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

const C = { forest:'#12382A', teal:'#0A6B5E', saffron:'#D4510E', ink:'#0D1520', gray:'#5C6878', light:'#F3F6FA', border:'#DDE4EF', red:'#B83232', green:'#177A45', amber:'#C47D10' }
const font = "'Plus Jakarta Sans',sans-serif"
const ist = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { timeZone:'Asia/Kolkata', day:'numeric', month:'short', hour:'numeric', minute:'2-digit' }) : '')
const ms = (v) => (v ? (v / 1000).toFixed(1) + 's' : '0s')
const usd = (v) => (v ? '$' + Number(v).toFixed(5) : '$0')
const TOOL_COLORS = { stt:C.teal, tts:C.teal, llm:C.saffron, generate:C.saffron, final:C.forest, check_red_flags:C.red }

async function authedFetch(url) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (!token) throw new Error('Please log in again to view traces.')
  const res = await fetch(url, { headers:{ Authorization:'Bearer ' + token } })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { throw new Error('Traces API did not return JSON (status ' + res.status + '). Check that api/traces.js is deployed.') }
  if (!res.ok) throw new Error(json.error || 'Request failed')
  return json
}

function Chip({ text, color = C.gray }) {
  return <span style={{ fontFamily:font, fontSize:10, fontWeight:700, color, border:`1px solid ${color}`, borderRadius:20, padding:'2px 8px', marginRight:4, marginBottom:4, display:'inline-block', whiteSpace:'nowrap' }}>{text}</span>
}

function Outcome({ s }) {
  if (s.booking_id) return <Chip text={'booking #' + s.booking_id} color={C.green} />
  if (s.refused) return <Chip text={s.reason || 'refused'} color={s.reason === 'red_flag' ? C.red : C.amber} />
  if (s.final_answer) return <Chip text="answered" color={C.green} />
  return <Chip text="incomplete" color={C.gray} />
}

export default function Traces() {
  const [sessions, setSessions] = useState([])
  const [detail, setDetail] = useState(null)
  const [channel, setChannel] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try { setSessions((await authedFetch('/api/traces')).sessions || []) } catch (e) { setError(String(e.message || e)) } finally { setLoading(false) }
  }
  const open = async (id) => {
    setError('')
    try { setDetail(await authedFetch('/api/traces?session=' + encodeURIComponent(id))) } catch (e) { setError(String(e.message || e)) }
  }
  useEffect(() => { load() }, [])

  const channels = ['all', ...new Set(sessions.map((s) => s.channel))]
  const shown = channel === 'all' ? sessions : sessions.filter((s) => s.channel === channel)
  const box = { background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:16 }
  const h = { fontFamily:font, fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:C.saffron, marginBottom:8 }

  if (detail) {
    const s = detail.summary
    return (
      <div>
        <button onClick={() => setDetail(null)} style={{ fontFamily:font, fontSize:13, fontWeight:700, border:`1px solid ${C.border}`, background:'#fff', borderRadius:7, padding:'8px 14px', cursor:'pointer', marginBottom:14 }}>← All sessions</button>
        <div style={box}>
          <div style={h}>Session · {s.channel}</div>
          <div style={{ fontFamily:font, fontSize:11, color:C.gray, marginBottom:8 }}>{s.session_id} · {ist(s.started_at)}</div>
          <div style={{ fontFamily:font, fontSize:15, fontWeight:700, color:C.ink, marginBottom:10 }}>{s.question || '(no question logged)'}</div>
          <div style={{ marginBottom:10 }}><Outcome s={s} />{s.models.map((m) => <Chip key={m} text={m} />)}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:8, fontFamily:font, fontSize:12 }}>
            <div><b>Latency</b><br />{ms(s.latency_ms)}</div>
            <div><b>Tokens</b><br />{s.tokens_in} in · {s.tokens_out} out</div>
            <div><b>Est. cost</b><br />{usd(s.cost_usd)}</div>
            <div><b>Steps</b><br />{s.step_count}</div>
          </div>
        </div>
        <div style={box}>
          <div style={h}>Final answer</div>
          <div style={{ fontFamily:font, fontSize:13, lineHeight:1.6, color:C.ink, background:C.light, borderRadius:7, padding:10 }}>{s.final_answer || '(not logged)'}</div>
        </div>
        <div style={box}>
          <div style={h}>Retrieved sources ({s.sources.length})</div>
          {s.sources.length === 0 && <div style={{ fontFamily:font, fontSize:12, color:C.gray }}>None</div>}
          {s.sources.map((x) => <div key={x.title} style={{ fontFamily:font, fontSize:13, padding:'4px 0' }}>{x.title} <span style={{ color:C.gray }}>· similarity {x.similarity}</span></div>)}
        </div>
        <div style={box}>
          <div style={h}>Steps</div>
          {detail.steps.map((st) => (
            <details key={st.id} style={{ borderTop:`1px solid ${C.border}`, padding:'8px 0' }}>
              <summary style={{ fontFamily:font, fontSize:13, cursor:'pointer' }}>
                <b style={{ color:TOOL_COLORS[st.tool] || C.ink }}>{st.step}. {st.tool}</b>
                <span style={{ color:C.gray }}> · {st.latency_ms} ms{st.model ? ' · ' + st.model : ''}{st.tokens_in ? ` · ${st.tokens_in}/${st.tokens_out} tok` : ''}{st.cost_usd ? ' · ' + usd(st.cost_usd) : ''}</span>
              </summary>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, background:C.light, borderRadius:7, padding:10, marginTop:6, overflowX:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                <div style={{ color:C.gray, marginBottom:4 }}>input</div>{JSON.stringify(st.input, null, 2)}
                <div style={{ color:C.gray, margin:'8px 0 4px' }}>output</div>{JSON.stringify(st.output, null, 2)}
              </div>
            </details>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12, marginBottom:16 }}>
        <div>
          <div style={h}>Observability</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.25rem', fontWeight:800 }}>Agent traces</div>
          <div style={{ fontFamily:font, fontSize:12, color:C.gray, marginTop:4 }}>Latest 50 sessions · personal details are masked before logging</div>
        </div>
        <button onClick={load} style={{ fontFamily:font, fontSize:12, fontWeight:700, padding:'8px 14px', borderRadius:7, border:'none', background:C.forest, color:'#fff', cursor:'pointer' }}>Refresh</button>
      </div>
      <div style={{ marginBottom:12 }}>
        {channels.map((c) => (
          <button key={c} onClick={() => setChannel(c)} style={{ fontFamily:font, fontSize:12, fontWeight:600, padding:'6px 12px', marginRight:6, borderRadius:7, cursor:'pointer', border:`1.5px solid ${channel === c ? C.forest : C.border}`, background:channel === c ? C.forest : '#fff', color:channel === c ? '#fff' : C.gray }}>{c}</button>
        ))}
      </div>
      {error && <div style={{ ...box, borderColor:C.red, color:C.red, fontFamily:font, fontSize:13 }}>⚠️ {error}</div>}
      {loading && <div style={{ fontFamily:font, color:C.gray }}>Loading…</div>}
      {!loading && !error && shown.length === 0 && <div style={{ ...box, fontFamily:font, fontSize:13, color:C.gray }}>No sessions yet.</div>}
      {shown.map((s) => (
        <div key={s.session_id} onClick={() => open(s.session_id)} style={{ ...box, cursor:'pointer' }}>
          <div style={{ display:'flex', justifyContent:'space-between', gap:8, flexWrap:'wrap', marginBottom:6 }}>
            <span style={{ fontFamily:font, fontSize:11, color:C.gray }}>{ist(s.started_at)} · {s.channel}</span>
            <span style={{ fontFamily:font, fontSize:11, color:C.gray }}>{ms(s.latency_ms)} · {s.tokens_in + s.tokens_out} tok · {usd(s.cost_usd)}</span>
          </div>
          <div style={{ fontFamily:font, fontSize:14, fontWeight:700, color:C.ink, marginBottom:6 }}>{s.question || '(no question logged)'}</div>
          <div><Outcome s={s} />{s.tools.map((t, i) => <Chip key={i} text={t} color={TOOL_COLORS[t] || C.gray} />)}</div>
        </div>
      ))}
    </div>
  )
}
