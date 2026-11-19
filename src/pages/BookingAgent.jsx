/**
 * BookingAgent — AI-powered booking chat with visual date/time picker.
 * Chat with Drishti → slots offered → visual picker → review → confirm.
 */
import { useState, useEffect, useRef } from 'react'

const C = {
  forest:'#12382A', teal:'#0A6B5E', ink:'#0D1520',
  gray:'#5C6878', light:'#F3F6FA', border:'#DDE4EF',
  green:'#177A45', rose:'#FBE9EB', roseBorder:'#D45B6A',
  saffron:'#D4510E', cream:'#FDFAF3',
}
const pj = "'Plus Jakarta Sans',sans-serif"
const pd = "'Playfair Display',serif"

const OPENERS = ["Hi! I'm Drishti, your physiotherapy assistant. 👋 Tell me what's bothering you — where's the pain, and how long has it been going on?"]

// Parse "Tue, 24 Nov, 10:00 am" → structured slot data
function parseWhen(when) {
  const parts = String(when).split(',').map(s => s.trim())
  const dow   = parts[0] || ''                        // "Tue"
  const dm    = (parts[1] || '').split(' ')           // ["24","Nov"]
  const day   = parseInt(dm[0]) || 0
  const month = dm[1] || ''
  const timeStr = parts[2] || ''                      // "10:00 am"
  const m = timeStr.match(/(\d+):(\d+)\s*(am|pm)/i)
  let hour = m ? parseInt(m[1]) : 0
  if (m) { const ap = m[3].toLowerCase(); if (ap==='pm'&&hour!==12) hour+=12; if(ap==='am'&&hour===12) hour=0 }
  const section = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'
  return { dow, day, month, dateKey:`${day} ${month}`, timeStr, hour, section }
}

// Group offered slots by date for the picker
function groupByDate(slots) {
  const map = {}
  for (const s of slots) {
    const p = parseWhen(s.when)
    if (!map[p.dateKey]) map[p.dateKey] = { ...p, slots: [] }
    map[p.dateKey].slots.push({ ...s, parsed: p })
  }
  return Object.values(map).sort((a, b) => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const am = months.indexOf(a.month), bm = months.indexOf(b.month)
    return am !== bm ? am - bm : a.day - b.day
  })
}

const SECTIONS = ['Morning', 'Afternoon', 'Evening']

// ── Sub-components ──────────────────────────────────────────────────────────

function DateStrip({ dates, selected, onSelect }) {
  return (
    <div style={{ overflowX:'auto', display:'flex', gap:8, padding:'0 20px 4px' }}>
      {dates.map(d => {
        const active = d.dateKey === selected
        return (
          <button key={d.dateKey} onClick={() => onSelect(d.dateKey)}
            style={{ fontFamily:pj, display:'flex', flexDirection:'column', alignItems:'center',
              minWidth:52, padding:'10px 8px', borderRadius:14, border:'none', cursor:'pointer',
              background: active ? C.forest : '#fff',
              color: active ? '#fff' : C.ink,
              boxShadow: active ? '0 4px 12px rgba(18,56,42,.25)' : '0 1px 4px rgba(0,0,0,.08)',
              transition:'all .18s' }}>
            <span style={{ fontSize:10, fontWeight:600, opacity: active ? .75 : .5, letterSpacing:.5, textTransform:'uppercase' }}>{d.dow}</span>
            <span style={{ fontSize:22, fontWeight:800, lineHeight:1.2, margin:'2px 0' }}>{d.day}</span>
            <span style={{ fontSize:10, fontWeight:600, opacity: active ? .75 : .5 }}>{d.month}</span>
          </button>
        )
      })}
    </div>
  )
}

function Legend() {
  const dot = (bg, border) => ({ width:10, height:10, borderRadius:'50%', background:bg, border:`1.5px solid ${border}`, display:'inline-block', marginRight:4 })
  const item = (label, bg, border) => (
    <span key={label} style={{ display:'flex', alignItems:'center', fontSize:11, color:C.gray, fontFamily:pj }}>
      <span style={dot(bg, border)} />{label}
    </span>
  )
  return (
    <div style={{ display:'flex', gap:14, padding:'8px 20px', flexWrap:'wrap' }}>
      {item('Available', '#fff', C.border)}
      {item('Chosen', C.rose, C.roseBorder)}
      {item('Booked', C.light, C.border)}
    </div>
  )
}

function TimeGrid({ slots, chosen, onChoose }) {
  return (
    <div style={{ padding:'4px 20px 16px', flex:1, overflowY:'auto' }}>
      {SECTIONS.map(sec => {
        const inSection = slots.filter(s => s.parsed.section === sec)
        if (!inSection.length) return null
        return (
          <div key={sec} style={{ marginBottom:16 }}>
            <div style={{ fontFamily:pj, fontSize:12, fontWeight:700, color:C.gray, letterSpacing:.5,
              textTransform:'uppercase', marginBottom:8 }}>{sec}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
              {inSection.map(s => {
                const isChosen = chosen === s.slot_id
                return (
                  <button key={s.slot_id} onClick={() => onChoose(s.slot_id)}
                    style={{ fontFamily:pj, fontSize:13, fontWeight:700, padding:'11px 6px',
                      borderRadius:12, cursor:'pointer', transition:'all .15s',
                      border: isChosen ? `2px solid ${C.roseBorder}` : `1.5px solid ${C.border}`,
                      background: isChosen ? C.rose : '#fff',
                      color: isChosen ? C.roseBorder : C.ink,
                      boxShadow: isChosen ? '0 2px 8px rgba(212,81,14,.15)' : '0 1px 3px rgba(0,0,0,.06)' }}>
                    {s.parsed.timeStr}
                    <div style={{ fontSize:10, fontWeight:500, opacity:.6, marginTop:2 }}>
                      {s.mode === 'home' ? '🏠 Home' : '🖥 Online'}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ReviewScreen({ slot, onBack, onConfirm, confirming }) {
  const p = parseWhen(slot.when)
  const row = (icon, label, value) => (
    <div style={{ display:'flex', gap:14, padding:'14px 0', borderBottom:`1px solid ${C.border}`, alignItems:'center' }}>
      <div style={{ fontSize:20, width:28, textAlign:'center', flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontFamily:pj, fontSize:11, color:C.gray, marginBottom:2 }}>{label}</div>
        <div style={{ fontFamily:pj, fontSize:14, fontWeight:700, color:C.ink }}>{value}</div>
      </div>
    </div>
  )
  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflowY:'auto' }}>
      {/* sub-header */}
      <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:C.gray, padding:0, lineHeight:1 }}>←</button>
        <span style={{ fontFamily:pd, fontSize:'1.05rem', fontWeight:800, color:C.ink }}>Review details</span>
      </div>

      {/* provider card */}
      <div style={{ margin:'16px 20px', padding:'16px', background:C.light, borderRadius:14, display:'flex', gap:14, alignItems:'center' }}>
        <div style={{ width:46, height:46, borderRadius:'50%', background:`linear-gradient(135deg,${C.teal},${C.forest})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🩺</div>
        <div>
          <div style={{ fontFamily:pd, fontSize:'1rem', fontWeight:800, color:C.ink }}>PhysioDrishti</div>
          <div style={{ fontFamily:pj, fontSize:12, color:C.gray, marginTop:2 }}>Physiotherapy session · 45 min</div>
        </div>
      </div>

      {/* details */}
      <div style={{ padding:'0 20px', flex:1 }}>
        {row('📅', 'Date', `${p.dow}, ${p.day} ${p.month}`)}
        {row('⏰', 'Time', p.timeStr)}
        {row('📍', 'Mode', slot.mode === 'home' ? 'Home visit' : 'Online (video call)')}
        {row('💳', 'Payment', 'Pay at the session')}
      </div>

      {/* confirm */}
      <div style={{ padding:'16px 20px' }}>
        <button onClick={onConfirm} disabled={confirming}
          style={{ fontFamily:pj, fontWeight:800, fontSize:15, padding:'15px', width:'100%',
            borderRadius:14, border:'none', cursor: confirming ? 'default' : 'pointer',
            background: confirming ? C.border : C.forest, color: confirming ? C.gray : '#fff',
            transition:'background .2s' }}>
          {confirming ? 'Sending request…' : 'Confirm booking →'}
        </button>
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export default function BookingAgent({ onClose, onSuccess }) {
  const [contact, setContact]       = useState({ name:'', phone:'' })
  const [contactSaved, setContactSaved] = useState(false)
  const [contactErr, setContactErr] = useState('')

  const [messages, setMessages]   = useState([{ role:'assistant', text: OPENERS[0] }])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [history, setHistory]     = useState([])
  const [booking, setBooking]     = useState(null)
  const [offeredSlots, setOfferedSlots] = useState([])
  const [agentState, setAgentState] = useState({})

  // picker state
  const [view, setView]             = useState('chat')   // 'chat' | 'picker' | 'review'
  const [selectedDate, setSelectedDate] = useState(null)
  const [chosenSlotId, setChosenSlotId] = useState(null)
  const [confirming, setConfirming] = useState(false)

  const bottomRef = useRef(null)
  useEffect(() => { if (view==='chat') bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, view])

  const saveContact = () => {
    const name = contact.name.trim(), phone = contact.phone.trim()
    if (name.length < 2) { setContactErr('Please enter your name.'); return }
    if (!/^[6-9]\d{9}$/.test(phone)) { setContactErr('Enter a valid 10-digit Indian mobile number.'); return }
    setContactErr(''); setContactSaved(true)
  }

  const send = async (overrideText) => {
    const text = typeof overrideText === 'string' ? overrideText : input.trim()
    if (!text || loading) return
    if (!overrideText) setInput('')
    setMessages(p => [...p, { role:'user', text }])
    setLoading(true)

    try {
      const res = await fetch('/api/agent', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          message: text,
          contact: contactSaved ? { name: contact.name.trim(), phone: contact.phone.trim() } : null,
          history, language:'en-IN', state: agentState,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setMessages(p => [...p, { role:'assistant', text: data.error || 'Something went wrong. Please try again.' }]); return }

      setMessages(p => [...p, { role:'assistant', text: data.reply }])
      setHistory(p => [...p, { role:'user', text }, { role:'assistant', text: data.reply }])
      if (data.state) setAgentState(data.state)
      if (data.state?.offered_slots?.length) {
        const slots = data.state.offered_slots
        setOfferedSlots(slots)
        const dates = groupByDate(slots)
        setSelectedDate(dates[0]?.dateKey || null)
        setChosenSlotId(null)
      }
      if (data.booking) { setBooking(data.booking); onSuccess?.(data.booking) }
    } catch {
      setMessages(p => [...p, { role:'assistant', text:'Could not reach the server. Please try again.' }])
    } finally { setLoading(false) }
  }

  const confirmBooking = async () => {
    const slot = offeredSlots.find(s => s.slot_id === chosenSlotId)
    if (!slot) return
    setConfirming(true)
    setView('chat')
    await send(`Please book the slot on ${slot.when} (slot_id ${slot.slot_id}).`)
    setConfirming(false)
  }

  const chosenSlot = offeredSlots.find(s => s.slot_id === chosenSlotId)
  const dateGroups = groupByDate(offeredSlots)
  const slotsForDate = selectedDate ? (dateGroups.find(d => d.dateKey === selectedDate)?.slots || []) : []

  // ── Layout shells ──
  const overlay = { position:'fixed', inset:0, background:'rgba(13,21,32,.55)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }
  const box     = { background:'#fff', borderRadius:20, width:'100%', maxWidth:420, maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 28px 72px rgba(0,0,0,.2)' }

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={box}>

        {/* ── Header ── */}
        <div style={{ background:C.forest, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {view !== 'chat' && (
              <button onClick={() => setView(view==='review' ? 'picker' : 'chat')}
                style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:8, color:'#fff', fontSize:16, cursor:'pointer', padding:'4px 8px', lineHeight:1 }}>←</button>
            )}
            <div>
              <div style={{ fontFamily:pd, fontSize:'1.05rem', fontWeight:800, color:'#fff' }}>
                {view==='picker' ? 'Date and time' : view==='review' ? 'Review details' : 'Book with Drishti'}
              </div>
              <div style={{ fontFamily:pj, fontSize:11, color:'rgba(255,255,255,.55)', marginTop:1 }}>
                {view==='chat' ? 'AI-powered · Human-reviewed' : 'PhysioDrishti · 45 min session'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,.65)', fontSize:20, cursor:'pointer', lineHeight:1 }}>✕</button>
        </div>

        {/* ── Contact strip ── */}
        <div style={{ flexShrink:0 }}>
          {!contactSaved ? (
            <div style={{ padding:'12px 20px', borderBottom:`1px solid ${C.border}`, background:C.light }}>
              <div style={{ fontFamily:pj, fontSize:11, fontWeight:700, color:C.forest, marginBottom:8 }}>Your contact details (required to confirm a slot)</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <input placeholder="Your name" value={contact.name} onChange={e => setContact(p => ({ ...p, name: e.target.value }))}
                  style={{ fontFamily:pj, fontSize:13, padding:'8px 12px', borderRadius:8, border:`1px solid ${C.border}`, flex:1, minWidth:110, outline:'none' }} />
                <input placeholder="WhatsApp (10 digits)" value={contact.phone} onChange={e => setContact(p => ({ ...p, phone: e.target.value.replace(/\D/g,'').slice(0,10) }))}
                  style={{ fontFamily:pj, fontSize:13, padding:'8px 12px', borderRadius:8, border:`1px solid ${C.border}`, flex:1, minWidth:140, outline:'none' }} />
                <button onClick={saveContact}
                  style={{ fontFamily:pj, fontSize:13, fontWeight:700, padding:'8px 14px', borderRadius:8, border:'none', background:C.teal, color:'#fff', cursor:'pointer' }}>Save</button>
              </div>
              {contactErr && <div style={{ fontFamily:pj, fontSize:11, color:'#B83232', marginTop:5 }}>{contactErr}</div>}
              <div style={{ fontFamily:pj, fontSize:11, color:C.gray, marginTop:5 }}>You can chat without saving, but we need this to confirm your slot.</div>
            </div>
          ) : (
            <div style={{ padding:'8px 20px', borderBottom:`1px solid ${C.border}`, background:'#F0FAF4', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:pj, fontSize:12, color:C.green, fontWeight:600 }}>✓ {contact.name} · +91 {contact.phone}</span>
              <button onClick={() => setContactSaved(false)} style={{ fontFamily:pj, fontSize:11, background:'none', border:'none', color:C.gray, cursor:'pointer', textDecoration:'underline' }}>Edit</button>
            </div>
          )}
        </div>

        {/* ── Chat view ── */}
        {view === 'chat' && (
          <>
            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth:'80%', padding:'10px 14px',
                    borderRadius: m.role==='user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: m.role==='user' ? C.teal : C.light,
                    color: m.role==='user' ? '#fff' : C.ink,
                    fontFamily:pj, fontSize:13, lineHeight:1.6 }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display:'flex', justifyContent:'flex-start' }}>
                  <div style={{ padding:'10px 14px', borderRadius:'14px 14px 14px 2px', background:C.light, fontFamily:pj, fontSize:13, color:C.gray }}>Drishti is thinking…</div>
                </div>
              )}
              {/* Slot picker card */}
              {offeredSlots.length > 0 && !booking && (
                <div style={{ background:'linear-gradient(135deg,#F0FAF4,#E8F4FF)', border:`1px solid ${C.border}`, borderRadius:14, padding:14, fontFamily:pj }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.forest, marginBottom:6 }}>📅 {offeredSlots.length} slot{offeredSlots.length>1?'s':''} available</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
                    {offeredSlots.map(s => (
                      <div key={s.slot_id} style={{ fontSize:12, color:C.ink, display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ color:C.saffron }}>◉</span>
                        <span>{s.when}</span>
                        <span style={{ fontSize:11, color:C.gray }}>· {s.mode==='home' ? '🏠 Home' : '🖥 Online'}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setView('picker')}
                    style={{ fontFamily:pj, fontWeight:800, fontSize:13, padding:'10px 16px', borderRadius:10, border:'none', background:C.forest, color:'#fff', cursor:'pointer', width:'100%' }}>
                    Choose your slot →
                  </button>
                </div>
              )}
              {booking && (
                <div style={{ background:'#F0FAF4', border:`1px solid ${C.green}`, borderRadius:12, padding:14, fontFamily:pj }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.green, marginBottom:4 }}>Booking request submitted ✓</div>
                  <div style={{ fontSize:12, color:C.ink }}>A clinician will review and confirm your slot. You'll hear back on WhatsApp.</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            {/* Input */}
            <div style={{ padding:'12px 16px', borderTop:`1px solid ${C.border}`, display:'flex', gap:8, alignItems:'flex-end', flexShrink:0 }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}
                placeholder={contactSaved ? "Tell Drishti what's going on…" : "Chat with Drishti (save contact above to book)"}
                rows={2}
                style={{ fontFamily:pj, fontSize:13, padding:'10px 12px', borderRadius:10, border:`1px solid ${C.border}`, flex:1, resize:'none', outline:'none', lineHeight:1.5 }} />
              <button onClick={() => send()} disabled={!input.trim()||loading}
                style={{ fontFamily:pj, fontSize:13, fontWeight:700, padding:'10px 18px', borderRadius:10, border:'none',
                  background: (!input.trim()||loading) ? C.border : C.forest,
                  color: (!input.trim()||loading) ? C.gray : '#fff',
                  cursor: (!input.trim()||loading) ? 'default' : 'pointer', whiteSpace:'nowrap', alignSelf:'stretch' }}>
                Send
              </button>
            </div>
          </>
        )}

        {/* ── Picker view ── */}
        {view === 'picker' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
            {/* month label */}
            <div style={{ padding:'14px 20px 8px', fontFamily:pd, fontSize:'1.3rem', fontWeight:800, color:C.ink, flexShrink:0 }}>
              {dateGroups[0]?.month || ''}
            </div>
            {/* date strip */}
            <div style={{ flexShrink:0, paddingBottom:12 }}>
              <DateStrip dates={dateGroups} selected={selectedDate} onSelect={d => { setSelectedDate(d); setChosenSlotId(null) }} />
            </div>
            {/* legend */}
            <div style={{ flexShrink:0, borderBottom:`1px solid ${C.border}` }}>
              <Legend />
            </div>
            {/* time grid */}
            <TimeGrid slots={slotsForDate} chosen={chosenSlotId} onChoose={id => setChosenSlotId(id === chosenSlotId ? null : id)} />
            {/* continue */}
            <div style={{ padding:'12px 20px', borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
              <button disabled={!chosenSlotId} onClick={() => setView('review')}
                style={{ fontFamily:pj, fontWeight:800, fontSize:15, padding:'14px', width:'100%',
                  borderRadius:14, border:'none', cursor: chosenSlotId ? 'pointer' : 'default',
                  background: chosenSlotId ? C.forest : C.border,
                  color: chosenSlotId ? '#fff' : C.gray,
                  transition:'background .18s' }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Review view ── */}
        {view === 'review' && chosenSlot && (
          <ReviewScreen
            slot={chosenSlot}
            onBack={() => setView('picker')}
            onConfirm={confirmBooking}
            confirming={confirming}
          />
        )}

      </div>
    </div>
  )
}
