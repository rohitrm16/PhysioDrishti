/**
 * Guided home-exercise session (follow-along timer or on-device camera coach).
 * Flow: safety check → pain score → choose mode → exercises → pain score + summary.
 * Only clinician-approved exercises are used (from /api/exercises or the chat card).
 * Camera video is processed on the phone and never uploaded.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { figureSvg, figureCaption } from './exerciseFigures.js'
import { TRACKING, canTrack, loadPoseLandmarker, createRepCounter, visible, drawSkeleton } from './poseTracker.js'
import { nextScale, scaledReps } from './recovery.js'

const C = { forest:'#12382A', saffron:'#D4510E', teal:'#0A6B5E', mint:'#3FE08F', ink:'#0D1520', gray:'#5C6878', light:'#F3F6FA', border:'#DDE4EF', red:'#B23131', redSoft:'#F8E3E3', green:'#177A45', greenSoft:'#E3F3EA', cream:'#FDFAF3' }
const font = "'Plus Jakarta Sans', system-ui, sans-serif"
const serif = "'Playfair Display', Georgia, serif"

export const SESSION_CONDITIONS = [
  { key:'knee_osteoarthritis', label:'Knee pain', sub:'Age-related knee pain or stiffness', icon:'🦵', demo:'straight_leg_raise' },
  { key:'hip_osteoarthritis',  label:'Hip pain',  sub:'Hip or groin pain with stiffness',  icon:'🚶', demo:'bridge' },
  { key:'low_back_pain',       label:'Lower back pain', sub:'Everyday back ache, no injury', icon:'🧘', demo:'bird_dog' },
  { key:'neck_pain',           label:'Neck pain', sub:'Stiff neck from desk or phone use', icon:'💻', demo:'chin_tuck' },
]

const SIDE_LABELS = { 2: ['Left side', 'Right side'], 4: ['Front', 'Back', 'Left side', 'Right side'] }
const firstInt = (s, d) => { const m = String(s || '').match(/\d+/); return m ? Number(m[0]) : d }

// Exercises -> ordered steps (one per side), skipping anything not meant for a timed session
export function buildSteps(exercises, scale = 1) {
  const steps = []
  for (const e of exercises || []) {
    const full = e.reps ?? firstInt(e.dose, 8)
    if (!full) continue
    const reps = scaledReps(full, scale)
    const hold = e.hold_seconds ?? 3
    const sides = SIDE_LABELS[e.sides] ? e.sides : 1
    for (let i = 0; i < sides; i++) {
      steps.push({ ex: e, reps, hold, side: sides > 1 ? SIDE_LABELS[sides][i] : null, trackSide: sides === 2 ? (i === 0 ? 'left' : 'right') : 'left' })
    }
  }
  return steps
}

export const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private mode */ } },
}
export function deviceId() {
  let id = store.get('pd-device', null)
  if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)); store.set('pd-device', id) }
  return id
}

function useVoice() {
  const [on, setOn] = useState(true)
  const say = useCallback((text) => {
    if (!on || !('speechSynthesis' in window)) return
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      const v = window.speechSynthesis.getVoices().find((x) => /en[-_]IN/i.test(x.lang))
      if (v) u.voice = v
      u.rate = 0.95
      window.speechSynthesis.speak(u)
    } catch { /* ignore */ }
  }, [on])
  useEffect(() => () => { try { window.speechSynthesis.cancel() } catch { /* ignore */ } }, [])
  return { on, setOn, say }
}

const btn = (bg, fg = '#fff') => ({ fontFamily:font, fontWeight:800, fontSize:15, background:bg, color:fg, border:'none', borderRadius:12, padding:'14px 18px', cursor:'pointer' })

function PainScale({ value, onChange, label }) {
  return (
    <div>
      <div style={{ fontFamily:font, fontWeight:700, fontSize:15, color:C.ink, marginBottom:10 }}>{label}</div>
      <div role="radiogroup" aria-label={label} style={{ display:'grid', gridTemplateColumns:'repeat(11, 1fr)', gap:4 }}>
        {Array.from({ length: 11 }, (_, n) => {
          const hue = 140 - n * 13
          return (
            <button key={n} role="radio" aria-checked={value === n} onClick={() => onChange(n)}
              style={{ fontFamily:font, fontWeight:800, fontSize:14, padding:'10px 0', borderRadius:8, cursor:'pointer',
                border: value === n ? `2px solid ${C.ink}` : `1px solid ${C.border}`,
                background: value === n ? `hsl(${hue} 60% 45%)` : `hsl(${hue} 60% 95%)`, color: value === n ? '#fff' : C.ink }}>{n}</button>
          )
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontFamily:font, fontSize:11, color:C.gray, marginTop:4 }}><span>No pain</span><span>Worst pain</span></div>
    </div>
  )
}

const SCREEN_QS = [
  { key:'urgent', q:'Do you have any of these right now?', items:['Numbness around the groin or buttocks','Loss of bladder or bowel control','New weakness in an arm or leg','Fever, or unexplained weight loss with the pain','Chest pain or trouble breathing','Severe pain after a fall or accident'] },
  { key:'surgery', q:'In the last 3 months, have you had any of these?', items:['Surgery on this area','A fracture or broken bone','A new injury that has not been checked'] },
  { key:'pregnant', q:'Are you pregnant, or did you give birth in the last 6 weeks?', items:[] },
]

export default function GuidedSession({ condition, label, exercises: given, onClose, onBook, onProgress }) {
  const [screen, setScreen] = useState('screen')       // screen | blocked | pain | setup | play | done
  const [answers, setAnswers] = useState({})
  const [blockReason, setBlockReason] = useState(null)
  const [data, setData] = useState(given ? { ok: true, exercises: given, label } : null)
  const [loadErr, setLoadErr] = useState('')
  const [painBefore, setPainBefore] = useState(null)
  const [painAfter, setPainAfter] = useState(null)
  const [useCamera, setUseCamera] = useState(false)
  const [result, setResult] = useState(null)            // { done:[...], stoppedForPain, mode, seconds }
  const [saved, setSaved] = useState(false)
  const voice = useVoice()
  const title = label || data?.label || 'Home exercises'

  useEffect(() => {
    if (given) return
    let alive = true
    fetch('/api/recovery?action=exercises&condition=' + encodeURIComponent(condition))
      .then((r) => r.json()).then((j) => { if (alive) setData(j) })
      .catch(() => { if (alive) setLoadErr('Could not load exercises. Please check your internet and try again.') })
    return () => { alive = false }
  }, [condition, given])

  useEffect(() => {  // lock page scroll behind the overlay
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const dose = useMemo(() => nextScale(store.get('pd-sessions', []).filter((h) => h.condition === condition)), [condition])
  const steps = useMemo(() => buildSteps(data?.exercises, dose.scale), [data, dose])
  const walk = (data?.exercises || []).find((e) => (e.reps ?? 1) === 0)
  const anyTrackable = steps.some((s) => canTrack(s.ex.slug))
  const history = store.get('pd-sessions', []).filter((h) => h.condition === condition)
  const last = history[history.length - 1]

  const submitScreen = () => {
    if (answers.urgent) { setBlockReason('urgent'); setScreen('blocked') }
    else if (answers.surgery || answers.pregnant) { setBlockReason('clearance'); setScreen('blocked') }
    else setScreen('pain')
  }

  // The session is recorded on this phone as soon as it ends (so closing early never loses it),
  // then updated with the pain score. One anonymous summary is sent to the server.
  const entryId = useRef(null), posted = useRef(false)
  const finish = (r) => {
    setResult(r); setScreen('done'); try { window.speechSynthesis.cancel() } catch { /* ignore */ }
    entryId.current = String(Date.now())
    const entry = { id: entryId.current, at: new Date().toISOString(), condition, pain_before: painBefore, pain_after: null, stopped: r.stoppedForPain,
      items: r.done.map((d) => ({ slug: d.slug, target: d.target, done: d.done })), scale: dose.scale, seconds: r.seconds, mode: r.mode }
    store.set('pd-sessions', [...store.get('pd-sessions', []), entry].slice(-120))
  }
  const post = (after) => {
    if (posted.current || !result) return
    posted.current = true
    fetch('/api/recovery', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({
      action:'session', device_id: deviceId(), condition, mode: result.mode, items: result.done.map((d) => ({ slug: d.slug, target: d.target, done: d.done })),
      pain_before: painBefore, pain_after: after, stopped_for_pain: result.stoppedForPain, duration_s: result.seconds, rep_scale: dose.scale,
    }) }).catch(() => { /* offline is fine: it is kept on this phone */ })
  }
  const save = () => {
    store.set('pd-sessions', store.get('pd-sessions', []).map((e) => (e.id === entryId.current ? { ...e, pain_after: painAfter } : e)))
    setSaved(true); post(painAfter)
  }
  const close = () => { if (screen === 'done') post(saved ? painAfter : null); onClose() }

  const answered = SCREEN_QS.every((s) => typeof answers[s.key] === 'boolean')

  return (
    <div role="dialog" aria-modal="true" aria-label={'Guided session: ' + title}
      style={{ position:'fixed', inset:0, zIndex:2000, background:C.cream, overflowY:'auto', fontFamily:font, color:C.ink,
        paddingTop:'env(safe-area-inset-top, 0px)', paddingBottom:'env(safe-area-inset-bottom, 0px)' }}>
      <div style={{ maxWidth:560, margin:'0 auto', padding:'14px max(16px, env(safe-area-inset-left, 0px)) 28px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:14 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:C.saffron }}>Guided session</div>
            <div style={{ fontFamily:serif, fontWeight:900, fontSize:22, color:C.forest }}>{title}</div>
          </div>
          <button onClick={close} aria-label="Close session" style={{ ...btn('#fff', C.ink), border:`1px solid ${C.border}`, padding:'8px 12px', fontSize:14 }}>✕</button>
        </div>

        {screen === 'screen' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <p style={{ margin:0, fontSize:14, color:C.gray, lineHeight:1.6 }}>A quick safety check before you start. These exercises follow Indian national guidelines and were reviewed by our physiotherapist. They are general guidance, not a personal prescription.</p>
            {SCREEN_QS.map((s) => (
              <div key={s.key} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:14 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom: s.items.length ? 6 : 10 }}>{s.q}</div>
                {s.items.length > 0 && <ul style={{ margin:'0 0 10px', paddingLeft:18, fontSize:13, color:C.gray, lineHeight:1.6 }}>{s.items.map((i) => <li key={i}>{i}</li>)}</ul>}
                <div style={{ display:'flex', gap:8 }}>
                  {[[true, 'Yes'], [false, 'No']].map(([v, t]) => (
                    <button key={t} onClick={() => setAnswers({ ...answers, [s.key]: v })} aria-pressed={answers[s.key] === v}
                      style={{ ...btn(answers[s.key] === v ? (v ? C.red : C.forest) : '#fff', answers[s.key] === v ? '#fff' : C.ink), border:`1px solid ${C.border}`, flex:1, padding:'10px' }}>{t}</button>
                  ))}
                </div>
              </div>
            ))}
            <button disabled={!answered} onClick={submitScreen} style={{ ...btn(answered ? C.saffron : C.border, answered ? '#fff' : C.gray), cursor: answered ? 'pointer' : 'default' }}>Continue</button>
          </div>
        )}

        {screen === 'blocked' && (
          <div style={{ background: blockReason === 'urgent' ? C.redSoft : '#fff', border:`1px solid ${blockReason === 'urgent' ? C.red : C.border}`, borderRadius:14, padding:18, lineHeight:1.6 }}>
            {blockReason === 'urgent' ? (
              <>
                <div style={{ fontWeight:800, fontSize:17, color:C.red, marginBottom:6 }}>Please don't exercise. Get medical help first.</div>
                <p style={{ margin:'0 0 12px', fontSize:14 }}>Some of what you ticked can need urgent attention. Please contact a doctor now, or call <b>112</b> (India emergency number).</p>
              </>
            ) : (
              <>
                <div style={{ fontWeight:800, fontSize:17, color:C.forest, marginBottom:6 }}>Let's get you assessed first</div>
                <p style={{ margin:'0 0 12px', fontSize:14 }}>After recent surgery, a fracture, a new injury, or during pregnancy, exercises need to be set by your doctor or a physiotherapist after an assessment. A general routine could set your recovery back.</p>
                <button onClick={onBook} style={btn(C.saffron)}>Book a session</button>
              </>
            )}
          </div>
        )}

        {screen === 'pain' && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {!data && !loadErr && <div style={{ fontSize:14, color:C.gray }}>Loading your exercises…</div>}
            {loadErr && <div style={{ fontSize:14, color:C.red }}>{loadErr}</div>}
            {data && !data.ok && (
              <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:16, fontSize:14, lineHeight:1.6 }}>
                <b>These exercises are waiting for our physiotherapist's review.</b> We only show exercises a registered physiotherapist has approved. Meanwhile, you can book a free call.
                <div style={{ marginTop:12 }}><button onClick={onBook} style={btn(C.saffron)}>Book a free call</button></div>
              </div>
            )}
            {data?.ok && (
              <>
                <PainScale label="How bad is your pain right now?" value={painBefore} onChange={setPainBefore} />
                {last && <div style={{ fontSize:13, color:C.gray }}>Last session: pain {last.pain_before ?? '–'} before, {last.pain_after ?? '–'} after.</div>}
                {painBefore >= 8 && <div style={{ fontSize:13, background:C.redSoft, color:C.red, borderRadius:10, padding:'10px 12px' }}>Your pain is high today. Rest instead, and book a session if it does not ease in a day or two.</div>}
                <button disabled={painBefore == null || painBefore >= 8} onClick={() => setScreen('setup')}
                  style={{ ...btn(painBefore != null && painBefore < 8 ? C.saffron : C.border, painBefore != null && painBefore < 8 ? '#fff' : C.gray) }}>Next</button>
              </>
            )}
          </div>
        )}

        {screen === 'setup' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {dose.reason && <div style={{ fontSize:13, background:'#FBF0D9', color:'#7A4E00', borderRadius:10, padding:'10px 12px' }}>{dose.reason} {dose.scale < 1 && `(${Math.round(dose.scale * 100)}% of the full plan)`}</div>}
            <div style={{ fontWeight:700, fontSize:15 }}>Today's session · {steps.length} sets · about {Math.max(5, Math.round(steps.reduce((t, s) => t + s.reps * (s.hold + 5), 0) / 60))} minutes</div>
            <ol style={{ margin:0, paddingLeft:20, fontSize:14, lineHeight:1.8 }}>
              {(data.exercises || []).filter((e) => (e.reps ?? 1) !== 0).map((e) => (
                <li key={e.slug}>{e.name}{canTrack(e.slug) && <span style={{ fontSize:11, fontWeight:800, color:C.teal, marginLeft:6 }}>📷 camera counts reps</span>}</li>
              ))}
            </ol>
            <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:14 }}>
              <label style={{ display:'flex', gap:10, alignItems:'flex-start', cursor: anyTrackable ? 'pointer' : 'default', opacity: anyTrackable ? 1 : .5 }}>
                <input type="checkbox" checked={useCamera} disabled={!anyTrackable} onChange={(e) => setUseCamera(e.target.checked)} style={{ width:20, height:20, marginTop:2, accentColor:C.forest }} />
                <span>
                  <b style={{ fontSize:15 }}>Use the camera coach</b>
                  <span style={{ display:'block', fontSize:13, color:C.gray, lineHeight:1.5 }}>Your phone tracks your movement and counts reps. Video stays on your phone and is never uploaded. Prop the phone up side-on, about 2 metres away.</span>
                </span>
              </label>
            </div>
            <label style={{ display:'flex', gap:10, alignItems:'center', fontSize:14 }}>
              <input type="checkbox" checked={voice.on} onChange={(e) => voice.setOn(e.target.checked)} style={{ width:18, height:18, accentColor:C.forest }} /> Spoken coaching
            </label>
            <button onClick={() => setScreen('play')} style={btn(C.saffron)}>Start session ▶</button>
          </div>
        )}

        {screen === 'play' && <Player steps={steps} useCamera={useCamera} voice={voice} onFinish={finish} />}

        {screen === 'done' && result && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {result.stoppedForPain ? (
              <div style={{ background:C.redSoft, border:`1px solid ${C.red}`, borderRadius:14, padding:16, fontSize:14, lineHeight:1.6 }}>
                <b style={{ color:C.red }}>You stopped because of pain. That was the right call.</b><br />
                Rest for today. If the pain is severe, or you feel numbness, tingling or weakness, contact a doctor. A physiotherapist can adjust these exercises for you.
              </div>
            ) : (
              <div style={{ background:C.greenSoft, borderRadius:14, padding:16, fontSize:15, fontWeight:700, color:C.green }}>Session complete. Well done! 🎉</div>
            )}
            <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:14 }}>
              {result.done.map((d) => (
                <div key={d.key} style={{ display:'flex', justifyContent:'space-between', fontSize:14, padding:'6px 0', borderBottom:`1px solid ${C.light}` }}>
                  <span>{d.name}{d.side ? ` · ${d.side}` : ''}</span>
                  <b style={{ fontVariantNumeric:'tabular-nums', color: d.done >= d.target ? C.green : C.gray }}>{d.done} / {d.target}</b>
                </div>
              ))}
              {walk && <div style={{ fontSize:13, color:C.gray, marginTop:8 }}>Also today: {walk.name}. {walk.dose}</div>}
            </div>
            {!saved ? (
              <>
                <PainScale label="And how is your pain now?" value={painAfter} onChange={setPainAfter} />
                <button disabled={painAfter == null} onClick={save} style={btn(painAfter != null ? C.forest : C.border, painAfter != null ? '#fff' : C.gray)}>Save my progress</button>
              </>
            ) : (
              <div style={{ fontSize:14, lineHeight:1.6, background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:14 }}>
                <b>Pain: {painBefore} before → {painAfter} after.</b>{' '}
                {painAfter >= painBefore + 2
                  ? 'Your pain went up. Next time do fewer reps, and book a session if it stays higher tomorrow.'
                  : painAfter < painBefore ? 'Your pain eased. Keep going as advised.' : 'Mild soreness is normal. Keep going as advised.'}
                <div style={{ fontSize:12, color:C.gray, marginTop:6 }}>Saved on this phone. Only anonymous numbers (reps and pain scores) are sent to PhysioDrishti.</div>
              </div>
            )}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button onClick={() => { post(saved ? painAfter : null); onBook() }} style={{ ...btn(C.saffron), flex:1 }}>Book a session</button>
              {onProgress && saved && <button onClick={() => { post(painAfter); onProgress() }} style={{ ...btn(C.forest), flex:'1 1 100%' }}>📈 See my progress</button>}
              <button onClick={close} style={{ ...btn('#fff', C.ink), border:`1px solid ${C.border}`, flex:1 }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── the exercise player ─────────────────────────────────────────────────────
function Player({ steps, useCamera, voice, onFinish }) {
  const [i, setI] = useState(0)
  const [reps, setReps] = useState(0)
  const [phase, setPhase] = useState('ready')         // ready | move | hold | release | rest
  const [holdLeft, setHoldLeft] = useState(0)
  const [paused, setPaused] = useState(false)
  const [cue, setCue] = useState('')
  const [camState, setCamState] = useState(useCamera ? 'starting' : 'off')  // off | starting | on | failed
  const [meter, setMeter] = useState(0)                // 0..1 how close to the working position
  const doneRef = useRef([])
  const startedAt = useRef(Date.now())
  const videoRef = useRef(null), canvasRef = useRef(null), streamRef = useRef(null), counterRef = useRef(null), lastCueRef = useRef(0)
  const step = steps[i]
  const camThis = camState === 'on' && canTrack(step?.ex.slug)
  const { say } = voice

  const record = useCallback((count) => {
    doneRef.current = [...doneRef.current.filter((d) => d.key !== i), { key: i, slug: step.ex.slug, name: step.ex.name, side: step.side, target: step.reps, done: count }]
  }, [i, step])

  const next = useCallback((count) => {
    record(count)
    if (i + 1 >= steps.length) {
      onFinish({ done: doneRef.current, stoppedForPain: false, mode: useCamera ? (camState === 'on' ? 'camera' : 'follow') : 'follow', seconds: Math.round((Date.now() - startedAt.current) / 1000) })
      return
    }
    setI(i + 1); setReps(0); setPhase('ready'); setHoldLeft(0)
  }, [i, steps.length, record, onFinish, useCamera, camState])

  const stopForPain = () => {
    record(reps)
    onFinish({ done: doneRef.current, stoppedForPain: true, mode: camState === 'on' ? 'camera' : 'follow', seconds: Math.round((Date.now() - startedAt.current) / 1000) })
  }

  // Announce each new set
  useEffect(() => {
    if (!step) return
    const text = `${step.ex.name}${step.side ? ', ' + step.side.toLowerCase() : ''}. ${step.reps} reps.`
    setCue(camThis ? TRACKING[step.ex.slug].setup : figureCaption(step.ex.slug) || step.ex.purpose)
    say(text)
    counterRef.current = canTrack(step.ex.slug) ? createRepCounter({ ...TRACKING[step.ex.slug], holdMs: step.hold * 1000 }) : null
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── follow-along timer ──
  useEffect(() => {
    if (!step || camThis || paused) return
    const t = { ready: 2500, move: 2000, hold: 1000, release: 2000, rest: step.hold >= 15 ? 3000 : 1000 }[phase]
    const id = setTimeout(() => {
      if (phase === 'ready') { setPhase('move'); setCue('Move slowly into position'); say('Go') }
      else if (phase === 'move') { setPhase('hold'); setHoldLeft(step.hold); setCue(`Hold… ${step.hold}`); say('Hold') }
      else if (phase === 'hold') {
        if (holdLeft > 1) { setHoldLeft(holdLeft - 1); setCue(`Hold… ${holdLeft - 1}`) }
        else { setPhase('release'); setHoldLeft(0); setCue('Slowly come back'); say('And relax') }
      } else if (phase === 'release') { setPhase('rest'); const n = reps + 1; setReps(n); setCue(`${n} of ${step.reps}`); if (n < step.reps) say(String(n)) }
      else if (phase === 'rest') {
        if (reps >= step.reps) next(reps)
        else { setPhase('move'); setCue('Move slowly into position') }
      }
    }, t)
    return () => clearTimeout(id)
  }, [phase, holdLeft, paused, camThis, reps, step, next, say])

  // ── camera: start once ──
  useEffect(() => {
    if (!useCamera) return
    let cancelled = false
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}) }
        await loadPoseLandmarker()
        if (!cancelled) setCamState('on')
      } catch (e) {
        console.warn('Camera coach unavailable:', e)
        if (!cancelled) { setCamState('failed'); setCue('Camera coach could not start, so we will count for you instead.') }
      }
    })()
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((t) => t.stop()) }
  }, [useCamera])

  // ── camera: per-frame tracking ──
  useEffect(() => {
    if (!camThis || paused) return
    let raf, alive = true
    const spec = TRACKING[step.ex.slug]
    ;(async () => {
      const landmarker = await loadPoseLandmarker()
      const loop = () => {
        if (!alive) return
        const v = videoRef.current, cv = canvasRef.current
        if (v && cv && v.readyState >= 2) {
          if (cv.width !== v.videoWidth) { cv.width = v.videoWidth; cv.height = v.videoHeight }
          const now = performance.now()
          const res = landmarker.detectForVideo(v, now)
          const lm = res.landmarks?.[0]
          drawSkeleton(cv.getContext('2d'), lm, cv.width, cv.height)
          if (!lm || !visible(lm, spec.needs(step.trackSide))) {
            if (now - lastCueRef.current > 4000) { setCue(spec.setup); lastCueRef.current = now }
          } else {
            const val = spec.metric(lm, step.trackSide)
            const span = spec.up - spec.down
            setMeter(Math.max(0, Math.min(1, (val - spec.down) / span)))
            const r = counterRef.current.update(val, now)
            setHoldLeft(r.holdLeft)
            if (r.event === 'reached') { setCue(step.hold ? `Hold… ${step.hold}` : 'Good. Now come back slowly'); say('Hold') }
            else if (r.event === 'held') { setCue('Good. Now come back slowly'); say('Relax') }
            else if (r.event === 'early') { setCue('Hold a little longer at the top'); say('Hold a little longer') }
            else if (r.event === 'rep') {
              setReps(r.reps); setCue(`${r.reps} of ${step.reps}`); say(String(r.reps))
              if (r.reps >= step.reps) { alive = false; setTimeout(() => next(r.reps), 900); return }
            } else if (r.phase === 'up' && r.holdLeft) setCue(`Hold… ${r.holdLeft}`)
            else if (r.phase === 'down' && now - lastCueRef.current > 6000 && val > spec.down + span * 0.4) { setCue(spec.low); lastCueRef.current = now }
          }
        }
        raf = requestAnimationFrame(loop)
      }
      loop()
    })()
    return () => { alive = false; cancelAnimationFrame(raf) }
  }, [camThis, paused, i]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!step) return null
  const pct = Math.round(((i + reps / step.reps) / steps.length) * 100)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* set progress */}
      <div style={{ display:'flex', gap:4 }} aria-label={`Set ${i + 1} of ${steps.length}`}>
        {steps.map((_, k) => <div key={k} style={{ flex:1, height:6, borderRadius:6, background: k < i ? C.forest : k === i ? C.saffron : C.border }} />)}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8 }}>
        <div style={{ fontWeight:800, fontSize:17 }}>{step.ex.name}{step.side && <span style={{ color:C.gray, fontWeight:600, fontSize:14 }}> · {step.side}</span>}</div>
        <div style={{ fontSize:12, color:C.gray, whiteSpace:'nowrap' }}>Set {i + 1}/{steps.length}</div>
      </div>

      {useCamera && camState === 'failed' && (
        <div role="status" style={{ fontSize:12, background:'#FBF0D9', color:'#7A4E00', borderRadius:10, padding:'8px 10px' }}>
          The camera coach couldn't start on this device, so Drishti is counting for you. Follow the figure.
        </div>
      )}
      {/* coach bubble */}
      <div aria-live="polite" style={{ display:'flex', gap:10, alignItems:'center', background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:'10px 12px', boxShadow:'0 4px 14px rgba(18,56,42,.06)' }}>
        <div aria-hidden="true" style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background:`conic-gradient(${C.saffron}, ${C.forest}, ${C.saffron})` }} />
        <div style={{ fontSize:15, fontWeight:600 }}>{cue}</div>
      </div>

      {/* stage: camera with skeleton, or animated figure */}
      <div style={{ position:'relative', borderRadius:18, overflow:'hidden', background: camThis ? '#000' : '#fff', border:`1px solid ${C.border}`, aspectRatio: camThis ? '4 / 3' : 'auto', maxWidth:'100%' }}>
        {useCamera && camState !== 'failed' && (
          <video ref={videoRef} playsInline muted aria-label="Your camera, mirrored"
            style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)', display: camThis ? 'block' : 'none' }} />
        )}
        {camThis && <canvas ref={canvasRef} aria-hidden="true" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} />}
        {!camThis && (
          <div style={{ padding:'14px 12px 6px', '--fig-ink':C.ink, '--fig-accent':C.saffron, '--fig-prop':'#C9D4CE' }}
            dangerouslySetInnerHTML={{ __html: figureSvg(step.ex.slug, { animate: !paused }) }} />
        )}
        {camThis && (
          <div aria-hidden="true" style={{ position:'absolute', left:12, bottom:64, display:'flex', flexDirection:'column-reverse', gap:4 }}>
            {[0.25, 0.5, 0.75, 1].map((t) => (
              <div key={t} style={{ width:44, height:16, clipPath:'polygon(0 100%, 50% 30%, 100% 100%, 100% 70%, 50% 0, 0 70%)', background: meter >= t - 0.01 ? C.mint : 'rgba(255,255,255,.85)' }} />
            ))}
          </div>
        )}
        {useCamera && camState === 'starting' && <div style={{ position:'absolute', top:10, left:10, right:10, fontSize:12, background:'rgba(255,255,255,.92)', borderRadius:8, padding:'6px 10px' }}>Starting camera coach…</div>}
        {/* rep counter */}
        <div style={{ position: camThis ? 'absolute' : 'static', left:0, right:0, bottom:8, textAlign:'center', padding: camThis ? 0 : '0 0 12px', color: camThis ? '#fff' : C.ink, textShadow: camThis ? '0 2px 8px rgba(0,0,0,.6)' : 'none' }}>
          <span style={{ fontSize:46, fontWeight:800, fontVariantNumeric:'tabular-nums' }}>{reps}</span>
          <span style={{ fontSize:24, fontWeight:600, opacity:.8 }}>/{step.reps}</span>
          {holdLeft > 0 && <div style={{ fontSize:13, fontWeight:700 }}>hold {holdLeft}s</div>}
        </div>
      </div>

      <div style={{ height:6, background:C.border, borderRadius:6, overflow:'hidden' }}><div style={{ width:pct + '%', height:'100%', background:C.forest, transition:'width .4s' }} /></div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <button onClick={() => setPaused(!paused)} style={{ ...btn('#fff', C.ink), border:`1px solid ${C.border}`, flex:1 }}>{paused ? '▶ Resume' : '❚❚ Pause'}</button>
        <button onClick={() => next(reps)} style={{ ...btn('#fff', C.ink), border:`1px solid ${C.border}`, flex:1 }}>Skip ⏭</button>
      </div>
      <button onClick={stopForPain} style={btn(C.red)}>Stop: this hurts</button>
      <div style={{ fontSize:12, color:C.gray, lineHeight:1.5 }}>
        <b>How much:</b> {step.ex.dose} <span style={{ color:C.red }}>⚠️ {step.ex.stop_if}</span>
      </div>
    </div>
  )
}
