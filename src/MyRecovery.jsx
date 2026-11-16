/**
 * My recovery — the patient's progress screen.
 * Closes the two gaps the site names: adherence (today's plan, streak, reminder, comeback nudges,
 * pain-adjusted dose) and invisible progress (pain trend, weekly goal rating, milestones).
 * Optional, consented sharing gives the physiotherapist the same view between visits.
 * Everything lives on this phone; only anonymous numbers go to the server unless the patient shares.
 */
import { useState, useMemo } from 'react'
import GuidedSession, { SESSION_CONDITIONS, store, deviceId } from './GuidedSession.jsx'
import { adherence, painTrend, goalProgress, milestones, nudge, nextScale, dayKey } from './recovery.js'
import { figureSvg } from './exerciseFigures.js'

const C = { forest:'#12382A', saffron:'#D4510E', teal:'#0A6B5E', ink:'#0D1520', gray:'#5C6878', light:'#F3F6FA', border:'#DDE4EF', red:'#B23131', redSoft:'#F8E3E3', green:'#177A45', greenSoft:'#E3F3EA', amber:'#7A4E00', amberSoft:'#FBF0D9', cream:'#FDFAF3' }
const font = "'Plus Jakarta Sans', system-ui, sans-serif"
const serif = "'Playfair Display', Georgia, serif"
const card = { background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:16 }
const btn = (bg, fg = '#fff') => ({ fontFamily:font, fontWeight:800, fontSize:14, background:bg, color:fg, border:'none', borderRadius:12, padding:'12px 16px', cursor:'pointer' })
const h3 = { fontFamily:font, fontWeight:800, fontSize:13, letterSpacing:1, textTransform:'uppercase', color:C.forest, margin:'0 0 10px' }
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const GOALS = {
  knee_osteoarthritis: ['Climbing stairs', 'Walking for 20 minutes', 'Getting up from a chair', 'Standing to cook'],
  hip_osteoarthritis:  ['Walking for 20 minutes', 'Putting on socks', 'Getting in and out of a car', 'Climbing stairs'],
  low_back_pain:       ['Sitting through a work day', 'Bending to pick things up', 'Sleeping through the night', 'Walking for 30 minutes'],
  neck_pain:           ['Working at a laptop for an hour', 'Turning to look over my shoulder', 'Sleeping without neck pain', 'Reading on my phone'],
}

function post(body) {
  return fetch('/api/recovery', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ device_id: deviceId(), ...body }) })
    .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Could not save'); return j })
}

function Scale({ value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display:'grid', gridTemplateColumns:'repeat(11, 1fr)', gap:3 }}>
      {Array.from({ length: 11 }, (_, n) => (
        <button key={n} role="radio" aria-checked={value === n} onClick={() => onChange(n)}
          style={{ fontFamily:font, fontWeight:800, fontSize:13, padding:'9px 0', borderRadius:8, cursor:'pointer', border: value === n ? `2px solid ${C.forest}` : `1px solid ${C.border}`, background: value === n ? C.forest : '#fff', color: value === n ? '#fff' : C.ink }}>{n}</button>
      ))}
    </div>
  )
}

// Small line chart, drawn to scale: x = session order, y = 0..10
function LineChart({ series, height = 150, yLabel }) {
  const W = 320, H = height, L = 26, R = 8, T = 10, B = 22
  const n = Math.max(...series.map((s) => s.values.length), 1)
  const x = (i) => L + (n === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (n - 1))
  const y = (v) => T + ((10 - v) * (H - T - B)) / 10
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={yLabel} style={{ width:'100%', height:'auto', display:'block' }}>
      {[0, 5, 10].map((v) => (
        <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={C.border} strokeWidth="1" /><text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill={C.gray} fontFamily={font}>{v}</text></g>
      ))}
      {series.map((s) => {
        const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)])).filter(Boolean)
        return (
          <g key={s.name}>
            {s.line !== false && pts.length > 1 && <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
            {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4.5 : 3} fill={s.line === false ? '#fff' : s.color} stroke={s.color} strokeWidth="2" />)}
          </g>
        )
      })}
      <text x={L} y={H - 6} fontSize="10" fill={C.gray} fontFamily={font}>First session</text>
      <text x={W - R} y={H - 6} fontSize="10" fill={C.gray} fontFamily={font} textAnchor="end">Latest</text>
    </svg>
  )
}

function icsFor(time, label) {
  const [hh, mm] = time.split(':')
  const d = new Date(); d.setDate(d.getDate() + 1)
  const ymd = dayKey(d).replace(/-/g, '')
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PhysioDrishti//Home exercise//EN', 'BEGIN:VEVENT',
    `UID:pd-${Date.now()}@physiodrishti`, `DTSTAMP:${stamp}`, `DTSTART;TZID=Asia/Kolkata:${ymd}T${hh}${mm}00`, 'DURATION:PT15M', 'RRULE:FREQ=DAILY',
    `SUMMARY:Home exercises: ${label}`, 'DESCRIPTION:Your 10-minute PhysioDrishti session. Open physiodrishti.vercel.app and tap My progress.',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Time for your home exercises', 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
}

export default function MyRecovery({ onClose, onBook, initialCondition }) {
  const [tick, setTick] = useState(0)          // bump to re-read local data after a session
  const all = useMemo(() => store.get('pd-sessions', []), [tick])
  const goalsAll = useMemo(() => store.get('pd-goals', []), [tick])
  const used = [...new Set(all.map((s) => s.condition))]
  const [cond, setCond] = useState(initialCondition || used[used.length - 1] || null)
  const [session, setSession] = useState(null)
  const meta = SESSION_CONDITIONS.find((c) => c.key === cond)

  const sessions = all.filter((s) => s.condition === cond)
  const checkins = goalsAll.filter((g) => g.condition === cond)
  const a = adherence(sessions)
  const p = painTrend(sessions)
  const g = goalProgress(checkins)
  const ms = milestones(sessions, checkins)
  const nd = nudge(sessions, checkins)
  const dose = nextScale(sessions)

  // goal form
  const [goalText, setGoalText] = useState('')
  const [goalRating, setGoalRating] = useState(null)
  const saveGoal = () => {
    const goal = (g?.goal || goalText).trim()
    if (!goal || goalRating == null) return
    store.set('pd-goals', [...goalsAll, { at: new Date().toISOString(), condition: cond, goal, rating: goalRating }])
    post({ action:'goal', condition: cond, goal, rating: goalRating }).catch(() => {})
    setGoalRating(null); setGoalText(''); setTick(tick + 1)
  }

  // reminder
  const [time, setTime] = useState(store.get('pd-reminder', '08:00'))
  const [remMsg, setRemMsg] = useState('')
  const addReminder = () => {
    store.set('pd-reminder', time)
    try {
      const url = URL.createObjectURL(new Blob([icsFor(time, meta?.label || 'PhysioDrishti')], { type:'text/calendar' }))
      const aEl = document.createElement('a'); aEl.href = url; aEl.download = 'physiodrishti-reminder.ics'; document.body.appendChild(aEl); aEl.click(); aEl.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      setRemMsg('Open the downloaded file to add a daily reminder to your calendar.')
    } catch { setRemMsg('Could not create the reminder on this device.') }
  }

  // sharing with the physiotherapist
  const [share, setShare] = useState(store.get('pd-share', null))
  const [sName, setSName] = useState(''), [sPhone, setSPhone] = useState(''), [consent, setConsent] = useState(false)
  const [sErr, setSErr] = useState(''), [sBusy, setSBusy] = useState(false)
  const doShare = async () => {
    setSErr(''); setSBusy(true)
    try { await post({ action:'share', name: sName, phone: sPhone, consent }); const v = { name: sName, last4: sPhone.replace(/\D/g, '').slice(-4), at: new Date().toISOString() }; store.set('pd-share', v); setShare(v) }
    catch (e) { setSErr(e.message) } finally { setSBusy(false) }
  }
  const stopShare = async () => { setSBusy(true); try { await post({ action:'unshare' }); store.set('pd-share', null); setShare(null) } catch (e) { setSErr(e.message) } finally { setSBusy(false) } }

  const toneStyle = { good: [C.greenSoft, C.green], info: ['#EEF4F1', C.forest], danger: [C.redSoft, C.red] }[nd.tone]
  const minutes = 10

  return (
    <div role="dialog" aria-modal="true" aria-label="My recovery"
      style={{ position:'fixed', inset:0, zIndex:1900, background:C.cream, overflowY:'auto', fontFamily:font, color:C.ink, paddingTop:'env(safe-area-inset-top, 0px)', paddingBottom:'env(safe-area-inset-bottom, 0px)' }}>
      <div style={{ maxWidth:560, margin:'0 auto', padding:'14px max(16px, env(safe-area-inset-left, 0px)) 32px', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:C.saffron }}>PhysioDrishti</div>
            <div style={{ fontFamily:serif, fontWeight:900, fontSize:24, color:C.forest }}>My recovery</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ ...btn('#fff', C.ink), border:`1px solid ${C.border}`, padding:'8px 12px' }}>✕</button>
        </div>

        {/* condition switcher */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }} role="group" aria-label="Choose your plan">
          {SESSION_CONDITIONS.map((c) => (
            <button key={c.key} onClick={() => setCond(c.key)} aria-pressed={cond === c.key}
              style={{ fontFamily:font, fontSize:12, fontWeight:700, borderRadius:999, padding:'7px 12px', cursor:'pointer', border:`1px solid ${cond === c.key ? C.forest : C.border}`, background: cond === c.key ? C.forest : '#fff', color: cond === c.key ? '#fff' : C.ink }}>
              {c.label}{used.includes(c.key) ? ' •' : ''}
            </button>
          ))}
        </div>

        {!cond && <div style={{ ...card, fontSize:14, color:C.gray }}>Pick the pain you're working on to see your plan.</div>}

        {cond && (
          <>
            {/* today */}
            <div style={{ ...card, display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
                <div>
                  <div style={{ fontSize:12, color:C.gray, fontWeight:700 }}>TODAY</div>
                  <div style={{ fontWeight:800, fontSize:17 }}>{a.doneToday ? '✅ Session done' : `${meta.label} session · ${minutes} min`}</div>
                </div>
                <div style={{ textAlign:'center', minWidth:64 }}>
                  <div style={{ fontSize:26, fontWeight:800, lineHeight:1, fontVariantNumeric:'tabular-nums', color: a.streak ? C.saffron : C.gray }}>{a.streak}</div>
                  <div style={{ fontSize:11, color:C.gray, fontWeight:700 }}>day streak</div>
                </div>
              </div>
              <div style={{ fontSize:13, background:toneStyle[0], color:toneStyle[1], borderRadius:10, padding:'10px 12px', lineHeight:1.5 }}>{nd.text}</div>
              {dose.scale < 1 && !a.doneToday && nd.tone !== 'danger' && <div style={{ fontSize:12, color:C.amber }}>Today's reps: {Math.round(dose.scale * 100)}% of your full plan.</div>}
              {nd.tone === 'danger'
                ? <button onClick={onBook} style={btn(C.saffron)}>Book a check with a physiotherapist</button>
                : <button onClick={() => setSession(cond)} style={btn(a.doneToday ? C.forest : C.saffron)}>{a.doneToday ? 'Do another session' : 'Start today’s session ▶'}</button>}
            </div>

            {/* week */}
            <div style={card}>
              <h3 style={h3}>This week</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:6, textAlign:'center' }}>
                {a.week.map((d) => (
                  <div key={d.date}>
                    <div style={{ fontSize:11, color: d.today ? C.ink : C.gray, fontWeight: d.today ? 800 : 600, marginBottom:4 }}>{DOW[d.dow]}</div>
                    <div aria-label={`${d.date}: ${d.done ? 'done' : 'not done'}`}
                      style={{ height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800,
                        background: d.done ? C.forest : '#fff', color:'#fff', border: d.done ? 'none' : `1.5px ${d.today ? 'solid' : 'dashed'} ${d.today ? C.saffron : C.border}` }}>{d.done ? '✓' : ''}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:13, color:C.gray, marginTop:10 }}>
                {sessions.length ? <><b style={{ color:C.ink }}>{a.daysDone} of {a.span} days</b> in the last {a.span === 14 ? 'two weeks' : `${a.span} day${a.span > 1 ? 's' : ''}`} ({a.pct}%) · {sessions.length} session{sessions.length > 1 ? 's' : ''} in total</> : 'Your first session will show up here.'}
              </div>
            </div>

            {/* pain trend */}
            <div style={card}>
              <h3 style={h3}>Pain</h3>
              {p.points.length >= 2 ? (
                <>
                  <LineChart yLabel="Pain score before and after each session, 0 to 10" series={[
                    { name:'Before', color:C.saffron, values: p.points.slice(-14).map((x) => x.before) },
                    { name:'After', color:C.teal, values: p.points.slice(-14).map((x) => x.after), line:false },
                  ]} />
                  <div style={{ display:'flex', gap:14, fontSize:12, color:C.gray, marginTop:6, flexWrap:'wrap' }}>
                    <span><span style={{ display:'inline-block', width:10, height:10, borderRadius:5, background:C.saffron, marginRight:5 }} />Before session</span>
                    <span><span style={{ display:'inline-block', width:10, height:10, borderRadius:5, border:`2px solid ${C.teal}`, marginRight:5 }} />After session</span>
                  </div>
                  {p.change != null && (
                    <div style={{ fontSize:14, marginTop:8, fontWeight:700, color: p.change < 0 ? C.green : p.change > 0 ? C.red : C.ink }}>
                      {p.change < 0 ? `Your usual pain is down ${-p.change} points since you started.` : p.change > 0 ? `Your usual pain is up ${p.change} points. Consider booking a check.` : 'Your pain is steady.'}
                    </div>
                  )}
                </>
              ) : <div style={{ fontSize:13, color:C.gray }}>After two sessions you'll see your pain trend here.</div>}
            </div>

            {/* goal */}
            <div style={card}>
              <h3 style={h3}>My goal</h3>
              {g && (
                <>
                  <div style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>{g.goal}</div>
                  <div style={{ fontSize:13, color:C.gray, marginBottom:8 }}>How well you can do it: <b style={{ color:C.ink }}>{g.first} → {g.last}</b> out of 10{g.change > 0 ? ` (+${g.change})` : ''}</div>
                  {g.points.length >= 2 && <LineChart height={120} yLabel="Goal ability rating over time" series={[{ name:'Goal', color:C.forest, values: g.points.map((x) => x.rating) }]} />}
                </>
              )}
              {(!g || g.due) && (
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop: g ? 12 : 0 }}>
                  {!g && (
                    <>
                      <div style={{ fontSize:14, color:C.gray }}>Pick one everyday activity your pain makes hard. You'll rate it once a week, so you can see it getting easier.</div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {GOALS[cond].map((x) => (
                          <button key={x} onClick={() => setGoalText(x)} aria-pressed={goalText === x}
                            style={{ fontFamily:font, fontSize:12, fontWeight:700, borderRadius:999, padding:'7px 11px', cursor:'pointer', border:`1px solid ${goalText === x ? C.forest : C.border}`, background: goalText === x ? '#EEF4F1' : '#fff', color:C.ink }}>{x}</button>
                        ))}
                      </div>
                      <input id="goal-text" value={goalText} onChange={(e) => setGoalText(e.target.value)} placeholder="Or type your own" maxLength={80}
                        style={{ fontFamily:font, fontSize:14, padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:10 }} />
                    </>
                  )}
                  <div style={{ fontSize:14, fontWeight:700 }}>{g ? 'Weekly check: how well can you do it now?' : 'How well can you do it today?'}</div>
                  <Scale label="Goal ability, 0 to 10" value={goalRating} onChange={setGoalRating} />
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.gray }}><span>Can't do it</span><span>As well as before</span></div>
                  <button onClick={saveGoal} disabled={goalRating == null || !(g?.goal || goalText.trim())}
                    style={btn(goalRating != null && (g?.goal || goalText.trim()) ? C.forest : C.border, goalRating != null && (g?.goal || goalText.trim()) ? '#fff' : C.gray)}>Save</button>
                </div>
              )}
              {g && !g.due && <div style={{ fontSize:12, color:C.gray, marginTop:8 }}>{(() => { const n = 7 - Math.floor((Date.now() - +new Date(g.points[g.points.length - 1].at)) / 86400000); return `Next check-in in ${n} day${n === 1 ? '' : 's'}.` })()}</div>}
            </div>

            {/* milestones */}
            <div style={card}>
              <h3 style={h3}>Milestones · {ms.filter((m) => m.achieved).length}/{ms.length}</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:8 }}>
                {ms.map((m) => (
                  <div key={m.id} style={{ borderRadius:12, padding:10, border:`1px solid ${m.achieved ? C.forest : C.border}`, background: m.achieved ? '#EEF4F1' : '#fff', opacity: m.achieved ? 1 : 0.6 }}>
                    <div style={{ fontSize:20 }} aria-hidden="true">{m.achieved ? m.icon : '🔒'}</div>
                    <div style={{ fontWeight:800, fontSize:13 }}>{m.title}</div>
                    <div style={{ fontSize:11, color:C.gray, lineHeight:1.4 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* reminder */}
            <div style={card}>
              <h3 style={h3}>Daily reminder</h3>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                <label htmlFor="rem-time" style={{ fontSize:14 }}>Remind me at</label>
                <input id="rem-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ fontFamily:font, fontSize:15, padding:'8px 10px', border:`1px solid ${C.border}`, borderRadius:10 }} />
                <button onClick={addReminder} style={btn(C.forest)}>Add to my calendar</button>
              </div>
              {remMsg && <div style={{ fontSize:12, color:C.gray, marginTop:8 }}>{remMsg}</div>}
            </div>

            {/* share */}
            <div style={card}>
              <h3 style={h3}>Share with my physiotherapist</h3>
              {share ? (
                <div style={{ fontSize:14, lineHeight:1.6 }}>
                  ✅ Shared as <b>{share.name}</b> (WhatsApp ending {share.last4}). Your physiotherapist can see your sessions, pain scores and goal ratings between visits.
                  <div style={{ marginTop:10 }}><button onClick={stopShare} disabled={sBusy} style={{ ...btn('#fff', C.red), border:`1px solid ${C.border}` }}>Stop sharing</button></div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ fontSize:13, color:C.gray, lineHeight:1.5 }}>Your physiotherapist can see how you're doing between visits and adjust your plan. Nothing is shared unless you turn this on.</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <input id="share-name" value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Your name" autoComplete="name" style={{ flex:'1 1 140px', minWidth:0, fontFamily:font, fontSize:14, padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:10 }} />
                    <input id="share-phone" value={sPhone} onChange={(e) => setSPhone(e.target.value)} placeholder="WhatsApp number" inputMode="tel" autoComplete="tel" style={{ flex:'1 1 140px', minWidth:0, fontFamily:font, fontSize:14, padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:10 }} />
                  </div>
                  <label style={{ display:'flex', gap:8, fontSize:12, color:C.gray, lineHeight:1.5, alignItems:'flex-start' }}>
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width:18, height:18, marginTop:1, accentColor:C.forest, flexShrink:0 }} />
                    I agree to share my exercise sessions, pain scores and goal ratings with PhysioDrishti physiotherapists, linked to my name and WhatsApp number. I can stop sharing anytime.
                  </label>
                  {sErr && <div style={{ fontSize:12, color:C.red }}>{sErr}</div>}
                  <button onClick={doShare} disabled={!consent || sBusy} style={btn(consent ? C.saffron : C.border, consent ? '#fff' : C.gray)}>{sBusy ? 'Sharing…' : 'Share my progress'}</button>
                </div>
              )}
            </div>

            <div style={{ fontSize:11, color:C.gray, lineHeight:1.5 }}>Your history is saved on this phone. PhysioDrishti receives only anonymous numbers (reps and pain scores) unless you choose to share. Clearing your browser data removes the history on this phone.</div>
          </>
        )}
      </div>

      {session && (
        <GuidedSession condition={session} label={SESSION_CONDITIONS.find((c) => c.key === session)?.label}
          onClose={() => { setSession(null); setTick((t) => t + 1) }}
          onBook={() => { setSession(null); onBook?.() }}
          onProgress={() => { setSession(null); setTick((t) => t + 1) }} />
      )}
    </div>
  )
}

// ── landing page section: pick your pain, or open your progress ─────────────
export function GuidedSessionsSection({ onBook }) {
  const [open, setOpen] = useState(null)        // condition for a session
  const [progress, setProgress] = useState(null) // { condition } when My recovery is open
  const hist = store.get('pd-sessions', [])
  const streak = hist.length ? adherence(hist).streak : 0
  return (
    <section style={{ padding:'64px 5%', background:'#fff' }}>
      <div style={{ maxWidth:1080, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontFamily:font, fontSize:11, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:C.saffron, marginBottom:12 }}>Exercise at home</div>
          <h2 style={{ fontFamily:serif, fontSize:'2rem', fontWeight:900, margin:'0 0 10px', color:C.ink }}>A guided session for your pain</h2>
          <p style={{ fontFamily:font, fontSize:14, color:C.gray, lineHeight:1.7, maxWidth:580, margin:'0 auto' }}>Follow along with Drishti, or let your phone's camera count your reps. Track your streak, pain and goals, and share progress with your physiotherapist. Based on ICMR guidelines and reviewed by our physiotherapist. Video never leaves your phone.</p>
          <button onClick={() => setProgress({})} style={{ ...btn(C.forest), marginTop:16 }}>
            📈 My progress{hist.length ? ` · ${streak}-day streak` : ''}
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
          {SESSION_CONDITIONS.map((c) => (
            <button key={c.key} onClick={() => setOpen(c)}
              style={{ textAlign:'left', background:C.cream, border:`1px solid ${C.border}`, borderRadius:18, padding:16, cursor:'pointer', fontFamily:font, display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ background:'#fff', borderRadius:12, padding:'8px 10px', '--fig-ink':C.ink, '--fig-accent':C.saffron, '--fig-prop':'#C9D4CE' }}
                dangerouslySetInnerHTML={{ __html: figureSvg(c.demo, { animate: true }) }} />
              <div style={{ fontFamily:serif, fontWeight:800, fontSize:18, color:C.forest }}>{c.label}</div>
              <div style={{ fontSize:13, color:C.gray }}>{c.sub}</div>
              <div style={{ fontSize:13, fontWeight:800, color:C.saffron }}>Start session →</div>
            </button>
          ))}
        </div>
      </div>
      {open && <GuidedSession condition={open.key} label={open.label} onClose={() => setOpen(null)}
        onBook={() => { setOpen(null); onBook?.() }} onProgress={() => { const k = open.key; setOpen(null); setProgress({ condition: k }) }} />}
      {progress && <MyRecovery initialCondition={progress.condition} onClose={() => setProgress(null)} onBook={() => { setProgress(null); onBook?.() }} />}
    </section>
  )
}
