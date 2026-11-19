import type { DemoProps, Scene, Script, TimelineItem } from "./types";

export const FPS = 30;
export const INTRO_SECONDS = 4;

export const parseTime = (t: string): number => {
  const [m, s] = t.split(":").map(Number);
  return m * 60 + s;
};

export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

const sceneSeconds = (scene: Scene): number =>
  Math.max(1, parseTime(scene.end) - parseTime(scene.start));

const scenesFor = (script: Script, includeOptional: boolean): Scene[] => {
  if (!includeOptional || !script.optional_scenes?.length) {
    return script.scenes;
  }
  const out: Scene[] = [];
  for (const scene of script.scenes) {
    out.push(scene);
    for (const opt of script.optional_scenes) {
      if (opt.insert_after === scene.n) {
        out.push({
          ...opt,
          n: scene.n,
          start: "0:00",
          end: formatTime(opt.duration_seconds),
        });
      }
    }
  }
  return out;
};

export const selectScripts = (props: DemoProps): Script[] => {
  if (!props.scriptId) return props.scripts;
  const match = props.scripts.filter((s) => s.id === props.scriptId);
  if (!match.length) {
    throw new Error(
      `scriptId "${props.scriptId}" not found. Available: ${props.scripts
        .map((s) => s.id)
        .join(", ")}`,
    );
  }
  return match;
};

export const buildTimeline = (props: DemoProps): TimelineItem[] => {
  const items: TimelineItem[] = [];
  let cursor = 0;
  selectScripts(props).forEach((script) => {
    const scriptIndex = props.scripts.indexOf(script);
    const introDuration = INTRO_SECONDS * FPS;
    items.push({ kind: "intro", from: cursor, duration: introDuration, script, scriptIndex });
    cursor += introDuration;

    const scenes = scenesFor(script, props.includeOptional ?? false);
    scenes.forEach((scene, i) => {
      const duration = Math.round(sceneSeconds(scene) * FPS);
      items.push({
        kind: "scene",
        from: cursor,
        duration,
        script,
        scriptIndex,
        scene,
        label: `${scene.start}–${scene.end}`,
        sceneCount: scenes.length,
        position: i + 1,
      });
      cursor += duration;
    });
  });
  return items;
};

export const totalFrames = (items: TimelineItem[]): number =>
  items.reduce((acc, it) => Math.max(acc, it.from + it.duration), 1);
