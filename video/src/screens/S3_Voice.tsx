import React from 'react'
import { interpolate } from 'remotion'

const F = '#12382A', T = '#0A6B5E', S = '#D4510E', CRM = '#FDFAF3', GY = '#5C6878'

export const S3_Voice: React.FC<{ progress: number }> = ({ progress }) => {
  const micPulse = 0.5 + Math.sin(progress * Math.PI * 8) * 0.5
  const hindiOp = interpolate(progress, [0.1, 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const waveActive = progress > 0.25 && progress < 0.65
  const responseOp = interpolate(progress, [0.65, 0.8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // waveform bars heights
  const bars = [14, 22, 32, 44, 36, 28, 44, 56, 44, 28, 36, 48, 36, 24, 32, 20, 28, 40, 28, 16]

  return (
    <div style={{ width: 280, height: 520, background: CRM, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      {/* Status + header */}
      <div style={{ background: F, padding: '10px 14px 0', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>9:41</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>●●●</span>
      </div>
      <div style={{ background: F, padding: '8px 14px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: T, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🩺</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'Georgia, serif' }}>Voice Mode</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Hindi · Kannada · English</div>
        </div>
        <div style={{ marginLeft: 'auto', background: T + '44', borderRadius: 20, padding: '3px 8px', fontSize: 9, color: '#fff', fontWeight: 700 }}>🔴 Listening</div>
      </div>

      {/* Voice content */}
      <div style={{ flex: 1, background: '#F5F7FB', padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {/* Mic button with pulse rings */}
        <div style={{ position: 'relative', marginTop: 8 }}>
          {/* Outer pulse ring */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 80 + micPulse * 20, height: 80 + micPulse * 20,
            borderRadius: '50%', background: T + '22', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 70 + micPulse * 12, height: 70 + micPulse * 12,
            borderRadius: '50%', background: T + '33', pointerEvents: 'none',
          }} />
          {/* Main mic button */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${T}, ${F})`,
            boxShadow: `0 8px 24px ${T}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            position: 'relative', zIndex: 1,
          }}>
            🎙️
          </div>
        </div>

        {/* Hindi text bubble */}
        <div style={{ width: '100%', opacity: hindiOp }}>
          <div style={{ fontSize: 10, color: GY, textAlign: 'center', marginBottom: 6 }}>You said (Hindi):</div>
          <div style={{ background: T, borderRadius: '10px 2px 10px 10px', padding: '10px 14px', fontSize: 14, color: '#fff', textAlign: 'center', lineHeight: 1.5, alignSelf: 'flex-end', marginLeft: 'auto', maxWidth: '90%' }}>
            घुटने में दर्द है, क्या करूं?
          </div>
          <div style={{ fontSize: 9, color: GY, textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}>
            "Ghutne mein dard hai, kya karun?"
          </div>
        </div>

        {/* Waveform */}
        {waveActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 60, padding: '0 10px' }}>
            {bars.map((h, i) => {
              const animated = h * (0.6 + Math.sin(progress * 20 + i * 0.4) * 0.4)
              return (
                <div key={i} style={{
                  width: 5, borderRadius: 3,
                  height: animated,
                  background: i % 3 === 0 ? S : i % 3 === 1 ? T : F,
                  opacity: 0.7 + Math.sin(i * 0.5) * 0.3,
                }} />
              )
            })}
          </div>
        )}

        {/* Translated response */}
        {!waveActive && (
          <div style={{ width: '100%', opacity: responseOp }}>
            <div style={{ fontSize: 10, color: GY, marginBottom: 6 }}>Drishti replied:</div>
            <div style={{ background: '#fff', borderRadius: '2px 10px 10px 10px', padding: '10px 12px', fontSize: 10, color: '#1a1a2e', lineHeight: 1.6, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              🔊 <em>"घुटने के दर्द के लिए, क्वाड्रिसेप्स की एक्सर्साइज़ बहुत फ़ायदेमंद है। पहले quad sets करें — जांघ की मांसपेशी को कस कर 5 सेकंड होल्ड करें।"</em>
            </div>
          </div>
        )}

        {/* Language selector */}
        <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
          {['हिंदी', 'ಕನ್ನಡ', 'English'].map((lang, i) => (
            <div key={i} style={{
              borderRadius: 16, padding: '5px 12px', fontSize: 10, fontWeight: 600,
              background: i === 0 ? T : 'rgba(0,0,0,0.06)', color: i === 0 ? '#fff' : GY,
              border: i === 0 ? 'none' : '1px solid #DDE4EF',
            }}>{lang}</div>
          ))}
        </div>
      </div>

      {/* Bottom action bar */}
      <div style={{ background: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E8F0', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: GY }}>Tap mic to speak again</div>
        <button style={{ background: F, border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 10, fontWeight: 700, color: '#fff' }}>Switch to chat →</button>
      </div>
    </div>
  )
}
