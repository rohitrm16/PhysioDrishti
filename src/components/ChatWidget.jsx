import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase.js'

const OPENER = "Hi there! 👋 I'm Maya from PhysioDrishti. Where does it hurt most?"

export default function ChatWidget() {
  const [open,  setOpen]  = useState(false)
  const [msgs,  setMsgs]  = useState([{ role: 'assistant', text: OPENER }])
  const [input, setInput] = useState('')
  const [busy,  setBusy]  = useState(false)
  const [done,  setDone]  = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, busy, open])

  const send = async () => {
    const txt = input.trim()
    if (!txt || busy || done) return
    setInput('')

    const nextMsgs = [...msgs, { role: 'user', text: txt }]
    setMsgs(nextMsgs)
    setBusy(true)

    const apiMsgs = nextMsgs.map(m => ({ role: m.role, content: m.text }))

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMsgs }),
      })
      const data = await r.json()

      setMsgs(p => [...p, { role: 'assistant', text: data.text }])

      if (data.lead) {
        try {
          await supabase.from('leads').insert({
            name:     data.lead.name,
            phone:    data.lead.phone,
            pain:     data.lead.pain,
            note:     data.lead.note || null,
            stage:    'new',
            priority: 'medium',
          })
        } catch (e) { console.error('Lead save:', e) }
        setDone(true)
      }
    } catch {
      setMsgs(p => [...p, { role: 'assistant', text: "I'm having trouble right now — please use the 'Book free call' button!" }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Pulse ring on first open */}
      {!open && (
        <div style={{
          position: 'fixed', bottom: 22, right: 22, zIndex: 996,
          width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(18,56,42,.15)',
          animation: 'chatPulse 2s ease-out infinite',
          pointerEvents: 'none',
        }}/>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat' : 'Chat with Maya'}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 998,
          width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: open ? '#5C6878' : '#12382A',
          boxShadow: '0 4px 18px rgba(0,0,0,.28)',
          fontSize: 22, transition: 'all .3s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 86, right: 20, zIndex: 997,
          width: 'min(340px, calc(100vw - 32px)',
          maxHeight: 'min(480px, calc(100vh - 110px))',
          background: '#fff', borderRadius: 16,
          boxShadow: '0 10px 48px rgba(0,0,0,.22)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'fadeUp .22s ease',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg,#12382A,#1E5C3A)',
            padding: '13px 16px',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#3A9A6B', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18, flexShrink: 0,
            }}>🩺</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 700, color: '#fff' }}>Maya · PhysioDrishti</div>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize: 11, color: 'rgba(255,255,255,.55)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, background: '#4ADE80', borderRadius: '50%' }}/>
                Online — replies in seconds
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '84%', padding: '9px 13px', lineHeight: 1.55,
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                  background: m.role === 'user' ? '#12382A' : '#F3F6FA',
                  color: m.role === 'user' ? '#fff' : '#0D1520',
                  fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13,
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* Typing dots */}
            {busy && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 6px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#3A9A6B',
                    animation: `blink 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }}/>
                ))}
              </div>
            )}
            <div ref={endRef}/>
          </div>

          {/* Footer */}
          {done ? (
            <div style={{
              padding: '14px 16px', background: '#F0FDF4',
              borderTop: '1px solid #D1FAE5', textAlign: 'center', flexShrink: 0,
            }}>
              <div style={{ fontSize: 24, marginBottom: 5 }}>✅</div>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 700, color: '#177A45' }}>
                You're all set! The doctor will WhatsApp you shortly.
              </div>
            </div>
          ) : (
            <div style={{ padding: '9px 10px', borderTop: '1px solid #E5E9EF', display: 'flex', gap: 7, flexShrink: 0 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Type here…"
                autoFocus
                style={{
                  flex: 1, padding: '9px 12px', border: '1.5px solid #DDE4EF', borderRadius: 8,
                  fontSize: 13, outline: 'none',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  transition: 'border-color .2s',
                }}
                onFocus={e => e.target.style.borderColor = '#3A9A6B'}
                onBlur={e => e.target.style.borderColor = '#DDE4EF'}
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: 'none', flexShrink: 0,
                  background: input.trim() && !busy ? '#12382A' : '#DDE4EF',
                  color: '#fff', cursor: input.trim() && !busy ? 'pointer' : 'default',
                  fontSize: 16, transition: 'background .2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >→</button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes chatPulse {
          0%   { transform: scale(1); opacity: .6; }
          70%  { transform: scale(1.9); opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  )
}
