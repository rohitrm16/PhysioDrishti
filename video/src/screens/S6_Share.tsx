import React from 'react'
import { interpolate } from 'remotion'

const F = '#12382A', T = '#0A6B5E', S = '#D4510E', CRM = '#FDFAF3', GY = '#5C6878'

export const S6_Share: React.FC<{ progress: number }> = ({ progress }) => {
  const consentChecked = progress > 0.45
  const shareClicked = progress > 0.65
  const shareSucceeded = progress > 0.80

  const successOp = interpolate(progress, [0.80, 0.92], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const checkScale = interpolate(progress, [0.45, 0.6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ width: 280, height: 520, background: CRM, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      {/* Status + header */}
      <div style={{ background: F, padding: '10px 14px 0', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>9:41</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>●●●</span>
      </div>
      <div style={{ background: F, padding: '8px 14px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: T, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔗</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'Georgia, serif' }}>Share with Physiotherapist</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Private · Your choice · Revoke anytime</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, background: '#F5F7FB', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Physio card */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid #DDE4EF', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${T}, ${F})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>👩‍⚕️</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: F }}>Dr. Priya Sharma</div>
            <div style={{ fontSize: 10, color: GY }}>MPT · Senior Physiotherapist</div>
            <div style={{ fontSize: 9, color: T, marginTop: 2 }}>✓ Verified · Connected</div>
          </div>
          <div style={{ marginLeft: 'auto', background: '#F0FAF4', borderRadius: 20, padding: '4px 10px', fontSize: 9, fontWeight: 700, color: T }}>
            Your physio
          </div>
        </div>

        {/* What gets shared */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid #DDE4EF' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: F, marginBottom: 8 }}>What she'll see</div>
          {[
            { icon: '📊', label: 'Session history', sub: '7 sessions this week' },
            { icon: '📉', label: 'Pain trend', sub: '7 → 3 over 7 days' },
            { icon: '🎯', label: 'Goal progress', sub: 'Climbing stairs: 5/10' },
            { icon: '🏃', label: 'Exercise completion', sub: '100% of prescribed exercises' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? '1px solid #F0F2F8' : 'none' }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#1a1a2e' }}>{item.label}</div>
                <div style={{ fontSize: 9, color: GY }}>{item.sub}</div>
              </div>
              <div style={{ fontSize: 10, color: '#059669' }}>✓</div>
            </div>
          ))}
        </div>

        {/* Consent toggle */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: `1px solid ${consentChecked ? '#B2DFCB' : '#DDE4EF'}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{
            width: 20, height: 20, borderRadius: 5, border: `2px solid ${consentChecked ? T : '#DDE4EF'}`,
            background: consentChecked ? T : '#fff', flexShrink: 0, marginTop: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${checkScale})`, transition: 'all 0.3s',
          }}>
            {consentChecked && <span style={{ fontSize: 11, color: '#fff', fontWeight: 900 }}>✓</span>}
          </div>
          <div style={{ fontSize: 10, color: '#1a1a2e', lineHeight: 1.5 }}>
            I consent to sharing my anonymised physiotherapy data with Dr. Sharma for my care. I can revoke access anytime.
          </div>
        </div>

        {/* Success state */}
        {shareSucceeded ? (
          <div style={{ background: '#F0FAF4', border: '2px solid #B2DFCB', borderRadius: 12, padding: '14px', textAlign: 'center', opacity: successOp }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>✅</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: F, marginBottom: 4 }}>Shared successfully!</div>
            <div style={{ fontSize: 10, color: GY }}>Dr. Sharma can now see your progress between visits.</div>
          </div>
        ) : (
          <button style={{
            background: consentChecked ? F : '#DDE4EF',
            border: 'none', borderRadius: 20, padding: '11px',
            fontSize: 12, fontWeight: 700,
            color: consentChecked ? '#fff' : GY,
            cursor: consentChecked ? 'pointer' : 'default',
            transform: shareClicked ? 'scale(0.97)' : 'scale(1)',
          }}>
            {consentChecked ? 'Share with Dr. Sharma →' : 'Tick the consent checkbox first'}
          </button>
        )}
      </div>
    </div>
  )
}
