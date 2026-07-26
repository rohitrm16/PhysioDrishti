/**
 * PhysioDrishti — Doctor Profile Page
 * Public-facing page building patient trust before they book.
 */
import { useState, useEffect } from 'react'
import AIBookingChat from './AIBooking.jsx'
import logoImg from '../assets/physiodrishti-logo.png'

const C = {
  forest:'#12382A', teal:'#0A6B5E', mint:'#3A9A6B',
  saffron:'#D4510E', ink:'#0D1520', gray:'#5C6878',
  light:'#F3F6FA', border:'#DDE4EF', cream:'#FDFAF3',
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',sans-serif;background:#FDFAF3;color:#0D1520}
.pd{font-family:'Playfair Display',serif}
.pj{font-family:'Plus Jakarta Sans',sans-serif}
.btn-main{background:#D4510E;color:#fff;border:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif}
.btn-main:hover{background:#BF4610;transform:translateY(-1px)}
.btn-ghost-d{background:transparent;color:#12382A;border:2px solid #12382A;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif}
.btn-ghost-d:hover{background:#12382A;color:#fff}
.dp-card{background:#fff;border-radius:14px;border:1px solid #DDE4EF;box-shadow:0 2px 16px rgba(13,21,32,.07)}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.fade-dp{animation:fadeUp .5s ease both}
.spec-chip{background:#EDF7F2;color:#12382A;border:1px solid #C0DDCA;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;display:inline-block}
`

const SPECIALITIES = [
  'Orthopaedic Physiotherapy',
  'Sports Injury Rehabilitation',
  'Post-Surgical Recovery',
  'Neurological Physiotherapy',
  'Geriatric Care',
  'Online Physiotherapy',
  'Back & Neck Pain',
  'Knee & Hip Conditions',
]

const CREDENTIALS = [
  { icon:'🎓', text:'BPT — Rajiv Gandhi University of Health Sciences, Bengaluru (2010)' },
  { icon:'🏅', text:'MPT (Musculoskeletal & Sports) — Manipal University (2013)' },
  { icon:'🩺', text:'Fellowship in Orthopaedic Manual Therapy — IAP (2015)' },
  { icon:'✅', text:'Registered with Indian Association of Physiotherapists (IAP)' },
]

const OUTCOMES = [
  { val:'3,400+', label:'Sessions completed' },
  { val:'14 yrs', label:'Clinical experience' },
  { val:'4.9 ⭐', label:'Patient rating' },
  { val:'94%',   label:'Feel better in 6 weeks' },
]

const TESTIMONIALS = [
  {
    name:'Meera R.', area:'Koramangala', pain:'3 years of back pain',
    text:'Dr. Priya explained everything so clearly and the exercises actually worked. My back pain is gone in 6 weeks.',
    stars: 5,
  },
  {
    name:'Rahul S.', area:'HSR Layout', pain:'Post ACL surgery',
    text:'I was nervous about recovering from knee surgery at home but Dr. Priya guided me every step. Walking normally again!',
    stars: 5,
  },
  {
    name:'Priya K.', area:'Whitefield', pain:'Frozen shoulder',
    text:'No travel, no waiting room — just effective treatment on video. My shoulder movement is fully restored.',
    stars: 5,
  },
]

function Stars({ n }) {
  return <span style={{ color:'#FBBF24', fontSize:15 }}>{'★'.repeat(n)}</span>
}

export default function DoctorProfile({ onBack }) {
  const [showBooking, setShowBooking] = useState(false)
  const [booked,      setBooked]      = useState(null)

  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = CSS
    document.head.appendChild(el)
    return () => { try { document.head.removeChild(el) } catch {} }
  }, [])

  return (
    <div style={{ background:C.cream, minHeight:'100vh' }}>
      {/* Nav */}
      <nav style={{ background:C.forest, padding:'0 5%' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer' }}>
            <img src={logoImg} alt="PhysioDrishti" style={{ height:36, width:'auto' }} />
            <div className="pd" style={{ fontWeight:900, fontSize:16, color:'#fff' }}>PhysioDrishti</div>
          </button>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onBack} className="pj" style={{ background:'rgba(255,255,255,.12)', border:'none', borderRadius:7, padding:'7px 14px', color:'rgba(255,255,255,.75)', cursor:'pointer', fontSize:13 }}>← Back</button>
            <button className="btn-main" style={{ padding:'8px 18px', fontSize:13 }} onClick={()=>setShowBooking(true)}>Book free call</button>
          </div>
        </div>
      </nav>

      {/* Success bar */}
      {booked && (
        <div style={{ background:C.teal, padding:'11px 5%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div className="pj" style={{ fontSize:14, color:'#fff' }}>🎉 Done, <strong>{booked.name}</strong>! We'll WhatsApp you within 30 minutes.</div>
          <button onClick={()=>setBooked(null)} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:6, padding:'3px 10px', color:'#fff', cursor:'pointer', fontSize:12 }}>✕</button>
        </div>
      )}

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'48px 5% 64px' }}>

        {/* Hero card */}
        <div className="dp-card fade-dp" style={{ padding:'36px 36px', marginBottom:28, display:'flex', gap:40, flexWrap:'wrap', alignItems:'flex-start' }}>

          {/* Avatar */}
          <div style={{ flexShrink:0 }}>
            <div style={{
              width:130, height:130, borderRadius:'50%',
              background:`linear-gradient(135deg,${C.forest},${C.teal})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:52, color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif',
              fontWeight:800, boxShadow:'0 8px 32px rgba(18,56,42,.25)',
              border:'4px solid #fff', outline:`3px solid ${C.mint}`,
            }}>PM</div>
            <div style={{ marginTop:12, textAlign:'center' }}>
              <div style={{ background:C.mint, color:'#fff', borderRadius:6, padding:'4px 12px', fontSize:11, fontWeight:800, fontFamily:'Plus Jakarta Sans,sans-serif', letterSpacing:1 }}>✓ IAP Registered</div>
            </div>
          </div>

          {/* Info */}
          <div style={{ flex:1, minWidth:240 }}>
            <div className="pj" style={{ fontSize:11, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:C.saffron, marginBottom:4 }}>Lead Physiotherapist</div>
            <h1 className="pd" style={{ fontSize:'2rem', fontWeight:900, color:C.forest, marginBottom:4 }}>Dr. Priya Menon</h1>
            <div className="pj" style={{ fontSize:14, color:C.gray, marginBottom:20, lineHeight:1.6 }}>
              BPT, MPT (Musculoskeletal) · 14 years experience · Bengaluru
            </div>

            <p className="pj" style={{ fontSize:15, color:C.ink, lineHeight:1.8, marginBottom:24, maxWidth:580 }}>
              I help people in Bengaluru (and across India via online sessions) get out of pain
              and back to the activities they love — without surgery or long waiting times.
              Whether it's a bad back, a post-surgery knee, or a sports injury that won't heal,
              I find the real cause and fix it with a personalised plan.
            </p>

            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <button className="btn-main" onClick={()=>setShowBooking(true)}>Book a free call →</button>
              <a href="tel:+919800000000" className="btn-ghost-d pj" style={{ display:'inline-flex', alignItems:'center', gap:6, textDecoration:'none', padding:'11px 22px', border:`2px solid ${C.forest}`, borderRadius:8, fontSize:14, fontWeight:700, color:C.forest }}>
                📞 Call directly
              </a>
            </div>
          </div>
        </div>

        {/* Outcome stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:28 }}>
          {OUTCOMES.map(o => (
            <div key={o.label} className="dp-card fade-dp" style={{ padding:'20px 18px', textAlign:'center', borderLeft:`3px solid ${C.saffron}` }}>
              <div className="pd" style={{ fontSize:'1.9rem', fontWeight:900, color:C.forest }}>{o.val}</div>
              <div className="pj" style={{ fontSize:12, color:C.gray, marginTop:2 }}>{o.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>

          {/* Credentials */}
          <div className="dp-card fade-dp" style={{ padding:28 }}>
            <div className="pj" style={{ fontSize:11, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:C.saffron, marginBottom:16 }}>Qualifications</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {CREDENTIALS.map(c => (
                <div key={c.text} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>{c.icon}</span>
                  <div className="pj" style={{ fontSize:13, color:C.ink, lineHeight:1.55 }}>{c.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Specialities */}
          <div className="dp-card fade-dp" style={{ padding:28 }}>
            <div className="pj" style={{ fontSize:11, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:C.saffron, marginBottom:16 }}>Specialities</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {SPECIALITIES.map(s => (
                <span key={s} className="spec-chip">{s}</span>
              ))}
            </div>
            <div style={{ marginTop:20, padding:'14px 16px', background:C.light, borderRadius:8 }}>
              <div className="pj" style={{ fontSize:13, color:C.gray, lineHeight:1.65 }}>
                Online sessions available across India. In-person available in Bengaluru
                (Koramangala, HSR Layout, Indiranagar, Whitefield, Jayanagar & more).
              </div>
            </div>
          </div>
        </div>

        {/* How a session works */}
        <div className="dp-card fade-dp" style={{ padding:28, marginBottom:28 }}>
          <div className="pj" style={{ fontSize:11, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:C.saffron, marginBottom:20 }}>Your first session</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:18 }}>
            {[
              { step:'01', icon:'📞', title:'Free 15-min call',   desc:"Tell me what's wrong. I'll ask a few questions and figure out if I can help." },
              { step:'02', icon:'🩺', title:'Video assessment',    desc:"I assess your movement and posture on camera — no clinic visit needed." },
              { step:'03', icon:'📋', title:'Personalised plan',   desc:"You get exercises, lifestyle tips, and a clear timeline to recovery." },
              { step:'04', icon:'📱', title:'Weekly check-ins',    desc:"We meet every week to track progress and update your plan as you improve." },
            ].map(s => (
              <div key={s.step} style={{ padding:'18px 16px', background:C.light, borderRadius:10, borderLeft:`3px solid ${C.mint}` }}>
                <div className="pj" style={{ fontSize:11, fontWeight:800, color:C.teal, marginBottom:8, letterSpacing:1 }}>STEP {s.step}</div>
                <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
                <div className="pj" style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>{s.title}</div>
                <div className="pj" style={{ fontSize:12, color:C.gray, lineHeight:1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div style={{ marginBottom:28 }}>
          <div className="pd" style={{ fontSize:'1.4rem', fontWeight:900, color:C.forest, marginBottom:20 }}>What patients say</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:18 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="dp-card fade-dp" style={{ padding:24 }}>
                <Stars n={t.stars} />
                <div className="pj" style={{ fontSize:14, color:C.ink, lineHeight:1.75, margin:'12px 0 16px', fontStyle:'italic' }}>"{t.text}"</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div className="pj" style={{ fontWeight:700, fontSize:13 }}>{t.name}</div>
                    <div className="pj" style={{ fontSize:11, color:C.gray }}>📍 {t.area}</div>
                  </div>
                  <div style={{ background:C.light, padding:'4px 10px', borderRadius:20 }}>
                    <div className="pj" style={{ fontSize:10, color:C.teal, fontWeight:700 }}>{t.pain}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background:`linear-gradient(140deg,${C.forest},${C.teal})`, borderRadius:16, padding:'36px 40px', textAlign:'center' }}>
          <h2 className="pd" style={{ fontSize:'1.7rem', fontWeight:900, color:'#fff', marginBottom:10 }}>
            Ready to stop hurting?
          </h2>
          <p className="pj" style={{ fontSize:15, color:'rgba(255,255,255,.75)', marginBottom:28, maxWidth:440, margin:'0 auto 28px' }}>
            Book a free 15-minute call. No commitment, no travel. I'll tell you if I can help.
          </p>
          <button className="btn-main" style={{ padding:'15px 40px', fontSize:17 }} onClick={()=>setShowBooking(true)}>
            Book my free call →
          </button>
          <div className="pj" style={{ marginTop:14, fontSize:12, color:'rgba(255,255,255,.5)' }}>
            No credit card · WhatsApp callback in 30 min · Cancel any time
          </div>
        </div>

      </div>

      {showBooking && (
        <AIBookingChat
          onClose={()=>setShowBooking(false)}
          onSuccess={d=>{ setShowBooking(false); setBooked(d) }}
        />
      )}
    </div>
  )
}
