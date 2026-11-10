/**
 * PhysioDrishti — Approvals tab (staff only)
 * The agent proposes bookings; a clinician approves, reschedules or rejects.
 * Every action is logged. WhatsApp messages are drafted, never sent automatically.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

const C = { forest:'#12382A', teal:'#0A6B5E', saffron:'#D4510E', ink:'#0D1520', gray:'#5C6878', light:'#F3F6FA', border:'#DDE4EF', red:'#B83232', green:'#177A45', amber:'#C47D10', wa:'#25D366' }
const font = "'Plus Jakarta Sans',sans-serif"
const pct = (v) => (v === null || v === undefined ? '—' : Math.round(v * 100) + '%')
const STATUS_COLOR = { pending_approval:C.amber, proposed:C.teal, approved:C.green, rejected:C.red, expired:C.gray, cancelled:C.gray }
const BADGE_COLOR = { danger:C.red, warn:C.amber, info:C.gray }

async function api(method, body) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (!token) throw new Error('Please log in again.')
  const res = await fetch(body && method === 'GET' ? '/api/traces?session=' + encodeURIComponent(body.session) : '/api/approvals', {
    method: method === 'GET' ? 'GET' : 'POST',
    headers: { Authorization:'Bearer ' + token, 'Content-Type':'application/json' },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { throw new Error('Server did not return JSON (status ' + res.status + ').') }
  if (!res.ok) throw new Error(json.error || 'Request failed')
  return json
}

function timeLeft(iso) {
  if (!iso) return ''
  const mins = Math.round((new Date(iso) - Date.now()) / 60000)
  if (mins <= 0) return 'overdue'
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m left` : `${mins}m left`
}

function Chip({ text, color }) {
  return <span style={{ fontFamily:font, fontSize:10, fontWeight:700, color, border:`1px solid ${color}`, borderRadius:20, padding:'2px 8px', marginRight:4, whiteSpace:'nowrap' }}>{text}</span>
}

function Card({ b, data, onDone }) {
  const [mode, setMode] = useState(null)        // reschedule | reject | note | convo
  const [slotId, setSlotId] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [convo, setConvo] = useState(null)

  const run = async (action, extra = {}) => {
    setBusy(true); setError('')
    try {
      const r = await api('POST', { booking_id:b.id, action, ...extra })
      setResult({ action, ...r }); setMode(null)
    } catch (e) { setError(String(e.message || e)) } finally { setBusy(false) }
  }
  const notified = async () => { try { await api('POST', { booking_id:b.id, action:'notified' }) } catch { /* not critical */ } }
  const showConvo = async () => {
    if (mode === 'convo') { setMode(null); return }
    setMode('convo')
    if (!convo && b.session_id) {
      try { setConvo(await api('GET', { session:b.session_id })) } catch (e) { setError(String(e.message || e)) }
    }
  }

  const btn = (bg, color = '#fff', border = 'none') => ({ fontFamily:font, fontSize:12, fontWeight:700, padding:'8px 12px', borderRadius:7, border, background:bg, color, cursor:'pointer', opacity:busy ? .6 : 1 })
  const isPending = b.status === 'pending_approval'
  const isProposed = b.status === 'proposed'

  if (result) {
    return (
      <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:14, marginBottom:12 }}>
        <div style={{ fontFamily:font, fontSize:14, fontWeight:700, color:C.green, marginBottom:8 }}>✓ {result.booking.status.replace('_', ' ')} · request #{b.id}</div>
        {result.message && <div style={{ fontFamily:font, fontSize:12, background:C.light, borderRadius:7, padding:10, whiteSpace:'pre-wrap', marginBottom:10 }}>{result.message}</div>}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {result.whatsapp_url && <a href={result.whatsapp_url} target="_blank" rel="noreferrer" onClick={notified} style={{ ...btn(C.wa), textDecoration:'none' }}>💬 Send on WhatsApp</a>}
          <button onClick={onDone} style={btn('#fff', C.forest, `1px solid ${C.border}`)}>Done</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderLeft:`4px solid ${STATUS_COLOR[b.status] || C.gray}`, borderRadius:10, padding:14, marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:6, marginBottom:6 }}>
        <div>
          <Chip text={b.status.replace('_', ' ')} color={STATUS_COLOR[b.status]} />
          <Chip text={b.mode || 'online'} color={C.gray} />
          <Chip text={'via ' + (b.source || 'agent')} color={C.gray} />
        </div>
        <span style={{ fontFamily:font, fontSize:11, fontWeight:700, color:timeLeft(b.expires_at) === 'overdue' ? C.red : C.amber }}>⏱ {timeLeft(b.expires_at)}</span>
      </div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.05rem', fontWeight:800, color:C.ink }}>{b.when || 'Slot missing'}</div>
      <div style={{ fontFamily:font, fontSize:13, color:C.ink, margin:'6px 0' }}>{b.patient_summary}</div>
      <div style={{ fontFamily:font, fontSize:12, color:C.gray, marginBottom:8 }}>{b.contact_name || 'No name'} · {b.contact_phone}</div>
      {b.badges.length > 0 && (
        <div style={{ marginBottom:10 }}>
          {b.badges.map((x, i) => <div key={i} style={{ fontFamily:font, fontSize:12, color:BADGE_COLOR[x.level], marginBottom:3 }}>{x.level === 'danger' ? '⛔' : x.level === 'warn' ? '⚠️' : 'ℹ️'} {x.text}</div>)}
        </div>
      )}
      {b.staff_note && <div style={{ fontFamily:font, fontSize:12, color:C.teal, marginBottom:8 }}>📝 {b.staff_note}</div>}

      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {isPending && <button disabled={busy} onClick={() => run('approve')} style={btn(C.green)}>✓ Approve</button>}
        {isProposed && <button disabled={busy} onClick={() => run('confirm')} style={btn(C.green)}>✓ Patient accepted</button>}
        <button disabled={busy} onClick={() => setMode(mode === 'reschedule' ? null : 'reschedule')} style={btn('#fff', C.teal, `1px solid ${C.teal}`)}>↻ Reschedule</button>
        <button disabled={busy} onClick={() => setMode(mode === 'reject' ? null : 'reject')} style={btn('#fff', C.red, `1px solid ${C.red}`)}>✕ Reject</button>
        {isProposed && <button disabled={busy} onClick={() => run('cancel')} style={btn('#fff', C.gray, `1px solid ${C.border}`)}>Patient declined</button>}
        <button disabled={busy} onClick={() => setMode(mode === 'note' ? null : 'note')} style={btn('#fff', C.gray, `1px solid ${C.border}`)}>📝 Note</button>
        {b.session_id && <button onClick={showConvo} style={btn('#fff', C.forest, `1px solid ${C.border}`)}>💬 Conversation</button>}
      </div>

      {mode === 'reschedule' && (
        <div style={{ marginTop:10, display:'flex', gap:6, flexWrap:'wrap' }}>
          <select value={slotId} onChange={(e) => setSlotId(e.target.value)} style={{ fontFamily:font, fontSize:12, padding:8, borderRadius:7, border:`1px solid ${C.border}`, flex:1, minWidth:180 }}>
            <option value="">Pick a new slot</option>
            {data.open_slots.map((s) => <option key={s.id} value={s.id}>{s.when} · {s.mode}</option>)}
          </select>
          <button disabled={busy || !slotId} onClick={() => run('reschedule', { slot_id:Number(slotId) })} style={btn(C.teal)}>Offer this time</button>
        </div>
      )}
      {mode === 'reject' && (
        <div style={{ marginTop:10, display:'flex', gap:6, flexWrap:'wrap' }}>
          <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ fontFamily:font, fontSize:12, padding:8, borderRadius:7, border:`1px solid ${C.border}`, flex:1, minWidth:180 }}>
            <option value="">Reason</option>
            {Object.entries(data.reject_reasons).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button disabled={busy || !reason} onClick={() => run('reject', { reason, note })} style={btn(C.red)}>Reject</button>
        </div>
      )}
      {mode === 'note' && (
        <div style={{ marginTop:10, display:'flex', gap:6 }}>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note" style={{ fontFamily:font, fontSize:12, padding:8, borderRadius:7, border:`1px solid ${C.border}`, flex:1 }} />
          <button disabled={busy || !note.trim()} onClick={async () => { await run('note', { note }); onDone() }} style={btn(C.forest)}>Save</button>
        </div>
      )}
      {mode === 'convo' && (
        <div style={{ marginTop:10, background:C.light, borderRadius:7, padding:10, fontFamily:font, fontSize:12, lineHeight:1.6 }}>
          {!convo && 'Loading…'}
          {convo && <>
            <div><b>Patient:</b> {convo.summary.question || '—'}</div>
            <div><b>Drishti:</b> {convo.summary.final_answer || '—'}</div>
            <div style={{ color:C.gray, marginTop:4 }}>Tools: {convo.summary.tools.join(' → ')}</div>
          </>}
        </div>
      )}
      {error && <div style={{ fontFamily:font, fontSize:12, color:C.red, marginTop:8 }}>⚠️ {error}</div>}
    </div>
  )
}

export default function Approvals() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const { data: s } = await supabase.auth.getSession()
      const res = await fetch('/api/approvals', { headers:{ Authorization:'Bearer ' + (s?.session?.access_token || '') } })
      const text = await res.text()
      let json
      try { json = JSON.parse(text) } catch { throw new Error('Approvals API did not return JSON (status ' + res.status + '). Check that api/approvals.js is deployed.') }
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setData(json)
    } catch (e) { setError(String(e.message || e)) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const h = { fontFamily:font, fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:C.saffron, marginBottom:8 }
  const m = data?.metrics
  const stat = (label, value) => (
    <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px' }}>
      <div style={{ fontFamily:font, fontSize:10, fontWeight:700, color:C.gray, textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem', fontWeight:900, color:C.ink }}>{value}</div>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12, marginBottom:16 }}>
        <div>
          <div style={h}>Human in the loop</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.25rem', fontWeight:800 }}>Booking approvals</div>
          <div style={{ fontFamily:font, fontSize:12, color:C.gray, marginTop:4 }}>Drishti proposes; a clinician decides. Soonest appointments first.</div>
        </div>
        <button onClick={load} style={{ fontFamily:font, fontSize:12, fontWeight:700, padding:'8px 14px', borderRadius:7, border:'none', background:C.forest, color:'#fff', cursor:'pointer' }}>Refresh</button>
      </div>

      {error && <div style={{ fontFamily:font, fontSize:13, color:C.red, marginBottom:12 }}>⚠️ {error}</div>}
      {loading && <div style={{ fontFamily:font, color:C.gray }}>Loading…</div>}

      {data && (
        <>
          {data.expired_now > 0 && <div style={{ fontFamily:font, fontSize:12, color:C.amber, marginBottom:10 }}>⏱ {data.expired_now} request(s) expired without a response and their slots were released.</div>}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:18 }}>
            {stat('Waiting', data.queue.length)}
            {stat('Median response', m.median_minutes_to_decision === null ? '—' : Math.round(m.median_minutes_to_decision) + ' min')}
            {stat('Approval rate', pct(m.approval_rate))}
            {stat('Reschedule rate', pct(m.reschedule_rate))}
            {stat('Expiry rate', pct(m.expiry_rate))}
          </div>

          <div style={h}>Waiting for a decision ({data.queue.length})</div>
          {data.queue.length === 0 && <div style={{ fontFamily:font, fontSize:13, color:C.green, marginBottom:16 }}>Nothing waiting. 🎉</div>}
          {data.queue.map((b) => <Card key={b.id} b={b} data={data} onDone={load} />)}

          {Object.keys(m.rejection_reasons).length > 0 && (
            <div style={{ fontFamily:font, fontSize:12, color:C.gray, margin:'8px 0 16px' }}>
              Rejection reasons (30 days): {Object.entries(m.rejection_reasons).map(([k, v]) => `${data.reject_reasons[k] || k} ${v}`).join(' · ')}
            </div>
          )}

          <div style={h}>Recent decisions</div>
          {data.recent.length === 0 && <div style={{ fontFamily:font, fontSize:13, color:C.gray }}>None yet.</div>}
          {data.recent.map((b) => (
            <div key={b.id} style={{ display:'flex', justifyContent:'space-between', gap:8, flexWrap:'wrap', borderBottom:`1px solid ${C.border}`, padding:'8px 0', fontFamily:font, fontSize:12 }}>
              <span><Chip text={b.status} color={STATUS_COLOR[b.status] || C.gray} /> {b.when || '—'} · {b.contact_name || 'No name'}</span>
              <span style={{ color:C.gray }}>{b.decided_by || ''}{b.decision_reason ? ' · ' + b.decision_reason : ''}{b.notified_at ? ' · notified ✓' : ''}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
