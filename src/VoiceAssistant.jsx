/**
 * PhysioDrishti — "Talk to Drishti" voice + text assistant (floating button)
 * Mic -> /api/voice (Sarvam STT -> agent -> Sarvam TTS) -> plays the reply.
 * Typed messages go to /api/agent. Contact details are sent separately,
 * used only by the booking tool, and never shown to the AI model.
 */
import { useState, useRef, useEffect } from 'react'

const C = { forest:'#12382A', saffron:'#D4510E', ink:'#0D1520', gray:'#5C6878', light:'#F3F6FA', border:'#DDE4EF', red:'#B83232', green:'#177A45' }
const font = "'Plus Jakarta Sans',sans-serif"
const MAX_SECONDS = 25

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] || '')
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

async function postJson(url, body) {
  const res = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { throw new Error('Server error (' + res.status + '). Please try again.') }
  if (!res.ok) throw new Error(json.error || 'Something went wrong')
  return json
}

export default function VoiceAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role:'assistant', text:'Hi, I am Drishti. Ask about your pain or book a session. Tap the mic to speak in English, Hindi, Kannada or other Indian languages.' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const [contact, setContact] = useState({ name:'', phone:'' })
  const [showContact, setShowContact] = useState(false)
  const [pendingAudio, setPendingAudio] = useState(null)
  const recRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, busy])

  const history = () => messages.slice(1).filter((m) => m.role === 'user' || m.role === 'assistant').map((m) => ({ role:m.role, text:m.text })).slice(-8)
  const contactPayload = () => (contact.phone.trim() ? { name:contact.name.trim(), phone:contact.phone.trim() } : null)

  const handleReply = (r) => {
    setMessages((m) => [...m, { role:'assistant', text:r.reply, booking:r.booking, refused:r.refused, reason:r.reason }])
    if (/contact box/i.test(r.reply || '')) setShowContact(true)
    if (r.audio?.base64) {
      const audio = new Audio('data:' + r.audio.mime + ';base64,' + r.audio.base64)
      audio.play().catch(() => setPendingAudio(audio))
    }
  }

  const sendText = async () => {
    const text = input.trim()
    if (!text || busy) return
    setInput(''); setError(''); setBusy(true)
    setMessages((m) => [...m, { role:'user', text }])
    try {
      handleReply(await postJson('/api/agent', { message:text, history:history(), contact:contactPayload() }))
    } catch (e) { setError(String(e.message || e)) } finally { setBusy(false) }
  }

  const sendVoice = async (blob) => {
    setBusy(true); setError('')
    setMessages((m) => [...m, { role:'user', text:'🎙 …', pending:true }])
    try {
      const audio = await blobToBase64(blob)
      const r = await postJson('/api/voice', { audio, mime:blob.type, history:history(), contact:contactPayload() })
      setMessages((m) => {
        const copy = [...m]
        const idx = copy.findLastIndex ? copy.findLastIndex((x) => x.pending) : copy.length - 1
        if (idx >= 0) copy[idx] = { role:'user', text:r.transcript ? '🎙 ' + r.transcript : '🎙 (not heard)' }
        return copy
      })
      handleReply(r)
    } catch (e) {
      setMessages((m) => m.filter((x) => !x.pending))
      setError(String(e.message || e))
    } finally { setBusy(false) }
  }

  const stop = () => {
    clearInterval(timerRef.current)
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
    setRecording(false)
  }

  const start = async () => {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError('Voice is not supported in this browser. Please type instead.'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true })
      const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t)) || ''
      const rec = new MediaRecorder(stream, type ? { mimeType:type } : undefined)
      chunksRef.current = []
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type:rec.mimeType || type || 'audio/webm' })
        if (blob.size > 0) sendVoice(blob)
      }
      rec.start()
      recRef.current = rec
      setRecording(true); setSeconds(0)
      timerRef.current = setInterval(() => setSeconds((s) => { if (s + 1 >= MAX_SECONDS) stop(); return s + 1 }), 1000)
    } catch {
      setError('Microphone permission was denied. Allow it in your browser settings, or type instead.')
    }
  }

  const btn = (bg, color = '#fff') => ({ fontFamily:font, fontSize:13, fontWeight:700, border:'none', borderRadius:20, padding:'10px 14px', cursor:'pointer', background:bg, color })

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} aria-label="Talk to Drishti"
        style={{ position:'fixed', right:20, bottom:20, zIndex:900, ...btn(C.saffron), padding:'14px 20px', boxShadow:'0 8px 24px rgba(0,0,0,.25)' }}>
        🎙 Talk to Drishti
      </button>
    )
  }

  return (
    <div style={{ position:'fixed', right:16, bottom:16, zIndex:900, width:'min(400px, 92vw)', height:'min(640px, 78vh)', background:'#fff', borderRadius:16, boxShadow:'0 16px 48px rgba(0,0,0,.3)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ background:C.forest, color:'#fff', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:16 }}>Drishti</div>
          <div style={{ fontFamily:font, fontSize:10, opacity:.75 }}>AI assistant · not medical advice · emergencies: call 112</div>
        </div>
        <button onClick={() => { stop(); setOpen(false) }} style={{ ...btn('rgba(255,255,255,.15)'), padding:'6px 10px' }}>✕</button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:14, background:C.light }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent:m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom:8 }}>
            <div style={{ maxWidth:'82%', fontFamily:font, fontSize:13, lineHeight:1.55, padding:'9px 12px', borderRadius:12,
              background:m.role === 'user' ? C.saffron : '#fff', color:m.role === 'user' ? '#fff' : C.ink,
              border:m.role === 'user' ? 'none' : `1px solid ${m.reason === 'red_flag' ? C.red : C.border}` }}>
              {m.text}
              {m.booking && (
                <div style={{ marginTop:8, padding:8, borderRadius:8, background:'#EDF7F2', color:C.green, fontWeight:700, fontSize:12 }}>
                  ✅ Request sent for {m.booking.when} ({m.booking.mode}). A clinician will confirm on WhatsApp.
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <div style={{ fontFamily:font, fontSize:12, color:C.gray }}>Drishti is thinking…</div>}
        {pendingAudio && <button onClick={() => { pendingAudio.play(); setPendingAudio(null) }} style={{ ...btn(C.forest), marginTop:6 }}>▶ Play reply</button>}
        <div ref={endRef} />
      </div>

      {error && <div style={{ fontFamily:font, fontSize:12, color:C.red, padding:'6px 14px' }}>⚠️ {error}</div>}

      <div style={{ borderTop:`1px solid ${C.border}`, padding:10 }}>
        <button onClick={() => setShowContact((v) => !v)} style={{ fontFamily:font, fontSize:11, fontWeight:700, color:C.forest, background:'none', border:'none', cursor:'pointer', padding:'0 0 6px' }}>
          {showContact ? '▾' : '▸'} Contact for booking {contact.phone ? '✓' : ''}
        </button>
        {showContact && (
          <div style={{ display:'flex', gap:6, marginBottom:8 }}>
            <input placeholder="Name" value={contact.name} onChange={(e) => setContact({ ...contact, name:e.target.value })}
              style={{ flex:1, minWidth:0, fontFamily:font, fontSize:12, padding:'8px 10px', border:`1px solid ${C.border}`, borderRadius:8 }} />
            <input placeholder="WhatsApp number" inputMode="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone:e.target.value })}
              style={{ flex:1, minWidth:0, fontFamily:font, fontSize:12, padding:'8px 10px', border:`1px solid ${C.border}`, borderRadius:8 }} />
          </div>
        )}
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <button onClick={recording ? stop : start} disabled={busy && !recording}
            style={{ ...btn(recording ? C.red : C.forest), padding:'10px 14px', opacity:busy && !recording ? .5 : 1 }}>
            {recording ? `■ ${MAX_SECONDS - seconds}s` : '🎙'}
          </button>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendText()}
            placeholder={recording ? 'Listening…' : 'Type a message'} disabled={recording}
            style={{ flex:1, minWidth:0, fontFamily:font, fontSize:13, padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:20 }} />
          <button onClick={sendText} disabled={busy || !input.trim()} style={{ ...btn(C.saffron), opacity:busy || !input.trim() ? .5 : 1 }}>➤</button>
        </div>
      </div>
    </div>
  )
}
