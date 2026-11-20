import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import { DemoScript } from './types'

const FOREST = '#12382A'
const FOREST_DARK = '#071a10'
const SAFFRON = '#D4510E'
const TEAL = '#0A6B5E'
const CREAM = '#FDFAF3'

const DURATION_FRAMES = 90 // 3 seconds

export const TitleCard: React.FC<{ script: DemoScript }> = ({ script }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const FADE = 20
  const opacity = interpolate(frame, [0, FADE, DURATION_FRAMES - FADE, DURATION_FRAMES], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const taglineY = interpolate(frame, [FADE, FADE + 20], [16, 0], { extrapolateRight: 'clamp' })
  const logoScale = interpolate(frame, [0, FADE + 10], [0.85, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${TEAL}33 0%, transparent 65%),
                       linear-gradient(160deg, ${FOREST_DARK} 0%, ${FOREST} 60%, #0d2d1f 100%)`,
        }}
      />

      {/* Decorative ring */}
      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: 400,
            height: 400,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,0.05)`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: 560,
            height: 560,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,0.03)`,
          }}
        />
      </AbsoluteFill>

      {/* Centre content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        {/* Emoji logo */}
        <div
          style={{
            fontSize: 72,
            transform: `scale(${logoScale})`,
            lineHeight: 1,
          }}
        >
          🩺
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 72,
            fontWeight: 800,
            color: CREAM,
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          PhysioDrishti
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: 2,
            textTransform: 'uppercase',
            transform: `translateY(${taglineY}px)`,
          }}
        >
          Guided · Measurable · Human-reviewed
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 40,
            background: `linear-gradient(to bottom, ${SAFFRON}, transparent)`,
            margin: '4px 0',
          }}
        />

        {/* Script title */}
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: SAFFRON,
            letterSpacing: 1,
            textTransform: 'uppercase',
            transform: `translateY(${taglineY}px)`,
          }}
        >
          {script.title}
        </div>

        {/* Audience chips */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          {script.audience.map((a) => (
            <div
              key={a}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: 0.5,
              }}
            >
              {a}
            </div>
          ))}
        </div>
      </AbsoluteFill>

      {/* Bottom URL */}
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 13,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: 1,
        }}
      >
        physiodrishti.vercel.app
      </div>
    </AbsoluteFill>
  )
}

export { DURATION_FRAMES as TITLE_CARD_FRAMES }
