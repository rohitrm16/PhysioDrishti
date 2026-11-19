import { Composition } from "remotion";
import demoScript from "../demo-script.json";
import { calculateDemoMetadata, Demo } from "./demo/Demo";
import { FPS } from "./demo/timeline";
import type { DemoProps } from "./demo/types";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Data-driven: props come from demo-script.json (or --props on the CLI). */}
      <Composition
        id="Demo"
        component={Demo}
        durationInFrames={FPS * 60}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={demoScript as DemoProps}
        calculateMetadata={calculateDemoMetadata}
      />
    </>
  );
};
