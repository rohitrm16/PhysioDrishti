/**
 * PhysioDrishti — Clinic Dashboard
 * Clean, simple lead & session management for physio and ortho clinics.
 * Props: onGoToLanding, mapplsKey, setMapplsKey
 */
import { useState, useEffect, useRef } from 'react'

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
  { id:1,  name:'Rahul Sharma',  phone:'98XX0001', area:'Koramangala',     pain:'Back / Neck',   stage:'new',        note:'3 years of back pain',        time:'9:14 AM',   priority:'high' },
  { id:2,  name:'Anitha Reddy',  phone:'97XX0012', area:'HSR Layout',      pain:'Knee / Hip',    stage:'called',     note:'Post ACL surgery',            time:'8:45 AM',   priority:'high' },
  { id:3,  name:'Vikram Nair',   phone:'96XX0023', area:'Whitefield',      pain:'Shoulder',      stage:'assessment', note:'Shoulder clicks at night',    time:'Yesterday', priority:'medium' },
  { id:4,  name:'Priya Iyer',    phone:'95XX0034', area:'Jayanagar',       pain:'Knee / Hip',    stage:'active',     note:'Knee replacement recovery',   time:'Yesterday', priority:'high' },
  { id:5,  name:'Suresh Kumar',  phone:'94XX0045', area:'Marathahalli',    pain:'Back / Neck',   stage:'new',        note:'Pain down left leg',          time:'9:02 AM',   priority:'high' },
  { id:6,  name:'Deepa Menon',   phone:'93XX0056', area:'Indiranagar',     pain:'Back / Neck',   stage:'done',       note:'Cervical pain, much better',  time:'2 days ago',priority:'low'  },
  { id:7,  name:'Arjun Patel',   phone:'92XX0067', area:'Electronic City', pain:'Post-surgery',  stage:'new',        note:'Sports injury — knee',        time:'8:55 AM',   priority:'medium' },
  { id:8,  name:'Kavitha S.',    phone:'91XX0078', area:'JP Nagar',        pain:'Knee / Hip',    stage:'active',     note:'Hip replacement, wk 4',       time:'Yesterday', priority:'high' },
  { id:9,  name:'Mohammed A.',   phone:'90XX0089', area:'Yelahanka',       pain:'Ankle / Foot',  stage:'called',     note:'Heel pain every morning',     time:'9:20 AM',   priority:'medium' },
  { id:10, name:'Sangeetha R.',  phone:'89XX0091', area:'Bannerghatta Road',pain:'Knee / Hip',   stage:'assessment', note:'Knee pain, difficulty walking',time:'Yesterday', priority:'medium' },
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

/* ─── Video Call ─────────────────────────────────────────────────── */
function VideoCall({ session, onClose }) {
  const [muted, setMuted]   = useState(false)
  const [cam, setCam]       = useState(true)
  const [t, setT]           = useState(0)
  const [notes, setNotes]   = useState('')
  const [exDone, setExDone] = useState([])
  const exercises = ['Gentle knee bends','Leg raises','Seated marching','Calf stretches']
  useEffect(() => { const i = setInterval(() => setT(p=>p+1), 1000); return () => clearInterval(i) }, [])
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.88)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}>
      <div style={{ background:'#1A1F2E', borderRadius:16, width:'100%', maxWidth:820, overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.6)' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:9, height:9, borderRadius:'50%', background:'#22C55E', animation:'blink 1.5s infinite' }}/>
            <span className="pj" style={{ fontSize:13, color:'#fff', fontWeight:700 }}>Session with {session.name} · {fmt(t)}</span>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.12)', border:'none', borderRadius:6, padding:'5px 12px', color:'rgba(255,255,255,.75)', cursor:'pointer', fontSize:12 }}>✕ End</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 240px', gap:10, padding:12 }}>
          {/* Video */}
          <div style={{ background:'#111', borderRadius:10, position:'relative', aspectRatio:'16/9' }}>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#1A3A2A,#0D2018)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:8 }}>{cam ? '👩‍⚕️' : '👤'}</div>
                <div className="pj" style={{ fontSize:12, color:'rgba(255,255,255,.65)' }}>{session.name} · {session.area}</div>
              </div>
            </div>
            {/* PiP */}
            <div style={{ position:'absolute', bottom:10, right:10, width:90, height:65, background:'#0D2E1F', borderRadius:6, border:'2px solid rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ textAlign:'center' }}><div style={{ fontSize:18 }}>🩺</div><div className="pj" style={{ fontSize:8, color:'rgba(255,255,255,.5)' }}>Dr. Priya Menon</div></div>
            </div>
            <div style={{ position:'absolute', top:10, left:10, background:'rgba(0,0,0,.5)', borderRadius:5, padding:'3px 8px', fontSize:12, color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif' }}>{fmt(t)}</div>
          </div>

          {/* Right */}
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
          <button onClick={onClose} style={{ background:'#C02020', border:'none', borderRadius:20, padding:'9px 22px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif' }}>End session</button>
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
    date: '',
    time: '',
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

/* ─── Dashboard ──────────────────────────────────────────────────── */
export default function Dashboard({ onGoToLanding, mapplsKey, setMapplsKey }) {
  const [tab, setTab]             = useState('overview')
  const [patients, setPatients]   = useState(INITIAL_PATIENTS)
  const [sessions, setSessions]   = useState(SESSIONS_TODAY)
  const [sideOpen, setSideOpen]   = useState(false)
  const [liveSession, setLiveSession] = useState(null)
  const [modal, setModal]         = useState(null)  // null | { mode:'add'|'schedule', prefill? }
  const [selected, setSelected]   = useState(null)  // selected patient
  const [w, setW]                 = useState(window.innerWidth)
  const [notif, setNotif]         = useState(3)
  const [kwFilter, setKwFilter]   = useState('all')

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
    const newP = { id: Date.now(), name:form.name, phone:form.phone, area:form.area, pain:form.pain, stage:'new', note:form.note, time:'Just now', priority:'medium' }
    setPatients(p => [newP, ...p])
    setModal(null)
  }

  const scheduleSession = (form) => {
    const timeStr = form.time ? form.time : '12:00 PM'
    const newS = { id:Date.now(), name:form.name, pain:form.pain||'General session', time:timeStr, status:'upcoming', duration:'45 min', area:form.area||'Bengaluru', type:form.sessionType }
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
          <div style={{ width:30, height:30, background:'#D4510E', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, flexShrink:0 }}>✚</div>
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
                      {s.status==='live'
                        ? <button className="btn-o" style={{ width:'100%', fontSize:12, padding:'8px 0' }} onClick={()=>setLiveSession(s)}>📹 Join now</button>
                        : <button className="btn-soft" style={{ width:'100%', fontSize:11 }} onClick={()=>setLiveSession(s)}>Join when ready</button>}
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
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:10 }}>
                <div>
                  <div className="pj" style={{ fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:C.saffron, marginBottom:3 }}>Sessions</div>
                  <div className="pd" style={{ fontSize:'1.2rem', fontWeight:800 }}>Today's sessions · Dr. Priya Menon</div>
                </div>
                <button className="btn-o" onClick={()=>setModal({mode:'schedule'})}>+ Schedule session</button>
              </div>

              {/* Live banner */}
              {sessions.filter(s=>s.status==='live').map(s=>(
                <div key={s.id} style={{ background:'linear-gradient(135deg,#D4510E,#BF4610)', borderRadius:10, padding:'15px 20px', marginBottom:18, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#fff', animation:'blink 1s infinite' }}/>
                  <div style={{ flex:1 }}>
                    <div className="pj" style={{ fontWeight:800, fontSize:14, color:'#fff' }}>🔴 Live now — {s.name}</div>
                    <div className="pj" style={{ fontSize:12, color:'rgba(255,255,255,.8)' }}>{s.pain} · {s.area} · {s.duration}</div>
                  </div>
                  <button className="pj" onClick={()=>setLiveSession(s)} style={{ background:'#fff', color:C.saffron, border:'none', borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:800, cursor:'pointer' }}>📹 Join session</button>
                </div>
              ))}

              <div className="g2" style={{ display:'grid', gap:14 }}>
                {sessions.map(s=>(
                  <div key={s.id} className="card-d" style={{ padding:20, border:s.status==='live'?`2px solid ${C.saffron}`:`1px solid ${C.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                        <div style={{ width:38, height:38, borderRadius:'50%', background:s.status==='live'?`linear-gradient(135deg,${C.saffron},#BF4610)`:C.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{s.status==='live'?'🔴':'⏰'}</div>
                        <div>
                          <div className="pj" style={{ fontWeight:800, fontSize:14 }}>{s.name}</div>
                          <div className="pj" style={{ fontSize:11, color:C.gray }}>{s.area}</div>
                        </div>
                      </div>
                      <span style={{ background:s.status==='live'?C.saffronLight:'#F0F2F5', color:s.status==='live'?C.saffron:C.gray, padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:700, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{s.status==='live'?'● Live':s.time}</span>
                    </div>
                    <div className="pj" style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{s.pain}</div>
                    <div className="pj" style={{ fontSize:12, color:C.gray, marginBottom:14 }}>{s.type} · {s.duration}</div>
                    <button onClick={()=>setLiveSession(s)} className="pj"
                      style={{ background:s.status==='live'?C.saffron:C.forest, color:'#fff', border:'none', borderRadius:7, padding:'8px 16px', fontSize:12, fontWeight:700, cursor:'pointer', width:'100%' }}>
                      {s.status==='live'?'📹 Join now →':'Join when ready →'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SEARCH RANKINGS ── */}
          {tab === 'rankings' && (
            <div className="fade-d">
              <div style={{ marginBottom:18 }}>
                <div className="pj" style={{ fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:C.saffron, marginBottom:3 }}>Google search</div>
                <div className="pd" style={{ fontSize:'1.2rem', fontWeight:800 }}>How people find you</div>
              </div>

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
              {[['Phone',selected.phone],['Area',selected.area],['Pain area',selected.pain],['Added',selected.time],['Status',STAGE_LABEL[selected.stage]],['Priority',selected.priority]].map(([k,v])=>(
                <div key={k} style={{ background:C.light, padding:'10px 13px', borderRadius:8 }}>
                  <div className="pj" style={{ fontSize:10, fontWeight:700, color:C.gray, textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>{k}</div>
                  <div className="pj" style={{ fontSize:13, fontWeight:700 }}>{v}</div>
                </div>
              ))}
            </div>
            {selected.note && (
              <div style={{ background:'#FFF8EF', borderRadius:8, padding:14, marginBottom:20 }}>
                <div className="pj" style={{ fontSize:12, fontWeight:700, color:C.amber, marginBottom:6 }}>Their note</div>
                <div className="pj" style={{ fontSize:13, color:C.ink, lineHeight:1.6 }}>{selected.note}</div>
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
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-g" style={{ flex:1, padding:11 }} onClick={()=>{setModal({mode:'schedule',prefill:selected});setSelected(null)}}>📅 Book a session</button>
              <button className="btn-soft" style={{ flex:'0 0 80px', padding:11 }}>📞 Call</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal?.mode === 'add'      && <PatientModal mode="add"      prefill={modal.prefill} onClose={()=>setModal(null)} onSave={addPatient} />}
      {modal?.mode === 'schedule' && <PatientModal mode="schedule" prefill={modal.prefill} onClose={()=>setModal(null)} onSave={scheduleSession} />}
      {liveSession && <VideoCall session={liveSession} onClose={()=>setLiveSession(null)} />}
    </div>
  )
}
