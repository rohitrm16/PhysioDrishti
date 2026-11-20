import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

const FOREST = '#12382A'
const FOREST_DARK = '#071a10'
const SAFFRON = '#D4510E'
const TEAL = '#0A6B5E'
const CREAM = '#FDFAF3'

export const EndCard: React.FC<{ site: string; repo: string }> = ({ site, repo }) => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  const FADE = 20
  const opacity = interpolate(frame, [0, FADE], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const itemY = (delay: number) =>
    interpolate(frame, [FADE + delay, FADE + delay + 20], [20, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${TEAL}44 0%, transparent 65%),
                       linear-gradient(160deg, ${FOREST_DARK} 0%, ${FOREST} 60%, #0d2d1f 100%)`,
        }}
      />

      {/* Concentric rings */}
      {[300, 480, 660].map((r, i) => (
        <AbsoluteFill
          key={i}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            style={{
              width: r,
              height: r,
              borderRadius: '50%',
              border: `1px solid rgba(255,255,255,${0.06 - i * 0.015})`,
            }}
          />
        </AbsoluteFill>
      ))}

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <div style={{ fontSize: 64, transform: `translateY(${itemY(0)}px)` }}>🩺</div>

        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 68,
            fontWeight: 800,
            color: CREAM,
            letterSpacing: -2,
            transform: `translateY(${itemY(5)}px)`,
          }}
        >
          PhysioDrishti
        </div>

        <div
          style={{
            fontSize: 20,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: 2,
            textTransform: 'uppercase',
            transform: `translateY(${itemY(10)}px)`,
          }}
        >
          Guided · Measurable · Human-reviewed
        </div>

        <div
          style={{
            width: 60,
            height: 2,
            background: SAFFRON,
            borderRadius: 1,
            transform: `translateY(${itemY(12)}px)`,
          }}
        />

        {/* Links */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            transform: `translateY(${itemY(15)}px)`,
          }}
        >
          {[
            { label: '🌐 ' + site.replace('https://', ''), bg: TEAL + '33', border: TEAL },
            { label: '⌥ GitHub', bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.15)' },
          ].map(({ label, bg, border }) => (
            <div
              key={label}
              style={{
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 24,
                padding: '10px 24px',
                fontSize: 14,
                color: CREAM,
                letterSpacing: 0.3,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Stack badges */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 600,
            transform: `translateY(${itemY(20)}px)`,
          }}
        >
          {['React', 'Vercel', 'Supabase', 'Gemini', 'Sarvam', 'MediaPipe', 'pgvector'].map(
            (s) => (
              <div
                key={s}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 6,
                  padding: '3px 10px',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.4)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {s}
              </div>
            )
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
