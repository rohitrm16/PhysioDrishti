/**
 * BookingAgent — AI-powered booking chat powered by /api/agent.
 * Shows a contact form (name + WhatsApp) alongside a chat window.
 * onClose: () => void
 * onSuccess: (booking) => void
 */
import { useState, useEffect, useRef } from 'react'

const C = {
  forest:'#12382A', teal:'#0A6B5E', mint:'#3A9A6B',
  saffron:'#D4510E', ink:'#0D1520', gray:'#5C6878',
  light:'#F3F6FA', border:'#DDE4EF', green:'#177A45',
}
const pj = "'Plus Jakarta Sans',sans-serif"
const pd = "'Playfair Display',serif"

const OPENERS = [
  "Hi! I'm Drishti, your physiotherapy assistant. 👋 Tell me what's bothering you — where's the pain, and how long has it been going on?",
]

export default function BookingAgent({ onClose, onSuccess }) {
  const [contact, setContact]   = useState({ name:'', phone:'' })
  const [contactSaved, setContactSaved] = useState(false)
  const [contactErr, setContactErr]     = useState('')

  const [messages, setMessages] = useState([{ role:'assistant', text: OPENERS[0] }])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [sessionId, setSessionId]   = useState(null)
  const [history, setHistory]   = useState([])
  const [booking, setBooking]   = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const saveContact = () => {
    const name = contact.name.trim()
    const phone = contact.phone.trim()
    if (name.length < 2) { setContactErr('Please enter your name.'); return }
    if (!/^[6-9]\d{9}$/.test(phone)) { setContactErr('Enter a valid 10-digit Indian mobile number.'); return }
    setContactErr('')
    setContactSaved(true)
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(p => [...p, { role:'user', text }])
    setLoading(true)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId || undefined,
          contact: contactSaved ? { name: contact.name.trim(), phone: contact.phone.trim() } : null,
          history,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages(p => [...p, { role:'assistant', text: data.error || 'Something went wrong. Please try again.' }])
        return
      }
      setMessages(p => [...p, { role:'assistant', text: data.reply }])
      setSessionId(data.session_id)
      setHistory(data.history || [])
      if (data.booking) {
        setBooking(data.booking)
        onSuccess?.(data.booking)
      }
    } catch {
      setMessages(p => [...p, { role:'assistant', text: 'Could not reach the server. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  const overlay = { position:'fixed', inset:0, background:'rgba(13,21,32,.55)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }
  const box     = { background:'#fff', borderRadius:16, width:'100%', maxWidth:600, maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.18)' }

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={box}>
        {/* Header */}
        <div style={{ background:C.forest, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:pd, fontSize:'1.1rem', fontWeight:800, color:'#fff' }}>Book with Drishti</div>
            <div style={{ fontFamily:pj, fontSize:11, color:'rgba(255,255,255,.6)', marginTop:2 }}>AI-powered · Human-reviewed</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,.7)', fontSize:20, cursor:'pointer', lineHeight:1 }}>✕</button>
        </div>

        {/* Contact form — collapses after save */}
        {!contactSaved ? (
          <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, background:C.light }}>
            <div style={{ fontFamily:pj, fontSize:12, fontWeight:700, color:C.forest, marginBottom:10 }}>Your contact details (so we can confirm your slot)</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <input
                placeholder="Your name"
                value={contact.name}
                onChange={e => setContact(p => ({ ...p, name: e.target.value }))}
                style={{ fontFamily:pj, fontSize:13, padding:'8px 12px', borderRadius:8, border:`1px solid ${C.border}`, flex:1, minWidth:120, outline:'none' }}
              />
              <input
                placeholder="WhatsApp number (10 digits)"
                value={contact.phone}
                onChange={e => setContact(p => ({ ...p, phone: e.target.value.replace(/\D/g,'').slice(0,10) }))}
                style={{ fontFamily:pj, fontSize:13, padding:'8px 12px', borderRadius:8, border:`1px solid ${C.border}`, flex:1, minWidth:150, outline:'none' }}
              />
              <button onClick={saveContact} style={{ fontFamily:pj, fontSize:13, fontWeight:700, padding:'8px 16px', borderRadius:8, border:'none', background:C.teal, color:'#fff', cursor:'pointer', whiteSpace:'nowrap' }}>Save</button>
            </div>
            {contactErr && <div style={{ fontFamily:pj, fontSize:11, color:'#B83232', marginTop:6 }}>{contactErr}</div>}
            <div style={{ fontFamily:pj, fontSize:11, color:C.gray, marginTop:6 }}>You can still chat without saving — but we'll need this to confirm a slot.</div>
          </div>
        ) : (
          <div style={{ padding:'8px 20px', borderBottom:`1px solid ${C.border}`, background:'#F0FAF4', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:pj, fontSize:12, color:C.green, fontWeight:600 }}>✓ {contact.name} · +91 {contact.phone}</span>
            <button onClick={() => setContactSaved(false)} style={{ fontFamily:pj, fontSize:11, background:'none', border:'none', color:C.gray, cursor:'pointer', textDecoration:'underline' }}>Edit</button>
          </div>
        )}

        {/* Chat messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth:'80%', padding:'10px 14px', borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                background: m.role === 'user' ? C.teal : C.light,
                color: m.role === 'user' ? '#fff' : C.ink,
                fontFamily:pj, fontSize:13, lineHeight:1.6,
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display:'flex', justifyContent:'flex-start' }}>
              <div style={{ padding:'10px 14px', borderRadius:'14px 14px 14px 2px', background:C.light, fontFamily:pj, fontSize:13, color:C.gray }}>
                Drishti is thinking…
              </div>
            </div>
          )}
          {booking && (
            <div style={{ background:'#F0FAF4', border:`1px solid ${C.green}`, borderRadius:10, padding:14, fontFamily:pj }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.green, marginBottom:4 }}>Booking request submitted ✓</div>
              <div style={{ fontSize:12, color:C.ink }}>A clinician will review and confirm your slot. You'll hear back on WhatsApp.</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding:'12px 16px', borderTop:`1px solid ${C.border}`, display:'flex', gap:8, alignItems:'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={contactSaved ? "Tell Drishti what's going on…" : "Chat with Drishti (save contact above to book)"}
            rows={2}
            style={{ fontFamily:pj, fontSize:13, padding:'10px 12px', borderRadius:10, border:`1px solid ${C.border}`, flex:1, resize:'none', outline:'none', lineHeight:1.5 }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            style={{ fontFamily:pj, fontSize:13, fontWeight:700, padding:'10px 18px', borderRadius:10, border:'none', background: (!input.trim() || loading) ? C.border : C.forest, color: (!input.trim() || loading) ? C.gray : '#fff', cursor: (!input.trim() || loading) ? 'default' : 'pointer', whiteSpace:'nowrap', alignSelf:'stretch' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
