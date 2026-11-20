import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion'
import { Scene } from './types'
import { PhoneFrame } from './PhoneFrame'

const FOREST = '#12382A'
const FOREST_DARK = '#071a10'
const SAFFRON = '#D4510E'
const TEAL = '#0A6B5E'
const CREAM = '#FDFAF3'

// Tags map to colours
const TAG_COLORS: Record<string, string> = {
  'The problem': '#6366f1',
  'Ask Drishti': TEAL,
  'Voice in Hindi': '#7c3aed',
  'Guided session': SAFFRON,
  'My progress': '#059669',
  'Share with physiotherapist': '#0284c7',
  'Book a session': FOREST,
  'End card': '#374151',
  Safety: '#dc2626',
  'Title and stack': '#1e3a5f',
  'RAG with citations': TEAL,
  'Refusals and fixed replies': '#dc2626',
  'Agent and tool calling': SAFFRON,
  'Human in the loop': FOREST,
  'Voice pipeline': '#7c3aed',
  Evals: '#059669',
  Privacy: '#374151',
}

function Progressive({ text, durationInFrames, fps }: { text: string; durationInFrames: number; fps: number }) {
  const frame = useCurrentFrame()
  const words = text.split(' ')
  // start revealing at 0.4s, complete at 85% of scene
  const revealStart = Math.floor(fps * 0.4)
  const revealEnd = Math.floor(durationInFrames * 0.85)
  const progress = interpolate(frame, [revealStart, revealEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const count = Math.ceil(progress * words.length)
  const shown = words.slice(0, Math.max(1, count)).join(' ')
  const hidden = words.slice(Math.max(1, count)).join(' ')
  return (
    <>
      <span>{shown}</span>
      {hidden && <span style={{ opacity: 0 }}>{' ' + hidden}</span>}
    </>
  )
}

export const SceneSlide: React.FC<{
  scene: Scene
  sceneIndex: number
  totalScenes: number
}> = ({ scene, sceneIndex, totalScenes }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames, width, height } = useVideoConfig()

  const FADE = Math.min(12, Math.floor(fps * 0.4))

  const opacity = interpolate(
    frame,
    [0, FADE, durationInFrames - FADE, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  const slideY = interpolate(frame, [0, FADE], [24, 0], { extrapolateRight: 'clamp' })
  const tagColor = TAG_COLORS[scene.title] || TEAL

  // Particle dots in background (static positions, slight drift)
  const dots = Array.from({ length: 18 }, (_, i) => ({
    x: ((i * 137.5) % 100),
    y: ((i * 97.3) % 100),
    r: 1 + (i % 3),
  }))

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Background */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 30% 40%, ${TEAL}22 0%, transparent 60%),
                       radial-gradient(ellipse at 75% 70%, ${SAFFRON}11 0%, transparent 50%),
                       linear-gradient(160deg, ${FOREST_DARK} 0%, ${FOREST} 55%, #0d2d1f 100%)`,
        }}
      />

      {/* Subtle grid overlay */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating particles */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        {dots.map((d, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.r * 2,
              height: d.r * 2,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </AbsoluteFill>

      {/* ── Top bar ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 64px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          transform: `translateY(${slideY}px)`,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${TEAL}, ${FOREST})`,
              border: '2px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
            }}
          >
            🩺
          </div>
          <div>
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 18,
                fontWeight: 800,
                color: CREAM,
                letterSpacing: -0.3,
              }}
            >
              PhysioDrishti
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginTop: -1 }}>
              physiodrishti.vercel.app
            </div>
          </div>
        </div>

        {/* Scene tag */}
        <div
          style={{
            background: tagColor + '22',
            border: `1px solid ${tagColor}55`,
            borderRadius: 20,
            padding: '5px 14px',
            fontSize: 11,
            fontWeight: 700,
            color: tagColor,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {sceneIndex + 1} / {totalScenes} · {scene.title}
        </div>
      </div>

      {/* ── Centre layout ── */}
      <div
        style={{
          position: 'absolute',
          top: 72,
          left: 0,
          right: 0,
          bottom: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 80,
          padding: '0 80px',
          transform: `translateY(${slideY / 2}px)`,
        }}
      >
        {/* Phone frame */}
        <PhoneFrame scene={scene} />

        {/* Text block */}
        <div style={{ flex: 1, maxWidth: 740 }}>
          {/* Scene time */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: SAFFRON,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 10,
              opacity: 0.8,
            }}
          >
            {scene.start} — {scene.end}
          </div>

          {/* Scene title */}
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 48,
              fontWeight: 800,
              color: CREAM,
              lineHeight: 1.15,
              marginBottom: 24,
              letterSpacing: -1,
            }}
          >
            {scene.title}
          </div>

          {/* Divider */}
          <div
            style={{
              width: 48,
              height: 3,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${SAFFRON}, transparent)`,
              marginBottom: 24,
            }}
          />

          {/* Voiceover caption */}
          <div
            style={{
              fontSize: 20,
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.72)',
              fontFamily: 'Georgia, serif',
              letterSpacing: 0.1,
            }}
          >
            <Progressive
              text={scene.voiceover}
              durationInFrames={durationInFrames}
              fps={fps}
            />
          </div>

          {/* User input chips */}
          {scene.user_input && (
            <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(Array.isArray(scene.user_input) ? scene.user_input : [scene.user_input]).map(
                (u, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      borderRadius: 20,
                      padding: '5px 14px',
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.65)',
                    }}
                  >
                    "{u}"
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom progress bar ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${TEAL}, ${SAFFRON})`,
            width: `${(frame / durationInFrames) * 100}%`,
          }}
        />
      </div>

      {/* Scene dots */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 6,
        }}
      >
        {Array.from({ length: totalScenes }, (_, i) => (
          <div
            key={i}
            style={{
              width: i === sceneIndex ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === sceneIndex ? SAFFRON : 'rgba(255,255,255,0.2)',
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  )
}
