import React from 'react'
import { interpolate } from 'remotion'

const F = '#12382A', T = '#0A6B5E', S = '#D4510E', CRM = '#FDFAF3', GY = '#5C6878'

export const S7_Booking: React.FC<{ progress: number }> = ({ progress }) => {
  // 3 phases: 0-30% chat, 30-75% date/time picker, 75-100% success
  const phase = progress < 0.30 ? 'chat' : progress < 0.78 ? 'picker' : 'success'

  const phaseProg = phase === 'chat' ? progress / 0.30
    : phase === 'picker' ? (progress - 0.30) / 0.48
    : (progress - 0.78) / 0.22

  const selectedDate = phaseProg > 0.35 ? 2 : -1 // index of selected date card
  const selectedSlot = phaseProg > 0.6 ? 1 : -1  // index of selected time slot

  const successOp = interpolate(progress, [0.78, 0.9], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const dates = [
    { day: 'Tue', date: '25 Nov' },
    { day: 'Wed', date: '26 Nov' },
    { day: 'Thu', date: '27 Nov' },
    { day: 'Fri', date: '28 Nov' },
  ]

  const slots = [
    { time: '10:00 am', label: 'Morning', mode: 'Online' },
    { time: '5:00 pm', label: 'Evening', mode: 'Home visit' },
    { time: '6:30 pm', label: 'Evening', mode: 'Online' },
  ]

  return (
    <div style={{ width: 280, height: 520, background: CRM, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      {/* Status + header */}
      <div style={{ background: F, padding: '10px 14px 0', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>9:41</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>●●●</span>
      </div>
      <div style={{ background: F, padding: '8px 14px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: T, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🩺</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'Georgia, serif' }}>Drishti</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Booking assistant</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Dr. Sharma</div>
      </div>

      {/* CHAT PHASE */}
      {phase === 'chat' && (
        <div style={{ flex: 1, background: '#F5F7FB', padding: '10px 10px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: T, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🩺</div>
            <div style={{ background: '#fff', borderRadius: '2px 10px 10px 10px', padding: '7px 10px', fontSize: 10, color: '#1a1a2e', maxWidth: '86%', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              Namaste! I can help you book a session. Which day works best?
            </div>
          </div>
          {phaseProg > 0.3 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ background: T, borderRadius: '10px 2px 10px 10px', padding: '7px 10px', fontSize: 10, color: '#fff', maxWidth: '72%' }}>
                Book a session
              </div>
            </div>
          )}
          {phaseProg > 0.65 && (
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: T, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🩺</div>
              <div style={{ background: '#fff', borderRadius: '2px 10px 10px 10px', padding: '7px 10px', fontSize: 10, color: '#1a1a2e', maxWidth: '86%', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                Dr. Sharma has 3 slots this week. Let me show you the options…
              </div>
            </div>
          )}
        </div>
      )}

      {/* PICKER PHASE */}
      {phase === 'picker' && (
        <div style={{ flex: 1, background: '#F5F7FB', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          {/* Provider mini-card */}
          <div style={{ padding: '0 10px' }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', border: '1px solid #DDE4EF', display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${T}, ${F})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👩‍⚕️</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: F }}>Dr. Priya Sharma</div>
                <div style={{ fontSize: 9, color: GY }}>MPT · Available this week</div>
              </div>
              <div style={{ marginLeft: 'auto', background: '#F0FAF4', borderRadius: 20, padding: '3px 8px', fontSize: 9, color: T, fontWeight: 600 }}>3 slots</div>
            </div>
          </div>

          {/* Date strip */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: GY, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, paddingLeft: 10 }}>Choose a date</div>
            <div style={{ display: 'flex', gap: 7, paddingLeft: 10, overflowX: 'hidden' }}>
              {dates.map((d, i) => (
                <div key={i} style={{
                  flexShrink: 0, textAlign: 'center', padding: '8px 12px', borderRadius: 12,
                  background: i === selectedDate ? F : '#fff',
                  border: `1px solid ${i === selectedDate ? F : '#DDE4EF'}`,
                  cursor: 'pointer', minWidth: 54,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: i === selectedDate ? 'rgba(255,255,255,0.7)' : GY }}>{d.day}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: i === selectedDate ? '#fff' : F, marginTop: 2 }}>{d.date.split(' ')[0]}</div>
                  <div style={{ fontSize: 8, color: i === selectedDate ? 'rgba(255,255,255,0.5)' : GY }}>{d.date.split(' ')[1]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Time slots */}
          {selectedDate >= 0 && (
            <div style={{ padding: '0 10px', flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: GY, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Available times — Evening</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {slots.map((s, i) => (
                  <div key={i} style={{
                    background: i === selectedSlot ? '#FEF0E9' : '#fff',
                    border: `1.5px solid ${i === selectedSlot ? S : '#DDE4EF'}`,
                    borderRadius: 10, padding: '9px 12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: i === selectedSlot ? S : F }}>{s.time}</div>
                      <div style={{ fontSize: 9, color: GY }}>{s.label}</div>
                    </div>
                    <div style={{
                      background: i === selectedSlot ? S : '#F5F7FB',
                      borderRadius: 8, padding: '4px 8px', fontSize: 9,
                      color: i === selectedSlot ? '#fff' : GY,
                      fontWeight: 600, border: `1px solid ${i === selectedSlot ? S : '#DDE4EF'}`
                    }}>
                      {s.mode}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact + confirm */}
          {selectedSlot >= 0 && (
            <div style={{ padding: '0 10px' }}>
              <input style={{ width: '100%', border: '1.5px solid #DDE4EF', borderRadius: 10, padding: '8px 12px', fontSize: 10, color: '#1a1a2e', background: '#fff', boxSizing: 'border-box', marginBottom: 7, outline: 'none' }} placeholder="Your name" defaultValue="Asha Krishnamurthy" />
              <div style={{ display: 'flex', gap: 7 }}>
                <input style={{ flex: 1, border: '1.5px solid #DDE4EF', borderRadius: 10, padding: '8px 12px', fontSize: 10, color: GY, background: '#fff', outline: 'none' }} placeholder="WhatsApp number" defaultValue="+91 98XXX XXXXX" />
                <button style={{ background: F, border: 'none', borderRadius: 10, padding: '8px 12px', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>Confirm →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUCCESS PHASE */}
      {phase === 'success' && (
        <div style={{ flex: 1, background: '#F5F7FB', padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: successOp }}>
          <div style={{ fontSize: 48, marginTop: 10 }}>✅</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 800, color: F, marginBottom: 4 }}>Request sent!</div>
            <div style={{ fontSize: 10, color: GY, lineHeight: 1.6 }}>Dr. Sharma will confirm on WhatsApp within a few hours.</div>
          </div>
          {/* Booking summary card */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px', border: '1px solid #DDE4EF', width: '100%' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${T}, ${F})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👩‍⚕️</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: F }}>Dr. Priya Sharma</div>
                <div style={{ fontSize: 9, color: GY }}>MPT · Senior Physiotherapist</div>
              </div>
            </div>
            {[
              { label: 'Date', value: 'Wed, 26 Nov' },
              { label: 'Time', value: '5:00 pm' },
              { label: 'Mode', value: 'Home visit' },
              { label: 'Status', value: '⏳ Pending approval' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? '1px solid #F0F2F8' : 'none' }}>
                <span style={{ fontSize: 9, color: GY }}>{row.label}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: i === 3 ? S : F }}>{row.value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#F0FAF4', borderRadius: 10, padding: '10px 12px', width: '100%', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 16 }}>💬</span>
            <div style={{ fontSize: 9, color: GY, lineHeight: 1.5 }}>You'll receive a WhatsApp confirmation from Dr. Sharma once approved.</div>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div style={{ background: '#fff', padding: '7px 10px', display: 'flex', gap: 7, alignItems: 'center', borderTop: '1px solid #E5E8F0', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#F0F2F8', borderRadius: 16, padding: '5px 10px', fontSize: 9.5, color: '#8A93A6' }}>Type a message…</div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: S, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13 }}>↑</div>
      </div>
    </div>
  )
}
