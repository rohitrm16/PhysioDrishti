import React from 'react'
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import { Scene } from './types'
import { S1_Landing } from './screens/S1_Landing'
import { S2_Chat } from './screens/S2_Chat'
import { S3_Voice } from './screens/S3_Voice'
import { S4_Guided } from './screens/S4_Guided'
import { S5_Progress } from './screens/S5_Progress'
import { S6_Share } from './screens/S6_Share'
import { S7_Booking } from './screens/S7_Booking'

function getScreen(sceneN: number, progress: number): React.ReactNode {
  switch (sceneN) {
    case 1: return <S1_Landing progress={progress} />
    case 2: return <S2_Chat progress={progress} />
    case 3: return <S3_Voice progress={progress} />
    case 4: return <S4_Guided progress={progress} />
    case 5: return <S5_Progress progress={progress} />
    case 6: return <S6_Share progress={progress} />
    case 7: return <S7_Booking progress={progress} />
    default: return <S2_Chat progress={progress} />
  }
}

export const PhoneFrame: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const progress = frame / durationInFrames

  const screenContent = getScreen(scene.n, progress)

  return (
    <div
      style={{
        width: 304,
        height: 548,
        borderRadius: 44,
        background: '#111',
        border: '3px solid #252525',
        boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Screen content — full bleed */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 42,
          overflow: 'hidden',
        }}
      >
        {screenContent}
      </div>

      {/* Dynamic island — overlaid on content */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 100,
          height: 24,
          borderRadius: 12,
          background: '#000',
          zIndex: 10,
        }}
      />

      {/* Home indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 7,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 90,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.28)',
          zIndex: 10,
        }}
      />

      {/* Side button shimmer */}
      <div
        style={{
          position: 'absolute',
          right: -3,
          top: 100,
          width: 3,
          height: 60,
          borderRadius: '0 2px 2px 0',
          background: 'rgba(255,255,255,0.08)',
        }}
      />
    </div>
  )
}
