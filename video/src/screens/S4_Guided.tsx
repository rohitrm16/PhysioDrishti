import React from 'react'
import { interpolate } from 'remotion'

const F = '#12382A', T = '#0A6B5E', S = '#D4510E', CRM = '#FDFAF3', GY = '#5C6878'

// Skeleton SVG overlay for camera coach
const SkeletonFigure: React.FC<{ repProgress: number }> = ({ repProgress }) => {
  // Animate arms down: simulating quad set / leg raise
  const legLift = Math.sin(repProgress * Math.PI) * 30
  const bodyBob = Math.sin(repProgress * Math.PI) * 2

  return (
    <svg width="100%" height="100%" viewBox="0 0 200 320" style={{ position: 'absolute', inset: 0 }}>
      {/* teal skeleton points */}
      {/* head */}
      <circle cx={100} cy={40 + bodyBob} r={16} fill="none" stroke={T} strokeWidth={3} opacity={0.9} />
      {/* neck */}
      <line x1={100} y1={56 + bodyBob} x2={100} y2={76 + bodyBob} stroke={T} strokeWidth={3} />
      {/* shoulders */}
      <line x1={56} y1={76 + bodyBob} x2={144} y2={76 + bodyBob} stroke={T} strokeWidth={3} />
      {/* left arm */}
      <line x1={56} y1={76 + bodyBob} x2={42} y2={120 + bodyBob} stroke={T} strokeWidth={2.5} />
      <line x1={42} y1={120 + bodyBob} x2={36} y2={148 + bodyBob} stroke={T} strokeWidth={2.5} />
      {/* right arm */}
      <line x1={144} y1={76 + bodyBob} x2={158} y2={120 + bodyBob} stroke={T} strokeWidth={2.5} />
      <line x1={158} y1={120 + bodyBob} x2={164} y2={148 + bodyBob} stroke={T} strokeWidth={2.5} />
      {/* torso */}
      <line x1={100} y1={76 + bodyBob} x2={100} y2={160 + bodyBob} stroke={T} strokeWidth={3} />
      {/* hips */}
      <line x1={72} y1={160 + bodyBob} x2={128} y2={160 + bodyBob} stroke={T} strokeWidth={3} />
      {/* left leg static */}
      <line x1={72} y1={160 + bodyBob} x2={66} y2={232 + bodyBob} stroke={T} strokeWidth={2.5} />
      <line x1={66} y1={232 + bodyBob} x2={62} y2={292 + bodyBob} stroke={T} strokeWidth={2.5} />
      {/* right leg animated */}
      <line x1={128} y1={160 + bodyBob}
        x2={128 + Math.sin(legLift * Math.PI / 180) * 20}
        y2={160 + bodyBob + Math.cos(legLift * Math.PI / 180) * 72}
        stroke={S} strokeWidth={3} />
      <line
        x1={128 + Math.sin(legLift * Math.PI / 180) * 20}
        y1={160 + bodyBob + Math.cos(legLift * Math.PI / 180) * 72}
        x2={128 + Math.sin(legLift * Math.PI / 180) * 10}
        y2={160 + bodyBob + Math.cos(legLift * Math.PI / 180) * 72 + 56}
        stroke={S} strokeWidth={3} />
      {/* joint dots */}
      {[
        [100, 40 + bodyBob], [100, 76 + bodyBob], [56, 76 + bodyBob], [144, 76 + bodyBob],
        [72, 160 + bodyBob], [128, 160 + bodyBob], [66, 232 + bodyBob],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={5} fill={T} opacity={0.8} />
      ))}
    </svg>
  )
}

// Pain rating slider
const PainSlider: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const pct = (value / 10) * 100
  const color = value <= 3 ? '#059669' : value <= 6 ? S : '#dc2626'
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: F, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: GY, width: 20 }}>0</span>
        <div style={{ flex: 1, height: 8, background: '#DDE4EF', borderRadius: 4, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
          <div style={{
            position: 'absolute', top: '50%', left: `${pct}%`, transform: 'translate(-50%, -50%)',
            width: 18, height: 18, borderRadius: '50%', background: color, border: '2px solid #fff',
            boxShadow: `0 2px 6px ${color}66`
          }} />
        </div>
        <span style={{ fontSize: 10, color: GY, width: 20, textAlign: 'right' }}>10</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color }}>
        {value}<span style={{ fontSize: 13, fontWeight: 400, color: GY }}>/10</span>
      </div>
    </div>
  )
}

export const S4_Guided: React.FC<{ progress: number }> = ({ progress }) => {
  // 4 phases: 0-25% safety, 25-50% pain before, 50-80% camera, 80-100% done
  const phase = progress < 0.25 ? 'safety' : progress < 0.50 ? 'pain_before' : progress < 0.82 ? 'camera' : 'done'

  const phaseProg = phase === 'safety' ? progress / 0.25
    : phase === 'pain_before' ? (progress - 0.25) / 0.25
    : phase === 'camera' ? (progress - 0.50) / 0.32
    : (progress - 0.82) / 0.18

  const repNum = Math.min(5, Math.floor(phaseProg * 5) + 1)
  const repFrac = (phaseProg * 5) % 1

  return (
    <div style={{ width: 280, height: 520, background: CRM, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      {/* Status + header */}
      <div style={{ background: F, padding: '10px 14px 0', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>9:41</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>●●●</span>
      </div>
      <div style={{ background: F, padding: '8px 14px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: T, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏃</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'Georgia, serif' }}>Guided Session</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Knee Strengthening · 3 exercises</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
          {phase === 'safety' ? 'Step 1 of 4' : phase === 'pain_before' ? 'Step 2 of 4' : phase === 'camera' ? 'Step 3 of 4' : 'Complete!'}
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* SAFETY CHECK */}
        {phase === 'safety' && (
          <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 800, color: F, marginBottom: 2 }}>Quick safety check</div>
            <div style={{ fontSize: 10, color: GY, marginBottom: 4 }}>Are any of these true right now?</div>
            {[
              { q: 'Severe pain, numbness, or tingling down your leg', icon: '⚡' },
              { q: 'You had surgery in the last 3 months', icon: '🏥' },
              { q: 'Chest pain or shortness of breath', icon: '🫀' },
            ].map((item, i) => {
              const isChecked = phaseProg > 0.25 + i * 0.2
              return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid #DDE4EF' }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <div style={{ flex: 1, fontSize: 10, color: '#1a1a2e', lineHeight: 1.4 }}>{item.q}</div>
                  <div style={{
                    width: 44, height: 22, borderRadius: 11,
                    background: isChecked ? '#DDE4EF' : '#DDE4EF',
                    position: 'relative', flexShrink: 0
                  }}>
                    <div style={{
                      position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      left: isChecked ? 2 : 24, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'left 0.3s',
                    }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: GY, minWidth: 18 }}>No</span>
                </div>
              )
            })}
            {phaseProg > 0.9 && (
              <div style={{ background: '#F0FAF4', border: '1px solid #B2DFCB', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: F }}>All clear! You're good to go.</div>
                  <div style={{ fontSize: 9, color: GY }}>Starting in a moment…</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAIN BEFORE */}
        {phase === 'pain_before' && (
          <div style={{ padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 800, color: F }}>Pain before session</div>
            <PainSlider value={4} label="How is your knee right now?" />
            <div style={{ fontSize: 10, color: GY, lineHeight: 1.5, background: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid #DDE4EF' }}>
              💡 Pain at 4/10 is a good level to exercise. We'll keep movements gentle. Stop if it rises above 6/10.
            </div>
            <button style={{ background: F, border: 'none', borderRadius: 20, padding: '10px', fontSize: 11, fontWeight: 700, color: '#fff', marginTop: 8 }}>
              Start Exercises →
            </button>
          </div>
        )}

        {/* CAMERA COACH */}
        {phase === 'camera' && (
          <div style={{ position: 'absolute', inset: 0, background: '#1a1a2e' }}>
            {/* Simulated camera feed - dark with green tint */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0d1f14, #1a2e1a)', opacity: 0.9 }} />
            {/* Skeleton overlay */}
            <SkeletonFigure repProgress={repFrac} />
            {/* Top overlay - exercise name */}
            <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '5px 10px' }}>
                <div style={{ fontSize: 9, color: T, fontWeight: 700 }}>Straight Leg Raise</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>Exercise 2 of 3</div>
              </div>
              <div style={{ background: 'rgba(220,38,38,0.8)', borderRadius: 8, padding: '5px 8px', fontSize: 9, color: '#fff', fontWeight: 700 }}>
                🔴 LIVE
              </div>
            </div>
            {/* Bottom HUD */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>REPS</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: T }}>
                    {repNum}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>/5</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>HOLD</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: S }}>
                    {Math.max(1, 5 - Math.floor(repFrac * 5))}
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>s</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>FORM</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>✓ Good</div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${(repNum / 5) * 100}%`, background: T, borderRadius: 2 }} />
              </div>
            </div>
          </div>
        )}

        {/* DONE */}
        {phase === 'done' && (
          <div style={{ padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginTop: 8 }}>🎉</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 800, color: F }}>Session complete!</div>
            <div style={{ fontSize: 10, color: GY }}>3 exercises · 15 min · 5 reps each</div>
            <PainSlider value={3} label="How does your knee feel now?" />
            <div style={{ background: '#F0FAF4', border: '1px solid #B2DFCB', borderRadius: 10, padding: '10px 12px', width: '100%', textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: F, marginBottom: 3 }}>Pain improved from 4 → 3 ✓</div>
              <div style={{ fontSize: 9, color: GY }}>Tomorrow's session will be at the same level. Great work!</div>
            </div>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button style={{ flex: 1, background: F, border: 'none', borderRadius: 20, padding: '8px', fontSize: 10, fontWeight: 700, color: '#fff' }}>Save & see progress</button>
              <button style={{ background: '#DDE4EF', border: 'none', borderRadius: 20, padding: '8px 12px', fontSize: 10, color: GY }}>Share</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
