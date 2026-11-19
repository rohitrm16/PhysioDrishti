export type Scene = {
  n: number;
  start: string;
  end: string;
  title: string;
  on_screen: string;
  voiceover: string;
  user_input?: string | string[];
  metrics?: Record<string, Record<string, string | number>>;
};

export type OptionalScene = Omit<Scene, "n" | "start" | "end"> & {
  insert_after: number;
  duration_seconds: number;
};

export type Script = {
  id: string;
  title: string;
  audience: string[];
  duration_seconds: number;
  device: string;
  stack?: string[];
  persona?: { name: string; age: number; city: string; condition: string };
  scenes: Scene[];
  optional_scenes?: OptionalScene[];
};

export type DemoProps = {
  project: string;
  site: string;
  repo: string;
  version: string;
  scripts: Script[];
  /** Render only the script with this id. Omit to render every script back to back. */
  scriptId?: string;
  /** Include optional scenes (e.g. the safety scene) at their insert points. */
  includeOptional?: boolean;
  [key: string]: unknown;
};

export type TimelineItem =
  | {
      kind: "intro";
      from: number;
      duration: number;
      script: Script;
      scriptIndex: number;
    }
  | {
      kind: "scene";
      from: number;
      duration: number;
      script: Script;
      scriptIndex: number;
      scene: Scene;
      label: string;
      sceneCount: number;
      position: number;
    };
