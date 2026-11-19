import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ScriptIntro, SceneView } from "./scenes";
import { theme } from "./theme";
import { buildTimeline, totalFrames } from "./timeline";
import type { DemoProps } from "./types";

export const calculateDemoMetadata: CalculateMetadataFunction<DemoProps> = ({
  props,
}) => ({
  durationInFrames: totalFrames(buildTimeline(props)),
});

export const Demo: React.FC<DemoProps> = (props) => {
  const items = buildTimeline(props);
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: theme.bg, fontFamily: theme.font }}>
      {items.map((item, i) => (
        <Sequence
          key={i}
          from={item.from}
          durationInFrames={item.duration}
          name={
            item.kind === "intro"
              ? `Intro · ${item.script.id}`
              : `${item.script.id} · ${item.scene.n}. ${item.scene.title}`
          }
        >
          {item.kind === "intro" ? (
            <ScriptIntro script={item.script} project={props.project} />
          ) : (
            <SceneView
              script={item.script}
              scene={item.scene}
              label={item.label}
              position={item.position}
              sceneCount={item.sceneCount}
              duration={item.duration}
              site={props.site}
              repo={props.repo}
            />
          )}
        </Sequence>
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          height: 8,
          width: `${(frame / durationInFrames) * 100}%`,
          background: theme.orange,
        }}
      />
    </AbsoluteFill>
  );
};
