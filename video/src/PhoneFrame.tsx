import React from 'react'
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { Scene } from './types'

const FOREST = '#12382A'
const TEAL = '#0A6B5E'
const SAFFRON = '#D4510E'

function parseTimeSecs(t: string): number {
  const [m, s] = t.split(':').map(Number)
  return m * 60 + (s || 0)
}

// Renders a mock phone screen with on_screen description + user message bubble
export const PhoneFrame: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const bubbleVisible = interpolate(frame, [fps * 0.6, fps * 0.9], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const userInput = Array.isArray(scene.user_input)
    ? scene.user_input[0]
    : scene.user_input

  return (
    <div
      style={{
        width: 280,
        height: 520,
        borderRadius: 36,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        border: '2.5px solid rgba(255,255,255,0.18)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Dynamic island / notch */}
      <div
        style={{
          width: 100,
          height: 24,
          borderRadius: 12,
          background: '#000',
          margin: '10px auto 0',
          flexShrink: 0,
        }}
      />

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '4px 20px',
          fontSize: 10,
          color: 'rgba(255,255,255,0.5)',
          flexShrink: 0,
        }}
      >
        <span>9:41</span>
        <span>◉◉◉</span>
      </div>

      {/* Screen content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '10px 14px 0',
          overflow: 'hidden',
        }}
      >
        {/* App header */}
        <div
          style={{
            background: FOREST,
            borderRadius: '12px 12px 0 0',
            padding: '10px 14px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'Georgia, serif',
            }}
          >
            PhysioDrishti
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
            AI-powered physiotherapy
          </div>
        </div>

        {/* Chat / content area */}
        <div
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            padding: '10px 10px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflow: 'hidden',
          }}
        >
          {/* On-screen description as AI message */}
          <div
            style={{
              background: 'rgba(10,107,94,0.35)',
              borderRadius: '2px 10px 10px 10px',
              padding: '8px 10px',
              fontSize: 10,
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.85)',
              maxWidth: '90%',
            }}
          >
            {scene.on_screen}
          </div>

          {/* User input bubble */}
          {userInput && (
            <div
              style={{
                background: TEAL,
                borderRadius: '10px 10px 2px 10px',
                padding: '7px 10px',
                fontSize: 10,
                color: '#fff',
                alignSelf: 'flex-end',
                maxWidth: '80%',
                opacity: bubbleVisible,
              }}
            >
              {userInput}
            </div>
          )}
        </div>

        {/* Input bar */}
        <div
          style={{
            background: 'rgba(255,255,255,0.07)',
            borderRadius: '0 0 0 0',
            padding: '7px 10px',
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 22,
              borderRadius: 11,
              background: 'rgba(255,255,255,0.1)',
              fontSize: 9,
              color: 'rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 8,
            }}
          >
            Message Drishti…
          </div>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: SAFFRON,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
            }}
          >
            ↑
          </div>
        </div>
      </div>

      {/* Home indicator */}
      <div
        style={{
          width: 90,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.25)',
          margin: '6px auto 8px',
          flexShrink: 0,
        }}
      />
    </div>
  )
}
