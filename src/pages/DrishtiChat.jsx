/**
 * DrishtiChat — floating bottom-right chat widget.
 * Text: POST /api/agent  { message, contact, history, language }
 * Voice: POST /api/voice { audio (base64), mime, contact, history }
 */
import { useState, useRef, useEffect } from 'react'

const C = {
  forest:'#12382A', teal:'#0A6B5E', saffron:'#D4510E',
  ink:'#0D1520', gray:'#5C6878', light:'#F3F6FA', border:'#DDE4EF',
  green:'#177A45', red:'#B83232',
}
const pj = "'Plus Jakarta Sans',sans-serif"
const pd = "'Playfair Display',serif"

const OPENER = "Hi! I'm Drishti 👋 Tell me what's bothering you — I can answer questions or help you book a session."

export default function DrishtiChat() {
  const [open, setOpen]           = useState(false)
  const [contact, setContact]     = useState({ name:'', phone:'' })
  const [contactSaved, setContactSaved] = useState(false)
  const [contactErr, setContactErr]     = useState('')
  const [messages, setMessages]   = useState([{ role:'assistant', text: OPENER }])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [history, setHistory]     = useState([])
  const [booking, setBooking]     = useState(null)

  // Voice recording state
  const [recState, setRecState]   = useState('idle') // idle | recording | processing
  const mediaRef  = useRef(null)
  const chunksRef = useRef([])

  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, open])

  /* ── Contact ── */
  const saveContact = () => {
    const name = contact.name.trim()
    const phone = contact.phone.trim()
    if (name.length < 2) { setContactErr('Enter your name.'); return }
    if (!/^[6-9]\d{9}$/.test(phone)) { setContactErr('Enter a valid 10-digit Indian mobile.'); return }
    setContactErr('')
    setContactSaved(true)
  }

  /* ── Text send ── */
  const sendText = async (text) => {
    if (!text.trim() || loading) return
    setInput('')
    setMessages(p => [...p, { role:'user', text }])
    setLoading(true)
    try {
      const res = await fetch('/api/agent', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          message: text,
          contact: contactSaved ? { name: contact.name.trim(), phone: contact.phone.trim() } : null,
          history,
          language: 'en-IN',
        }),
      })
      const data = await res.json()
      const reply = res.ok ? (data.reply || 'No reply.') : (data.error || 'Server error. Please try again.')
      setMessages(p => [...p, { role:'assistant', text: reply }])
      setHistory(p => [...p, { role:'user', text }, { role:'assistant', text: reply }])
      if (data.booking && !booking) { setBooking(data.booking) }
    } catch {
      setMessages(p => [...p, { role:'assistant', text:'Could not reach the server. Please try again.' }])
    } finally { setLoading(false) }
  }

  /* ── Voice ── */
  const startRec = async () => {
    if (recState !== 'idle') return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      const mr = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setRecState('processing')
        const blob = new Blob(chunksRef.current, { type: mime })
        const ab = await blob.arrayBuffer()
        const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)))
        setMessages(p => [...p, { role:'user', text:'🎙 (voice message)' }])
        try {
          const res = await fetch('/api/voice', {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({
              audio: b64,
              mime: mime.split(';')[0],
              contact: contactSaved ? { name: contact.name.trim(), phone: contact.phone.trim() } : null,
              history,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Voice error')
          const transcript = data.transcript ? `"${data.transcript}"` : null
          const reply = data.reply || 'No reply.'
          if (transcript) setMessages(p => [...p, { role:'system', text: `Heard: ${transcript}` }])
          setMessages(p => [...p, { role:'assistant', text: reply }])
          setHistory(p => [...p, { role:'user', text: data.transcript || '(voice)' }, { role:'assistant', text: reply }])
          if (data.booking && !booking) setBooking(data.booking)
          // Play TTS audio if returned
          if (data.audio?.base64) {
            const bytes = Uint8Array.from(atob(data.audio.base64), (c) => c.charCodeAt(0))
            const ab2 = bytes.buffer
            const ctx = new AudioContext()
            const decoded = await ctx.decodeAudioData(ab2)
            const src = ctx.createBufferSource()
            src.buffer = decoded
            src.connect(ctx.destination)
            src.start()
          }
        } catch (err) {
          setMessages(p => [...p, { role:'assistant', text: err.message || 'Voice failed. Try again.' }])
        } finally { setRecState('idle') }
      }
      mr.start()
      mediaRef.current = mr
      setRecState('recording')
    } catch {
      setMessages(p => [...p, { role:'assistant', text:'Microphone access denied. Please allow mic access in your browser.' }])
    }
  }

  const stopRec = () => {
    if (mediaRef.current && recState === 'recording') {
      mediaRef.current.stop()
      mediaRef.current = null
    }
  }

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(input) } }

  /* ── Styles ── */
  const fabStyle = {
    position:'fixed', bottom:24, right:24, zIndex:900,
    display:'flex', alignItems:'center', gap:8,
    background: open ? C.ink : C.forest,
    color:'#fff', border:'none', borderRadius:40,
    padding:'12px 20px', cursor:'pointer', boxShadow:'0 4px 20px rgba(0,0,0,.25)',
    fontFamily:pj, fontSize:14, fontWeight:700, transition:'background .2s',
  }
  const panelStyle = {
    position:'fixed', bottom:84, right:24, zIndex:900,
    width: Math.min(window.innerWidth - 32, 380),
    maxHeight:'70vh', display:'flex', flexDirection:'column',
    background:'#fff', borderRadius:16, boxShadow:'0 8px 40px rgba(0,0,0,.18)',
    overflow:'hidden',
  }

  return (
    <>
      {/* FAB */}
      <button style={fabStyle} onClick={() => setOpen(o => !o)} aria-label="Talk to Drishti">
        <span style={{ fontSize:18 }}>{open ? '✕' : '🎙'}</span>
        {!open && <span>Talk to Drishti</span>}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={panelStyle}>
          {/* Header */}
          <div style={{ background:C.forest, padding:'12px 16px' }}>
            <div style={{ fontFamily:pd, fontSize:'1rem', fontWeight:800, color:'#fff' }}>Drishti</div>
            <div style={{ fontFamily:pj, fontSize:11, color:'rgba(255,255,255,.6)' }}>AI assistant · PhysioDrishti</div>
          </div>

          {/* Contact strip */}
          {!contactSaved ? (
            <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}`, background:C.light }}>
              <div style={{ fontFamily:pj, fontSize:11, fontWeight:700, color:C.forest, marginBottom:6 }}>Save contact to book a slot</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <input placeholder="Name" value={contact.name} onChange={e => setContact(p => ({...p, name: e.target.value}))}
                  style={{ fontFamily:pj, fontSize:12, padding:'6px 10px', borderRadius:7, border:`1px solid ${C.border}`, flex:1, minWidth:80, outline:'none' }} />
                <input placeholder="WhatsApp (10 digits)" value={contact.phone} onChange={e => setContact(p => ({...p, phone: e.target.value.replace(/\D/g,'').slice(0,10)}))}
                  style={{ fontFamily:pj, fontSize:12, padding:'6px 10px', borderRadius:7, border:`1px solid ${C.border}`, flex:1, minWidth:120, outline:'none' }} />
                <button onClick={saveContact} style={{ fontFamily:pj, fontSize:12, fontWeight:700, padding:'6px 12px', borderRadius:7, border:'none', background:C.teal, color:'#fff', cursor:'pointer' }}>Save</button>
              </div>
              {contactErr && <div style={{ fontFamily:pj, fontSize:11, color:C.red, marginTop:4 }}>{contactErr}</div>}
            </div>
          ) : (
            <div style={{ padding:'6px 14px', borderBottom:`1px solid ${C.border}`, background:'#F0FAF4', display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontFamily:pj, fontSize:11, color:C.green, fontWeight:600 }}>✓ {contact.name}</span>
              <button onClick={() => setContactSaved(false)} style={{ fontFamily:pj, fontSize:11, background:'none', border:'none', color:C.gray, cursor:'pointer', textDecoration:'underline' }}>Edit</button>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
            {messages.map((m, i) => (
              m.role === 'system'
                ? <div key={i} style={{ fontFamily:pj, fontSize:11, color:C.gray, textAlign:'center', fontStyle:'italic' }}>{m.text}</div>
                : (
                  <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth:'85%', padding:'8px 12px', lineHeight:1.55,
                      borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      background: m.role === 'user' ? C.teal : C.light,
                      color: m.role === 'user' ? '#fff' : C.ink,
                      fontFamily:pj, fontSize:13,
                    }}>{m.text}</div>
                  </div>
                )
            ))}
            {(loading || recState === 'processing') && (
              <div style={{ display:'flex', justifyContent:'flex-start' }}>
                <div style={{ padding:'8px 12px', borderRadius:'12px 12px 12px 2px', background:C.light, fontFamily:pj, fontSize:13, color:C.gray }}>
                  {recState === 'processing' ? 'Transcribing…' : 'Drishti is thinking…'}
                </div>
              </div>
            )}
            {booking && (
              <div style={{ background:'#F0FAF4', border:`1px solid ${C.green}`, borderRadius:8, padding:10, fontFamily:pj, fontSize:12 }}>
                <div style={{ fontWeight:700, color:C.green }}>Booking request sent ✓</div>
                <div style={{ color:C.ink, marginTop:2 }}>A clinician will confirm on WhatsApp.</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding:'10px 12px', borderTop:`1px solid ${C.border}`, display:'flex', gap:6, alignItems:'flex-end' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
              placeholder="Type a question…" rows={2} disabled={loading || recState !== 'idle'}
              style={{ fontFamily:pj, fontSize:13, padding:'8px 10px', borderRadius:8, border:`1px solid ${C.border}`, flex:1, resize:'none', outline:'none', lineHeight:1.5 }} />
            {/* Send button */}
            <button onClick={() => sendText(input)} disabled={!input.trim() || loading || recState !== 'idle'}
              style={{ fontFamily:pj, fontSize:12, fontWeight:700, padding:'8px 12px', borderRadius:8, border:'none',
                background: (!input.trim() || loading || recState !== 'idle') ? C.border : C.forest,
                color: (!input.trim() || loading || recState !== 'idle') ? C.gray : '#fff',
                cursor: (!input.trim() || loading || recState !== 'idle') ? 'default' : 'pointer', whiteSpace:'nowrap' }}>
              Send
            </button>
            {/* Mic button */}
            <button
              onClick={recState === 'idle' ? startRec : stopRec}
              disabled={loading || recState === 'processing'}
              title={recState === 'recording' ? 'Tap to stop' : 'Tap to speak'}
              style={{ padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer', fontSize:16,
                background: recState === 'recording' ? C.red : C.saffron, color:'#fff',
                animation: recState === 'recording' ? 'pulse 1s infinite' : 'none' }}>
              {recState === 'recording' ? '⏹' : '🎙'}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </>
  )
}
