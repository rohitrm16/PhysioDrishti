import React from 'react'
import { Composition } from 'remotion'
import { Demo, DemoEngineering } from './Demo'
import { DemoProps } from './types'
import demoScript from '../demo-script.json'

const FPS = 30
const TITLE_CARD_FRAMES = 90
const END_CARD_FRAMES = 90

function parseTimeSecs(t: string): number {
  const [m, s] = t.split(':').map(Number)
  return m * 60 + (s || 0)
}

export const Root: React.FC = () => {
  const script1 = (demoScript as any).scripts.find((s: any) => s.id === 'patient-journey')
  const script2 = (demoScript as any).scripts.find((s: any) => s.id === 'ai-engineering')

  const dur1 = TITLE_CARD_FRAMES + (script1?.duration_seconds ?? 160) * FPS + END_CARD_FRAMES
  const dur2 = TITLE_CARD_FRAMES + (script2?.duration_seconds ?? 245) * FPS + END_CARD_FRAMES

  return (
    <>
      <Composition
        id="Demo"
        component={Demo as any}
        fps={FPS}
        width={1920}
        height={1080}
        durationInFrames={dur1}
        defaultProps={demoScript as unknown as DemoProps}
        calculateMetadata={async ({ props }) => {
          const s = (props as any).scripts?.find((x: any) => x.id === 'patient-journey')
            || (props as any).scripts?.[0]
          const dur = TITLE_CARD_FRAMES + (s?.duration_seconds ?? 160) * FPS + END_CARD_FRAMES
          return { durationInFrames: dur }
        }}
      />
      <Composition
        id="DemoEngineering"
        component={DemoEngineering as any}
        fps={FPS}
        width={1920}
        height={1080}
        durationInFrames={dur2}
        defaultProps={demoScript as unknown as DemoProps}
        calculateMetadata={async ({ props }) => {
          const s = (props as any).scripts?.find((x: any) => x.id === 'ai-engineering')
            || (props as any).scripts?.[1]
            || (props as any).scripts?.[0]
          const dur = TITLE_CARD_FRAMES + (s?.duration_seconds ?? 245) * FPS + END_CARD_FRAMES
          return { durationInFrames: dur }
        }}
      />
    </>
  )
}
