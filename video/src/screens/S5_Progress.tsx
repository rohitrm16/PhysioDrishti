import React from 'react'
import { interpolate } from 'remotion'

const F = '#12382A', T = '#0A6B5E', S = '#D4510E', CRM = '#FDFAF3', GY = '#5C6878'

export const S5_Progress: React.FC<{ progress: number }> = ({ progress }) => {
  const streakOp = interpolate(progress, [0.0, 0.15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const calOp = interpolate(progress, [0.15, 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const chartOp = interpolate(progress, [0.3, 0.45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const goalOp = interpolate(progress, [0.45, 0.6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const milestoneOp = interpolate(progress, [0.6, 0.78], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Pain chart data: 7, 6, 5, 4, 3, 3
  const painPoints = [7, 6, 5, 4, 3, 3]
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const daysDone = [true, true, true, true, true, true, false]

  const chartW = 220, chartH = 48
  const maxP = 10, minP = 0

  const chartPath = painPoints.map((p, i) => {
    const x = (i / (painPoints.length - 1)) * chartW
    const y = chartH - ((p - minP) / (maxP - minP)) * chartH
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  const goalProg = interpolate(progress, [0.45, 0.75], [0, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ width: 280, height: 520, background: CRM, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', overflowY: 'hidden' }}>
      {/* Status + header */}
      <div style={{ background: F, padding: '10px 14px 0', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>9:41</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>●●●</span>
      </div>
      <div style={{ background: F, padding: '8px 14px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: T, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📈</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'Georgia, serif' }}>My Progress</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Knee · Last 7 days</div>
        </div>
        <button style={{ marginLeft: 'auto', background: S, border: 'none', borderRadius: 16, padding: '4px 10px', fontSize: 9, fontWeight: 700, color: '#fff' }}>Share ↗</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, background: '#F5F7FB', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'hidden' }}>

        {/* Streak card */}
        <div style={{ background: `linear-gradient(135deg, ${F}, ${T})`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, opacity: streakOp }}>
          <div style={{ fontSize: 32 }}>🔥</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>7 <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.7 }}>day streak</span></div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Don't break the chain!</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Total sessions</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>7</div>
          </div>
        </div>

        {/* Week calendar */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', opacity: calOp, border: '1px solid #DDE4EF' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GY, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>This week</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {days.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 9, color: GY }}>{d}</div>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: daysDone[i] ? T : '#E5E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: daysDone[i] ? '#fff' : GY,
                  fontWeight: daysDone[i] ? 700 : 400,
                }}>
                  {daysDone[i] ? '✓' : '·'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pain chart */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', opacity: chartOp, border: '1px solid #DDE4EF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: GY, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pain level (0-10)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0FAF4', borderRadius: 20, padding: '3px 8px' }}>
              <span style={{ fontSize: 10 }}>↓</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#059669' }}>57% less pain</span>
            </div>
          </div>
          <svg width="100%" height={chartH + 8} viewBox={`0 0 ${chartW} ${chartH + 8}`} style={{ overflow: 'visible' }}>
            {/* Area fill */}
            <path
              d={`${chartPath} L ${chartW} ${chartH} L 0 ${chartH} Z`}
              fill={T + '22'}
            />
            {/* Line */}
            <path d={chartPath} fill="none" stroke={T} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {/* Points */}
            {painPoints.map((p, i) => {
              const x = (i / (painPoints.length - 1)) * chartW
              const y = chartH - ((p - minP) / (maxP - minP)) * chartH
              return <circle key={i} cx={x} cy={y} r={4} fill="#fff" stroke={T} strokeWidth={2} />
            })}
            {/* Labels */}
            {painPoints.map((p, i) => {
              const x = (i / (painPoints.length - 1)) * chartW
              const y = chartH - ((p - minP) / (maxP - minP)) * chartH
              return <text key={i} x={x} y={y - 7} textAnchor="middle" fontSize={8} fill={GY}>{p}</text>
            })}
          </svg>
        </div>

        {/* Goal card */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', opacity: goalOp, border: '1px solid #DDE4EF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: F }}>🎯 Climbing stairs comfortably</div>
              <div style={{ fontSize: 9, color: GY, marginTop: 2 }}>Confidence score</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: T }}>5</span>
              <span style={{ fontSize: 9, color: GY }}>/10</span>
              <div style={{ fontSize: 8, color: '#059669' }}>↑ from 3</div>
            </div>
          </div>
          <div style={{ height: 8, background: '#E5E8F0', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${goalProg * 100}%`, background: T, borderRadius: 4 }} />
          </div>
        </div>

        {/* Milestones */}
        <div style={{ opacity: milestoneOp }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GY, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Milestones</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { icon: '🌱', label: 'First session', done: true },
              { icon: '🔥', label: '7-day streak', done: true },
              { icon: '📉', label: 'Pain -50%', done: true },
            ].map((m, i) => (
              <div key={i} style={{
                flex: 1, background: m.done ? '#F0FAF4' : '#fff',
                border: `1px solid ${m.done ? '#B2DFCB' : '#DDE4EF'}`,
                borderRadius: 10, padding: '8px 6px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, marginBottom: 3 }}>{m.icon}</div>
                <div style={{ fontSize: 8.5, fontWeight: 600, color: m.done ? F : GY }}>{m.label}</div>
                {m.done && <div style={{ fontSize: 8, color: '#059669' }}>✓ Earned</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
