import React from 'react'
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

const F = '#12382A', T = '#0A6B5E', S = '#D4510E', CRM = '#FDFAF3', GY = '#5C6878'

export const S1_Landing: React.FC<{ progress: number }> = ({ progress }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scrollY = interpolate(progress, [0.3, 1], [0, 180], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cardSlide = (delay: number) => interpolate(progress, [delay, delay + 0.15], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cardOp = (delay: number) => interpolate(progress, [delay, delay + 0.15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const cards = [
    { icon: '🏃', title: 'Exercises that stop after a few days', sub: 'No feedback, no motivation' },
    { icon: '📊', title: "Can't tell if you're improving", sub: 'No progress tracking at home' },
    { icon: '📞', title: 'Difficult to reach your physio', sub: 'Between appointments, questions go unanswered' },
  ]

  return (
    <div style={{ width: 280, height: 520, background: CRM, overflowY: 'hidden', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>
      {/* Nav */}
      <div style={{ background: F, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: T, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🩺</div>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 800, color: '#fff' }}>PhysioDrishti</span>
      </div>

      {/* Scroll container */}
      <div style={{ transform: `translateY(-${scrollY}px)` }}>
        {/* Hero */}
        <div style={{ background: F, padding: '18px 14px 22px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T, letterSpacing: 1, textTransform: 'uppercase', background: T + '22', borderRadius: 20, padding: '3px 10px', display: 'inline-block', marginBottom: 8 }}>Physiotherapy · Guided · Measured</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 800, color: CRM, lineHeight: 1.3, marginBottom: 8 }}>Home physiotherapy that actually works</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 14 }}>AI assistant, guided sessions, and your physiotherapist keeps an eye on your progress.</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button style={{ background: S, border: 'none', borderRadius: 20, padding: '7px 14px', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Talk to Drishti →</button>
            <button style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '7px 12px', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Book a session</button>
          </div>
        </div>

        {/* Dr approved badge */}
        <div style={{ margin: '14px 14px 0', background: '#F0FAF4', border: '1px solid #B2DFCB', borderRadius: 10, padding: '8px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: 20 }}>👩‍⚕️</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: F }}>Dr. Sharma, MPT</div>
            <div style={{ fontSize: 10, color: GY }}>All 12 exercises reviewed and approved</div>
          </div>
        </div>

        {/* Challenge cards */}
        <div style={{ padding: '14px 14px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GY, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>Why people stop home exercises</div>
          {cards.map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', marginBottom: 8, border: '1px solid #DDE4EF', display: 'flex', gap: 10, alignItems: 'flex-start', transform: `translateY(${cardSlide(0.4 + i * 0.1)}px)`, opacity: cardOp(0.4 + i * 0.1) }}>
              <div style={{ fontSize: 18, flexShrink: 0 }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0D1520', lineHeight: 1.3 }}>{c.title}</div>
                <div style={{ fontSize: 10, color: GY, marginTop: 2 }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Exercise preview card */}
        <div style={{ margin: '14px 14px 20px', background: `linear-gradient(135deg, ${F}, ${T})`, borderRadius: 12, padding: '12px 14px', color: '#fff' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, opacity: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Featured · Knee pain</div>
          <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'Georgia, serif', marginBottom: 4 }}>Quad Sets · SLR · Mini Squats</div>
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 10 }}>3 exercises · 20 min · Dr. Sharma approved</div>
          <button style={{ background: S, border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 10, fontWeight: 700, color: '#fff' }}>Start guided session →</button>
        </div>
      </div>
    </div>
  )
}
