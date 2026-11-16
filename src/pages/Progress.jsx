/**
 * PhysioDrishti — Progress tab (staff only)
 * Home-exercise progress for patients who chose to share it: adherence, pain trend, goal and flags.
 * Patients needing attention come first. WhatsApp check-ins are drafted, never sent automatically.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

const C = { forest:'#12382A', teal:'#0A6B5E', saffron:'#D4510E', ink:'#0D1520', gray:'#5C6878', light:'#F3F6FA', border:'#DDE4EF', red:'#B83232', green:'#177A45', amber:'#C47D10', wa:'#25D366' }
const font = "'Plus Jakarta Sans',sans-serif"
const LEVEL = { danger:C.red, warn:C.amber, info:C.gray }
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'numeric', minute:'2-digit', timeZone:'Asia/Kolkata' }) : '—')

function Spark({ points }) {
  if (!points?.length) return <span style={{ fontSize:11, color:C.gray }}>no pain data</span>
  const W = 120, H = 34, n = points.length
  const x = (i) => (n === 1 ? W / 2 : 4 + (i * (W - 8)) / (n - 1)), y = (v) => 4 + ((10 - v) * (H - 8)) / 10
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`Pain before sessions: ${points.map((p) => p.before).join(', ')}`}>
      <line x1="0" x2={W} y1={y(5)} y2={y(5)} stroke={C.border} strokeDasharray="3 3" />
      <polyline points={points.map((p, i) => `${x(i)},${y(p.before)}`).join(' ')} fill="none" stroke={C.saffron} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={x(n - 1)} cy={y(points[n - 1].before)} r="3" fill={C.saffron} />
    </svg>
  )
}

function draft(p) {
  const first = (p.name || '').split(' ')[0] || 'there'
  if (p.flags.some((f) => f.code === 'pain_rising' || f.code === 'stopped')) return `Hi ${first}, this is PhysioDrishti. We noticed your pain has gone up during your home exercises. Please pause them for now. Can we set up a quick call today to adjust your plan?`
  if (p.flags.some((f) => f.code === 'inactive')) return `Hi ${first}, this is PhysioDrishti. Just checking in, we haven't seen a session for a few days. How is the pain? Even a short session today helps. Reply if anything is making it hard.`
  return `Hi ${first}, this is PhysioDrishti. Great work on your home exercises${p.adherence.streak > 1 ? ` (${p.adherence.streak}-day streak!)` : ''}. Keep going, and tell us if anything feels harder.`
}

export default function Progress() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const { data: s } = await supabase.auth.getSession()
        const res = await fetch('/api/recovery?action=staff', { headers:{ Authorization:'Bearer ' + (s?.session?.access_token || '') } })
        const j = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(j.error || 'Could not load progress')
        setData(j)
      } catch (e) { setErr(e.message) }
    })()
  }, [])

  if (err) return <div style={{ fontFamily:font, color:C.red, padding:16 }}>{err}</div>
  if (!data) return <div style={{ fontFamily:font, color:C.gray, padding:16 }}>Loading progress…</div>

  const pts = data.patients
  const attention = pts.filter((p) => p.flags.some((f) => f.level !== 'info')).length
  const avgAdh = pts.length ? Math.round(pts.reduce((t, p) => t + p.adherence.pct, 0) / pts.length) : null

  return (
    <div style={{ fontFamily:font, display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ fontSize:12, color:C.gray }}>Patients who chose to share their home-exercise progress. Those needing attention are listed first.</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:10 }}>
        {[['Sharing patients', pts.length], ['Need attention', attention, attention ? C.red : C.ink], ['Average adherence', avgAdh == null ? '—' : avgAdh + '%']].map(([k, v, col]) => (
          <div key={k} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 14px' }}>
            <div style={{ fontSize:22, fontWeight:800, color:col || C.ink, fontVariantNumeric:'tabular-nums' }}>{v}</div>
            <div style={{ fontSize:12, color:C.gray, fontWeight:600 }}>{k}</div>
          </div>
        ))}
      </div>

      {!pts.length && <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:12, padding:16, fontSize:13, color:C.gray }}>No patients are sharing yet. Patients can turn on sharing from <b>My progress</b> on the website after a guided session.</div>}

      {pts.map((p) => {
        const open = openId === p.device_id
        const worst = p.flags.find((f) => f.level === 'danger') ? 'danger' : p.flags.find((f) => f.level === 'warn') ? 'warn' : null
        return (
          <div key={p.device_id} style={{ background:'#fff', border:`1px solid ${C.border}`, borderLeft:`4px solid ${worst ? LEVEL[worst] : C.green}`, borderRadius:12, padding:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap', alignItems:'flex-start' }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>{p.name}</div>
                <div style={{ fontSize:12, color:C.gray }}>{p.conditions.join(', ') || 'No sessions yet'} · last session {fmt(p.last_at)}</div>
              </div>
              <Spark points={p.pain.points} />
            </div>

            <div style={{ display:'flex', flexWrap:'wrap', gap:6, margin:'10px 0' }}>
              {p.flags.map((f) => <span key={f.code} style={{ fontSize:11, fontWeight:700, color:LEVEL[f.level], border:`1px solid ${LEVEL[f.level]}`, borderRadius:20, padding:'2px 8px' }}>{f.text}</span>)}
              {!p.flags.length && <span style={{ fontSize:11, fontWeight:700, color:C.green, border:`1px solid ${C.green}`, borderRadius:20, padding:'2px 8px' }}>On track</span>}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:8, fontSize:12 }}>
              <div><div style={{ color:C.gray }}>Adherence</div><b style={{ fontSize:15 }}>{p.adherence.pct}%</b> <span style={{ color:C.gray }}>({p.adherence.days}/{p.adherence.span} days)</span></div>
              <div><div style={{ color:C.gray }}>Streak</div><b style={{ fontSize:15 }}>{p.adherence.streak}</b> <span style={{ color:C.gray }}>days</span></div>
              <div><div style={{ color:C.gray }}>Usual pain</div><b style={{ fontSize:15 }}>{p.pain.first == null ? '—' : `${Math.round(p.pain.first * 10) / 10} → ${Math.round(p.pain.last * 10) / 10}`}</b></div>
              <div><div style={{ color:C.gray }}>Goal{p.goal ? `: ${p.goal.goal}` : ''}</div><b style={{ fontSize:15 }}>{p.goal ? `${p.goal.first} → ${p.goal.last}` : '—'}</b>{p.goal && <span style={{ color:C.gray }}> /10</span>}</div>
            </div>

            <div style={{ display:'flex', gap:4, marginTop:10 }} aria-label="Last 7 days">
              {p.adherence.week.map((d) => (
                <div key={d.date} style={{ flex:1, textAlign:'center' }}>
                  <div style={{ fontSize:10, color:C.gray }}>{DOW[d.dow]}</div>
                  <div style={{ height:16, borderRadius:4, background: d.done ? C.forest : C.light, border:`1px solid ${C.border}` }} />
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
              <a href={`https://wa.me/91${p.phone}?text=${encodeURIComponent(draft(p))}`} target="_blank" rel="noreferrer"
                style={{ fontSize:12, fontWeight:700, color:'#fff', background:C.wa, borderRadius:8, padding:'8px 12px', textDecoration:'none' }}>WhatsApp check-in (draft)</a>
              <button onClick={() => setOpenId(open ? null : p.device_id)} style={{ fontFamily:font, fontSize:12, fontWeight:700, color:C.forest, background:C.light, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 12px', cursor:'pointer' }}>{open ? 'Hide sessions' : 'Recent sessions'}</button>
            </div>

            {open && (
              <div style={{ overflowX:'auto', marginTop:10 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:420 }}>
                  <thead><tr style={{ color:C.gray, textAlign:'left' }}><th style={{ padding:6 }}>When</th><th>Pain</th><th>Reps done</th><th>Dose</th><th>Mode</th></tr></thead>
                  <tbody>
                    {p.recent.map((s, k) => {
                      const done = s.items.reduce((t, i) => t + i.done, 0), target = s.items.reduce((t, i) => t + i.target, 0)
                      return (
                        <tr key={k} style={{ borderTop:`1px solid ${C.light}` }}>
                          <td style={{ padding:6 }}>{fmt(s.at)}</td>
                          <td style={{ color: s.pain_after != null && s.pain_after - s.pain_before >= 2 ? C.red : C.ink }}>{s.pain_before ?? '—'} → {s.pain_after ?? '—'}{s.stopped && <b style={{ color:C.red }}> stopped</b>}</td>
                          <td style={{ fontVariantNumeric:'tabular-nums' }}>{done}/{target}</td>
                          <td>{Math.round((s.scale ?? 1) * 100)}%</td>
                          <td>{s.mode === 'camera' ? '📷 camera' : 'follow-along'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
