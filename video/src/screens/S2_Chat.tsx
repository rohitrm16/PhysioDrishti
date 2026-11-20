import React from 'react'
import { interpolate } from 'remotion'

const F = '#12382A', T = '#0A6B5E', S = '#D4510E', CRM = '#FDFAF3', GY = '#5C6878'

// Simple animated stick figure for quad sets
const QuadFigure: React.FC<{ phase: number }> = ({ phase }) => {
  // phase 0-1: standing upright; raising right leg up and down
  const legAngle = Math.sin(phase * Math.PI * 2) * 25
  return (
    <svg width={48} height={56} viewBox="0 0 48 56">
      {/* head */}
      <circle cx={24} cy={8} r={6} fill="none" stroke={T} strokeWidth={2} />
      {/* torso */}
      <line x1={24} y1={14} x2={24} y2={32} stroke={T} strokeWidth={2} />
      {/* left arm */}
      <line x1={24} y1={18} x2={12} y2={28} stroke={T} strokeWidth={2} />
      {/* right arm */}
      <line x1={24} y1={18} x2={36} y2={28} stroke={T} strokeWidth={2} />
      {/* left leg - static */}
      <line x1={24} y1={32} x2={16} y2={48} stroke={T} strokeWidth={2} />
      <line x1={16} y1={48} x2={12} y2={56} stroke={T} strokeWidth={2} />
      {/* right leg - animated (raised) */}
      <line
        x1={24} y1={32}
        x2={24 + Math.sin(legAngle * Math.PI / 180) * 12}
        y2={32 + Math.cos(legAngle * Math.PI / 180) * 16}
        stroke={S} strokeWidth={2.5}
      />
      <line
        x1={24 + Math.sin(legAngle * Math.PI / 180) * 12}
        y1={32 + Math.cos(legAngle * Math.PI / 180) * 16}
        x2={24 + Math.sin(legAngle * Math.PI / 180) * 10 + 4}
        y2={32 + Math.cos(legAngle * Math.PI / 180) * 32}
        stroke={S} strokeWidth={2.5}
      />
    </svg>
  )
}

export const S2_Chat: React.FC<{ progress: number }> = ({ progress }) => {
  const showUser = progress > 0.05
  const showTyping = progress > 0.15 && progress < 0.35
  const showAI = progress > 0.35
  const showCard = progress > 0.6
  const figPhase = (progress - 0.6) * 2

  const aiOp = interpolate(progress, [0.35, 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cardOp = interpolate(progress, [0.6, 0.72], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cardSlide = interpolate(progress, [0.6, 0.72], [16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ width: 280, height: 520, background: CRM, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      {/* Status bar */}
      <div style={{ background: F, padding: '10px 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>9:41</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>●●●</span>
      </div>
      {/* Header */}
      <div style={{ background: F, padding: '8px 14px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: T, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🩺</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'Georgia, serif' }}>Drishti</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>PhysioDrishti assistant · online</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 14, opacity: 0.6 }}>🎙️</span>
          <span style={{ fontSize: 14, opacity: 0.6 }}>⋮</span>
        </div>
      </div>

      {/* Chat messages */}
      <div style={{ flex: 1, background: '#F5F7FB', padding: '10px 10px 6px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        {/* Welcome */}
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: T, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🩺</div>
          <div style={{ background: '#fff', borderRadius: '2px 10px 10px 10px', padding: '7px 10px', fontSize: 10, color: '#1a1a2e', maxWidth: '85%', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            Namaste! I'm Drishti. How can I help with your physiotherapy today?
          </div>
        </div>

        {/* User message */}
        {showUser && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ background: T, borderRadius: '10px 2px 10px 10px', padding: '7px 10px', fontSize: 10, color: '#fff', maxWidth: '82%' }}>
              My knee hurts on the stairs. What can I do at home?
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {showTyping && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: T, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🩺</div>
            <div style={{ background: '#fff', borderRadius: '2px 10px 10px 10px', padding: '8px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', gap: 3, alignItems: 'center' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: GY, animation: 'bounce 1s infinite' }} />
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: GY }} />
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: GY }} />
            </div>
          </div>
        )}

        {/* AI response */}
        {showAI && (
          <div style={{ display: 'flex', gap: 6, opacity: aiOp }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: T, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🩺</div>
            <div style={{ background: '#fff', borderRadius: '2px 10px 10px 10px', padding: '8px 10px', fontSize: 9.5, color: '#1a1a2e', maxWidth: '86%', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', lineHeight: 1.5 }}>
              Knee pain on stairs is usually due to weak quadriceps. Here are exercises that help{' '}
              <span style={{ background: T, color: '#fff', borderRadius: 4, padding: '1px 4px', fontSize: 8, fontWeight: 700 }}>[1]</span>{' '}
              <span style={{ background: T + 'cc', color: '#fff', borderRadius: 4, padding: '1px 4px', fontSize: 8, fontWeight: 700 }}>[2]</span>
              <br /><br />
              <strong>Quad Sets</strong> — tighten the thigh, hold 5s<br />
              <strong>Straight Leg Raise</strong> — slow lift, 10 reps<br />
              <strong>Mini Squats</strong> — bend to 30° only
            </div>
          </div>
        )}

        {/* Exercise card */}
        {showCard && (
          <div style={{ background: `linear-gradient(135deg, ${F}, ${T})`, borderRadius: 12, padding: '10px 12px', opacity: cardOp, transform: `translateY(${cardSlide}px)`, color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, opacity: 0.6, textTransform: 'uppercase', marginBottom: 3 }}>Dr. Sharma · Approved</div>
                <div style={{ fontSize: 12, fontWeight: 800, fontFamily: 'Georgia, serif' }}>Knee Strengthening</div>
                <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>3 exercises · 15 min</div>
              </div>
              <QuadFigure phase={figPhase} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button style={{ background: S, border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 9, fontWeight: 700, color: '#fff', flex: 1 }}>Start Session →</button>
              <button style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 9, color: '#fff' }}>Watch Demo</button>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{ background: '#fff', padding: '7px 10px', display: 'flex', gap: 7, alignItems: 'center', borderTop: '1px solid #E5E8F0', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#F0F2F8', borderRadius: 16, padding: '5px 10px', fontSize: 9.5, color: '#8A93A6', display: 'flex', alignItems: 'center' }}>Type a message…</div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: T, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>🎙️</div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: S, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13 }}>↑</div>
      </div>
    </div>
  )
}
