/**
 * PhysioDrishti — Clinic Dashboard
 * Clean, simple lead & session management for physio and ortho clinics.
 * Props: onGoToLanding, mapplsKey, setMapplsKey
 */
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase.js'

const C = {
  forest:'#12382A', teal:'#0A6B5E', mint:'#3A9A6B',
  saffron:'#D4510E', ink:'#0D1520', gray:'#5C6878',
  light:'#F3F6FA', border:'#DDE4EF', white:'#FFFFFF',
  green:'#177A45', blue:'#1A4FBB', red:'#B83232',
  amber:'#C47D10', purple:'#5E3A9A',
  greenLight:'#EDF7F2', blueLight:'#EEF4FF', saffronLight:'#FFF3EB',
}

/* ─── Data ─────────────────────────────────────────────────────── */
const AREAS = ['Koramangala','HSR Layout','Whitefield','Indiranagar','Jayanagar','Marathahalli','JP Nagar','Electronic City','Bannerghatta Road','Yelahanka']
const PAIN_OPTIONS = ['Back / Neck','Knee / Hip','Shoulder','Ankle / Foot','Elbow / Wrist','Post-surgery','Other']
const STAGES = ['new','called','assessment','active','done']
const STAGE_LABEL = { new:'New', called:'Called', assessment:'Checked', active:'In sessions', done:'Done' }
const STAGE_COLOR = { new:C.blue, called:C.amber, assessment:C.purple, active:C.teal, done:C.green }
const STAGE_ICON  = { new:'🔔', called:'📞', assessment:'🩺', active:'💪', done:'✅' }

const INITIAL_PATIENTS = [
  { id:1,  name:'Rahul Sharma',  phone:'98XX0001', area:'Koramangala',     pain:'Back / Neck',   stage:'new',        note:'3 years of back pain',        time:'30 Jun 2026, 9:14 AM',   priority:'high' },
  { id:2,  name:'Anitha Reddy',  phone:'97XX0012', area:'HSR Layout',      pain:'Knee / Hip',    stage:'called',     note:'Post ACL surgery',            time:'30 Jun 2026, 8:45 AM',   priority:'high' },
  { id:3,  name:'Vikram Nair',   phone:'96XX0023', area:'Whitefield',      pain:'Shoulder',      stage:'assessment', note:'Shoulder clicks at night',    time:'29 Jun 2026, 4:10 PM', priority:'medium' },
  { id:4,  name:'Priya Iyer',    phone:'95XX0034', area:'Jayanagar',       pain:'Knee / Hip',    stage:'active',     note:'Knee replacement recovery',   time:'29 Jun 2026, 3:22 PM', priority:'high' },
  { id:5,  name:'Suresh Kumar',  phone:'94XX0045', area:'Marathahalli',    pain:'Back / Neck',   stage:'new',        note:'Pain down left leg',          time:'30 Jun 2026, 9:02 AM',   priority:'high' },
  { id:6,  name:'Deepa Menon',   phone:'93XX0056', area:'Indiranagar',     pain:'Back / Neck',   stage:'done',       note:'Cervical pain, much better',  time:'28 Jun 2026, 11:05 AM',priority:'low'  },
  { id:7,  name:'Arjun Patel',   phone:'92XX0067', area:'Electronic City', pain:'Post-surgery',  stage:'new',        note:'Sports injury — knee',        time:'30 Jun 2026, 8:55 AM',   priority:'medium' },
  { id:8,  name:'Kavitha S.',    phone:'91XX0078', area:'JP Nagar',        pain:'Knee / Hip',    stage:'active',     note:'Hip replacement, wk 4',       time:'29 Jun 2026, 5:40 PM', priority:'high' },
  { id:9,  name:'Mohammed A.',   phone:'90XX0089', area:'Yelahanka',       pain:'Ankle / Foot',  stage:'called',     note:'Heel pain every morning',     time:'30 Jun 2026, 9:20 AM',   priority:'medium' },
  { id:10, name:'Sangeetha R.',  phone:'89XX0091', area:'Bannerghatta Road',pain:'Knee / Hip',   stage:'assessment', note:'Knee pain, difficulty walking',time:'29 Jun 2026, 2:15 PM', priority:'medium' },
]

const SESSIONS_TODAY = [
  { id:1, name:'Priya Iyer',   pain:'Knee recovery',       time:'11:00 AM', status:'live',     duration:'45 min', area:'Jayanagar',     type:'Video' },
  { id:2, name:'Kavitha S.',   pain:'Hip recovery wk 4',   time:'11:45 AM', status:'upcoming', duration:'30 min', area:'JP Nagar',       type:'Video' },
  { id:3, name:'Rahul Sharma', pain:'Back pain check-in',  time:'2:00 PM',  status:'upcoming', duration:'45 min', area:'Koramangala',   type:'Video' },
  { id:4, name:'Suresh Kumar', pain:'Leg pain follow-up',  time:'3:30 PM',  status:'upcoming', duration:'30 min', area:'Marathahalli',  type:'Video' },
  { id:5, name:'Anitha Reddy', pain:'Knee rehab week 3',   time:'4:15 PM',  status:'upcoming', duration:'60 min', area:'HSR Layout',    type:'Video' },
]

const SEO_TERMS = [
  { term:'physiotherapist in Bengaluru',        position:1, searches:'8,100/mo', trend:'up',   type:'Physio' },
  { term:'physiotherapy near me Bangalore',     position:1, searches:'6,600/mo', trend:'up',   type:'Physio' },
  { term:'best physio clinic Koramangala',      position:2, searches:'2,900/mo', trend:'up',   type:'Physio' },
  { term:'online physiotherapy India',          position:2, searches:'4,400/mo', trend:'same', type:'Physio' },
  { term:'orthopaedic doctor Bengaluru',        position:3, searches:'5,400/mo', trend:'down', type:'Ortho'  },
  { term:'knee pain treatment Bangalore',       position:4, searches:'2,400/mo', trend:'up',   type:'Ortho'  },
  { term:'online physio sessions India',        position:1, searches:'1,900/mo', trend:'up',   type:'Online' },
  { term:'back pain treatment Bangalore',       position:3, searches:'3,600/mo', trend:'down', type:'Physio' },
  { term:'sports injury physio HSR Layout',     position:1, searches:'1,200/mo', trend:'up',   type:'Physio' },
  { term:'shoulder pain treatment Indiranagar', position:2, searches:'880/mo',   trend:'up',   type:'Physio' },
]


/* ── Default Google Meet link (update in Settings) ─────────────── */
const DEFAULT_MEET_LINK = 'https://meet.google.com/new'

/* ── WhatsApp helper ─────────────────────────────────────────────── */
function openWhatsApp(phone, message) {
  const clean = phone.replace(/[^0-9]/g, '')
  const num   = clean.startsWith('91') ? clean : `91${clean}`
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank')
}

function bookingConfirmMsg(session, doctorName, meetLink) {
  const dateStr = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })
  return (
`Hi ${session.name}, this is Dr. ${doctorName} from PhysioDrishti 🌿

Your session is confirmed for ${dateStr} at ${session.time}.

Join here:
${meetLink || 'https://meet.google.com/new'}

Please join 2 minutes early. If you have any questions before the session, reply here.

See you soon!
- PhysioDrishti`
  )
}

/* ─── CSS ────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',sans-serif;color:#0D1520;overflow-x:hidden}
.pd{font-family:'Playfair Display',serif}
.pj{font-family:'Plus Jakarta Sans',sans-serif}
.btn-g{background:#12382A;color:#fff;border:none;padding:10px 22px;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif}
.btn-g:hover{background:#0E2B1E}
.btn-o{background:#D4510E;color:#fff;border:none;padding:10px 20px;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s}
.btn-o:hover{background:#BF4610}
.btn-soft{background:#F3F6FA;color:#5C6878;border:1px solid #DDE4EF;padding:8px 16px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s}
.btn-soft:hover{background:#DDE4EF}
.card-d{background:#fff;border-radius:10px;border:1px solid #DDE4EF;box-shadow:0 1px 8px rgba(13,21,32,.06)}
.field-d{width:100%;padding:10px 13px;border:1.5px solid #DDE4EF;border-radius:7px;font-size:13px;outline:none;transition:border-color .2s;background:#fff;color:#0D1520;font-family:'Plus Jakarta Sans',sans-serif}
.field-d:focus{border-color:#3A9A6B;box-shadow:0 0 0 3px rgba(58,154,107,.1)}
.field-d::placeholder{color:#9BA8B5}
.side-btn{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:7px;cursor:pointer;transition:all .18s;color:rgba(255,255,255,.65);font-size:13px;font-weight:500;white-space:nowrap;border:none;background:none;width:100%;text-align:left;font-family:'Plus Jakarta Sans',sans-serif}
.side-btn:hover{background:rgba(255,255,255,.1);color:#fff}
.side-btn.on{background:rgba(255,255,255,.15);color:#fff;font-weight:700}
.tbl{width:100%;border-collapse:collapse;font-size:13px}
.tbl th{padding:10px 14px;text-align:left;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#5C6878;border-bottom:2px solid #DDE4EF;background:#F3F6FA}
.tbl td{padding:10px 14px;border-bottom:1px solid #DDE4EF;vertical-align:middle}
.tbl tr:hover td{background:#F3F6FA}
.badge{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif}
.kbn-card{background:#fff;border-radius:8px;padding:12px;margin-bottom:8px;border:1px solid #DDE4EF;cursor:pointer;transition:all .2s}
.kbn-card:hover{border-color:#3A9A6B;box-shadow:0 3px 12px rgba(10,107,94,.1);transform:translateY(-2px)}
.fade-d{animation:fadeUp .45s ease both}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}
@media(max-width:767px){
  .sidebar-d{position:fixed!important;left:0;top:0;height:100vh;z-index:200}
  .g4{grid-template-columns:repeat(2,1fr)!important}
  .g2{grid-template-columns:1fr!important}
  .g3{grid-template-columns:1fr!important}
  .kanban-wrap{overflow-x:auto}
}
@media(min-width:768px) and (max-width:1023px){.g4{grid-template-columns:repeat(2,1fr)}.g3{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1024px){.g4{grid-template-columns:repeat(4,1fr)}.g2{grid-template-columns:repeat(2,1fr)}.g3{grid-template-columns:repeat(3,1fr)}}
`

/* ─── Mappls Map ─────────────────────────────────────────────────── */
function MapplsMap({ apiKey, height = 340, patients = [] }) {
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
            { name:'Koramangala', lat:12.9352, lng:77.6245, count:3 },
            { name:'HSR Layout',  lat:12.9116, lng:77.6446, count:2 },
            { name:'Indiranagar', lat:12.9784, lng:77.6408, count:2 },
            { name:'Whitefield',  lat:12.9698, lng:77.7500, count:2 },
            { name:'Jayanagar',   lat:12.9300, lng:77.5830, count:1 },
            { name:'Marathahalli',lat:12.9591, lng:77.6974, count:1 },
          ]
          spots.forEach(a => {
            const el = document.createElement('div')
            el.style.cssText = `width:${10+a.count*3}px;height:${10+a.count*3}px;background:#D4510E;border:2px solid #fff;border-radius:50%;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;font-family:'Plus Jakarta Sans',sans-serif`
            el.textContent = a.count
            const m = new window.mappls.Marker({ map, position:{ lat:a.lat, lng:a.lng }, html:el })
            m.addListener('click', () =>
              new window.mappls.InfoWindow({ map, position:{ lat:a.lat, lng:a.lng },
                content:`<div style="font-family:'Plus Jakarta Sans',sans-serif;padding:6px 10px"><div style="font-weight:700;font-size:13px">${a.name}</div><div style="font-size:11px;color:#5C6878">${a.count} active patients</div></div>` })
            )
          })
        })
      } catch { setSt('error') }
    }
    if (window.mappls) { init(); return }
    const cb = `__mplD_${Date.now()}`
    window[cb] = () => { delete window[cb]; init() }
    const s = document.createElement('script')
    s.src = `https://apis.mappls.com/advancedmaps/api/${apiKey.trim()}/map_sdk?v=3.0&layer=vector&callback=${cb}`
    s.async = true; s.onerror = () => { setSt('error'); delete window[cb] }
    document.head.appendChild(s)
    return () => { try { document.head.removeChild(s) } catch {} }
  }, [apiKey])

  if (!apiKey?.trim()) return (
    <div style={{ height, background:'linear-gradient(135deg,#12382A,#1A5C38)', borderRadius:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
      <div style={{ fontSize:32 }}>🗺</div>
      <div className="pj" style={{ fontSize:13, color:'rgba(255,255,255,.75)', fontWeight:600 }}>Live patient map</div>
      <div className="pj" style={{ fontSize:11, color:'rgba(255,255,255,.45)', textAlign:'center', maxWidth:180, lineHeight:1.5 }}>Add your Mappls key in Settings to activate</div>
    </div>
  )
  return (
    <div style={{ position:'relative', height, borderRadius:10, overflow:'hidden' }}>
      <div ref={ref} style={{ width:'100%', height:'100%' }} />
      {st==='loading' && <div style={{ position:'absolute', inset:0, background:'rgba(18,56,42,.8)', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:26, height:26, border:'3px solid rgba(255,255,255,.15)', borderTop:'3px solid #72D4A8', borderRadius:'50%', animation:'spin .9s linear infinite' }}/></div>}
    </div>
  )
}

/* ─── Exercise prescription HTML builder ─────────────────────────── */
function buildPrescriptionHTML(exercises, patient, doctorName, note, format) {
  const dateStr = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })
  const filled = exercises.filter(e => e.name.trim())
  const isIG = format === 'instagram'
  const scale = isIG ? 2.4 : 1

  const exRows = filled.map((ex, i) => `
    <div style="display:flex;gap:${14*scale}px;margin-bottom:${16*scale}px;padding-bottom:${14*scale}px;border-bottom:1px solid #DDE4EF;align-items:flex-start">
      <div style="width:${26*scale}px;height:${26*scale}px;background:#12382A;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${11*scale}px;font-weight:800;font-family:Plus Jakarta Sans,sans-serif;flex-shrink:0">${i+1}</div>
      <div style="flex:1">
        <div style="font-size:${14*scale}px;font-weight:800;color:#0D1520;margin-bottom:${3*scale}px;font-family:Plus Jakarta Sans,sans-serif">${ex.name}</div>
        <div style="font-size:${11*scale}px;color:#D4510E;font-weight:700;margin-bottom:${3*scale}px;font-family:Plus Jakarta Sans,sans-serif">${ex.sets} sets × ${ex.reps} reps · ${ex.frequency}</div>
        ${ex.instructions ? `<div style="font-size:${11*scale}px;color:#5C6878;line-height:1.6;font-family:Plus Jakarta Sans,sans-serif">${ex.instructions}</div>` : ''}
      </div>
    </div>`).join('')

  const reminders = ['Stop immediately if pain increases', 'Contact us if you feel any discomfort', 'Consistency matters — do these daily', 'Next check-in: reply here to book'].map(r =>
    `<div style="display:flex;gap:${8*scale}px;align-items:center;margin-bottom:${6*scale}px;font-size:${11*scale}px;color:#5C6878;font-family:Plus Jakarta Sans,sans-serif"><div style="width:${5*scale}px;height:${5*scale}px;background:#3A9A6B;border-radius:50%;flex-shrink:0"></div>${r}</div>`
  ).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Exercise Prescription — ${patient.name}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',sans-serif;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@media print{@page{size:${isIG?'405px 720px':'A4 portrait'};margin:0}body{margin:0}}
.page{width:${isIG?405:210}${isIG?'px':'mm'};${isIG?'height:720px;':'min-height:297mm;'}background:#fff;display:flex;flex-direction:column}
</style></head><body>
<div class="page">
<div style="background:#12382A;padding:${22*scale}px ${30*scale}px;display:flex;align-items:center;gap:${14*scale}px">
  <div style="width:${38*scale}px;height:${38*scale}px;background:rgba(255,255,255,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${20*scale}px;border:2px solid rgba(255,255,255,.25);flex-shrink:0">🌿</div>
  <div style="flex:1">
    <div style="font-family:Playfair Display,serif;font-weight:900;color:#fff;font-size:${16*scale}px">PhysioDrishti</div>
    <div style="color:rgba(255,255,255,.6);font-size:${9*scale}px;font-family:Plus Jakarta Sans,sans-serif">Dr. ${doctorName} · BPT, MPT</div>
  </div>
  <div style="background:#D4510E;color:#fff;padding:${4*scale}px ${12*scale}px;border-radius:${5*scale}px;font-size:${9*scale}px;font-weight:800;letter-spacing:1px;font-family:Plus Jakarta Sans,sans-serif;text-transform:uppercase">Exercise Rx</div>
</div>
<div style="background:#F3F6FA;padding:${12*scale}px ${30*scale}px;display:flex;gap:${32*scale}px;border-bottom:1px solid #DDE4EF">
  ${[['Patient',patient.name],['Date',dateStr],['Condition',patient.pain||'General']].map(([l,v])=>`<div><div style="font-size:${8*scale}px;font-weight:800;color:#5C6878;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;font-family:Plus Jakarta Sans,sans-serif">${l}</div><div style="font-size:${13*scale}px;font-weight:700;color:#0D1520;font-family:Plus Jakarta Sans,sans-serif">${v}</div></div>`).join('')}
</div>
<div style="padding:${20*scale}px ${30*scale}px;flex:1">
  <div style="font-size:${9*scale}px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#0A6B5E;margin-bottom:${14*scale}px;font-family:Plus Jakarta Sans,sans-serif">Your Exercise Plan</div>
  ${exRows || `<div style="color:#9BA8B5;font-size:${12*scale}px;font-style:italic;font-family:Plus Jakarta Sans,sans-serif">No exercises added</div>`}
</div>
${note ? `<div style="margin:0 ${30*scale}px ${16*scale}px;background:#FFF8EF;border-left:${4*scale}px solid #D4510E;padding:${10*scale}px ${14*scale}px;border-radius:0 ${6*scale}px ${6*scale}px 0"><div style="font-size:${9*scale}px;font-weight:800;color:#D4510E;text-transform:uppercase;letter-spacing:1px;margin-bottom:${4*scale}px;font-family:Plus Jakarta Sans,sans-serif">Doctor's Notes</div><div style="font-size:${11*scale}px;color:#0D1520;line-height:1.65;font-family:Plus Jakarta Sans,sans-serif">${note}</div></div>` : ''}
<div style="padding:0 ${30*scale}px ${20*scale}px">
  <div style="font-size:${9*scale}px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#0A6B5E;margin-bottom:${10*scale}px;font-family:Plus Jakarta Sans,sans-serif">Important Reminders</div>
  ${reminders}
</div>
<div style="background:#12382A;padding:${12*scale}px ${30*scale}px;display:flex;justify-content:space-between;align-items:center;margin-top:auto">
  <div style="font-size:${11*scale}px;font-weight:700;color:#fff;font-family:Plus Jakarta Sans,sans-serif">PhysioDrishti · Bengaluru</div>
  <div style="font-size:${10*scale}px;color:rgba(255,255,255,.5);font-family:Plus Jakarta Sans,sans-serif">physiodrishti.in</div>
</div>
</div></body></html>`
}

/* ─── Exercise prescription modal ───────────────────────────────── */
function ExercisePrescriptionModal({ patient, doctorName, onClose }) {
  const mkEx = () => ({ id: Date.now() + Math.random(), name:'', sets:'3', reps:'10', frequency:'Daily', instructions:'' })
  const [exercises, setExercises] = useState([mkEx(), mkEx(), mkEx()])
  const [note,   setNote]   = useState('')
  const [format, setFormat] = useState('a4')

  const updateEx = (id, key, val) => setExercises(p => p.map(e => e.id === id ? {...e, [key]: val} : e))
  const removeEx = (id) => setExercises(p => p.filter(e => e.id !== id))

  const printPDF = () => {
    const html = buildPrescriptionHTML(exercises, patient, doctorName, note, format)
    const w = window.open('', '_blank', 'width=1000,height=1300')
    if (!w) { alert('Allow pop-ups to generate the PDF.'); return }
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 600)
  }

  const sendWA = () => {
    const lines = exercises.filter(e=>e.name.trim()).map((e,i)=>`${i+1}. ${e.name} — ${e.sets} sets × ${e.reps} (${e.frequency})`)
    const msg = `Hi ${patient.name}! 👋\n\nHere's your exercise plan from Dr. ${doctorName} at PhysioDrishti 🌿\n\n${lines.join('\n')}${note?`\n\nNote: ${note}`:''}\n\nDo these daily and WhatsApp us if anything hurts. See you at your next session! 💪`
    openWhatsApp(patient.phone, msg)
  }

  const preview = (
    <div style={{ background:'#fff', borderRadius:8, overflow:'hidden', boxShadow:'0 2px 14px rgba(0,0,0,.1)', fontSize:11 }}>
      <div style={{ background:C.forest, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>🌿</div>
        <div style={{ flex:1 }}>
          <div className="pd" style={{ fontSize:11, fontWeight:900, color:'#fff' }}>PhysioDrishti</div>
          <div className="pj" style={{ fontSize:8, color:'rgba(255,255,255,.6)' }}>Dr. {doctorName}</div>
        </div>
        <div style={{ background:C.saffron, color:'#fff', padding:'2px 7px', borderRadius:4, fontSize:7, fontWeight:800 }}>Exercise Rx</div>
      </div>
      <div style={{ background:C.light, padding:'7px 12px', display:'flex', gap:14, borderBottom:`1px solid ${C.border}` }}>
        <div><div className="pj" style={{ fontSize:7, color:C.gray, fontWeight:700, textTransform:'uppercase' }}>Patient</div><div className="pj" style={{ fontSize:10, fontWeight:700 }}>{patient.name}</div></div>
        <div><div className="pj" style={{ fontSize:7, color:C.gray, fontWeight:700, textTransform:'uppercase' }}>Condition</div><div className="pj" style={{ fontSize:10, fontWeight:700 }}>{patient.pain||'General'}</div></div>
      </div>
      <div style={{ padding:'10px 12px' }}>
        <div className="pj" style={{ fontSize:7, fontWeight:800, color:C.teal, textTransform:'uppercase', letterSpacing:1, marginBottom:7 }}>Exercise Plan</div>
        {exercises.filter(e=>e.name.trim()).length===0
          ? <div className="pj" style={{ fontSize:9, color:C.gray, fontStyle:'italic' }}>Add exercises on the left →</div>
          : exercises.filter(e=>e.name.trim()).map((ex,i) => (
            <div key={ex.id} style={{ display:'flex', gap:7, marginBottom:7, paddingBottom:7, borderBottom:`1px solid ${C.border}` }}>
              <div style={{ width:16, height:16, borderRadius:'50%', background:C.forest, color:'#fff', fontSize:8, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{i+1}</div>
              <div>
                <div className="pj" style={{ fontSize:10, fontWeight:800 }}>{ex.name}</div>
                <div className="pj" style={{ fontSize:8, color:C.saffron, fontWeight:700 }}>{ex.sets}×{ex.reps} · {ex.frequency}</div>
                {ex.instructions && <div className="pj" style={{ fontSize:8, color:C.gray, lineHeight:1.4 }}>{ex.instructions}</div>}
              </div>
            </div>
          ))
        }
        {note && <div style={{ background:'#FFF8EF', borderLeft:`3px solid ${C.saffron}`, padding:'6px 8px', borderRadius:'0 5px 5px 0', marginTop:6 }}>
          <div className="pj" style={{ fontSize:7, fontWeight:800, color:C.saffron, marginBottom:2 }}>DOCTOR'S NOTES</div>
          <div className="pj" style={{ fontSize:8, color:C.ink, lineHeight:1.4 }}>{note}</div>
        </div>}
      </div>
      <div style={{ background:C.forest, padding:'8px 12px', display:'flex', justifyContent:'space-between' }}>
        <div className="pj" style={{ fontSize:8, fontWeight:700, color:'#fff' }}>PhysioDrishti</div>
        <div className="pj" style={{ fontSize:7, color:'rgba(255,255,255,.5)' }}>physiodrishti.in</div>
      </div>
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:950, display:'flex', alignItems:'center', justifyContent:'center', padding:12 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:880, maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,.3)' }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ background:C.forest, padding:'14px 22px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <div className="pj" style={{ fontSize:10, color:'rgba(255,255,255,.55)', textTransform:'uppercase', letterSpacing:2 }}>Exercise Prescription</div>
            <div className="pd" style={{ fontSize:'1.1rem', fontWeight:900, color:'#fff' }}>{patient.name} · {patient.pain||'General'}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {[['💬 WhatsApp','#25D366',sendWA],['📄 Print PDF',C.saffron,printPDF],['✕','rgba(255,255,255,.2)',onClose]].map(([l,bg,fn])=>(
              <button key={l} onClick={fn} style={{ background:bg, border:'none', borderRadius:7, padding:'8px 14px', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif' }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          {/* Form */}
          <div style={{ flex:1, overflowY:'auto', padding:22, borderRight:`1px solid ${C.border}` }}>
            {/* Format toggle */}
            <div style={{ display:'flex', gap:8, marginBottom:18 }}>
              {[['a4','📄 A4 Print'],['instagram','📱 Square Card']].map(([f,l])=>(
                <button key={f} onClick={()=>setFormat(f)} className="pj" style={{ flex:1, padding:'7px 0', border:`1.5px solid ${format===f?C.forest:C.border}`, borderRadius:7, background:format===f?C.forest:'#fff', color:format===f?'#fff':C.gray, fontSize:12, fontWeight:700, cursor:'pointer' }}>{l}</button>
              ))}
            </div>

            {exercises.map((ex, i) => (
              <div key={ex.id} style={{ background:C.light, borderRadius:10, padding:14, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span className="pj" style={{ fontSize:10, fontWeight:800, color:C.teal, textTransform:'uppercase', letterSpacing:1 }}>Exercise {i+1}</span>
                  {exercises.length > 1 && <button onClick={()=>removeEx(ex.id)} style={{ background:'none', border:'none', cursor:'pointer', color:C.gray, fontSize:13 }}>✕</button>}
                </div>
                <input className="field-d" placeholder="Exercise name (e.g. Bridge Exercise)" value={ex.name} onChange={e=>updateEx(ex.id,'name',e.target.value)} style={{ marginBottom:8 }}/>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
                  {[['Sets','sets'],['Reps / Time','reps']].map(([label,key])=>(
                    <div key={key}>
                      <label className="pj" style={{ fontSize:10, fontWeight:700, color:C.gray, display:'block', marginBottom:4 }}>{label}</label>
                      <input className="field-d" value={ex[key]} onChange={e=>updateEx(ex.id,key,e.target.value)} style={{ textAlign:'center' }}/>
                    </div>
                  ))}
                  <div>
                    <label className="pj" style={{ fontSize:10, fontWeight:700, color:C.gray, display:'block', marginBottom:4 }}>Frequency</label>
                    <select className="field-d" value={ex.frequency} onChange={e=>updateEx(ex.id,'frequency',e.target.value)}>
                      {['Daily','Twice daily','3× week','Every other day','Twice weekly'].map(f=><option key={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
                <textarea className="field-d" placeholder="Instructions / cues…" rows={2} value={ex.instructions} onChange={e=>updateEx(ex.id,'instructions',e.target.value)} style={{ resize:'none' }}/>
              </div>
            ))}

            <button onClick={()=>setExercises(p=>[...p,mkEx()])} className="btn-soft" style={{ width:'100%', padding:10, marginBottom:14 }}>+ Add exercise</button>

            <div>
              <label className="pj" style={{ fontSize:12, fontWeight:700, color:C.teal, display:'block', marginBottom:6 }}>Doctor's note <span style={{ fontWeight:400, color:C.gray }}>(optional)</span></label>
              <textarea className="field-d" rows={3} placeholder="Precautions, timeline, specific advice…" value={note} onChange={e=>setNote(e.target.value)} style={{ resize:'none' }}/>
            </div>
          </div>

          {/* Preview */}
          <div style={{ width:300, flexShrink:0, overflowY:'auto', padding:16, background:'#F7F9FC' }}>
            <div className="pj" style={{ fontSize:10, fontWeight:800, color:C.gray, textTransform:'uppercase', letterSpacing:2, marginBottom:12 }}>Live preview</div>
            {preview}
            <div className="pj" style={{ fontSize:10, color:C.gray, marginTop:10, lineHeight:1.6, textAlign:'center' }}>
              "Print PDF" opens a print-ready page → Save as PDF → Share on WhatsApp
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Weekly calendar view ───────────────────────────────────────── */
function WeeklyCalendar({ sessions, onSchedule, onJoinSession, patients, doctorName, meetLink, onPrescribe }) {
  const getMonday = (d) => {
    const dt = new Date(d); dt.setHours(0,0,0,0)
    const day = dt.getDay()
    dt.setDate(dt.getDate() - (day === 0 ? 6 : day - 1))
    return dt
  }
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))

  const HOUR_START = 8
  const HOUR_END   = 20
  const HOUR_H     = 72  // px per hour
  const GRID_H     = (HOUR_END - HOUR_START) * HOUR_H

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d
  })

  const todayISO = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })()

  const dayISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  const parseTime = (str = '') => {
    const m = str.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!m) return { hour: HOUR_START, min: 0 }
    let h = parseInt(m[1]); const min = parseInt(m[2]); const p = m[3].toUpperCase()
    if (p === 'PM' && h !== 12) h += 12
    if (p === 'AM' && h === 12) h = 0
    return { hour: h, min }
  }
  const parseDurMins = (str = '30 min') => parseInt(str.match(/\d+/)?.[0] || 30)

  const sessionsForDay = (iso) => sessions.filter(s => (s.date || todayISO) === iso)

  const label = `${weekStart.toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – ${weekDays[6].toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`

  const shiftWeek = (n) => { const d = new Date(weekStart); d.setDate(d.getDate() + n * 7); setWeekStart(d) }

  const handleGridClick = (e, iso) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const h = Math.min(Math.floor(y / HOUR_H) + HOUR_START, HOUR_END - 1)
    const m = Math.round(((y % HOUR_H) / HOUR_H) * 2) * 30
    const min = m >= 60 ? 0 : m
    onSchedule(iso, `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`)
  }

  const hourLabels = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => i + HOUR_START)

  return (
    <div>
      {/* Controls */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={()=>shiftWeek(-1)} className="btn-soft" style={{ padding:'5px 11px', fontSize:17, lineHeight:1 }}>‹</button>
          <span className="pj" style={{ fontSize:13, fontWeight:700, color:C.ink }}>{label}</span>
          <button onClick={()=>shiftWeek(1)}  className="btn-soft" style={{ padding:'5px 11px', fontSize:17, lineHeight:1 }}>›</button>
          <button onClick={()=>setWeekStart(getMonday(new Date()))} className="btn-soft" style={{ fontSize:11, padding:'5px 10px' }}>Today</button>
        </div>
        <button className="btn-o" onClick={()=>onSchedule(null, null)}>+ Schedule session</button>
      </div>

      {/* Grid */}
      <div className="card-d" style={{ overflow:'auto' }}>
        <div style={{ display:'flex', minWidth:680 }}>

          {/* Time column */}
          <div style={{ width:50, flexShrink:0 }}>
            <div style={{ height:46, borderBottom:`1px solid ${C.border}` }}/>
            <div style={{ position:'relative', height:GRID_H }}>
              {hourLabels.map((h, i) => (
                <div key={h} style={{ position:'absolute', top: i * HOUR_H - 9, left:0, right:0, paddingRight:8, textAlign:'right', pointerEvents:'none' }}>
                  <span className="pj" style={{ fontSize:9.5, color:C.gray, fontWeight:600 }}>
                    {h === 12 ? '12 pm' : h < 12 ? `${h} am` : `${h-12} pm`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const iso = dayISO(day)
            const isToday = iso === todayISO
            const daySessions = sessionsForDay(iso)

            return (
              <div key={iso} style={{ flex:1, minWidth:84, borderLeft:`1px solid ${C.border}` }}>
                {/* Day header */}
                <div style={{ height:46, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderBottom:`1px solid ${C.border}`, background: isToday ? C.greenLight : 'transparent' }}>
                  <span className="pj" style={{ fontSize:9, fontWeight:700, color: isToday ? C.teal : C.gray, textTransform:'uppercase', letterSpacing:.5 }}>
                    {day.toLocaleDateString('en-IN',{weekday:'short'})}
                  </span>
                  <div style={{ width:24, height:24, borderRadius:'50%', background: isToday ? C.forest : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', marginTop:1 }}>
                    <span className="pj" style={{ fontSize:12, fontWeight:800, color: isToday ? '#fff' : C.ink }}>{day.getDate()}</span>
                  </div>
                </div>

                {/* Grid body */}
                <div
                  style={{ position:'relative', height:GRID_H, background: isToday ? 'rgba(237,247,242,.25)' : 'transparent', cursor:'cell' }}
                  onClick={e => handleGridClick(e, iso)}
                >
                  {/* Grid lines */}
                  {hourLabels.map((h, i) => (
                    <div key={h}>
                      <div style={{ position:'absolute', top: i * HOUR_H, left:0, right:0, borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}/>
                      {i < hourLabels.length - 1 && (
                        <div style={{ position:'absolute', top: i * HOUR_H + HOUR_H/2, left:0, right:0, borderTop:`1px dashed rgba(221,228,239,.6)` }}/>
                      )}
                    </div>
                  ))}

                  {/* Session cards */}
                  {daySessions.map(s => {
                    const { hour, min } = parseTime(s.time)
                    const durMins = parseDurMins(s.duration)
                    const top    = (hour - HOUR_START) * HOUR_H + (min / 60) * HOUR_H
                    const height = Math.max((durMins / 60) * HOUR_H, 40)
                    const isLive = s.status === 'live'
                    const pt = patients.find(p => p.name === s.name)

                    return (
                      <div key={s.id} onClick={e => e.stopPropagation()} style={{
                        position:'absolute', left:3, right:3, top, height,
                        borderRadius:6, padding:'4px 7px', overflow:'hidden',
                        background: isLive ? `linear-gradient(135deg,${C.saffron},#BF4610)` : C.forest,
                        boxShadow: isLive ? '0 2px 10px rgba(212,81,14,.4)' : '0 1px 5px rgba(0,0,0,.18)',
                        cursor:'default', display:'flex', flexDirection:'column',
                      }}>
                        {isLive && (
                          <div style={{ display:'flex', alignItems:'center', gap:3, marginBottom:2 }}>
                            <div style={{ width:5, height:5, borderRadius:'50%', background:'#fff', animation:'blink 1s infinite' }}/>
                            <span className="pj" style={{ fontSize:8, color:'rgba(255,255,255,.85)', fontWeight:700 }}>LIVE</span>
                          </div>
                        )}
                        <div className="pj" style={{ fontSize:10, fontWeight:800, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                        {height >= 54 && (
                          <div className="pj" style={{ fontSize:8.5, color:'rgba(255,255,255,.65)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.time} · {s.duration}</div>
                        )}
                        {height >= 66 && (
                          <div style={{ display:'flex', gap:3, marginTop:'auto' }}>
                            <button onClick={()=>onJoinSession(s)} style={{ flex:1, background:'rgba(255,255,255,.2)', border:'none', borderRadius:3, padding:'2px 0', fontSize:8, color:'#fff', cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700 }}>
                              {isLive ? '▶ Join' : '▶ Start'}
                            </button>
                            {onPrescribe && (
                              <button onClick={()=>onPrescribe({ name:s.name, phone:pt?.phone||'', pain:s.pain })} style={{ background:'rgba(255,255,255,.2)', border:'none', borderRadius:3, padding:'2px 5px', fontSize:8, color:'#fff', cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700 }}>Rx</button>
                            )}
                            <button onClick={()=>openWhatsApp(pt?.phone||'', bookingConfirmMsg(s, doctorName, meetLink))} style={{ background:'rgba(37,211,102,.3)', border:'none', borderRadius:3, padding:'2px 5px', fontSize:8, color:'#fff', cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700 }}>WA</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:16, marginTop:10, alignItems:'center', flexWrap:'wrap' }}>
        {[[C.saffron,'Live now'],[C.forest,'Upcoming']].map(([col,lbl])=>(
          <div key={lbl} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:col }}/>
            <span className="pj" style={{ fontSize:11, color:C.gray }}>{lbl}</span>
          </div>
        ))}
        <span className="pj" style={{ fontSize:11, color:C.gray, marginLeft:'auto' }}>Click any empty slot to schedule · "Rx" to prescribe exercises</span>
      </div>
    </div>
  )
}

/* ─── Pain score sparkline (pure SVG) ───────────────────────────── */
function PainSparkline({ logs }) {
  if (!logs || logs.length < 2) return null
  const W = 220, H = 52
  const scores = logs.map(l => l.score)
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * W
    const y = H - (s / 10) * H
    return `${x},${y}`
  }).join(' ')
  const latest = scores[scores.length - 1]
  const first  = scores[0]
  const improving = latest < first
  return (
    <div style={{ background:'#F3F6FA', borderRadius:8, padding:'10px 14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span className="pj" style={{ fontSize:10, fontWeight:800, letterSpacing:1, textTransform:'uppercase', color:C.gray }}>Pain trend</span>
        <span className="pj" style={{ fontSize:11, fontWeight:700, color: improving ? C.green : C.red }}>
          {improving ? `▼ ${first - latest} pts better` : first === latest ? '━ Same' : `▲ ${latest - first} pts worse`}
        </span>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
        <polyline points={pts} fill="none" stroke={improving ? '#3A9A6B' : '#D4510E'} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/>
        {scores.map((s, i) => (
          <circle key={i}
            cx={(i / (scores.length - 1)) * W}
            cy={H - (s / 10) * H}
            r={4} fill={improving ? '#3A9A6B' : '#D4510E'} stroke="#fff" strokeWidth={1.5}/>
        ))}
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
        <span className="pj" style={{ fontSize:9, color:C.gray }}>Session 1</span>
        <span className="pj" style={{ fontSize:9, color:C.gray }}>Latest (pain {latest}/10)</span>
      </div>
    </div>
  )
}

/* ─── Progress log modal ─────────────────────────────────────────── */
function ProgressModal({ patient, onClose, onSave }) {
  const [score, setScore] = useState(5)
  const [notes, setNotes] = useState('')

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:900, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:400, padding:28 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div className="pj" style={{ fontSize:12, fontWeight:800, color:C.saffron, textTransform:'uppercase', letterSpacing:1 }}>Log session</div>
            <div className="pd" style={{ fontSize:'1.1rem', fontWeight:900, color:C.forest }}>{patient.name}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:C.gray }}>✕</button>
        </div>

        <div style={{ marginBottom:20 }}>
          <label className="pj" style={{ fontSize:12, fontWeight:700, color:C.teal, display:'block', marginBottom:10 }}>
            Pain score today: <strong style={{ color:C.ink, fontSize:16 }}>{score}/10</strong>
            <span className="pj" style={{ fontSize:11, color:C.gray, marginLeft:8 }}>
              {score<=2?'Almost none':score<=4?'Mild':score<=6?'Moderate':score<=8?'Significant':'Severe'}
            </span>
          </label>
          <input type="range" min={0} max={10} step={1} value={score} onChange={e=>setScore(Number(e.target.value))}
            style={{ width:'100%', accentColor:score<=4?C.mint:score<=7?C.amber:C.red, cursor:'pointer' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
            <span className="pj" style={{ fontSize:9, color:C.gray }}>No pain (0)</span>
            <span className="pj" style={{ fontSize:9, color:C.gray }}>Worst (10)</span>
          </div>
        </div>

        <div style={{ marginBottom:22 }}>
          <label className="pj" style={{ fontSize:12, fontWeight:700, color:C.teal, display:'block', marginBottom:6 }}>Session notes</label>
          <textarea className="field-d" rows={3} placeholder="Observations, exercises done, patient feedback…"
            value={notes} onChange={e=>setNotes(e.target.value)}
            style={{ resize:'none', lineHeight:1.55 }}/>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-g" style={{ flex:1 }} onClick={()=>onSave({ score, notes, date: new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) })}>
            Save log
          </button>
          <button onClick={onClose} className="btn-soft" style={{ flex:1 }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Video Call ─────────────────────────────────────────────────── */
function VideoCall({ session, onClose, wherebyLink, onLogProgress }) {
  const [muted, setMuted]   = useState(false)
  const [cam, setCam]       = useState(true)
  const [t, setT]           = useState(0)
  const [notes, setNotes]   = useState('')
  const [exDone, setExDone] = useState([])
  const [logDone, setLogDone] = useState(false)
  const exercises = ['Gentle knee bends','Leg raises','Seated marching','Calf stretches']
  useEffect(() => { const i = setInterval(() => setT(p=>p+1), 1000); return () => clearInterval(i) }, [])
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const handleEnd = () => {
    if (onLogProgress && !logDone) onLogProgress(notes)
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.88)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}>
      <div style={{ background:'#1A1F2E', borderRadius:16, width:'100%', maxWidth:820, overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.6)' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:9, height:9, borderRadius:'50%', background:'#22C55E', animation:'blink 1.5s infinite' }}/>
            <span className="pj" style={{ fontSize:13, color:'#fff', fontWeight:700 }}>Session with {session.name} · {fmt(t)}</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {wherebyLink && (
              <a href={wherebyLink} target="_blank" rel="noreferrer"
                style={{ background:'rgba(255,255,255,.12)', border:'none', borderRadius:6, padding:'5px 12px', color:'rgba(255,255,255,.75)', cursor:'pointer', fontSize:12, textDecoration:'none', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
                ↗ Open Whereby
              </a>
            )}
            <button onClick={handleEnd} style={{ background:'rgba(255,255,255,.12)', border:'none', borderRadius:6, padding:'5px 12px', color:'rgba(255,255,255,.75)', cursor:'pointer', fontSize:12 }}>✕ End</button>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 240px', gap:10, padding:12 }}>
          {/* Video area — real Whereby embed or mock */}
          <div style={{ background:'#111', borderRadius:10, position:'relative', aspectRatio:'16/9', overflow:'hidden' }}>
            {wherebyLink ? (
              <iframe
                src={`${wherebyLink}?skipMediaPermissionPrompt&background=off`}
                allow="camera; microphone; fullscreen; speaker; display-capture"
                style={{ width:'100%', height:'100%', border:'none' }}
                title={`Session with ${session.name}`}
              />
            ) : (
              <>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#1A3A2A,#0D2018)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:48, marginBottom:8 }}>{cam ? '👩‍⚕️' : '👤'}</div>
                    <div className="pj" style={{ fontSize:12, color:'rgba(255,255,255,.65)' }}>{session.name} · {session.area}</div>
                  </div>
                  <div style={{ background:'rgba(255,255,255,.1)', borderRadius:8, padding:'8px 16px', marginTop:4 }}>
                    <div className="pj" style={{ fontSize:11, color:'rgba(255,255,255,.5)', textAlign:'center' }}>Add your Whereby room URL in Settings to enable real video</div>
                  </div>
                </div>
                <div style={{ position:'absolute', bottom:10, right:10, width:90, height:65, background:'#0D2E1F', borderRadius:6, border:'2px solid rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ textAlign:'center' }}><div style={{ fontSize:18 }}>🩺</div><div className="pj" style={{ fontSize:8, color:'rgba(255,255,255,.5)' }}>Dr. Priya Menon</div></div>
                </div>
                <div style={{ position:'absolute', top:10, left:10, background:'rgba(0,0,0,.5)', borderRadius:5, padding:'3px 8px', fontSize:12, color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif' }}>{fmt(t)}</div>
              </>
            )}
          </div>

          {/* Right panel */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ background:'rgba(255,255,255,.06)', borderRadius:8, padding:12 }}>
              <div className="pj" style={{ fontSize:10, fontWeight:800, letterSpacing:2, color:'rgba(255,255,255,.4)', textTransform:'uppercase', marginBottom:8 }}>Today's plan</div>
              {exercises.map(ex=>(
                <div key={ex} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                  <div onClick={()=>setExDone(p=>p.includes(ex)?p.filter(e=>e!==ex):[...p,ex])} style={{ width:14, height:14, borderRadius:3, border:`1.5px solid ${exDone.includes(ex)?'#72D4A8':'rgba(255,255,255,.3)'}`, background:exDone.includes(ex)?'#72D4A8':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {exDone.includes(ex) && <span style={{ color:'#fff', fontSize:9 }}>✓</span>}
                  </div>
                  <span className="pj" style={{ fontSize:11, color:'rgba(255,255,255,.7)', textDecoration:exDone.includes(ex)?'line-through':'none' }}>{ex}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'rgba(255,255,255,.06)', borderRadius:8, padding:12, flex:1 }}>
              <div className="pj" style={{ fontSize:10, fontWeight:800, letterSpacing:2, color:'rgba(255,255,255,.4)', textTransform:'uppercase', marginBottom:6 }}>Session notes</div>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Note down observations…"
                style={{ width:'100%', minHeight:80, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.1)', borderRadius:6, padding:'7px 9px', fontSize:11, color:'rgba(255,255,255,.85)', resize:'none', outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', lineHeight:1.5 }} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,.1)' }}>
          {[
            [muted?'🔇':'🎤', ()=>setMuted(p=>!p), muted],
            [cam?'📹':'📷', ()=>setCam(p=>!p), !cam],
            ['💬', ()=>{}, false],
          ].map(([icon, fn, active], i)=>(
            <button key={i} onClick={fn} style={{ width:42, height:42, borderRadius:'50%', border:'none', cursor:'pointer', fontSize:18, background:active?'rgba(185,50,50,.8)':'rgba(255,255,255,.12)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}>{icon}</button>
          ))}
          {onLogProgress && (
            <button onClick={()=>{setLogDone(true);onLogProgress(notes)}} style={{ background:'rgba(58,154,107,.8)', border:'none', borderRadius:20, padding:'9px 16px', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif' }}>📋 Log progress</button>
          )}
          <button onClick={handleEnd} style={{ background:'#C02020', border:'none', borderRadius:20, padding:'9px 22px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif' }}>End session</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Add Patient / Schedule Modal ──────────────────────────────── */
function PatientModal({ mode, prefill, onClose, onSave }) {
  const isSchedule = mode === 'schedule'
  const [f, setF] = useState({
    name: prefill?.name || '',
    phone: prefill?.phone || '',
    area: prefill?.area || '',
    pain: prefill?.pain || '',
    note: prefill?.note || '',
    date: prefill?.date || '',
    time: prefill?.time || '',
    sessionType: 'Video',
  })
  const set = (k,v) => setF(p=>({...p,[k]:v}))
  const canSave = f.name && f.phone && (isSchedule ? (f.date && f.time) : f.area)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:800, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:460, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:'#12382A', padding:'18px 22px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div className="pd" style={{ fontSize:'1.1rem', fontWeight:900, color:'#fff' }}>{isSchedule ? '📅 Schedule a session' : '➕ Add a patient'}</div>
            <div className="pj" style={{ fontSize:12, color:'rgba(255,255,255,.55)', marginTop:2 }}>{isSchedule ? 'Book a video or in-person session' : 'Add a new patient to your list'}</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', color:'#fff', fontSize:15 }}>✕</button>
        </div>

        <div style={{ padding:'22px 24px' }}>
          {[['Patient name','name','text','e.g. Rahul Sharma'],['Phone number','phone','tel','e.g. 98XXXXXXXX']].map(([l,k,t,ph])=>(
            <div key={k} style={{ marginBottom:14 }}>
              <label className="pj" style={{ fontSize:12, fontWeight:700, color:'#0A6B5E', display:'block', marginBottom:5 }}>{l}</label>
              <input className="field-d" type={t} placeholder={ph} value={f[k]} onChange={e=>set(k,e.target.value)} />
            </div>
          ))}

          {!isSchedule && (
            <div style={{ marginBottom:14 }}>
              <label className="pj" style={{ fontSize:12, fontWeight:700, color:'#0A6B5E', display:'block', marginBottom:5 }}>Area in Bengaluru</label>
              <select className="field-d" value={f.area} onChange={e=>set('area',e.target.value)} style={{ appearance:'none' }}>
                <option value="">Pick area</option>
                {AREAS.map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
          )}

          <div style={{ marginBottom:14 }}>
            <label className="pj" style={{ fontSize:12, fontWeight:700, color:'#0A6B5E', display:'block', marginBottom:6 }}>Where does it hurt?</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {PAIN_OPTIONS.map(p=>(
                <button key={p} onClick={()=>set('pain',p)}
                  style={{ padding:'6px 12px', border:`1.5px solid ${f.pain===p?'#12382A':'#DDE4EF'}`, borderRadius:20, background:f.pain===p?'#12382A':'#fff', color:f.pain===p?'#fff':'#5C6878', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', transition:'all .15s' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {isSchedule && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label className="pj" style={{ fontSize:12, fontWeight:700, color:'#0A6B5E', display:'block', marginBottom:5 }}>Date</label>
                <input className="field-d" type="date" value={f.date} onChange={e=>set('date',e.target.value)} />
              </div>
              <div>
                <label className="pj" style={{ fontSize:12, fontWeight:700, color:'#0A6B5E', display:'block', marginBottom:5 }}>Time</label>
                <input className="field-d" type="time" value={f.time} onChange={e=>set('time',e.target.value)} />
              </div>
            </div>
          )}

          {isSchedule && (
            <div style={{ marginBottom:14 }}>
              <label className="pj" style={{ fontSize:12, fontWeight:700, color:'#0A6B5E', display:'block', marginBottom:6 }}>Session type</label>
              <div style={{ display:'flex', gap:8 }}>
                {['Video','In-person','Home visit'].map(type=>(
                  <button key={type} onClick={()=>set('sessionType',type)}
                    style={{ padding:'7px 14px', border:`1.5px solid ${f.sessionType===type?'#12382A':'#DDE4EF'}`, borderRadius:7, background:f.sessionType===type?'#12382A':'#fff', color:f.sessionType===type?'#fff':'#5C6878', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', flex:1, transition:'all .15s' }}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom:20 }}>
            <label className="pj" style={{ fontSize:12, fontWeight:700, color:'#0A6B5E', display:'block', marginBottom:5 }}>
              Notes <span style={{ fontWeight:400, color:'#5C6878' }}>(optional)</span>
            </label>
            <textarea className="field-d" placeholder="Any extra info about the patient or session…" value={f.note} onChange={e=>set('note',e.target.value)} style={{ minHeight:60, resize:'none', lineHeight:1.5 }} />
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} className="btn-soft" style={{ flex:'0 0 90px' }}>Cancel</button>
            <button onClick={()=>canSave&&onSave(f)} className="btn-g" style={{ flex:1, opacity:canSave?1:.5 }}>
              {isSchedule ? 'Schedule session' : 'Add patient'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Logo Image (from /public/logo.png) ────────────────────────── */
function LogoImg({ size = 40 }) {
  return (
    <img
      src="/logo.png"
      alt="PhysioDrishti"
      style={{ height: size, width: 'auto', maxWidth: size * 2.5, objectFit: 'contain', flexShrink: 0 }}
      onError={e => {
        e.target.style.display = 'none'
        e.target.parentNode.innerHTML = '<div style="height:' + size + 'px;padding:0 10px;background:#12382A;borderRadius:7px;display:flex;alignItems:center;justifyContent:center;color:#fff;fontWeight:700;fontSize:' + Math.round(size*0.4) + 'px">PD</div>'
      }}
    />
  )
}


/* ─── Dashboard ──────────────────────────────────────────────────── */
export default function Dashboard({ onGoToLanding, onLogout, mapplsKey, setMapplsKey }) {
  const [tab, setTab]             = useState('overview')
  const [patients, setPatients]   = useState(INITIAL_PATIENTS)
  const [notif, setNotif]         = useState(0)

  // ── Fetch patients (leads) from Supabase ──────────────────────
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (data && data.length > 0) {
          const newOnes = data.filter(b => b.stage === 'new').length
          setNotif(newOnes)
          setPatients(data.map(b => ({
            id:         b.id,
            name:       b.name       || '',
            phone:      b.phone      || '',
            area:       b.area       || '',
            pain:       b.pain       || '',
            note:       b.note       || '',
            stage:      b.stage      || 'new',
            priority:   b.priority   || 'medium',
            created_at: b.created_at || null,
            time:       b.created_at
              ? new Date(b.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) + ', ' +
                new Date(b.created_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
              : 'Just now',
          })))
        }
      } catch (err) {
        console.error('Supabase fetch error:', err)
      }
    }
    fetchLeads()
    const interval = setInterval(fetchLeads, 30000)
    return () => clearInterval(interval)
  }, [])
  const [sessions, setSessions]   = useState(SESSIONS_TODAY)
  const [sideOpen, setSideOpen]   = useState(false)
  const [liveSession, setLiveSession] = useState(null)
  const [modal, setModal]         = useState(null)  // null | { mode:'add'|'schedule', prefill? }
  const [selected, setSelected]   = useState(null)  // selected patient
  const [w, setW]                 = useState(window.innerWidth)
  const [kwFilter, setKwFilter]   = useState('all')
  const [meetLink,    setMeetLink]    = useState(() => localStorage.getItem('pd_meet_link')    || DEFAULT_MEET_LINK)
  const [wherebyLink, setWherebyLink] = useState(() => localStorage.getItem('pd_whereby_link') || '')
  const [doctorName,  setDoctorName]  = useState(() => localStorage.getItem('pd_doctor_name')  || 'Priya Menon')
  const [followUps,   setFollowUps]   = useState(() => { try { return JSON.parse(localStorage.getItem('pd_follow_ups') || '[]') } catch { return [] } })
  const [progress,    setProgress]    = useState(() => { try { return JSON.parse(localStorage.getItem('pd_progress')   || '{}') } catch { return {} } })
  const [progressModal, setProgressModal] = useState(null)  // patient object when open
  const [exerciseModal, setExerciseModal] = useState(null)  // patient object when open
  const [seoData,    setSeoData]    = useState(null)   // { configured, gsc, ga4, error }
  const [seoLoading, setSeoLoading] = useState(false)

  useEffect(() => { localStorage.setItem('pd_follow_ups', JSON.stringify(followUps)) }, [followUps])
  useEffect(() => { localStorage.setItem('pd_progress',   JSON.stringify(progress))  }, [progress])

  // Fetch live GSC + GA4 data when rankings tab is opened
  useEffect(() => {
    if (tab !== 'rankings' || seoData !== null) return
    setSeoLoading(true)
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => setSeoData(d))
      .catch(() => setSeoData({ configured: false, fetchFailed: true }))
      .finally(() => setSeoLoading(false))
  }, [tab, seoData])

  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = CSS
    document.head.appendChild(el)
    return () => { try { document.head.removeChild(el) } catch {} }
  }, [])

  const mob = w < 768
  const showLabel = w >= 1024

  const advance = (id) => setPatients(p => p.map(pt => {
    if (pt.id !== id) return pt
    const idx = STAGES.indexOf(pt.stage)
    return idx < STAGES.length - 1 ? { ...pt, stage: STAGES[idx + 1] } : pt
  }))

  const addPatient = (form) => {
    const now = new Date()
    const stamp = `${now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}, ${now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`
    const newP = { id: Date.now(), name:form.name, phone:form.phone, area:form.area, pain:form.pain, stage:'new', note:form.note, time:stamp, priority:'medium' }
    setPatients(p => [newP, ...p])
    setModal(null)
  }

  const scheduleSession = (form) => {
    let timeStr = '12:00 PM'
    if (form.time) {
      const [hh, mm] = form.time.split(':').map(Number)
      const period = hh >= 12 ? 'PM' : 'AM'
      const h = hh % 12 || 12
      timeStr = `${h}:${String(mm).padStart(2,'0')} ${period}`
    }
    const date = form.date || new Date().toISOString().split('T')[0]
    const newS = { id:Date.now(), name:form.name, pain:form.pain||'General session', time:timeStr, date, status:'upcoming', duration:'45 min', area:form.area||'Bengaluru', type:form.sessionType }
    setSessions(p => [newS, ...p])
    setModal(null)
  }

  const stageCount = (s) => patients.filter(p => p.stage === s).length
  const navItems = [
    { id:'overview',  icon:'🏠', label:'Overview'        },
    { id:'patients',  icon:'👥', label:'Patients'        },
    { id:'sessions',  icon:'📱', label:'Sessions'        },
    { id:'rankings',  icon:'🔍', label:'Search Rankings' },
    { id:'settings',  icon:'⚙️', label:'Settings'        },
  ]

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#F3F6FA' }}>

      {mob && sideOpen && <div onClick={()=>setSideOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:199 }}/>}

      {/* ── Sidebar ── */}
      <aside className="sidebar-d" style={{ width:showLabel?216:mob?216:60, background:'#12382A', display:'flex', flexDirection:'column', flexShrink:0, position:mob?'fixed':'sticky', top:0, height:mob?'100vh':'100vh', zIndex:mob?200:10, transform:mob&&!sideOpen?'translateX(-100%)':'translateX(0)', transition:'transform .3s', overflow:'hidden' }}>
        <div style={{ padding:'18px 12px 14px', borderBottom:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <LogoImg size={36}/>
          {(showLabel||(mob&&sideOpen)) && (
            <div>
              <div className="pd" style={{ fontWeight:900, fontSize:14, color:'#fff', whiteSpace:'nowrap' }}>PhysioDrishti</div>
              <div className="pj" style={{ fontSize:8, color:'rgba(255,255,255,.4)', letterSpacing:2 }}>सबका मंगल हो</div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        {(showLabel||(mob&&sideOpen)) && (
          <div style={{ padding:'12px 12px 0' }}>
            <button onClick={()=>{setModal({mode:'schedule'});if(mob)setSideOpen(false)}} style={{ width:'100%', padding:'9px 0', background:'rgba(212,81,14,.85)', border:'none', borderRadius:7, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', marginBottom:8, fontFamily:'Plus Jakarta Sans,sans-serif' }}>
              + Schedule session
            </button>
            <button onClick={()=>{setModal({mode:'add'});if(mob)setSideOpen(false)}} style={{ width:'100%', padding:'9px 0', background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.15)', borderRadius:7, color:'rgba(255,255,255,.8)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
              + Add patient
            </button>
          </div>
        )}

        <div style={{ padding:'8px 8px', flex:1, overflowY:'auto' }}>
          {navItems.map(n=>(
            <button key={n.id} className={`side-btn ${tab===n.id?'on':''}`}
              onClick={()=>{setTab(n.id);if(mob)setSideOpen(false)}}>
              <span style={{ fontSize:17, flexShrink:0 }}>{n.icon}</span>
              {(showLabel||(mob&&sideOpen)) && <span>{n.label}</span>}
            </button>
          ))}
        </div>

        <div style={{ padding:'8px 8px', borderTop:'1px solid rgba(255,255,255,.1)' }}>
          <button className="side-btn" onClick={onGoToLanding}>
            <span style={{ fontSize:17 }}>🌐</span>
            {(showLabel||(mob&&sideOpen)) && <span>Patient site</span>}
          </button>
          {onLogout && (
            <button className="side-btn" onClick={onLogout} style={{ color:'rgba(255,100,100,.75)' }}>
              <span style={{ fontSize:17 }}>🔒</span>
              {(showLabel||(mob&&sideOpen)) && <span>Lock dashboard</span>}
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>

        {/* Topbar */}
        <header style={{ background:'#fff', borderBottom:`1px solid ${C.border}`, padding:'0 18px', height:54, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:50 }}>
          {mob && <button onClick={()=>setSideOpen(p=>!p)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer' }}>☰</button>}
          <div style={{ flex:1 }}>
            <span className="pd" style={{ fontSize:15, fontWeight:800 }}>{navItems.find(n=>n.id===tab)?.icon} {navItems.find(n=>n.id===tab)?.label}</span>
            <span className="pj" style={{ fontSize:11, color:C.gray, marginLeft:8 }}>PhysioDrishti</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {!mob && (
              <>
                <button className="btn-o" style={{ padding:'7px 16px', fontSize:12 }} onClick={()=>setModal({mode:'schedule'})}>+ Schedule session</button>
                <button className="btn-g" style={{ padding:'7px 16px', fontSize:12 }} onClick={()=>setModal({mode:'add'})}>+ Add patient</button>
              </>
            )}
            <div style={{ position:'relative', cursor:'pointer' }} onClick={()=>setNotif(0)}>
              <span style={{ fontSize:19 }}>🔔</span>
              {notif > 0 && <span style={{ position:'absolute', top:-4, right:-4, background:C.red, color:'#fff', borderRadius:'50%', width:15, height:15, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{notif}</span>}
            </div>
            <div style={{ width:30, height:30, background:C.forest, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700, fontFamily:'Plus Jakarta Sans,sans-serif' }}>PM</div>
            {!mob && onLogout && (
              <button onClick={onLogout} className="btn-soft" style={{ fontSize:11, padding:'5px 12px' }} title="Sign out">
                🔒 Lock
              </button>
            )}
          </div>
        </header>

        <main style={{ padding:'20px 18px', flex:1, overflowY:'auto' }}>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="fade-d">
              {/* KPIs */}
              <div className="g4" style={{ display:'grid', gap:14, marginBottom:20 }}>
                {[
                  { label:'New enquiries today', val:'8',   icon:'🔔', col:C.blue,    chg:'+3' },
                  { label:'Sessions today',       val:'5',   icon:'📱', col:C.saffron, chg:'2 live' },
                  { label:'Active patients',       val:'12',  icon:'👥', col:C.teal,   chg:'this week' },
                  { label:'Helped this month',     val:'68',  icon:'✅', col:C.green,  chg:'+14%' },
                ].map(k=>(
                  <div key={k.label} className="card-d" style={{ padding:18, borderLeft:`4px solid ${k.col}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ fontSize:22 }}>{k.icon}</span>
                      <span className="pj" style={{ fontSize:11, fontWeight:700, color:C.green, background:C.greenLight, padding:'2px 8px', borderRadius:20 }}>{k.chg}</span>
                    </div>
                    <div className="pd" style={{ fontSize:'1.6rem', fontWeight:900 }}>{k.val}</div>
                    <div className="pj" style={{ fontSize:12, color:C.gray }}>{k.label}</div>
                  </div>
                ))}
              </div>

              <div className="g2" style={{ display:'grid', gap:18, marginBottom:18 }}>
                {/* Map */}
                <div className="card-d" style={{ padding:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <div>
                      <div className="pj" style={{ fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:C.saffron, marginBottom:3 }}>Patient locations</div>
                      <div className="pd" style={{ fontSize:'1rem', fontWeight:800 }}>Where your patients are</div>
                    </div>
                    {!mapplsKey && <button className="btn-soft" style={{ fontSize:11 }} onClick={()=>setTab('settings')}>Add map key →</button>}
                  </div>
                  <MapplsMap apiKey={mapplsKey} height={300} patients={patients} />
                </div>

                {/* Recent enquiries */}
                <div className="card-d" style={{ padding:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <div>
                      <div className="pj" style={{ fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:C.saffron, marginBottom:3 }}>Just came in</div>
                      <div className="pd" style={{ fontSize:'1rem', fontWeight:800 }}>New enquiries</div>
                    </div>
                    <button className="btn-soft" onClick={()=>setTab('patients')}>See all →</button>
                  </div>
                  {patients.slice(0,7).map(p=>(
                    <div key={p.id} onClick={()=>setSelected(p)} style={{ display:'flex', gap:10, alignItems:'center', padding:'9px 0', borderBottom:`1px solid ${C.border}`, cursor:'pointer' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#F3F6FA'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:C.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:C.green, flexShrink:0, fontFamily:'Plus Jakarta Sans,sans-serif' }}>
                        {p.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="pj" style={{ fontWeight:700, fontSize:13 }}>{p.name}</div>
                        <div className="pj" style={{ fontSize:11, color:C.gray, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.pain} · {p.area}</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <span style={{ background:`${STAGE_COLOR[p.stage]}18`, color:STAGE_COLOR[p.stage], padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, fontFamily:'Plus Jakarta Sans,sans-serif', display:'inline-block', marginBottom:2 }}>{STAGE_ICON[p.stage]} {STAGE_LABEL[p.stage]}</span>
                        <div className="pj" style={{ fontSize:10, color:C.gray }}>{p.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up reminders */}
              {followUps.filter(f=>!f.sent).length > 0 && (
                <div className="card-d" style={{ padding:18, borderLeft:`4px solid ${C.amber}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <div>
                      <div className="pj" style={{ fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:C.amber, marginBottom:3 }}>Follow-ups</div>
                      <div className="pd" style={{ fontSize:'1rem', fontWeight:800 }}>Pending reminders</div>
                    </div>
                    <span className="pj" style={{ background:'#FFF3EB', color:C.amber, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{followUps.filter(f=>!f.sent).length} due</span>
                  </div>
                  {followUps.filter(f=>!f.sent).map(fu=>(
                    <div key={fu.id} style={{ display:'flex', gap:10, alignItems:'center', padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                      <div style={{ flex:1 }}>
                        <div className="pj" style={{ fontWeight:700, fontSize:13 }}>{fu.name}</div>
                        <div className="pj" style={{ fontSize:11, color:C.gray }}>{fu.pain} · due {fu.dueDate}</div>
                      </div>
                      <button onClick={()=>{
                        const msg = `Hi ${fu.name}! 👋 It's been 3 days since your last session.\n\nHow are you feeling? Is your ${fu.pain.toLowerCase()} getting better?\n\nReady to book your next session? Just reply here and we'll set it up.\n\n– Dr. ${doctorName}, PhysioDrishti 🌿`
                        openWhatsApp(fu.phone, msg)
                        setFollowUps(p=>p.map(f=>f.id===fu.id?{...f,sent:true}:f))
                      }} style={{ background:'#25D366', color:'#fff', border:'none', borderRadius:7, padding:'6px 12px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', flexShrink:0 }}>💬 Send</button>
                      <button onClick={()=>setFollowUps(p=>p.filter(f=>f.id!==fu.id))} className="btn-soft" style={{ padding:'6px 10px', fontSize:11 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Today's sessions */}
              <div className="card-d" style={{ padding:18 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <div>
                    <div className="pj" style={{ fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:C.saffron, marginBottom:3 }}>Today</div>
                    <div className="pd" style={{ fontSize:'1rem', fontWeight:800 }}>Upcoming sessions</div>
                  </div>
                  <button className="btn-o" style={{ fontSize:12, padding:'7px 14px' }} onClick={()=>setModal({mode:'schedule'})}>+ Schedule</button>
                </div>
                <div className="g3" style={{ display:'grid', gap:12 }}>
                  {sessions.slice(0,6).map(s=>(
                    <div key={s.id} className="card-d" style={{ padding:14, border:s.status==='live'?`2px solid ${C.saffron}`:`1px solid ${C.border}` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ background:s.status==='live'?C.saffronLight:'#F0F2F5', color:s.status==='live'?C.saffron:C.gray, padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{s.status==='live'?'🔴 Live now':s.time}</span>
                        <span style={{ background:C.blueLight, color:C.blue, padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{s.type}</span>
                      </div>
                      <div className="pj" style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>{s.name}</div>
                      <div className="pj" style={{ fontSize:11, color:C.gray, marginBottom:10 }}>{s.pain} · {s.duration}</div>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn-o" style={{ flex:1, fontSize:11, padding:'7px 0' }} onClick={()=>setLiveSession(s)}>
                          📹 {s.status==='live'?'Join now':'Join'}
                        </button>
                        <button onClick={()=>openWhatsApp(
                          patients.find(p=>p.name===s.name)?.phone||'',
                          bookingConfirmMsg(s, doctorName, meetLink)
                        )} style={{ flex:1, background:'#25D366', color:'#fff', border:'none', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer', padding:'7px 0', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                          📤 WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PATIENTS ── */}
          {tab === 'patients' && (
            <div className="fade-d">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:10 }}>
                <div>
                  <div className="pj" style={{ fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:C.saffron, marginBottom:3 }}>All patients</div>
                  <div className="pd" style={{ fontSize:'1.2rem', fontWeight:800 }}>Patient pipeline</div>
                </div>
                <button className="btn-g" onClick={()=>setModal({mode:'add'})}>+ Add patient</button>
              </div>

              {/* Kanban */}
              <div className="kanban-wrap" style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:8 }}>
                {STAGES.map(stage=>(
                  <div key={stage} style={{ background:'#fff', borderRadius:10, padding:12, minWidth:190, flex:1, border:`1px solid ${C.border}` }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span>{STAGE_ICON[stage]}</span>
                        <span className="pj" style={{ fontSize:12, fontWeight:700 }}>{STAGE_LABEL[stage]}</span>
                      </div>
                      <span style={{ background:STAGE_COLOR[stage], color:'#fff', borderRadius:'50%', width:19, height:19, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{stageCount(stage)}</span>
                    </div>
                    {patients.filter(p=>p.stage===stage).map(p=>(
                      <div key={p.id} className="kbn-card" onClick={()=>setSelected(p)}>
                        <div className="pj" style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>{p.name}</div>
                        <div className="pj" style={{ fontSize:11, color:C.gray, marginBottom:4 }}>{p.pain}</div>
                        <div className="pj" style={{ fontSize:11, color:C.gray, marginBottom:8 }}>📍 {p.area}</div>
                        <div style={{ display:'flex', gap:4 }}>
                          {STAGES.indexOf(stage) < STAGES.length-1 && (
                            <button onClick={e=>{e.stopPropagation();advance(p.id)}}
                              style={{ flex:1, padding:'5px 0', border:`1px solid ${C.mint}`, borderRadius:5, background:C.greenLight, fontSize:11, cursor:'pointer', color:C.green, fontWeight:700, fontFamily:'Plus Jakarta Sans,sans-serif' }}>
                              Move along →
                            </button>
                          )}
                          <button onClick={e=>{e.stopPropagation();setModal({mode:'schedule',prefill:p})}}
                            style={{ flex:1, padding:'5px 0', border:`1px solid ${C.border}`, borderRadius:5, background:'#fff', fontSize:11, cursor:'pointer', color:C.gray, fontFamily:'Plus Jakarta Sans,sans-serif' }}>
                            📅 Book
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SESSIONS ── */}
          {tab === 'sessions' && (
            <div className="fade-d">
              <WeeklyCalendar
                sessions={sessions}
                onSchedule={(dayISO, timeHHMM) => {
                  const today = new Date().toISOString().split('T')[0]
                  setModal({ mode:'schedule', prefill:{ date: dayISO || today, time: timeHHMM || '' } })
                }}
                onJoinSession={setLiveSession}
                patients={patients}
                doctorName={doctorName}
                meetLink={meetLink}
                onPrescribe={setExerciseModal}
              />
            </div>
          )}

          {/* ── SEARCH RANKINGS ── */}
          {tab === 'rankings' && (
            <div className="fade-d">
              <div style={{ marginBottom:18 }}>
                <div className="pj" style={{ fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:C.saffron, marginBottom:3 }}>Google search</div>
                <div className="pd" style={{ fontSize:'1.2rem', fontWeight:800 }}>How people find you</div>
              </div>

              {/* ── Live GSC + GA4 panel ── */}
              {seoLoading && (
                <div className="card-d" style={{ padding:20, display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                  <div style={{ width:20, height:20, border:`2px solid ${C.border}`, borderTop:`2px solid ${C.teal}`, borderRadius:'50%', animation:'spin .8s linear infinite', flexShrink:0 }}/>
                  <div className="pj" style={{ fontSize:13, color:C.gray }}>Loading live data from Google…</div>
                </div>
              )}

              {!seoLoading && seoData && !seoData.configured && (
                <div className="card-d" style={{ padding:22, marginBottom:18, borderLeft:`4px solid ${C.saffron}` }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                    <span style={{ fontSize:28 }}>📊</span>
                    <div style={{ flex:1 }}>
                      <div className="pj" style={{ fontSize:13, fontWeight:800, marginBottom:6 }}>Connect Google Search Console + Analytics</div>
                      <div className="pj" style={{ fontSize:12, color:C.gray, lineHeight:1.65, marginBottom:14 }}>
                        See exactly which search queries bring visitors, click-through rates, and GA4 traffic — all live inside this dashboard.
                      </div>
                      <div className="pj" style={{ fontSize:11, fontWeight:700, color:C.teal, marginBottom:8 }}>Add these 3 environment variables in Vercel:</div>
                      {[
                        ['GOOGLE_SERVICE_ACCOUNT_KEY', 'Full JSON from Google Cloud service account'],
                        ['GSC_SITE_URL',               'e.g. https://physiodrishti.vercel.app/'],
                        ['GA4_PROPERTY_ID',            'e.g. 123456789 (from GA4 Admin → Property)'],
                      ].map(([k, desc]) => (
                        <div key={k} style={{ marginBottom:8 }}>
                          <code style={{ background:'#F3F6FA', padding:'3px 7px', borderRadius:4, fontSize:11, fontFamily:'monospace', color:C.forest }}>{k}</code>
                          <span className="pj" style={{ fontSize:11, color:C.gray, marginLeft:8 }}>{desc}</span>
                        </div>
                      ))}
                      <div className="pj" style={{ fontSize:11, color:C.gray, marginTop:10, lineHeight:1.6 }}>
                        Setup: Google Cloud Console → Create service account → Enable Search Console API + Analytics Data API → Share property access with the service account email.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!seoLoading && seoData?.configured && seoData?.error && (
                <div className="card-d" style={{ padding:16, marginBottom:18, borderLeft:`4px solid ${C.red||'#E74C3C'}` }}>
                  <div className="pj" style={{ fontSize:12, color:C.gray }}>⚠️ Could not fetch Google data: <code style={{ fontSize:11 }}>{seoData.error}</code></div>
                </div>
              )}

              {!seoLoading && seoData?.configured && seoData?.gsc && seoData?.ga4 && (() => {
                // Flatten GA4 totals
                const ga4Rows = seoData.ga4.rows ?? []
                const totals = ga4Rows.reduce((acc, row) => {
                  const [sessions, users, bounce, views] = row.metricValues.map(m => parseFloat(m.value))
                  return { sessions: acc.sessions + sessions, users: acc.users + users, bounce: acc.bounce + bounce * sessions, views: acc.views + views, count: acc.count + sessions }
                }, { sessions: 0, users: 0, bounce: 0, views: 0, count: 0 })
                const avgBounce = totals.count ? totals.bounce / totals.count : 0

                // GSC totals
                const gscRows = seoData.gsc.rows ?? []
                const gscTotals = gscRows.reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 })
                const avgCTR = gscTotals.impressions ? (gscTotals.clicks / gscTotals.impressions * 100).toFixed(1) : '0.0'

                return (
                  <>
                    {/* KPI row */}
                    <div className="g4" style={{ display:'grid', gap:12, marginBottom:18 }}>
                      {[
                        { label:'Organic Sessions', val: totals.sessions.toFixed(0), icon:'📈', note:'last 28 days' },
                        { label:'Active Users',     val: totals.users.toFixed(0),    icon:'👤', note:'unique visitors' },
                        { label:'Impressions',      val: gscTotals.impressions.toFixed(0), icon:'👁', note:'search appearances' },
                        { label:'Click-through',    val: `${avgCTR}%`,              icon:'🎯', note:'impressions → clicks' },
                      ].map(k => (
                        <div key={k.label} className="card-d" style={{ padding:14 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                            <span style={{ fontSize:18 }}>{k.icon}</span>
                            <div className="pj" style={{ fontSize:11, color:C.gray }}>{k.label}</div>
                          </div>
                          <div className="pd" style={{ fontSize:'1.4rem', fontWeight:900, color:C.ink }}>{k.val}</div>
                          <div className="pj" style={{ fontSize:10, color:C.gray, marginTop:2 }}>{k.note}</div>
                        </div>
                      ))}
                    </div>

                    {/* Top GSC queries */}
                    <div className="card-d" style={{ overflow:'auto', marginBottom:18 }}>
                      <div className="pj" style={{ fontSize:11, fontWeight:800, color:C.teal, letterSpacing:2, textTransform:'uppercase', padding:'14px 16px 8px' }}>Top Search Queries · Live from Google</div>
                      <table className="tbl">
                        <thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead>
                        <tbody>
                          {gscRows.slice(0,10).map((r,i) => (
                            <tr key={i}>
                              <td><span className="pj" style={{ fontSize:12, fontWeight:600 }}>{r.keys[0]}</span></td>
                              <td><span className="pj" style={{ fontSize:12, fontWeight:700, color:C.green }}>{r.clicks}</span></td>
                              <td><span className="pj" style={{ fontSize:12 }}>{r.impressions}</span></td>
                              <td><span className="pj" style={{ fontSize:12 }}>{(r.ctr*100).toFixed(1)}%</span></td>
                              <td>
                                <div style={{ width:26, height:26, borderRadius:'50%', background: r.position <= 3 ? C.green : r.position <= 10 ? C.saffron : C.gray, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:800 }}>
                                  {r.position.toFixed(0)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Top GA4 pages */}
                    <div className="card-d" style={{ overflow:'auto', marginBottom:18 }}>
                      <div className="pj" style={{ fontSize:11, fontWeight:800, color:C.teal, letterSpacing:2, textTransform:'uppercase', padding:'14px 16px 8px' }}>Top Pages · Live from GA4</div>
                      <table className="tbl">
                        <thead><tr><th>Page</th><th>Sessions</th><th>Users</th><th>Page Views</th></tr></thead>
                        <tbody>
                          {ga4Rows.slice(0,8).map((r,i) => (
                            <tr key={i}>
                              <td><span className="pj" style={{ fontSize:11 }}>{r.dimensionValues[0].value}</span></td>
                              <td><span className="pj" style={{ fontSize:12, fontWeight:700 }}>{parseFloat(r.metricValues[0].value).toFixed(0)}</span></td>
                              <td><span className="pj" style={{ fontSize:12 }}>{parseFloat(r.metricValues[1].value).toFixed(0)}</span></td>
                              <td><span className="pj" style={{ fontSize:12 }}>{parseFloat(r.metricValues[3].value).toFixed(0)}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )
              })()}

              <div style={{ borderTop:`1px solid ${C.border}`, marginBottom:20 }}/>


              <div style={{ background:'linear-gradient(135deg,#12382A,#0A6B5E)', borderRadius:12, padding:'18px 22px', marginBottom:18, display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
                <div style={{ fontSize:38 }}>🏆</div>
                <div style={{ flex:1 }}>
                  <div className="pd" style={{ fontSize:'1.25rem', fontWeight:900, color:'#fff' }}>You're #1 on Google for "physiotherapist in Bengaluru"</div>
                  <div className="pj" style={{ fontSize:12, color:'rgba(255,255,255,.65)', marginTop:4 }}>8,100 people search this every month</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div className="pd" style={{ fontSize:'2.2rem', fontWeight:900, color:'#FBBF24' }}>#1</div>
                  <div className="pj" style={{ fontSize:11, color:'rgba(255,255,255,.5)' }}>Google position</div>
                </div>
              </div>

              <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                {['all','Physio','Ortho','Online'].map(f=>(
                  <button key={f} onClick={()=>setKwFilter(f)} className="pj"
                    style={{ padding:'6px 14px', border:`1.5px solid ${kwFilter===f?C.forest:C.border}`, borderRadius:7, background:kwFilter===f?C.forest:'#fff', color:kwFilter===f?'#fff':C.gray, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    {f==='all'?'All searches':f}
                  </button>
                ))}
              </div>

              <div className="card-d" style={{ overflow:'auto' }}>
                <table className="tbl">
                  <thead>
                    <tr><th>Search term</th><th>Position</th><th>Searches/month</th><th>Trend</th></tr>
                  </thead>
                  <tbody>
                    {SEO_TERMS.filter(k=>kwFilter==='all'||k.type===kwFilter).map(k=>(
                      <tr key={k.term}>
                        <td><span className="pj" style={{ fontSize:13, fontWeight:600 }}>{k.term}</span></td>
                        <td>
                          <div style={{ width:26, height:26, borderRadius:'50%', background:k.position===1?C.saffron:k.position<=3?C.green:k.position<=5?C.amber:C.gray, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:800, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{k.position}</div>
                        </td>
                        <td>
                          <span className="pj" style={{ fontSize:13, fontWeight:700 }}>{k.searches}</span>
                          <div style={{ width:80, height:3, background:C.border, borderRadius:2, marginTop:4 }}>
                            <div style={{ height:'100%', width:`${parseInt(k.searches)/81}%`, background:`linear-gradient(90deg,${C.mint},${C.saffron})`, borderRadius:2 }}/>
                          </div>
                        </td>
                        <td>
                          <span className="pj" style={{ fontSize:13, fontWeight:700, color:k.trend==='up'?C.green:k.trend==='down'?C.red:C.gray }}>
                            {k.trend==='up'?'▲ Going up':k.trend==='down'?'▼ Dropped':'━ Same'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Strategic Recommendations */}
              <div style={{ marginTop:24 }}>
                <div className="pj" style={{ fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:C.saffron, marginBottom:4 }}>Strategic recommendations</div>
                <div className="pd" style={{ fontSize:'1rem', fontWeight:800, marginBottom:16 }}>Grow your leads faster</div>
                <div className="g3" style={{ display:'grid', gap:14 }}>

                  {/* Card 1 — Long-tail keywords */}
                  <div className="card-d" style={{ padding:20, borderLeft:`4px solid ${C.saffron}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <span style={{ fontSize:22 }}>🎯</span>
                      <div className="pj" style={{ fontSize:13, fontWeight:800 }}>Target long-tail keywords</div>
                    </div>
                    <div className="pj" style={{ fontSize:12, color:C.gray, lineHeight:1.65, marginBottom:12 }}>
                      High-intent, low-competition phrases that bring patients who are ready to book — not just browsing.
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {[
                        '"physiotherapy for lower back pain at home Bengaluru"',
                        '"online physio for frozen shoulder India"',
                        '"best physiotherapist after knee surgery Koramangala"',
                        '"home visit physio for elderly HSR Layout"',
                      ].map(kw => (
                        <div key={kw} style={{ background:C.saffronLight, borderRadius:6, padding:'6px 10px', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11, fontWeight:600, color:C.saffron }}>
                          {kw}
                        </div>
                      ))}
                    </div>
                    <div className="pj" style={{ fontSize:11, color:C.green, fontWeight:700, marginTop:12 }}>
                      ✓ Long-tail terms convert 3–5× better than broad terms
                    </div>
                  </div>

                  {/* Card 2 — Near me / Local SEO */}
                  <div className="card-d" style={{ padding:20, borderLeft:`4px solid ${C.green}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <span style={{ fontSize:22 }}>📍</span>
                      <div className="pj" style={{ fontSize:13, fontWeight:800 }}>Win the "near me" factor</div>
                    </div>
                    <div className="pj" style={{ fontSize:12, color:C.gray, lineHeight:1.65, marginBottom:12 }}>
                      60% of physio searches include a location. Dominate local results with these steps.
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {[
                        ['📸', 'Add 15+ photos to Google Business Profile — clinics with photos get 42% more direction requests'],
                        ['⭐', 'Target 50+ Google reviews — ask every satisfied patient via WhatsApp'],
                        ['🗺', 'List on Practo, Justdial, Sulekha, and 1mg — each listing boosts local authority'],
                        ['📝', 'Write one blog per week on area-specific pain: "Knee pain treatment in Koramangala"'],
                      ].map(([icon, text]) => (
                        <div key={text} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                          <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{icon}</span>
                          <span className="pj" style={{ fontSize:12, color:C.ink, lineHeight:1.55 }}>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 3 — Digital-first value */}
                  <div className="card-d" style={{ padding:20, borderLeft:`4px solid ${C.teal}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <span style={{ fontSize:22 }}>💡</span>
                      <div className="pj" style={{ fontSize:13, fontWeight:800 }}>Lead with digital-first value</div>
                    </div>
                    <div className="pj" style={{ fontSize:12, color:C.gray, lineHeight:1.65, marginBottom:12 }}>
                      Your biggest competitive advantage: no commute, no waiting room. Make that the headline.
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {[
                        ['🚗', '"No Bengaluru traffic" — use this in all ads and landing pages. It resonates immediately.'],
                        ['📲', 'WhatsApp-first follow-up — 95% of urban Indians read messages within 5 minutes'],
                        ['🎁', 'Offer the first online session free — capture phone + pain details, convert later'],
                        ['🎬', 'Post 60-second Reels showing exercises for back, knee, shoulder pain — free reach on Instagram'],
                      ].map(([icon, text]) => (
                        <div key={text} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                          <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{icon}</span>
                          <span className="pj" style={{ fontSize:12, color:C.ink, lineHeight:1.55 }}>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab === 'settings' && (
            <div className="fade-d">
              <div style={{ marginBottom:18 }}>
                <div className="pj" style={{ fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:C.saffron, marginBottom:3 }}>Settings</div>
                <div className="pd" style={{ fontSize:'1.2rem', fontWeight:800 }}>Clinic settings</div>
              </div>
              <div className="g2" style={{ display:'grid', gap:18 }}>
                <div className="card-d" style={{ padding:24 }}>
                  <div className="pj" style={{ fontSize:12, fontWeight:700, color:C.teal, marginBottom:16, textTransform:'uppercase', letterSpacing:1 }}>Your clinic</div>
                  {[['Clinic name','PhysioDrishti'],['Doctor name','Dr. Priya Menon'],['City','Bengaluru, Karnataka'],['Phone','98XXXXXXXX']].map(([l,v])=>(
                    <div key={l} style={{ marginBottom:14 }}>
                      <label className="pj" style={{ fontSize:12, fontWeight:700, color:C.teal, display:'block', marginBottom:5 }}>{l}</label>
                      <input className="field-d" defaultValue={v} />
                    </div>
                  ))}
                  <button className="btn-g">Save details</button>
                </div>
                <div className="card-d" style={{ padding:24 }}>
                  <div className="pj" style={{ fontSize:12, fontWeight:700, color:C.teal, marginBottom:16, textTransform:'uppercase', letterSpacing:1 }}>Live map (Mappls)</div>
                  <div className="pj" style={{ fontSize:13, color:C.gray, marginBottom:14, lineHeight:1.6 }}>
                    Mappls is India's own mapping platform by MapmyIndia. Add your free API key below to show a live map of where your patients are.
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label className="pj" style={{ fontSize:12, fontWeight:700, color:C.teal, display:'block', marginBottom:5 }}>
                      Whereby room URL{' '}
                      {wherebyLink && <span style={{ color:C.green, fontWeight:700 }}>✓ Active</span>}
                    </label>
                    <input className="field-d" placeholder="https://yourname.whereby.com/my-room" value={wherebyLink}
                      onChange={e=>{ setWherebyLink(e.target.value); localStorage.setItem('pd_whereby_link',e.target.value) }}/>
                    <div className="pj" style={{ fontSize:11, color:C.gray, marginTop:4, lineHeight:1.55 }}>
                      Free at <a href="https://whereby.com" target="_blank" rel="noreferrer" style={{ color:C.teal }}>whereby.com</a> — create a room → copy the link. Patients join in the browser, no app needed.
                    </div>
                  </div>

                  <div style={{ marginBottom:14 }}>
                    <label className="pj" style={{ fontSize:12, fontWeight:700, color:C.teal, display:'block', marginBottom:5 }}>Google Meet Link (fallback)</label>
                    <input className="field-d" placeholder="https://meet.google.com/xxx-yyyy-zzz" value={meetLink}
                      onChange={e=>{ setMeetLink(e.target.value); localStorage.setItem('pd_meet_link',e.target.value) }}/>
                    <div className="pj" style={{ fontSize:11, color:C.gray, marginTop:4 }}>
                      Go to <a href="https://meet.google.com" target="_blank" rel="noreferrer" style={{ color:C.teal }}>meet.google.com</a> → New meeting → Create for later → copy the link
                    </div>
                  </div>

                  <div style={{ marginBottom:14 }}>
                    <label className="pj" style={{ fontSize:12, fontWeight:700, color:C.teal, display:'block', marginBottom:5 }}>
                      Mappls API key <span style={{ color:mapplsKey?C.green:C.amber, fontWeight:700 }}>{mapplsKey?'(Active ✓)':'(Not added yet)'}</span>
                    </label>
                    <input className="field-d" type="password" placeholder="Paste your Mappls key here…" value={mapplsKey} onChange={e=>setMapplsKey(e.target.value)} />
                    <a href="https://auth.mappls.com/console" target="_blank" rel="noreferrer" className="pj" style={{ fontSize:12, color:C.teal, display:'inline-block', marginTop:6 }}>Get a free key at mappls.com →</a>
                  </div>
                  <div className="pj" style={{ fontSize:12, fontWeight:700, color:C.teal, marginBottom:14, marginTop:24, textTransform:'uppercase', letterSpacing:1 }}>Notifications</div>
                  {[['WhatsApp alerts for new enquiries','on'],['Email when a session is booked','on'],['Daily summary at 8 PM','off']].map(([l,def])=>(
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, padding:'10px 14px', background:C.light, borderRadius:8 }}>
                      <span className="pj" style={{ fontSize:13 }}>{l}</span>
                      <div style={{ width:38, height:22, borderRadius:20, background:def==='on'?C.mint:C.border, cursor:'pointer', position:'relative', transition:'background .2s' }}>
                        <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:def==='on'?18:3, transition:'left .2s' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Patient detail slide-over */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:600, display:'flex', justifyContent:'flex-end' }} onClick={()=>setSelected(null)}>
          <div style={{ background:'#fff', width:Math.min(400, w), height:'100vh', padding:28, overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
              <div className="pd" style={{ fontSize:'1.15rem', fontWeight:900 }}>{selected.name}</div>
              <button onClick={()=>setSelected(null)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.gray }}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
              {[['Phone',selected.phone],['Area',selected.area],['Pain area',selected.pain],['Added on',selected.time],['Status',STAGE_LABEL[selected.stage]],['Priority',selected.priority]].map(([k,v])=>(
                <div key={k} style={{ background:C.light, padding:'10px 13px', borderRadius:8 }}>
                  <div className="pj" style={{ fontSize:10, fontWeight:700, color:C.gray, textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>{k}</div>
                  <div className="pj" style={{ fontSize:13, fontWeight:700 }}>{v}</div>
                </div>
              ))}
            </div>
            {selected.note && (
              <div style={{ background:'#FFF8EF', borderRadius:8, padding:14, marginBottom:16 }}>
                <div className="pj" style={{ fontSize:12, fontWeight:700, color:C.amber, marginBottom:6 }}>Their note</div>
                <div className="pj" style={{ fontSize:13, color:C.ink, lineHeight:1.6 }}>{selected.note}</div>
              </div>
            )}

            {/* Progress chart */}
            {progress[selected.id]?.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div className="pj" style={{ fontSize:12, fontWeight:700, color:C.teal, marginBottom:8 }}>Progress tracker</div>
                <PainSparkline logs={progress[selected.id]} />
                <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4, maxHeight:120, overflowY:'auto' }}>
                  {[...progress[selected.id]].reverse().slice(0,4).map((e,i)=>(
                    <div key={i} style={{ display:'flex', gap:8, padding:'6px 10px', background:C.light, borderRadius:6, alignItems:'center' }}>
                      <span style={{ width:22, height:22, borderRadius:'50%', background:e.score<=4?C.mint:e.score<=7?C.amber:C.red, color:'#fff', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Plus Jakarta Sans,sans-serif', flexShrink:0 }}>{e.score}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="pj" style={{ fontSize:11, fontWeight:600, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.notes || 'No notes'}</div>
                        <div className="pj" style={{ fontSize:10, color:C.gray }}>{e.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom:16 }}>
              <div className="pj" style={{ fontSize:12, fontWeight:700, color:C.teal, marginBottom:8 }}>Move to</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {STAGES.map(s=>(
                  <button key={s} onClick={()=>{setPatients(p=>p.map(pt=>pt.id===selected.id?{...pt,stage:s}:pt));setSelected({...selected,stage:s})}}
                    style={{ padding:'5px 11px', border:`1.5px solid ${selected.stage===s?STAGE_COLOR[s]:C.border}`, borderRadius:6, background:selected.stage===s?`${STAGE_COLOR[s]}18`:'transparent', color:selected.stage===s?STAGE_COLOR[s]:C.gray, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
                    {STAGE_ICON[s]} {STAGE_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
              <button className="btn-g" style={{ flex:1, padding:11 }} onClick={()=>{setModal({mode:'schedule',prefill:selected});setSelected(null)}}>📅 Book session</button>
              <button onClick={()=>openWhatsApp(selected.phone,`Hi ${selected.name}, this is Dr. ${doctorName} from PhysioDrishti 🌿\n\nWe'd love to schedule your session. When are you free?\n\nSee you soon!\n- PhysioDrishti`)}
                style={{ flex:1, background:'#25D366', color:'#fff', border:'none', borderRadius:7, padding:11, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, fontWeight:700, cursor:'pointer' }}>
                💬 WhatsApp
              </button>
              <button onClick={()=>window.open('tel:'+selected.phone)} className="btn-soft" style={{ padding:'11px 14px' }}>📞</button>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <button onClick={()=>setExerciseModal(selected)} className="btn-soft" style={{ flex:1, padding:10 }}>📄 Prescribe exercises</button>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setProgressModal(selected)} className="btn-soft" style={{ flex:1, padding:10 }}>📋 Log session</button>
              <button onClick={()=>{
                const due = new Date(); due.setDate(due.getDate()+3)
                const dueStr = due.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
                setFollowUps(p=>[...p,{ id:Date.now(), patientId:selected.id, name:selected.name, phone:selected.phone, pain:selected.pain, dueDate:dueStr, sent:false }])
                alert(`Follow-up reminder set for ${dueStr}!`)
              }} className="btn-soft" style={{ flex:1, padding:10 }}>⏰ 3-day follow-up</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal?.mode === 'add'      && <PatientModal mode="add"      prefill={modal.prefill} onClose={()=>setModal(null)} onSave={addPatient} />}
      {modal?.mode === 'schedule' && <PatientModal mode="schedule" prefill={modal.prefill} onClose={()=>setModal(null)} onSave={scheduleSession} />}
      {liveSession && (
        <VideoCall
          session={liveSession}
          onClose={()=>setLiveSession(null)}
          wherebyLink={wherebyLink}
          onLogProgress={(sessionNotes) => {
            const pt = patients.find(p => p.name === liveSession.name)
            if (pt) setProgressModal(pt)
          }}
        />
      )}
      {progressModal && (
        <ProgressModal
          patient={progressModal}
          onClose={()=>setProgressModal(null)}
          onSave={(entry) => {
            setProgress(prev => ({
              ...prev,
              [progressModal.id]: [...(prev[progressModal.id] || []), entry],
            }))
            setProgressModal(null)
          }}
        />
      )}
      {exerciseModal && (
        <ExercisePrescriptionModal
          patient={exerciseModal}
          doctorName={doctorName}
          onClose={()=>setExerciseModal(null)}
        />
      )}
    </div>
  )
}
