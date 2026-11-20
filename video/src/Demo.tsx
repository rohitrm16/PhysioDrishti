import React from 'react'
import { AbsoluteFill, Sequence } from 'remotion'
import { DemoProps } from './types'
import { SceneSlide } from './SceneSlide'
import { TitleCard, TITLE_CARD_FRAMES } from './TitleCard'
import { EndCard } from './EndCard'

const FPS = 30
const END_CARD_FRAMES = 90 // 3 seconds

function parseTimeSecs(t: string): number {
  const [m, s] = t.split(':').map(Number)
  return m * 60 + (s || 0)
}

export const Demo: React.FC<DemoProps> = ({ scripts, site, repo }) => {
  const script = scripts.find((s) => s.id === 'patient-journey') || scripts[0]

  return (
    <AbsoluteFill>
      {/* Title card */}
      <Sequence from={0} durationInFrames={TITLE_CARD_FRAMES}>
        <TitleCard script={script} />
      </Sequence>

      {/* Scene slides */}
      {script.scenes.map((scene, i) => {
        const startSecs = parseTimeSecs(scene.start)
        const endSecs = parseTimeSecs(scene.end)
        const from = TITLE_CARD_FRAMES + startSecs * FPS
        const dur = Math.max(FPS, (endSecs - startSecs) * FPS)
        return (
          <Sequence key={scene.n} from={from} durationInFrames={dur}>
            <SceneSlide
              scene={scene}
              sceneIndex={i}
              totalScenes={script.scenes.length}
            />
          </Sequence>
        )
      })}

      {/* End card */}
      <Sequence
        from={TITLE_CARD_FRAMES + script.duration_seconds * FPS}
        durationInFrames={END_CARD_FRAMES}
      >
        <EndCard site={site || 'physiodrishti.vercel.app'} repo={repo || 'github.com/rohitrm16/PhysioDrishti'} />
      </Sequence>
    </AbsoluteFill>
  )
}

export const DemoEngineering: React.FC<DemoProps> = ({ scripts, site, repo }) => {
  const script = scripts.find((s) => s.id === 'ai-engineering') || scripts[1] || scripts[0]

  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={TITLE_CARD_FRAMES}>
        <TitleCard script={script} />
      </Sequence>

      {script.scenes.map((scene, i) => {
        const startSecs = parseTimeSecs(scene.start)
        const endSecs = parseTimeSecs(scene.end)
        const from = TITLE_CARD_FRAMES + startSecs * FPS
        const dur = Math.max(FPS, (endSecs - startSecs) * FPS)
        return (
          <Sequence key={scene.n} from={from} durationInFrames={dur}>
            <SceneSlide
              scene={scene}
              sceneIndex={i}
              totalScenes={script.scenes.length}
            />
          </Sequence>
        )
      })}

      <Sequence
        from={TITLE_CARD_FRAMES + script.duration_seconds * FPS}
        durationInFrames={END_CARD_FRAMES}
      >
        <EndCard site={site || 'physiodrishti.vercel.app'} repo={repo || 'github.com/rohitrm16/PhysioDrishti'} />
      </Sequence>
    </AbsoluteFill>
  )
}
