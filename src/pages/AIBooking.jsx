/**
 * PhysioDrishti — Drishti Conversational Booking
 * Rule-based warm AI persona with guided conversation stages.
 * Usage: <AIBookingChat onClose={fn} onSuccess={fn}/>
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase.js'

/* ── Brand ─────────────────────────────────────────────────────── */
const C = {
  forest:'#12382A', teal:'#0A6B5E', mint:'#3A9A6B',
  saffron:'#D4510E', ink:'#0D1520', gray:'#5C6878',
  light:'#F3F6FA', border:'#DDE4EF', cream:'#FDFAF3',
}

/* ── Quick reply sets ───────────────────────────────────────────── */
const QUICK_PAIN = [
  'Back or neck pain','Knee or hip pain','Shoulder problem',
  'Sports injury','After surgery','Something else'
]
const QUICK_DURATION = [
  'Just started','A few days','1–2 weeks','1–3 months','More than 3 months'
]
const QUICK_AREA = [
  'Koramangala','HSR Layout','Whitefield','Indiranagar',
  'Jayanagar','Marathahalli','Online session'
]

/* ── Drishti conversation scripts ───────────────────────────────── */
const SCRIPTS = [
  ()  => "Hi there! 👋 I'm Drishti, PhysioDrishti's assistant.\n\nI'll help you find the right care in just a few questions. What's your name?",
  (d) => `Hi ${d.name}! 😊 Great to meet you.\n\nWhere does it hurt? Tell me in your own words, or pick one of the options below.`,
  (d) => `I'm sorry to hear about your ${d.pain.toLowerCase()} — that can really disrupt daily life.\n\nHow long have you been dealing with this?`,
  ()  => "Got it. Which part of Bengaluru are you in? I'll find a specialist near you — or we can arrange an online session.",
  (d) => `${d.area} — perfect! Last thing — what's your WhatsApp number so our team can reach you?`,
]

const STAGE_CHIPS = [[], [], QUICK_PAIN, QUICK_DURATION, QUICK_AREA, []]

/* ── Typing indicator ───────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display:'flex', gap:4, alignItems:'center', padding:'12px 16px',
                  background:C.forest, borderRadius:'18px 18px 18px 4px',
                  width:'fit-content', marginBottom:12 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:7, height:7, borderRadius:'50%', background:'rgba(255,255,255,0.6)',
          animation:`typingBounce 1.2s ease ${i*0.18}s infinite`
        }}/>
      ))}
    </div>
  )
}

/* ── Message bubble ─────────────────────────────────────────────── */
function Bubble({ msg }) {
  const isAI = msg.role === 'assistant'
  return (
    <div style={{
      display:'flex', justifyContent: isAI ? 'flex-start' : 'flex-end',
      marginBottom:10, animation:'fadeUp .35s ease both'
    }}>
      {isAI && (
        <div style={{
          width:30, height:30, borderRadius:'50%', background:C.forest,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:14, marginRight:8, flexShrink:0, alignSelf:'flex-end',
          boxShadow:'0 2px 8px rgba(18,56,42,.25)'
        }}>🌿</div>
      )}
      <div style={{
        maxWidth:'75%', padding:'11px 16px',
        borderRadius: isAI ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
        background: isAI ? C.forest : C.saffron,
        color:'#fff',
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        fontSize:14, lineHeight:1.65,
        boxShadow: isAI
          ? '0 2px 12px rgba(18,56,42,.2)'
          : '0 2px 12px rgba(212,81,14,.25)',
        whiteSpace:'pre-wrap',
      }}>
        {msg.content}
      </div>
    </div>
  )
}

/* ── Quick reply chip ───────────────────────────────────────────── */
function Chip({ label, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={() => onClick(label)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding:'8px 14px', borderRadius:20,
        border:`1.5px solid ${C.forest}`,
        background: hovered ? C.forest : '#fff',
        color: hovered ? '#fff' : C.forest,
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        fontSize:13, fontWeight:600, cursor:'pointer',
        transition:'all .18s', whiteSpace:'nowrap'
      }}>
      {label}
    </button>
  )
}

/* ── Success screen ─────────────────────────────────────────────── */
function SuccessScreen({ booking, onClose }) {
  return (
    <div style={{
      flex:1, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'32px 24px', textAlign:'center',
      animation:'fadeUp .5s ease'
    }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
      <div style={{
        fontFamily:"'Playfair Display',serif", fontWeight:900,
        fontSize:'1.5rem', color:C.forest, marginBottom:8
      }}>
        You're booked, {booking.name}!
      </div>
      <div style={{
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        fontSize:14, color:C.gray, lineHeight:1.7, marginBottom:28,
        maxWidth:280
      }}>
        We'll WhatsApp you on <strong>{booking.phone}</strong> within
        30 minutes to confirm your session. Keep your phone handy!
      </div>

      <div style={{
        background:C.light, borderRadius:12, padding:'18px 22px',
        width:'100%', maxWidth:320, marginBottom:28,
        border:`1px solid ${C.border}`, textAlign:'left'
      }}>
        <div style={{
          fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800,
          fontSize:11, letterSpacing:2, textTransform:'uppercase',
          color:C.saffron, marginBottom:14
        }}>Your booking details</div>
        {[
          ['👤','Name',    booking.name],
          ['📍','Area',    booking.area],
          ['🩺','Concern', booking.pain],
          ['📱','Phone',   booking.phone],
        ].map(([icon,label,value]) => (
          <div key={label} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
            <span style={{ fontSize:15, flexShrink:0 }}>{icon}</span>
            <div>
              <div style={{
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                fontSize:10, fontWeight:700, color:C.gray,
                textTransform:'uppercase', letterSpacing:1, marginBottom:1
              }}>{label}</div>
              <div style={{
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                fontSize:13, fontWeight:600, color:C.ink
              }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        fontSize:12, color:C.gray, marginBottom:20
      }}>
        ✓ No cost · ✓ Quick callback · ✓ Right specialist for you
      </div>

      <button
        onClick={onClose}
        style={{
          background:C.forest, color:'#fff', border:'none',
          borderRadius:8, padding:'12px 32px',
          fontFamily:"'Plus Jakarta Sans',sans-serif",
          fontSize:14, fontWeight:700, cursor:'pointer',
          width:'100%', maxWidth:320
        }}>
        Done
      </button>
    </div>
  )
}

/* ── Main Drishti Booking Chat ──────────────────────────────────── */
export default function AIBookingChat({ onClose, onSuccess }) {
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [chips,    setChips]    = useState([])
  const [booking,  setBooking]  = useState(null)
  const [stage,    setStage]    = useState(0)
  const dataRef   = useRef({ name:'', pain:'', duration:'', area:'', phone:'' })
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (stage === 1) inputRef.current?.focus()
  }, [stage])

  useEffect(() => {
    setChips(STAGE_CHIPS[stage] ?? [])
  }, [stage])

  useEffect(() => {
    drishtiSay(SCRIPTS[0](), 700, 1)
  }, [])

  const addMsg = (content, role = 'assistant') =>
    setMessages(p => [...p, { role, content }])

  const drishtiSay = (text, delay, nextStage) => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      addMsg(text)
      if (nextStage !== undefined) setStage(nextStage)
    }, delay)
  }

  const send = (raw) => {
    const text = (raw || '').trim()
    if (!text || loading || stage === 0 || stage >= 6) return
    addMsg(text, 'user')
    setInput('')
    setChips([])

    const d = dataRef.current
    switch (stage) {
      case 1:
        d.name = text
        drishtiSay(SCRIPTS[1](d), 1100, 2)
        break
      case 2:
        d.pain = text
        drishtiSay(SCRIPTS[2](d), 1100, 3)
        break
      case 3:
        d.duration = text
        drishtiSay(SCRIPTS[3](d), 1000, 4)
        break
      case 4:
        d.area = text
        drishtiSay(SCRIPTS[4](d), 900, 5)
        break
      case 5:
        d.phone = text
        setStage(6)
        setLoading(true)
        setTimeout(async () => {
          setLoading(false)
          addMsg(`You're all set, ${d.name}! 🎉 Booking your free consultation now...`)
          try {
            await supabase.from('leads').insert({
              name:     d.name,
              phone:    d.phone,
              area:     d.area,
              pain:     d.pain,
              note:     `${d.pain} for ${d.duration}. Located in ${d.area}. Via Drishti chat.`,
              stage:    'new',
              priority: 'medium',
            })
          } catch (err) {
            console.error('[AIBookingChat] Supabase insert error:', err)
          }
          setBooking({ name:d.name, phone:d.phone, area:d.area, pain:d.pain })
          if (onSuccess) onSuccess(d)
        }, 900)
        break
    }
  }

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes typingBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
    * { box-sizing:border-box; margin:0; padding:0; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:#DDE4EF; border-radius:2px; }
    textarea:focus, input:focus { outline:none; }
  `

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.6)',
      zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center',
      padding:'12px'
    }} onClick={onClose}>
      <style>{CSS}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:'100%', maxWidth:460,
          height:'min(660px, 90vh)',
          background:'#fff', borderRadius:20,
          boxShadow:'0 32px 80px rgba(0,0,0,.3)',
          display:'flex', flexDirection:'column',
          overflow:'hidden', animation:'fadeUp .4s ease'
        }}>

        {/* Header */}
        <div style={{
          background:`linear-gradient(135deg,${C.forest},#0E3222)`,
          padding:'16px 20px',
          display:'flex', alignItems:'center', gap:12, flexShrink:0
        }}>
          <div style={{
            width:40, height:40, borderRadius:'50%',
            background:'rgba(255,255,255,.15)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, border:'2px solid rgba(255,255,255,.25)'
          }}>🌿</div>
          <div style={{ flex:1 }}>
            <div style={{
              fontFamily:"'Plus Jakarta Sans',sans-serif",
              fontWeight:800, fontSize:14, color:'#fff'
            }}>Drishti</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80' }}/>
              <span style={{
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                fontSize:11, color:'rgba(255,255,255,.65)'
              }}>PhysioDrishti assistant · Online now</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background:'rgba(255,255,255,.15)', border:'none',
            borderRadius:8, width:32, height:32,
            color:'rgba(255,255,255,.8)', cursor:'pointer', fontSize:15,
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>✕</button>
        </div>

        {/* Chat area or success */}
        {booking ? (
          <SuccessScreen booking={booking} onClose={onClose}/>
        ) : (
          <>
            <div style={{
              flex:1, overflowY:'auto', padding:'20px 16px 8px',
              background:C.cream
            }}>
              {messages.map((msg, i) => <Bubble key={i} msg={msg}/>)}
              {loading && <TypingDots/>}
              <div ref={bottomRef}/>
            </div>

            {/* Quick-reply chips */}
            {chips.length > 0 && !loading && (
              <div style={{
                padding:'10px 16px 6px', background:C.cream,
                display:'flex', gap:8, flexWrap:'wrap',
                borderTop:`1px solid ${C.border}`, flexShrink:0
              }}>
                {chips.map(c => (
                  <Chip key={c} label={c} onClick={val => send(val)}/>
                ))}
              </div>
            )}

            {/* Input bar */}
            {stage < 6 && (
              <div style={{
                padding:'12px 16px',
                background:'#fff',
                borderTop:`1px solid ${C.border}`,
                display:'flex', gap:10, alignItems:'flex-end',
                flexShrink:0
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send(input)
                    }
                  }}
                  placeholder={{ 1:'Your name…', 5:'WhatsApp number…' }[stage] || 'Type your reply…'}
                  rows={1}
                  disabled={loading || stage === 0}
                  style={{
                    flex:1, resize:'none', border:`1.5px solid ${C.border}`,
                    borderRadius:22, padding:'10px 16px',
                    fontFamily:"'Plus Jakarta Sans',sans-serif",
                    fontSize:14, lineHeight:1.5, background:C.light,
                    color:C.ink, transition:'border-color .2s',
                    maxHeight:80, overflow:'auto'
                  }}
                  onFocus={e => e.target.style.borderColor = C.mint}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading || stage === 0}
                  style={{
                    width:42, height:42, borderRadius:'50%', border:'none',
                    background: input.trim() && !loading && stage > 0 ? C.saffron : C.border,
                    color:'#fff',
                    cursor: input.trim() && !loading && stage > 0 ? 'pointer' : 'default',
                    fontSize:18, display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all .2s', flexShrink:0
                  }}>
                  ➤
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
