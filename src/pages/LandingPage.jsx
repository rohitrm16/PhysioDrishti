/**
 * PhysioDrishti — Landing Page
 * Simple, warm, patient-first. Inspired by FlexifyMe's approach.
 * Props: onGoToDashboard, mapplsKey, setMapplsKey
 */
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase.js'

const C = {
  forest:'#12382A', teal:'#0A6B5E', mint:'#3A9A6B',
  saffron:'#D4510E', cream:'#FDFAF3', ink:'#0D1520',
  gray:'#5C6878', light:'#F3F6FA', border:'#DDE4EF',
  green:'#177A45', warm:'#FFF8EF',
}

const PAIN_AREAS = [
  { icon:'🦴', name:'Back & Neck Pain',   desc:'Aching back, stiff neck, pain that shoots down your arm or leg — we can help.' },
  { icon:'🦵', name:'Knee & Hip Pain',    desc:'Trouble walking, climbing stairs, or getting up? We can fix that together.' },
  { icon:'💪', name:'Shoulder Problems',  desc:'Cannot lift your arm, or shoulder hurts at night? We will get you moving again.' },
  { icon:'⚡', name:'Sports Injuries',    desc:'Sprain, strain, or a niggling injury slowing you down — get back in the game.' },
  { icon:'🔄', name:'After Surgery',      desc:'Recovering from an operation? We will guide your recovery step by step.' },
  { icon:'📱', name:'Online Sessions',    desc:'Talk to a specialist from home — on your phone or laptop. No travel needed.' },
]

const HOW_IT_WORKS = [
  { step:'01', icon:'📞', title:'Tell us what hurts',  desc:'Fill a short form in 60 seconds. Tell us where the pain is and how long it has been bothering you.' },
  { step:'02', icon:'🩺', title:'We find the right fit',desc:'We match you with a specialist near you or set up a video call if you prefer to stay home.' },
  { step:'03', icon:'💬', title:'Start your session',  desc:'Speak to your physiotherapist, get a plan made just for you, and start feeling better.' },
  { step:'04', icon:'🌟', title:'Get back to normal',  desc:'Follow your plan, track progress, and get back to the activities you love.' },
]

const REVIEWS = [
  { name:'Meera R.', area:'Koramangala', pain:'Back pain for 3 years', result:'Pain-free in 6 weeks', stars:5 },
  { name:'Rahul S.', area:'HSR Layout',  pain:'Knee pain after surgery',result:'Walking normally again',stars:5 },
  { name:'Priya K.', area:'Whitefield',  pain:'Frozen shoulder',        result:'Full movement restored',stars:5 },
]

const AREAS = [
  'Koramangala','HSR Layout','Whitefield','Indiranagar','Jayanagar',
  'Marathahalli','JP Nagar','Electronic City','Bannerghatta Road','Yelahanka',
  'Hebbal','BTM Layout',
]

const PHYSIOS = [
  { id:1, name:'Dr. Ananya Sharma',   specialty:'Orthopedic & Sports Physiotherapy', area:'Koramangala',        pin:'560034', lat:12.9352, lng:77.6245, exp:'8 yrs',  rating:4.9, reviews:94,  avail:'Today',    mode:['Home visit','Online'] },
  { id:2, name:'Dr. Rohan Mehta',     specialty:'Neuro & Post-Surgery Rehab',        area:'HSR Layout',         pin:'560102', lat:12.9081, lng:77.6476, exp:'12 yrs', rating:4.8, reviews:142, avail:'Today',    mode:['Home visit','Online'] },
  { id:3, name:'Dr. Preethi Nair',    specialty:'Women\'s Health & Pelvic Floor',    area:'Indiranagar',        pin:'560038', lat:12.9784, lng:77.6408, exp:'6 yrs',  rating:4.9, reviews:81,  avail:'Tomorrow', mode:['Clinic','Online'] },
  { id:4, name:'Dr. Kiran Reddy',     specialty:'Spine & Musculoskeletal',           area:'Whitefield',         pin:'560066', lat:12.9698, lng:77.7499, exp:'10 yrs', rating:4.7, reviews:203, avail:'Today',    mode:['Home visit','Clinic'] },
  { id:5, name:'Dr. Suresh Kumar',    specialty:'Sports Injury & Rehab',             area:'Marathahalli',       pin:'560037', lat:12.9591, lng:77.6974, exp:'9 yrs',  rating:4.8, reviews:117, avail:'Today',    mode:['Home visit','Online'] },
  { id:6, name:'Dr. Divya Iyer',      specialty:'Pediatric & Geriatric Physio',      area:'Jayanagar',          pin:'560041', lat:12.9250, lng:77.5938, exp:'7 yrs',  rating:4.9, reviews:66,  avail:'Today',    mode:['Home visit','Clinic'] },
  { id:7, name:'Dr. Arun Bhat',       specialty:'Post-Surgical & Cardiac Rehab',     area:'JP Nagar',           pin:'560078', lat:12.9102, lng:77.5857, exp:'14 yrs', rating:4.8, reviews:189, avail:'Tomorrow', mode:['Clinic','Online'] },
  { id:8, name:'Dr. Meghana Pai',     specialty:'Orthopedic & Manual Therapy',       area:'Electronic City',    pin:'560100', lat:12.8406, lng:77.6770, exp:'5 yrs',  rating:4.7, reviews:55,  avail:'Today',    mode:['Home visit','Online'] },
  { id:9, name:'Dr. Vijay Sundar',    specialty:'Sports & Musculoskeletal',          area:'Hebbal',             pin:'560024', lat:13.0358, lng:77.5970, exp:'11 yrs', rating:4.9, reviews:130, avail:'Today',    mode:['Home visit','Clinic'] },
  { id:10,name:'Dr. Lakshmi Prasad',  specialty:'Spine Rehab & Ergonomics',          area:'BTM Layout',         pin:'560076', lat:12.9166, lng:77.6101, exp:'8 yrs',  rating:4.8, reviews:98,  avail:'Today',    mode:['Home visit','Online'] },
  { id:11,name:'Dr. Naveen Gowda',    specialty:'Neurological Physiotherapy',        area:'Bannerghatta Road',  pin:'560076', lat:12.8920, lng:77.5972, exp:'9 yrs',  rating:4.7, reviews:74,  avail:'Tomorrow', mode:['Clinic','Online'] },
  { id:12,name:'Dr. Swathi Rao',      specialty:'Orthopedic & Sports Physio',        area:'Yelahanka',          pin:'560064', lat:13.1007, lng:77.5963, exp:'6 yrs',  rating:4.8, reviews:61,  avail:'Today',    mode:['Home visit','Online'] },
]

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// Fallback ticker shown before Supabase loads
const TICKER_FALLBACK = [
  'Rahul from Koramangala just booked a back pain session',
  'Priya from Indiranagar booked a knee recovery session',
  'Suresh from Whitefield booked an online consultation',
  'Anitha from HSR Layout booked a shoulder assessment',
  'Meera from Jayanagar just started her recovery plan',
]

// Format a real booking row into a natural ticker string
function formatTick(b) {
  const firstName = (b.name || 'Someone').split(' ')[0]
  const area      = b.area ? `from ${b.area}` : 'in Bengaluru'
  const pain      = b.pain || 'physiotherapy'
  const minsAgo   = Math.round((Date.now() - new Date(b.created_at).getTime()) / 60000)
  const timeStr   = minsAgo < 2  ? 'just now'
                  : minsAgo < 60 ? `${minsAgo} minutes ago`
                  : minsAgo < 120? '1 hour ago'
                  : `${Math.round(minsAgo/60)} hours ago`
  const actions   = ['just booked a session','booked a free call','requested a consultation','just signed up']
  const action    = actions[b.id % actions.length] || 'just booked'
  return `${firstName} ${area} ${action} for ${pain} · ${timeStr}`
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',sans-serif;background:#FDFAF3;color:#0D1520;overflow-x:hidden}
.pd{font-family:'Playfair Display',serif}
.pj{font-family:'Plus Jakarta Sans',sans-serif}
.btn-main{background:#D4510E;color:#fff;border:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif}
.btn-main:hover{background:#BF4610;transform:translateY(-2px);box-shadow:0 8px 20px rgba(212,81,14,.3)}
.btn-ghost{background:transparent;color:#fff;border:2px solid rgba(255,255,255,.45);padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif}
.btn-ghost:hover{border-color:#fff;background:rgba(255,255,255,.12)}
.btn-outline{background:#fff;color:#12382A;border:2px solid #12382A;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif}
.btn-outline:hover{background:#12382A;color:#fff}
.card-lp{background:#fff;border-radius:14px;box-shadow:0 2px 16px rgba(13,21,32,.07);transition:all .25s}
.card-lp:hover{box-shadow:0 8px 32px rgba(13,21,32,.12);transform:translateY(-3px)}
.field-lp{width:100%;padding:12px 16px;border:1.5px solid #DDE4EF;border-radius:8px;font-size:14px;outline:none;transition:border-color .2s;background:#fff;color:#0D1520;font-family:'Plus Jakarta Sans',sans-serif}
.field-lp:focus{border-color:#3A9A6B;box-shadow:0 0 0 3px rgba(58,154,107,.1)}
.field-lp::placeholder{color:#9BA8B5}
.fade-lp{animation:fadeUp .5s ease both}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes ticker{0%{opacity:0;transform:translateY(-6px)}10%,90%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(6px)}}
.star{color:#FBBF24}
.pain-btn{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:8px;color:rgba(255,255,255,.85);font-size:14px;cursor:pointer;transition:all .18s;text-align:left;width:100%;font-family:'Plus Jakarta Sans',sans-serif}
.pain-btn:hover{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.35)}
@media(max-width:767px){
  .hero-cols{flex-direction:column!important}
  .pain-grid{grid-template-columns:1fr 1fr!important}
  .steps-grid{grid-template-columns:1fr 1fr!important}
  .market-cols{flex-direction:column!important}
  .review-grid{grid-template-columns:1fr!important}
  .footer-cols{grid-template-columns:1fr!important}
  .hero-card{display:none!important}
}
@media(min-width:768px){
  .pain-grid{grid-template-columns:repeat(3,1fr)}
  .steps-grid{grid-template-columns:repeat(4,1fr)}
  .review-grid{grid-template-columns:repeat(3,1fr)}
  .market-cols{display:flex}
  .footer-cols{grid-template-columns:1fr}
  .challenge-grid{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:767px){
  .challenge-grid{grid-template-columns:1fr!important}
  .physio-results{grid-template-columns:1fr!important}
  .find-row{flex-direction:column!important}
}
@media(min-width:768px){
  .physio-results{grid-template-columns:repeat(3,1fr)}
}
`




/* ── Logo Mark — Three-figure care mark ─────────────────────────── */

/* ── Logo Image ─────────────────────────────────────────────────── */
function LogoImg({ size = 40 }) {
  return (
    <img
      src="/logo.png"
      alt="PhysioDrishti"
      style={{ height: size, width: 'auto', maxWidth: size * 2.5, objectFit: 'contain', flexShrink: 0 }}
    />
  )
}


/* ── PIN → area lookup ──────────────────────────────────────────── */
const BLG_PINS = {
  '560003':'Malleswaram','560004':'Basavanagudi','560010':'Rajajinagar','560011':'Jayanagar',
  '560017':'Vijayanagar','560024':'Hebbal','560029':'Banashankari','560034':'Koramangala',
  '560037':'Marathahalli','560038':'Indiranagar','560041':'BTM Layout','560043':'Kalyan Nagar',
  '560048':'Mahadevapura','560050':'Bannerghatta Road','560064':'Yelahanka','560066':'Whitefield',
  '560076':'Jayanagar / BTM','560078':'JP Nagar','560093':'CV Raman Nagar',
  '560100':'Electronic City','560102':'HSR Layout','560103':'Bellandur',
}
function pinArea(pin) {
  if (pin.length < 6) return null
  if (BLG_PINS[pin]) return '✓ ' + BLG_PINS[pin] + ', Bengaluru'
  if (pin.startsWith('560')) return '✓ Bengaluru — we\'ll confirm the nearest specialist'
  return 'Outside Bengaluru — online sessions available everywhere'
}

/* ── Reusable field styles ──────────────────────────────────────── */
const FS = { width:'100%', padding:'11px 14px', border:'1.5px solid #DDE4EF', borderRadius:8, fontSize:14, outline:'none', fontFamily:"'Plus Jakarta Sans',sans-serif", color:'#0D1520', background:'#fff' }
const LS = { fontSize:12, fontWeight:700, color:'#0A6B5E', display:'block', marginBottom:6, fontFamily:"'Plus Jakarta Sans',sans-serif" }
const WA_NO = '91XXXXXXXXXX'

/* ── Body Map ───────────────────────────────────────────────────── */
const ZONE_LABELS = {
  head:'Head', neck:'Neck',
  'l-shoulder':'Left Shoulder','r-shoulder':'Right Shoulder',
  chest:'Chest', abdomen:'Abdomen', pelvis:'Pelvis',
  'l-elbow':'Left Elbow','r-elbow':'Right Elbow',
  'l-forearm':'Left Forearm','r-forearm':'Right Forearm',
  'l-hand':'Left Hand','r-hand':'Right Hand',
  'l-hip':'Left Hip','r-hip':'Right Hip',
  'l-thigh':'Left Thigh','r-thigh':'Right Thigh',
  'l-knee':'Left Knee','r-knee':'Right Knee',
  'l-shin':'Left Shin','r-shin':'Right Shin',
  'l-foot':'Left Foot','r-foot':'Right Foot',
  'upper-back':'Upper Back','mid-back':'Mid Back','lower-back':'Lower Back',
  'l-buttock':'Left Buttock','r-buttock':'Right Buttock',
  'l-hamstring':'Left Hamstring','r-hamstring':'Right Hamstring',
  'l-calf':'Left Calf','r-calf':'Right Calf',
  'l-heel':'Left Heel / Achilles','r-heel':'Right Heel / Achilles',
}

// In front view: patient's LEFT = SVG right (high cx); patient's RIGHT = SVG left (low cx)
// In back  view: patient's LEFT = SVG left  (low  cx); patient's RIGHT = SVG right (high cx)
const BODY_ZONES = {
  front: [
    { id:'head',      cx:110, cy: 28, rx:25, ry:23 },
    { id:'neck',      cx:110, cy: 61, rx:13, ry:10 },
    { id:'r-shoulder',cx: 60, cy: 84, rx:18, ry:14 },
    { id:'l-shoulder',cx:160, cy: 84, rx:18, ry:14 },
    { id:'chest',     cx:110, cy:118, rx:30, ry:22 },
    { id:'r-elbow',   cx: 52, cy:145, rx:13, ry:13 },
    { id:'l-elbow',   cx:168, cy:145, rx:13, ry:13 },
    { id:'abdomen',   cx:110, cy:162, rx:26, ry:20 },
    { id:'r-forearm', cx: 50, cy:183, rx:11, ry:18 },
    { id:'l-forearm', cx:170, cy:183, rx:11, ry:18 },
    { id:'pelvis',    cx:110, cy:200, rx:24, ry:14 },
    { id:'r-hand',    cx: 52, cy:218, rx:12, ry:13 },
    { id:'l-hand',    cx:168, cy:218, rx:12, ry:13 },
    { id:'r-hip',     cx: 87, cy:228, rx:19, ry:15 },
    { id:'l-hip',     cx:133, cy:228, rx:19, ry:15 },
    { id:'r-thigh',   cx: 87, cy:272, rx:18, ry:28 },
    { id:'l-thigh',   cx:133, cy:272, rx:18, ry:28 },
    { id:'r-knee',    cx: 89, cy:314, rx:17, ry:15 },
    { id:'l-knee',    cx:131, cy:314, rx:17, ry:15 },
    { id:'r-shin',    cx: 89, cy:354, rx:13, ry:25 },
    { id:'l-shin',    cx:131, cy:354, rx:13, ry:25 },
    { id:'r-foot',    cx: 89, cy:404, rx:16, ry:14 },
    { id:'l-foot',    cx:131, cy:404, rx:16, ry:14 },
  ],
  back: [
    { id:'neck',        cx:110, cy: 61, rx:13, ry:10 },
    { id:'l-shoulder',  cx: 60, cy: 84, rx:18, ry:14 },
    { id:'r-shoulder',  cx:160, cy: 84, rx:18, ry:14 },
    { id:'upper-back',  cx:110, cy:112, rx:30, ry:22 },
    { id:'l-elbow',     cx: 52, cy:145, rx:13, ry:13 },
    { id:'r-elbow',     cx:168, cy:145, rx:13, ry:13 },
    { id:'mid-back',    cx:110, cy:158, rx:26, ry:20 },
    { id:'l-forearm',   cx: 50, cy:183, rx:11, ry:18 },
    { id:'r-forearm',   cx:170, cy:183, rx:11, ry:18 },
    { id:'lower-back',  cx:110, cy:196, rx:24, ry:16 },
    { id:'l-hand',      cx: 52, cy:218, rx:12, ry:13 },
    { id:'r-hand',      cx:168, cy:218, rx:12, ry:13 },
    { id:'l-buttock',   cx: 89, cy:226, rx:19, ry:16 },
    { id:'r-buttock',   cx:131, cy:226, rx:19, ry:16 },
    { id:'l-hamstring', cx: 89, cy:270, rx:17, ry:28 },
    { id:'r-hamstring', cx:131, cy:270, rx:17, ry:28 },
    { id:'l-knee',      cx: 89, cy:314, rx:17, ry:15 },
    { id:'r-knee',      cx:131, cy:314, rx:17, ry:15 },
    { id:'l-calf',      cx: 89, cy:354, rx:13, ry:25 },
    { id:'r-calf',      cx:131, cy:354, rx:13, ry:25 },
    { id:'l-foot',      cx: 89, cy:400, rx:14, ry:14 },
    { id:'r-foot',      cx:131, cy:400, rx:14, ry:14 },
    { id:'l-heel',      cx: 89, cy:418, rx:11, ry:11 },
    { id:'r-heel',      cx:131, cy:418, rx:11, ry:11 },
  ],
}

function BodyMap({ selected, onChange }) {
  const [view, setView] = useState('front')
  function toggle(id) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    onChange(next)
  }
  const zones = BODY_ZONES[view]
  const isFront = view === 'front'
  const oF = '#EEF2F7', oS = '#C8D0DB'
  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:12, justifyContent:'center' }}>
        {['front','back'].map(v=>(
          <button key={v} type="button" onClick={()=>setView(v)}
            style={{ padding:'7px 22px', border:`1.5px solid ${view===v?'#12382A':'#DDE4EF'}`, borderRadius:20, background:view===v?'#12382A':'#fff', color:view===v?'#fff':'#5C6878', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .18s', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            {v==='front'?'Front view':'Back view'}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'center', gap:4 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:58, minWidth:36 }}>
          <div style={{ fontSize:9, fontWeight:800, color:'#9BA8B5', fontFamily:"'Plus Jakarta Sans',sans-serif", textAlign:'center', lineHeight:1.3 }}>YOUR<br/>{isFront?'RIGHT':'LEFT'}</div>
          <div style={{ fontSize:14, color:'#CDD5DF', marginTop:2 }}>←</div>
        </div>
        <svg viewBox="0 0 220 440" width="160" style={{ display:'block', userSelect:'none', touchAction:'manipulation', flexShrink:0 }}>
          {/* Body silhouette */}
          <ellipse cx="110" cy="28" rx="30" ry="27" fill={oF} stroke={oS} strokeWidth="1.5"/>
          <rect x="98" y="53" width="24" height="18" rx="4" fill={oF} stroke={oS} strokeWidth="1.5"/>
          <rect x="72" y="68" width="76" height="165" rx="14" fill={oF} stroke={oS} strokeWidth="1.5"/>
          <rect x="44" y="72" width="28" height="152" rx="10" fill={oF} stroke={oS} strokeWidth="1.5"/>
          <rect x="148" y="72" width="28" height="152" rx="10" fill={oF} stroke={oS} strokeWidth="1.5"/>
          <rect x="78" y="230" width="30" height="192" rx="12" fill={oF} stroke={oS} strokeWidth="1.5"/>
          <rect x="112" y="230" width="30" height="192" rx="12" fill={oF} stroke={oS} strokeWidth="1.5"/>
          {/* Tappable zones */}
          {zones.map(z=>(
            <ellipse key={z.id} cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry}
              fill={selected.has(z.id)?'rgba(240,185,74,.75)':'rgba(58,154,107,.1)'}
              stroke={selected.has(z.id)?'#D4510E':'rgba(58,154,107,.4)'}
              strokeWidth={selected.has(z.id)?2:1}
              onClick={()=>toggle(z.id)}
              style={{ cursor:'pointer' }}/>
          ))}
        </svg>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:58, minWidth:36 }}>
          <div style={{ fontSize:9, fontWeight:800, color:'#9BA8B5', fontFamily:"'Plus Jakarta Sans',sans-serif", textAlign:'center', lineHeight:1.3 }}>YOUR<br/>{isFront?'LEFT':'RIGHT'}</div>
          <div style={{ fontSize:14, color:'#CDD5DF', marginTop:2 }}>→</div>
        </div>
      </div>
      <p style={{ fontSize:11, color:'#9BA8B5', textAlign:'center', margin:'4px 0 8px', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Tap zones to select · tap again to deselect</p>
      {selected.size>0&&(
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
          {[...selected].map(id=>(
            <span key={id} onClick={()=>toggle(id)}
              style={{ padding:'4px 10px', background:'#FFF8EF', border:'1.5px solid #F0B94A', borderRadius:16, fontSize:12, fontWeight:600, color:'#0D1520', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              {ZONE_LABELS[id]||id}<span style={{ fontSize:10, color:'#9BA8B5' }}>✕</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding:'7px 14px', border:`1.5px solid ${active?'#12382A':'#DDE4EF'}`, borderRadius:20, background:active?'#12382A':'#fff', color:active?'#fff':'#5C6878', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .18s', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      {label}
    </button>
  )
}

/* ── Booking Modal ──────────────────────────────────────────────── */
function SimpleBooking({ onClose, onSuccess }) {
  const [mode, setMode]   = useState('call')
  const [done, setDone]   = useState(null)
  const [busy, setBusy]   = useState(false)
  const [errors, setErrors] = useState({})

  // Free call form
  const [call, setCall] = useState({ name:'', phone:'', pin:'', issue:'', callTime:'', consent:false })
  const sc = (k, v) => setCall(p => ({ ...p, [k]: v }))
  const [callPinNote, setCallPinNote] = useState('')
  const [callGps, setCallGps] = useState('idle')

  // Consultation form
  const [con, setCon] = useState({ name:'', phone:'', age:'', pin:'', gender:'', samePref:false, painAreas:[], painScale:5, duration:'', sessionMode:'', date:'', slot:'', notes:'', consent:false })
  const sk = (k, v) => setCon(p => ({ ...p, [k]: v }))
  const [conPinNote, setConPinNote] = useState('')
  const [conGps, setConGps] = useState('idle')

  const [bodySelected, setBodySelected] = useState(new Set())

  const painWords = ['No pain','Very mild','Mild','Mild','Moderate','Moderate','Moderate','Severe','Severe','Very severe','Worst']

  // PIN GPS helper
  function useGps(setter, setNote, setGps) {
    if (!navigator.geolocation) { setNote('Location not available — enter PIN manually'); return }
    setGps('loading')
    navigator.geolocation.getCurrentPosition(
      () => { setNote('✓ Location captured — we\'ll match your nearest specialist'); setGps('done') },
      () => { setNote('Location blocked — enter your PIN manually'); setGps('idle') },
      { timeout: 8000 }
    )
  }

  // Validation
  const callOk = call.name.trim().length >= 2 && /^[6-9]\d{9}$/.test(call.phone) && /^\d{6}$/.test(call.pin) && call.callTime && call.consent
  const conOk  = con.name.trim().length >= 2 && /^[6-9]\d{9}$/.test(con.phone) && /^\d{6}$/.test(con.pin) && bodySelected.size > 0 && con.sessionMode && con.date && con.slot && con.consent

  // Today's date for min
  const todayStr = new Date().toISOString().slice(0,10)

  const submitCall = async () => {
    if (!callOk) { setErrors({ submit:'Please fill all required fields.' }); return }
    setBusy(true)
    try {
      const area = BLG_PINS[call.pin] || (call.pin.startsWith('560') ? 'Bengaluru' : 'Outside Bengaluru')
      await supabase.from('leads').insert({ name:call.name, phone:call.phone, area, pain:call.issue||'Not specified', note:`Call time: ${call.callTime}`, stage:'new', priority:'medium' })
      const rows = [['Name',call.name],['Mobile','+91 '+call.phone],['Area',area+' ('+call.pin+')'],['Concern',call.issue||'Not specified'],['Best time to call',call.callTime]]
      const wa = `Hi PhysioDrishti, I'd like a free call.\n${rows.map(r=>r[0]+': '+r[1]).join('\n')}`
      setDone({ title:'Free call requested 🎉', sub:`We'll call you ${call.callTime.toLowerCase()}. Send on WhatsApp so we have your details ready.`, rows, wa })
      onSuccess(call)
    } catch (e) { console.error(e); setErrors({ submit:'Something went wrong. Please try again.' }) }
    finally { setBusy(false) }
  }

  const submitConsult = async () => {
    if (!conOk) { setErrors({ submit:'Please fill all required fields.' }); return }
    setBusy(true)
    try {
      const area = BLG_PINS[con.pin] || (con.pin.startsWith('560') ? 'Bengaluru' : 'Outside Bengaluru')
      const note = [`Pain scale: ${con.painScale}/10`, con.duration && `Duration: ${con.duration}`, `Session: ${con.sessionMode}`, `Slot: ${con.date}, ${con.slot}`, con.notes && `Notes: ${con.notes}`].filter(Boolean).join(' | ')
      await supabase.from('leads').insert({ name:con.name, phone:con.phone, area, pain:[...bodySelected].map(id=>ZONE_LABELS[id]||id).join(', '), note, stage:'new', priority:'medium' })
      const rows = [
        ['Patient', con.name + (con.age ? ', '+con.age+' yrs' : '') + (con.gender ? ', '+con.gender : '')],
        ['Mobile', '+91 '+con.phone],
        ['Area', area+' ('+con.pin+')'],
        ['Pain areas', [...bodySelected].map(id=>ZONE_LABELS[id]||id).join(', ')],
        ['Pain today', con.painScale+'/10 — '+painWords[con.painScale]],
        ['Duration', con.duration||'Not specified'],
        ['Session type', con.sessionMode],
        ['Preferred slot', new Date(con.date+'T00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})+', '+con.slot],
      ]
      const wa = `Hi PhysioDrishti, I'd like to book a consultation.\n${rows.map(r=>r[0]+': '+r[1]).join('\n')}${con.notes ? '\nDetails: '+con.notes : ''}`
      setDone({ title:'Consultation booked 🎉', sub:"We'll confirm your slot and fee on WhatsApp before the session.", rows, wa })
      onSuccess(con)
    } catch (e) { console.error(e); setErrors({ submit:'Something went wrong. Please try again.' }) }
    finally { setBusy(false) }
  }

  const overlay = { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:999, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'16px 16px 32px', overflowY:'auto' }

  // Done screen
  if (done) return (
    <div style={overlay} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:480, marginTop:40, boxShadow:'0 24px 64px rgba(0,0,0,.25)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:'linear-gradient(135deg,#12382A,#0A6B5E)', padding:'28px 24px', textAlign:'center' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:28 }}>✓</div>
          <div className="pd" style={{ fontSize:'1.4rem', fontWeight:900, color:'#fff', marginBottom:6 }}>{done.title}</div>
          <div className="pj" style={{ fontSize:13, color:'rgba(255,255,255,.7)', lineHeight:1.6 }}>{done.sub}</div>
        </div>
        <div style={{ padding:'20px 24px 28px' }}>
          <div style={{ background:'#F3F6FA', borderRadius:10, padding:'4px 0', marginBottom:20 }}>
            {done.rows.map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:12, padding:'9px 16px', borderBottom:'1px solid #DDE4EF' }}>
                <span className="pj" style={{ fontSize:13, color:'#5C6878' }}>{k}</span>
                <span className="pj" style={{ fontSize:13, fontWeight:700, color:'#0D1520', textAlign:'right' }}>{v}</span>
              </div>
            ))}
          </div>
          <a href={`https://wa.me/${WA_NO}?text=${encodeURIComponent(done.wa)}`} target="_blank" rel="noopener"
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'#1FA855', color:'#fff', fontWeight:700, borderRadius:10, padding:'14px', textDecoration:'none', fontSize:15, fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#fff" d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm4.5 14.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2-.2-.2-.4-.3z"/></svg>
            Send on WhatsApp
          </a>
          <button onClick={onClose} className="pj" style={{ width:'100%', padding:12, background:'transparent', border:'1.5px solid #DDE4EF', borderRadius:10, fontWeight:600, fontSize:14, cursor:'pointer', color:'#5C6878' }}>Close</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:500, marginTop:20, boxShadow:'0 24px 64px rgba(0,0,0,.25)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#12382A,#0A6B5E)', padding:'18px 22px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div className="pd" style={{ fontSize:'1.2rem', fontWeight:900, color:'#fff', marginBottom:12 }}>Book a free call or consultation</div>
            {/* Tabs */}
            <div style={{ display:'flex', gap:2 }}>
              {[['call','Free call','30 sec'],['consult','Book consultation','2 min']].map(([m,label,t]) => (
                <button key={m} onClick={()=>setMode(m)}
                  style={{ padding:'9px 18px', border:'none', borderRadius:'8px 8px 0 0', background:mode===m?'#fff':'transparent', color:mode===m?'#12382A':'rgba(255,255,255,.65)', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", transition:'all .2s' }}>
                  {label} <span style={{ fontSize:10, opacity:.75 }}>· {t}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#fff', fontSize:16, flexShrink:0, marginTop:2 }}>✕</button>
        </div>

        <div style={{ padding:'22px 22px 24px', maxHeight:'75vh', overflowY:'auto' }}>

          {/* ── FREE CALL FORM ── */}
          {mode === 'call' && (
            <div className="fade-lp">
              <p className="pj" style={{ fontSize:13, color:'#5C6878', marginBottom:18, lineHeight:1.6 }}>A physiotherapist calls to understand your problem. No charge, no obligation.</p>

              <div style={{ marginBottom:14 }}>
                <label style={LS}>Your name</label>
                <input style={FS} type="text" placeholder="e.g. Rahul Sharma" value={call.name} onChange={e=>sc('name',e.target.value)} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={LS}>WhatsApp number</label>
                <div style={{ display:'flex' }}>
                  <span style={{ display:'flex', alignItems:'center', padding:'0 12px', border:'1.5px solid #DDE4EF', borderRight:'none', borderRadius:'8px 0 0 8px', background:'#F3F6FA', color:'#5C6878', fontWeight:600, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", flexShrink:0 }}>+91</span>
                  <input style={{ ...FS, borderRadius:'0 8px 8px 0', borderLeft:'none' }} type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number" value={call.phone} onChange={e=>sc('phone',e.target.value.replace(/\D/g,''))} />
                </div>
              </div>
              <div style={{ marginBottom:6 }}>
                <label style={LS}>PIN code</label>
                <input style={FS} type="text" inputMode="numeric" maxLength={6} placeholder="6-digit PIN (e.g. 560034)" value={call.pin}
                  onChange={e=>{ const v=e.target.value.replace(/\D/g,''); sc('pin',v); setCallPinNote(pinArea(v)||'') }} />
              </div>
              {callPinNote && <div className="pj" style={{ fontSize:12, color: callPinNote.startsWith('✓')?'#177A45':'#D4510E', marginBottom:6 }}>{callPinNote}</div>}
              <button type="button" className="pj" onClick={()=>useGps(sc, setCallPinNote, setCallGps)}
                style={{ background:'none', border:'none', color:'#0A6B5E', fontWeight:600, fontSize:13, cursor:'pointer', padding:'4px 0', marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
                {callGps==='loading'?'⏳ Locating…':'◎ Use my location instead'}
              </button>

              <div style={{ marginBottom:14 }}>
                <label style={LS}>What's troubling you? <span style={{ fontWeight:400, color:'#5C6878' }}>(optional)</span></label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {['Back or neck','Knee or joint','Shoulder','Sports injury','After surgery','Stroke / neuro','Something else'].map(p=>(
                    <Chip key={p} label={p} active={call.issue===p} onClick={()=>sc('issue', call.issue===p?'':p)} />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={LS}>Best time to call *</label>
                <div style={{ display:'flex', gap:8 }}>
                  {[['Morning','8am–12pm'],['Afternoon','12–4pm'],['Evening','4–8pm']].map(([t,sub])=>(
                    <button key={t} type="button" onClick={()=>sc('callTime',t)}
                      style={{ flex:1, padding:'9px 8px', border:`1.5px solid ${call.callTime===t?'#12382A':'#DDE4EF'}`, borderRadius:8, background:call.callTime===t?'#12382A':'#fff', color:call.callTime===t?'#fff':'#5C6878', fontFamily:"'Plus Jakarta Sans',sans-serif", cursor:'pointer', transition:'all .18s' }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>{t}</div>
                      <div style={{ fontSize:10, opacity:.75 }}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:10, alignItems:'flex-start', background:'#FFF8EF', borderRadius:8, padding:'10px 12px', marginBottom:4 }}>
                <input type="checkbox" id="call-consent" checked={call.consent} onChange={e=>sc('consent',e.target.checked)} style={{ width:16, height:16, marginTop:2, accentColor:'#12382A', flexShrink:0 }} />
                <label htmlFor="call-consent" className="pj" style={{ fontSize:12, color:'#5C6878', lineHeight:1.6, cursor:'pointer' }}>PhysioDrishti can call and WhatsApp me about my enquiry. My details stay private.</label>
              </div>
              {errors.submit && <div className="pj" style={{ fontSize:12, color:'#D4510E', marginTop:8 }}>{errors.submit}</div>}
              <button onClick={submitCall} disabled={busy}
                style={{ width:'100%', marginTop:16, padding:14, background:callOk?'#D4510E':'#DDE4EF', color:callOk?'#fff':'#9BA8B5', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:callOk?'pointer':'default', fontFamily:"'Plus Jakarta Sans',sans-serif", transition:'background .2s' }}>
                {busy?'⏳ Requesting…':'Request a free call →'}
              </button>
              <p className="pj" style={{ fontSize:11, color:'#9BA8B5', textAlign:'center', marginTop:8 }}>We never share your number.</p>
            </div>
          )}

          {/* ── CONSULTATION FORM ── */}
          {mode === 'consult' && (
            <div className="fade-lp">
              <div style={{ background:'#FFF3F0', border:'1px solid #F4C9BE', borderRadius:8, padding:'10px 14px', marginBottom:18 }}>
                <div className="pj" style={{ fontSize:12, fontWeight:700, color:'#D4510E', marginBottom:2 }}>Need urgent care?</div>
                <div className="pj" style={{ fontSize:12, color:'#5C6878', lineHeight:1.5 }}>After a bad fall, accident, or sudden numbness / weakness — go to the nearest emergency room first.</div>
              </div>

              {/* About you */}
              <div className="pd" style={{ fontSize:'0.9rem', fontWeight:800, color:'#12382A', marginBottom:12, borderBottom:'1px solid #DDE4EF', paddingBottom:6 }}>About you</div>
              <div style={{ marginBottom:14 }}>
                <label style={LS}>Patient's name *</label>
                <input style={FS} type="text" placeholder="Full name" value={con.name} onChange={e=>sk('name',e.target.value)} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={LS}>WhatsApp number *</label>
                <div style={{ display:'flex' }}>
                  <span style={{ display:'flex', alignItems:'center', padding:'0 12px', border:'1.5px solid #DDE4EF', borderRight:'none', borderRadius:'8px 0 0 8px', background:'#F3F6FA', color:'#5C6878', fontWeight:600, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", flexShrink:0 }}>+91</span>
                  <input style={{ ...FS, borderRadius:'0 8px 8px 0', borderLeft:'none' }} type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number" value={con.phone} onChange={e=>sk('phone',e.target.value.replace(/\D/g,''))} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:6 }}>
                <div>
                  <label style={LS}>Age</label>
                  <input style={FS} type="number" min={1} max={110} placeholder="e.g. 42" value={con.age} onChange={e=>sk('age',e.target.value)} />
                </div>
                <div>
                  <label style={LS}>PIN code *</label>
                  <input style={FS} type="text" inputMode="numeric" maxLength={6} placeholder="e.g. 560034" value={con.pin}
                    onChange={e=>{ const v=e.target.value.replace(/\D/g,''); sk('pin',v); setConPinNote(pinArea(v)||'') }} />
                </div>
              </div>
              {conPinNote && <div className="pj" style={{ fontSize:12, color: conPinNote.startsWith('✓')?'#177A45':'#D4510E', marginBottom:4 }}>{conPinNote}</div>}
              <button type="button" className="pj" onClick={()=>useGps(sk, setConPinNote, setConGps)}
                style={{ background:'none', border:'none', color:'#0A6B5E', fontWeight:600, fontSize:13, cursor:'pointer', padding:'4px 0', marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
                {conGps==='loading'?'⏳ Locating…':'◎ Use my location instead'}
              </button>
              {+con.age > 0 && +con.age < 18 && (
                <div className="pj" style={{ fontSize:12, color:'#D4510E', background:'#FFF3F0', borderRadius:6, padding:'8px 12px', marginBottom:14 }}>A parent or guardian must be present for patients under 18.</div>
              )}
              <div style={{ marginBottom:14 }}>
                <label style={LS}>Gender <span style={{ fontWeight:400, color:'#5C6878' }}>(optional)</span></label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {['Female','Male','Other','Prefer not to say'].map(g=>(
                    <Chip key={g} label={g} active={con.gender===g} onClick={()=>sk('gender', con.gender===g?'':g)} />
                  ))}
                </div>
                <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, cursor:'pointer' }}>
                  <input type="checkbox" checked={con.samePref} onChange={e=>sk('samePref',e.target.checked)} style={{ accentColor:'#12382A', width:15, height:15 }} />
                  <span className="pj" style={{ fontSize:12, color:'#5C6878' }}>I'd prefer a physiotherapist of the same gender</span>
                </label>
              </div>

              {/* What hurts */}
              <div className="pd" style={{ fontSize:'0.9rem', fontWeight:800, color:'#12382A', margin:'18px 0 12px', borderBottom:'1px solid #DDE4EF', paddingBottom:6 }}>Where does it hurt? *</div>
              <BodyMap selected={bodySelected} onChange={ns=>{ setBodySelected(ns); sk('painAreas',[...ns].map(id=>ZONE_LABELS[id]||id)) }} />
              <div style={{ marginBottom:14 }}>
                <label style={LS}>Pain level today</label>
                <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:6 }}>
                  <span className="pd" style={{ fontSize:'1.8rem', fontWeight:900, color:'#0D1520', minWidth:'2ch' }}>{con.painScale}</span>
                  <span className="pj" style={{ fontSize:13, color:'#5C6878', fontWeight:600 }}>{painWords[con.painScale]}</span>
                </div>
                <input type="range" min={0} max={10} value={con.painScale} onChange={e=>sk('painScale',+e.target.value)}
                  style={{ width:'100%', height:8, borderRadius:8, appearance:'none', WebkitAppearance:'none', background:`linear-gradient(90deg,#3A9A6B ${con.painScale*10}%,#DDE4EF ${con.painScale*10}%)`, cursor:'pointer' }} />
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span className="pj" style={{ fontSize:10, color:'#9BA8B5' }}>No pain</span>
                  <span className="pj" style={{ fontSize:10, color:'#9BA8B5' }}>Worst</span>
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={LS}>How long has this been going on?</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {['Under 2 weeks','2–6 weeks','6 weeks–6 months','Over 6 months'].map(d=>(
                    <Chip key={d} label={d} active={con.duration===d} onClick={()=>sk('duration', con.duration===d?'':d)} />
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={LS}>Tell us more <span style={{ fontWeight:400, color:'#5C6878' }}>(optional)</span></label>
                <textarea style={{ ...FS, minHeight:60, resize:'none', lineHeight:1.6 }} placeholder="e.g. Knee pain climbing stairs since March. Had surgery 3 weeks ago." value={con.notes} onChange={e=>sk('notes',e.target.value)} />
              </div>

              {/* When and how */}
              <div className="pd" style={{ fontSize:'0.9rem', fontWeight:800, color:'#12382A', margin:'18px 0 12px', borderBottom:'1px solid #DDE4EF', paddingBottom:6 }}>When & how *</div>
              <div style={{ marginBottom:14 }}>
                <label style={LS}>Session type *</label>
                <div style={{ display:'flex', gap:8 }}>
                  {['Home visit','Online video','Help me decide'].map(m=>(
                    <button key={m} type="button" onClick={()=>sk('sessionMode',m)}
                      style={{ flex:1, padding:'9px 6px', border:`1.5px solid ${con.sessionMode===m?'#12382A':'#DDE4EF'}`, borderRadius:8, background:con.sessionMode===m?'#12382A':'#fff', color:con.sessionMode===m?'#fff':'#5C6878', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .18s' }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label style={LS}>Preferred date *</label>
                  <input style={FS} type="date" min={todayStr} value={con.date} onChange={e=>sk('date',e.target.value)} />
                </div>
                <div>
                  <label style={LS}>Time *</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {[['Morning','AM'],['Afternoon','Noon'],['Evening','PM']].map(([full,short])=>(
                      <button key={full} type="button" onClick={()=>sk('slot',full)}
                        style={{ padding:'7px', border:`1.5px solid ${con.slot===full?'#12382A':'#DDE4EF'}`, borderRadius:6, background:con.slot===full?'#12382A':'#fff', color:con.slot===full?'#fff':'#5C6878', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        {short}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', gap:10, alignItems:'flex-start', background:'#FFF8EF', borderRadius:8, padding:'10px 12px', marginBottom:4 }}>
                <input type="checkbox" id="con-consent" checked={con.consent} onChange={e=>sk('consent',e.target.checked)} style={{ width:16, height:16, marginTop:2, accentColor:'#12382A', flexShrink:0 }} />
                <label htmlFor="con-consent" className="pj" style={{ fontSize:12, color:'#5C6878', lineHeight:1.6, cursor:'pointer' }}>I agree that PhysioDrishti can use these details to plan my care and contact me by call and WhatsApp.</label>
              </div>
              {errors.submit && <div className="pj" style={{ fontSize:12, color:'#D4510E', marginTop:8 }}>{errors.submit}</div>}
              <button onClick={submitConsult} disabled={busy}
                style={{ width:'100%', marginTop:16, padding:14, background:conOk?'#D4510E':'#DDE4EF', color:conOk?'#fff':'#9BA8B5', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:conOk?'pointer':'default', fontFamily:"'Plus Jakarta Sans',sans-serif", transition:'background .2s' }}>
                {busy?'⏳ Booking…':'Book consultation →'}
              </button>
              <p className="pj" style={{ fontSize:11, color:'#9BA8B5', textAlign:'center', marginTop:8 }}>We confirm your slot and fee on WhatsApp before the session.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Mappls Map ─────────────────────────────────────────────────── */
function CityMap({ apiKey, height = 300 }) {
  const ref = useRef(null)
  const [st, setSt] = useState('idle')

  useEffect(() => {
    if (!apiKey?.trim() || !ref.current) return
    setSt('loading')
    const init = () => {
      if (!window.mappls || !ref.current) { setSt('error'); return }
      try {
        const map = new window.mappls.Map(ref.current, { center:{ lat:12.9716, lng:77.5946 }, zoom:11 })
        map.addListener('load', () => {
          setSt('ready')
          const spots = [
            { name:'Koramangala', lat:12.9352, lng:77.6245 },
            { name:'HSR Layout',  lat:12.9116, lng:77.6446 },
            { name:'Indiranagar', lat:12.9784, lng:77.6408 },
            { name:'Whitefield',  lat:12.9698, lng:77.7500 },
            { name:'Jayanagar',   lat:12.9300, lng:77.5830 },
            { name:'Marathahalli',lat:12.9591, lng:77.6974 },
          ]
          spots.forEach(a => {
            const el = document.createElement('div')
            el.style.cssText = `width:11px;height:11px;background:#D4510E;border:2px solid #fff;border-radius:50%;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.25)`
            const m = new window.mappls.Marker({ map, position:{ lat:a.lat, lng:a.lng }, html:el })
            m.addListener('click', () =>
              new window.mappls.InfoWindow({ map, position:{ lat:a.lat, lng:a.lng },
                content:`<div style="font-family:'Plus Jakarta Sans',sans-serif;padding:5px 10px;font-size:13px;font-weight:700;color:#0D1520">${a.name}</div>` })
            )
          })
        })
      } catch { setSt('error') }
    }
    if (window.mappls) { init(); return }
    const cb = `__mpl_${Date.now()}`
    window[cb] = () => { delete window[cb]; init() }
    const s = document.createElement('script')
    s.src = `https://apis.mappls.com/advancedmaps/api/${apiKey.trim()}/map_sdk?v=3.0&layer=vector&callback=${cb}`
    s.async = true
    s.onerror = () => { setSt('error'); delete window[cb] }
    document.head.appendChild(s)
    return () => { try { document.head.removeChild(s) } catch {} }
  }, [apiKey])

  if (!apiKey?.trim()) return (
    <div style={{ height, background:`linear-gradient(135deg,#12382A,#1A5C38)`, borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
      <div style={{ fontSize:34 }}>🗺</div>
      <div className="pj" style={{ fontSize:13, color:'rgba(255,255,255,.7)', fontWeight:600 }}>Live map — Bengaluru</div>
      <div className="pj" style={{ fontSize:11, color:'rgba(255,255,255,.4)', textAlign:'center', maxWidth:200, lineHeight:1.5 }}>Add your Mappls key in dashboard Settings to activate</div>
    </div>
  )

  return (
    <div style={{ position:'relative', height, borderRadius:12, overflow:'hidden' }}>
      <div ref={ref} style={{ width:'100%', height:'100%' }} />
      {st === 'loading' && (
        <div style={{ position:'absolute', inset:0, background:'rgba(18,56,42,.8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:26, height:26, border:'3px solid rgba(255,255,255,.15)', borderTop:'3px solid #72D4A8', borderRadius:'50%', animation:'spin .9s linear infinite' }} />
        </div>
      )}
    </div>
  )
}

/* ── Landing Page ─────────────────────────────────────────────── */
export default function LandingPage({ onGoToDashboard, onShowDoctor, mapplsKey }) {
  const [showModal, setShowModal] = useState(false)
  const [booked, setBooked]       = useState(null)
  const [tickIdx, setTickIdx]     = useState(0)
  const [liveLeads, setLiveLeads] = useState(TICKER_FALLBACK)
  const [totalToday, setTotalToday] = useState(null)
  const [w, setW]                 = useState(window.innerWidth)
  const [scrolled, setScrolled]   = useState(false)
  const [pinInput, setPinInput]   = useState('')
  const [gpsState, setGpsState]   = useState('idle') // idle | loading | done | error
  const [userCoords, setUserCoords] = useState(null)
  const [findResults, setFindResults] = useState(null)
  const [findMode, setFindMode]   = useState(null) // 'pin' | 'gps'

  useEffect(() => {
    const onR = () => setW(window.innerWidth)
    const onS = () => setScrolled(window.scrollY > 50)
    window.addEventListener('resize', onR)
    window.addEventListener('scroll', onS)
    return () => { window.removeEventListener('resize', onR); window.removeEventListener('scroll', onS) }
  }, [])

  useEffect(() => {
    const t = setInterval(() => setTickIdx(p => (p + 1) % liveLeads.length), 3500)
    return () => clearInterval(t)
  }, [liveLeads])

  // Fetch real recent bookings from Supabase
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('id, name, area, pain, created_at')
          .order('created_at', { ascending: false })
          .limit(10)
        if (!error && data && data.length > 0) {
          setLiveLeads(data.map(formatTick))
          // Count bookings from today
          const today = new Date().toDateString()
          const todayCount = data.filter(b =>
            new Date(b.created_at).toDateString() === today
          ).length
          if (todayCount > 0) setTotalToday(todayCount)
        }
      } catch (e) {
        // silently keep fallback data
      }
    }
    fetchLeads()
    // Refresh every 2 minutes
    const interval = setInterval(fetchLeads, 120000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = CSS
    document.head.appendChild(el)
    return () => { try { document.head.removeChild(el) } catch {} }
  }, [])

  // Schema markup — MedicalBusiness + FAQPage JSON-LD for Google rich results
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'MedicalBusiness',
          '@id': 'https://physiodrishti.vercel.app/#organization',
          name: 'PhysioDrishti',
          url: 'https://physiodrishti.vercel.app',
          logo: 'https://physiodrishti.vercel.app/logo.png',
          description: 'Expert online physiotherapy and at-home physiotherapy services across Bengaluru, India. Specialists in back pain, knee pain, shoulder problems, sports injuries and post-surgery rehabilitation.',
          medicalSpecialty: [
            { '@type': 'MedicalSpecialty', name: 'Physiotherapy' },
            { '@type': 'MedicalSpecialty', name: 'Orthopedic Physiotherapy' },
            { '@type': 'MedicalSpecialty', name: 'Sports Physiotherapy' },
            { '@type': 'MedicalSpecialty', name: 'Neurological Physiotherapy' },
          ],
          address: { '@type': 'PostalAddress', addressLocality: 'Bengaluru', addressRegion: 'Karnataka', addressCountry: 'IN' },
          areaServed: ['Koramangala','HSR Layout','Whitefield','Indiranagar','Jayanagar','Marathahalli','JP Nagar','Electronic City','Bengaluru','India'],
          availableService: [
            { '@type': 'MedicalTherapy', name: 'Back & Neck Pain Treatment' },
            { '@type': 'MedicalTherapy', name: 'Knee & Hip Pain Treatment' },
            { '@type': 'MedicalTherapy', name: 'Shoulder Pain Treatment' },
            { '@type': 'MedicalTherapy', name: 'Sports Injury Rehabilitation' },
            { '@type': 'MedicalTherapy', name: 'Post-Surgery Rehabilitation' },
            { '@type': 'MedicalTherapy', name: 'Online Physiotherapy Sessions' },
          ],
          aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', bestRating: '5', reviewCount: '247' },
          priceRange: '₹₹',
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Can physiotherapy help with chronic back pain?',
              acceptedAnswer: { '@type': 'Answer', text: 'Yes. Physiotherapy is highly effective for chronic back pain. Our specialists design personalised programs combining manual therapy, targeted exercises, and posture correction — most patients see significant improvement within 4–6 sessions.' },
            },
            {
              '@type': 'Question',
              name: 'Do you offer home visit physiotherapy in Bengaluru?',
              acceptedAnswer: { '@type': 'Answer', text: 'Yes, we offer at-home physiotherapy sessions across Bengaluru including Koramangala, HSR Layout, Whitefield, Indiranagar, Jayanagar, and more. Book a free call and we will match you with a specialist near you.' },
            },
            {
              '@type': 'Question',
              name: 'How does online physiotherapy work?',
              acceptedAnswer: { '@type': 'Answer', text: 'Online physiotherapy sessions happen via a secure video call on your phone or laptop. Your physiotherapist assesses your condition, prescribes exercises, and guides you through them in real time. It is as effective as in-person for most conditions.' },
            },
            {
              '@type': 'Question',
              name: 'How many sessions will I need?',
              acceptedAnswer: { '@type': 'Answer', text: 'It depends on your condition. Most acute issues like sprains or muscle strains improve in 3–5 sessions. Chronic conditions like long-standing back pain or frozen shoulder typically need 8–12 sessions. Your physio will give you a clear plan after the first assessment.' },
            },
            {
              '@type': 'Question',
              name: 'Is PhysioDrishti available outside Bengaluru?',
              acceptedAnswer: { '@type': 'Answer', text: 'Yes! Online physiotherapy sessions are available across India. In-home visits are currently available in Bengaluru. We are expanding to other cities soon.' },
            },
          ],
        },
        {
          '@type': 'WebSite',
          '@id': 'https://physiodrishti.vercel.app/#website',
          url: 'https://physiodrishti.vercel.app',
          name: 'PhysioDrishti',
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: 'https://physiodrishti.vercel.app/?q={search_term_string}' },
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'pd-schema'
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)
    return () => { try { document.head.removeChild(script) } catch {} }
  }, [])

  const mob = w < 768

  return (
    <div style={{ background:'#FDFAF3', minHeight:'100vh' }}>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background: scrolled?'rgba(253,250,243,.97)':'transparent', backdropFilter:scrolled?'blur(12px)':'none', borderBottom:scrolled?'1px solid #DDE4EF':'none', padding:'0 5%', transition:'all .3s' }}>
        <div style={{ maxWidth:1160, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:62 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <LogoImg size={40}/>
            <div>
              <div className="pd" style={{ fontWeight:900, fontSize:17, color: scrolled?'#12382A':'#fff' }}>PhysioDrishti</div>
              <div className="pj" style={{ fontSize:8, color: scrolled?'#5C6878':'rgba(255,255,255,.55)', letterSpacing:2, textTransform:'uppercase' }}>Online Physiotherapy</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap: mob?8:20 }}>
            <button className="btn-main" style={{ padding:'8px 18px', fontSize:13 }} onClick={()=>setShowModal(true)}>Book free call</button>
            {!mob && <button onClick={onShowDoctor} className="pj" style={{ fontSize:13, color:scrolled?'#5C6878':'rgba(255,255,255,.6)', cursor:'pointer', background:'none', border:'none' }}>Meet the doctor →</button>}
            {!mob && <button onClick={onGoToDashboard} className="pj" style={{ fontSize:13, color:scrolled?'#5C6878':'rgba(255,255,255,.6)', cursor:'pointer', background:'none', border:'none' }}>For clinics →</button>}
          </div>
        </div>
      </nav>

      {/* Success bar */}
      {booked && (
        <div style={{ background:'#12382A', padding:'11px 5%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div className="pj" style={{ fontSize:14, color:'#fff' }}>🎉 Done, <strong>{booked.name}</strong>! We will WhatsApp you within 30 minutes.</div>
          <button onClick={()=>setBooked(null)} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:6, padding:'3px 10px', color:'#fff', cursor:'pointer', fontSize:12 }}>✕</button>
        </div>
      )}

      {/* Ticker — clickable → dashboard */}
      <div
        onClick={onGoToDashboard}
        style={{ background:'#12382A', padding:'7px 5%', cursor:'pointer', transition:'background .2s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#1A4D35'}
        onMouseLeave={e => e.currentTarget.style.background = '#12382A'}
        title="View all bookings in dashboard"
      >
        <div style={{ maxWidth:1160, margin:'0 auto', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ background:'#D4510E', color:'#fff', padding:'2px 8px', borderRadius:4, fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:1, flexShrink:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Live</span>
          {totalToday !== null && (
            <span style={{ background:'rgba(255,255,255,.15)', color:'rgba(255,255,255,.85)', padding:'2px 10px', borderRadius:4, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:10, fontWeight:700, flexShrink:0 }}>
              {totalToday} booking{totalToday !== 1 ? 's' : ''} today
            </span>
          )}
          <span className="pj" style={{ fontSize:12, color:'rgba(255,255,255,.7)', animation:'ticker 3.5s ease infinite', display:'inline-block', flex:1 }}>{liveLeads[tickIdx % liveLeads.length]}</span>
          <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11, color:'rgba(255,255,255,.4)', flexShrink:0, display:'flex', alignItems:'center', gap:4 }}>
            View in dashboard <span style={{ fontSize:13 }}>→</span>
          </span>
        </div>
      </div>

      {/* Hero */}
      <section style={{ padding:'72px 5% 80px', background:'linear-gradient(140deg,#12382A 0%,#1E4D35 60%,#0D3828 100%)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-100, right:-80, width:480, height:480, borderRadius:'50%', background:'rgba(255,255,255,.03)' }}/>
        <div style={{ maxWidth:1160, margin:'0 auto' }}>
          <div className="hero-cols" style={{ display:'flex', alignItems:'center', gap:56 }}>
            <div style={{ flex:1, minWidth:0 }}>

              {/* Online Physiotherapy pill */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:22 }}>
                <span style={{ background:'rgba(58,154,107,.25)', color:'#72D4A8', padding:'6px 16px', borderRadius:20, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>
                  📱 Online Physiotherapy
                </span>
                <span style={{ background:'rgba(212,81,14,.25)', color:'#F4A574', padding:'6px 16px', borderRadius:20, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>
                  🏠 At Home · Near You
                </span>
              </div>

              <h1 className="pd" style={{ fontSize:'clamp(2.2rem,5vw,3.4rem)', fontWeight:900, color:'#fff', lineHeight:1.15, marginBottom:20 }}>
                Get back to doing<br /><em style={{ color:'#F4A574', fontStyle:'italic' }}>what you love.</em>
              </h1>
              <p className="pj" style={{ color:'rgba(255,255,255,.72)', fontSize:17, lineHeight:1.75, maxWidth:500, marginBottom:36 }}>
                Whether it has back pain, a sports injury, or recovery after surgery — our physiotherapists come to you or meet you online. Real experts, real relief.
              </p>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:36 }}>
                <button className="btn-main" style={{ padding:'14px 30px', fontSize:16 }} onClick={()=>setShowModal(true)}>Book a free call →</button>
                <button className="btn-ghost" onClick={onGoToDashboard}>I am a clinic</button>
              </div>
              <div style={{ display:'flex', gap:28, flexWrap:'wrap' }}>
                {[['⭐ 4.9','Rating'],['🏥 3,400+','Sessions done'],['📍 10+','Areas in Bengaluru'],['📱','Online & at home']].map(([v,l])=>(
                  <div key={l}><div className="pj" style={{ fontSize:'1.1rem', fontWeight:800, color:'#fff' }}>{v}</div><div className="pj" style={{ fontSize:11, color:'rgba(255,255,255,.5)' }}>{l}</div></div>
                ))}
              </div>
            </div>

            {/* Quick-pick card */}
            <div className="hero-card" style={{ flex:'0 0 340px' }}>
              <div style={{ background:'rgba(255,255,255,.08)', backdropFilter:'blur(16px)', borderRadius:16, padding:28, border:'1px solid rgba(255,255,255,.13)' }}>
                <div className="pd" style={{ fontSize:'1.05rem', fontWeight:800, color:'#fff', marginBottom:5 }}>Where does it hurt?</div>
                <div className="pj" style={{ fontSize:12, color:'rgba(255,255,255,.55)', marginBottom:18 }}>Pick one and we will find you the right specialist today.</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {['Back or neck pain','Knee or hip pain','Shoulder problem','Sports injury','After surgery','Something else'].map(p=>(
                    <button key={p} className="pain-btn" onClick={()=>setShowModal(true)}>{p}<span>→</span></button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Find a Physiotherapist */}
      <section style={{ padding:'64px 5%', background:'#F3F6FA' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div className="pj" style={{ fontSize:11, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:'#D4510E', marginBottom:12 }}>Find near you</div>
            <h2 className="pd" style={{ fontSize:'2rem', fontWeight:900, marginBottom:10 }}>Find a physiotherapist near you</h2>
            <p className="pj" style={{ fontSize:14, color:'#5C6878', lineHeight:1.7 }}>Enter your PIN code or allow location access to see specialists in your area.</p>
          </div>

          {/* Search bar */}
          <div className="find-row" style={{ display:'flex', gap:12, marginBottom:28 }}>
            <div style={{ flex:1, display:'flex', gap:0, borderRadius:10, overflow:'hidden', border:'1.5px solid #DDE4EF', background:'#fff', boxShadow:'0 2px 12px rgba(13,21,32,.06)' }}>
              <span style={{ display:'flex', alignItems:'center', padding:'0 14px', fontSize:18, color:'#9BA8B5', flexShrink:0 }}>📍</span>
              <input
                className="pj"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit PIN code (e.g. 560034)"
                value={pinInput}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g,'')
                  setPinInput(v)
                  if (v.length >= 3) {
                    const res = PHYSIOS.filter(p => p.pin.startsWith(v))
                    setFindResults(res)
                    setFindMode('pin')
                  } else if (v.length === 0) {
                    setFindResults(null)
                    setFindMode(null)
                  }
                }}
                style={{ flex:1, padding:'14px 12px', border:'none', outline:'none', fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif", color:'#0D1520', background:'transparent' }}
              />
              {pinInput && (
                <button
                  onClick={() => { setPinInput(''); setFindResults(null); setFindMode(null) }}
                  style={{ padding:'0 14px', background:'none', border:'none', cursor:'pointer', color:'#9BA8B5', fontSize:16 }}
                >✕</button>
              )}
            </div>
            <button
              className="pj"
              onClick={() => {
                if (!navigator.geolocation) { setGpsState('error'); return }
                setGpsState('loading')
                setPinInput('')
                navigator.geolocation.getCurrentPosition(
                  pos => {
                    const { latitude: lat, longitude: lng } = pos.coords
                    setUserCoords({ lat, lng })
                    const withDist = PHYSIOS.map(p => ({ ...p, distKm: haversineKm(lat, lng, p.lat, p.lng) }))
                      .sort((a,b) => a.distKm - b.distKm)
                    setFindResults(withDist.slice(0, 6))
                    setFindMode('gps')
                    setGpsState('done')
                  },
                  () => setGpsState('error')
                )
              }}
              style={{
                flexShrink:0, padding:'14px 20px', borderRadius:10, border:'1.5px solid #0A6B5E',
                background: gpsState === 'done' ? '#0A6B5E' : '#fff',
                color: gpsState === 'done' ? '#fff' : '#0A6B5E',
                fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                whiteSpace:'nowrap', boxShadow:'0 2px 12px rgba(13,21,32,.06)', transition:'all .2s'
              }}
            >
              {gpsState === 'loading' ? <><span style={{ animation:'spin .8s linear infinite', display:'inline-block' }}>⏳</span> Locating…</> : gpsState === 'error' ? '⚠ Location off' : '🎯 Use my location'}
            </button>
          </div>

          {/* Error state */}
          {gpsState === 'error' && (
            <div className="pj" style={{ textAlign:'center', fontSize:13, color:'#D4510E', marginBottom:20 }}>
              Location access was denied. Please allow it in your browser or use a PIN code above.
            </div>
          )}

          {/* Results */}
          {findResults !== null && findResults.length === 0 && (
            <div style={{ textAlign:'center', padding:36 }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🔍</div>
              <div className="pd" style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:8 }}>No specialists found for this PIN</div>
              <div className="pj" style={{ fontSize:13, color:'#5C6878', marginBottom:20 }}>We may not cover your area yet, but we do offer online sessions everywhere in India.</div>
              <button className="btn-main" style={{ padding:'12px 28px' }} onClick={()=>setShowModal(true)}>Book an online session →</button>
            </div>
          )}

          {findResults !== null && findResults.length > 0 && (
            <>
              <div className="pj" style={{ fontSize:12, color:'#5C6878', marginBottom:16 }}>
                {findMode === 'gps'
                  ? `${findResults.length} specialists near you · sorted by distance`
                  : `${findResults.length} specialist${findResults.length !== 1 ? 's' : ''} in PIN ${pinInput}`}
              </div>
              <div className="physio-results" style={{ display:'grid', gap:16 }}>
                {findResults.map(p => (
                  <div key={p.id} style={{ background:'#fff', borderRadius:14, padding:22, boxShadow:'0 2px 16px rgba(13,21,32,.07)', border:'1px solid #EEF1F6', transition:'all .25s' }}
                    onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 8px 28px rgba(13,21,32,.12)'; e.currentTarget.style.transform='translateY(-3px)' }}
                    onMouseLeave={e=>{ e.currentTarget.style.boxShadow='0 2px 16px rgba(13,21,32,.07)'; e.currentTarget.style.transform='none' }}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, gap:8 }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#12382A,#3A9A6B)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:20 }}>🩺</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="pd" style={{ fontWeight:800, fontSize:'0.95rem', color:'#0D1520', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                        <div className="pj" style={{ fontSize:11, color:'#0A6B5E', fontWeight:600, marginTop:2 }}>{p.specialty}</div>
                      </div>
                      <div style={{ background:'#FFF8EF', borderRadius:6, padding:'3px 9px', fontSize:11, fontWeight:700, color:'#D4510E', fontFamily:"'Plus Jakarta Sans',sans-serif", flexShrink:0 }}>{p.avail}</div>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
                      <span className="pj" style={{ fontSize:11, color:'#5C6878', display:'flex', alignItems:'center', gap:4 }}>📍 {p.area} · {p.pin}</span>
                      {p.distKm !== undefined && (
                        <span className="pj" style={{ fontSize:11, color:'#3A9A6B', fontWeight:700 }}>~{p.distKm < 1 ? '<1' : p.distKm.toFixed(1)} km away</span>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
                      {p.mode.map(m => (
                        <span key={m} className="pj" style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, background:'#F3F6FA', color:'#5C6878', letterSpacing:.3 }}>{m}</span>
                      ))}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div className="pj" style={{ fontSize:12, color:'#5C6878' }}>
                        <span style={{ color:'#FBBF24', fontWeight:700 }}>★ {p.rating}</span> · {p.reviews} reviews · {p.exp}
                      </div>
                      <button className="btn-main" style={{ padding:'7px 16px', fontSize:12 }} onClick={()=>setShowModal(true)}>Book →</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Default prompt — no search yet */}
          {findResults === null && gpsState === 'idle' && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center' }}>
              {['560034','560102','560038','560066','560037','560041'].map(pin => (
                <button key={pin} className="pj"
                  onClick={() => {
                    setPinInput(pin)
                    setFindResults(PHYSIOS.filter(p => p.pin === pin))
                    setFindMode('pin')
                  }}
                  style={{ padding:'7px 16px', borderRadius:20, border:'1px solid #DDE4EF', background:'#fff', fontSize:12, color:'#5C6878', cursor:'pointer', transition:'all .2s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='#3A9A6B'; e.currentTarget.style.color='#0A6B5E' }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='#DDE4EF'; e.currentTarget.style.color='#5C6878' }}
                >📍 {PHYSIOS.find(p=>p.pin===pin)?.area} ({pin})</button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pain we treat */}
      <section style={{ padding:'72px 5%', background:'#fff' }}>
        <div style={{ maxWidth:1160, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:46 }}>
            <div className="pj" style={{ fontSize:11, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:'#D4510E', marginBottom:12 }}>We can help with</div>
            <h2 className="pd" style={{ fontSize:'2.2rem', fontWeight:900 }}>Pain we treat</h2>
            <p className="pj" style={{ color:'#5C6878', fontSize:15, marginTop:10, maxWidth:460, margin:'10px auto 0' }}>We've helped thousands of people across Bengaluru get back to their normal lives.</p>
          </div>
          <div className="pain-grid" style={{ display:'grid', gap:20 }}>
            {PAIN_AREAS.map(p=>(
              <div key={p.name} className="card-lp" style={{ padding:24, cursor:'pointer' }} onClick={()=>setShowModal(true)}>
                <div style={{ fontSize:32, marginBottom:12 }}>{p.icon}</div>
                <h3 className="pd" style={{ fontSize:'1.05rem', fontWeight:800, marginBottom:8 }}>{p.name}</h3>
                <p className="pj" style={{ fontSize:13, color:'#5C6878', lineHeight:1.65, marginBottom:14 }}>{p.desc}</p>
                <span className="pj" style={{ fontSize:13, color:'#0A6B5E', fontWeight:700 }}>Get help →</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding:'72px 5%', background:'#F3F6FA' }}>
        <div style={{ maxWidth:1160, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:46 }}>
            <div className="pj" style={{ fontSize:11, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:'#D4510E', marginBottom:12 }}>Simple process</div>
            <h2 className="pd" style={{ fontSize:'2.2rem', fontWeight:900 }}>How it works</h2>
          </div>
          <div className="steps-grid" style={{ display:'grid', gap:28 }}>
            {HOW_IT_WORKS.map(s=>(
              <div key={s.step} style={{ textAlign:'center' }}>
                <div style={{ width:64, height:64, background:'#fff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, margin:'0 auto 14px', boxShadow:'0 2px 12px rgba(0,0,0,.08)' }}>{s.icon}</div>
                <div className="pj" style={{ fontSize:10, fontWeight:800, letterSpacing:3, color:'#D4510E', marginBottom:6 }}>STEP {s.step}</div>
                <h3 className="pd" style={{ fontSize:'1rem', fontWeight:800, marginBottom:8 }}>{s.title}</h3>
                <p className="pj" style={{ fontSize:13, color:'#5C6878', lineHeight:1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center', marginTop:40 }}>
            <button className="btn-main" style={{ padding:'14px 36px', fontSize:16 }} onClick={()=>setShowModal(true)}>Start today — it has free →</button>
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section style={{ padding:'72px 5%', background:'#F3F6FA' }}>
        <div style={{ maxWidth:1160, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div className="pj" style={{ fontSize:11, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:'#D4510E', marginBottom:12 }}>Why PhysioDrishti exists</div>
            <h2 className="pd" style={{ fontSize:'2.2rem', fontWeight:900, marginBottom:14 }}>Challenges faced by patients<br />& clinicians — and how we solve them</h2>
            <p className="pj" style={{ fontSize:15, color:'#5C6878', maxWidth:560, margin:'0 auto', lineHeight:1.7 }}>The current physiotherapy system is broken in ways most people don't talk about. We're fixing that.</p>
          </div>

          <div style={{ marginBottom:48 }}>
            <div className="pj" style={{ fontSize:13, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:'#0A6B5E', marginBottom:20 }}>For Patients</div>
            <div className="challenge-grid" style={{ display:'grid', gap:20 }}>
              {[
                { icon:'📉', title:'The "80/20" Adherence Gap', body:'70% of patients struggle to complete their home exercise programs (HEPs). Low self-efficacy, pain during exercise, and lack of supervision make it hard to stay consistent — yet consistency is everything.' },
                { icon:'⏳', title:'Delayed & Invisible Progress', body:'Recovery takes time, but patients rarely see their own gains. Without clear milestones or feedback, they get discouraged and switch to quick fixes like pain medication instead of healing the root cause.' },
              ].map(c => (
                <div key={c.title} className="card-lp" style={{ padding:28 }}>
                  <div style={{ fontSize:32, marginBottom:14 }}>{c.icon}</div>
                  <h3 className="pd" style={{ fontSize:'1.1rem', fontWeight:800, marginBottom:10, color:'#0D1520' }}>{c.title}</h3>
                  <p className="pj" style={{ fontSize:13, color:'#5C6878', lineHeight:1.7 }}>{c.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="pj" style={{ fontSize:13, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:'#D4510E', marginBottom:20 }}>For Clinicians</div>
            <div className="challenge-grid" style={{ display:'grid', gap:20 }}>
              {[
                { icon:'📋', title:'Administrative & Documentation Overload', body:'Physiotherapists spend hours tracking patient activity, writing clinical histories, and navigating rigid software — time that should go to patient care. We cut paperwork so clinicians can focus on healing.' },
                { icon:'🔗', title:'No Continuity Between Visits', body:'Without a connected view of a patient\'s progress between sessions, clinicians have to rebuild context every appointment. This slows treatment and increases the risk of regression.' },
              ].map(c => (
                <div key={c.title} className="card-lp" style={{ padding:28 }}>
                  <div style={{ fontSize:32, marginBottom:14 }}>{c.icon}</div>
                  <h3 className="pd" style={{ fontSize:'1.1rem', fontWeight:800, marginBottom:10, color:'#0D1520' }}>{c.title}</h3>
                  <p className="pj" style={{ fontSize:13, color:'#5C6878', lineHeight:1.7 }}>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section style={{ padding:'72px 5%', background:'#fff' }}>
        <div style={{ maxWidth:1160, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:42 }}>
            <div className="pj" style={{ fontSize:11, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:'#D4510E', marginBottom:12 }}>Real patients, real results</div>
            <h2 className="pd" style={{ fontSize:'2.2rem', fontWeight:900 }}>What people say</h2>
          </div>
          <div className="review-grid" style={{ display:'grid', gap:20 }}>
            { REVIEWS.map(r=>(
              <div key={r.name} className="card-lp" style={{ padding:24 }}>
                <div style={{ marginBottom:12 }}>{'★★★★★'.split('').map((s,i)=><span key={i} className="star">{s}</span>)}</div>
                <div className="pd" style={{ fontSize:'1rem', fontWeight:700, marginBottom:4 }}>{r.pain}</div>
                <div className="pj" style={{ fontSize:13, color:'#0A6B5E', fontWeight:700, marginBottom:14 }}>✓ {r.result}</div>
                <div className="pj" style={{ fontSize:13, color:'#5C6878' }}>{r.name} · {r.area}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Final CTA */}
      <section style={{ padding:'72px 5%', background:'linear-gradient(135deg,#12382A,#0D3828)', textAlign:'center' }}>
        <div style={{ maxWidth:560, margin:'0 auto' }}>
          <h2 className="pd" style={{ fontSize:'2.2rem', fontWeight:900, color:'#fff', marginBottom:14 }}>Pain is holding you back.<br /><em style={{ color:'#F4A574' }}>We can change that.</em></h2>
          <p className="pj" style={{ color:'rgba(255,255,255,.7)', fontSize:16, marginBottom:32, lineHeight:1.7 }}>Join thousands of people across India who got back to a pain-free life.</p>
          <button className="btn-main" style={{ padding:'15px 40px', fontSize:17 }} onClick={()=>setShowModal(true)}>Book my free call →</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background:'#0D1520', padding:'44px 5% 24px' }}>
        <div style={{ maxWidth:1160, margin:'0 auto' }}>
          <div className="footer-cols" style={{ display:'grid', gap:36, marginBottom:36 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <LogoImg size={36}/>
                <div>
                  <div className="pd" style={{ fontWeight:900, fontSize:15, color:'#fff' }}>PhysioDrishti</div>
                  <div className="pj" style={{ fontSize:8, color:'rgba(255,255,255,.4)', letterSpacing:2, marginTop:1 }}>Online Physiotherapy</div>
                </div>
              </div>
              <p className="pj" style={{ color:'rgba(255,255,255,.4)', fontSize:12, lineHeight:1.8, maxWidth:260 }}>Expert physiotherapy and orthopaedic care — from home or near you. Helping people across India live pain-free.</p>
            </div>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', paddingTop:20, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
            <span className="pj" style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>© 2026 PhysioDrishti · Bengaluru, India</span>
            <span className="pj" style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>Privacy · Terms</span>
          </div>
        </div>
      </footer>

      {showModal && <SimpleBooking onClose={()=>setShowModal(false)} onSuccess={f=>{setShowModal(false);setBooked(f)}}/>}
    </div>
  )
          }
