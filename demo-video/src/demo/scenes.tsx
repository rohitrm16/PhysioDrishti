import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { formatTime } from "./timeline";
import { theme } from "./theme";
import type { Scene, Script } from "./types";
import { Caption, FadeUp, Phone, Pill, Tablet, useEnter } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const scriptHeading = (title: string) => {
  const [label, ...rest] = title.split(":");
  return rest.length
    ? { label: label.trim(), name: rest.join(":").trim() }
    : { label: "", name: title };
};

/** Split "Do this. Then that." into steps, never breaking inside quotes. */
const splitSteps = (text: string) => {
  const steps: string[] = [];
  let buf = "";
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    buf += c;
    if (c === '"') inQuote = !inQuote;
    if (c === "." && !inQuote && /\s/.test(text[i + 1] ?? " ")) {
      steps.push(buf);
      buf = "";
    }
  }
  steps.push(buf);
  return steps.map((s) => s.trim().replace(/\.$/, "")).filter(Boolean);
};

const hash = (s: string) =>
  [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/* ------------------------------------------------------------------ */
/* Script intro                                                         */
/* ------------------------------------------------------------------ */

export const ScriptIntro: React.FC<{ script: Script; project: string }> = ({
  script,
  project,
}) => {
  const { label, name } = scriptHeading(script.title);
  const frame = useCurrentFrame();
  const out = interpolate(frame, [100, 120], [1, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.ink} 0%, ${theme.teal} 100%)`,
        color: "white",
        padding: "0 160px",
        justifyContent: "center",
        opacity: out,
      }}
    >
      <FadeUp>
        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: theme.mint,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {project} · {label}
        </div>
      </FadeUp>
      <FadeUp delay={6}>
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            lineHeight: 1.05,
            marginTop: 20,
            maxWidth: 1500,
          }}
        >
          {name}
        </div>
      </FadeUp>
      <FadeUp delay={14} style={{ marginTop: 50, display: "flex", gap: 16, flexWrap: "wrap" }}>
        {script.audience.map((a) => (
          <Pill key={a} color="white" bg="rgba(255,255,255,0.14)">
            For {a}
          </Pill>
        ))}
        <Pill color={theme.ink} bg={theme.mint}>
          {formatTime(script.duration_seconds)} · {script.device}
        </Pill>
      </FadeUp>
      {script.persona ? (
        <FadeUp delay={22} style={{ marginTop: 40, fontSize: 40, opacity: 0.85 }}>
          Meet {script.persona.name}, {script.persona.age}, from{" "}
          {script.persona.city}: {script.persona.condition}.
        </FadeUp>
      ) : null}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Shared scene chrome                                                  */
/* ------------------------------------------------------------------ */

const Chrome: React.FC<{
  script: Script;
  scene: Scene;
  label: string;
  position: number;
  sceneCount: number;
  duration: number;
  children: React.ReactNode;
}> = ({ script, scene, label, position, sceneCount, duration, children }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], clamp);
  const fadeOut = interpolate(frame, [duration - 10, duration], [1, 0], clamp);
  const { label: scriptLabel } = scriptHeading(script.title);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 85% 20%, rgba(114,212,168,0.25), transparent 55%), ${theme.bg}`,
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 120,
          right: 120,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 26,
          fontWeight: 600,
          color: theme.muted,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Img src={staticFile("logo.png")} style={{ height: 44, borderRadius: 8 }} />
          <span>{scriptLabel}</span>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <Pill>{label}</Pill>
          <Pill color={theme.orange} bg="rgba(212,81,14,0.1)">
            Scene {position} / {sceneCount}
          </Pill>
        </div>
      </div>
      {children}
      <Caption text={scene.voiceover} duration={duration} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Device contents                                                      */
/* ------------------------------------------------------------------ */

const Bubble: React.FC<{
  side: "user" | "bot";
  children: React.ReactNode;
  delay: number;
}> = ({ side, children, delay }) => {
  const p = useEnter(delay);
  return (
    <div
      style={{
        alignSelf: side === "user" ? "flex-end" : "flex-start",
        maxWidth: "86%",
        padding: "10px 14px",
        borderRadius: 16,
        borderBottomRightRadius: side === "user" ? 4 : 16,
        borderBottomLeftRadius: side === "bot" ? 4 : 16,
        background: side === "user" ? theme.teal : theme.surface,
        color: side === "user" ? "white" : theme.ink,
        border: side === "bot" ? `1px solid ${theme.border}` : "none",
        fontSize: 17,
        lineHeight: 1.35,
        opacity: p,
        transform: `scale(${interpolate(p, [0, 1], [0.9, 1])})`,
        transformOrigin: side === "user" ? "right bottom" : "left bottom",
      }}
    >
      {children}
    </div>
  );
};

const Skeleton: React.FC<{ widths: number[]; color?: string }> = ({
  widths,
  color = theme.border,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
    {widths.map((w, i) => (
      <div key={i} style={{ height: 9, width: `${w}%`, borderRadius: 5, background: color }} />
    ))}
  </div>
);

const ChatScreen: React.FC<{ scene: Scene; duration: number }> = ({
  scene,
  duration,
}) => {
  const frame = useCurrentFrame();
  const inputs = Array.isArray(scene.user_input)
    ? scene.user_input
    : scene.user_input
      ? [scene.user_input]
      : [];
  const lower = scene.on_screen.toLowerCase();
  const isVoice = lower.includes("mic");
  const slot = (duration - 20) / Math.max(1, inputs.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      {inputs.map((text, i) => {
        const start = 12 + i * slot;
        const typed = Math.round(
          interpolate(frame, [start, start + Math.min(50, slot * 0.35)], [0, text.length], clamp),
        );
        const replyAt = start + Math.min(70, slot * 0.5);
        if (frame < start) return null;
        return (
          <React.Fragment key={i}>
            <Bubble side="user" delay={start}>
              {isVoice ? "🎤 " : ""}
              {text.slice(0, typed)}
              {typed < text.length ? "▍" : ""}
            </Bubble>
            {frame >= replyAt - 15 && frame < replyAt ? (
              <Bubble side="bot" delay={replyAt - 15}>
                <span style={{ letterSpacing: 4, color: theme.muted }}>•••</span>
              </Bubble>
            ) : null}
            {frame >= replyAt ? (
              <Bubble side="bot" delay={replyAt}>
                <Skeleton widths={[92, 80, 86, 54]} />
                {lower.includes("citation") ? (
                  <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                    {["[1]", "[2]"].map((c) => (
                      <span
                        key={c}
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: theme.teal,
                          background: "rgba(10,107,94,0.1)",
                          borderRadius: 6,
                          padding: "2px 6px",
                        }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : null}
                {isVoice ? (
                  <div style={{ marginTop: 8, fontSize: 13, color: theme.teal, fontWeight: 700 }}>
                    🔊 Playing spoken reply
                  </div>
                ) : null}
              </Bubble>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const StepScreen: React.FC<{ steps: string[]; active: number }> = ({
  steps,
  active,
}) => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 12 }}>
    <div style={{ display: "flex", gap: 6 }}>
      {steps.map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: i <= active ? theme.teal : theme.border,
          }}
        />
      ))}
    </div>
    <div
      style={{
        marginTop: 20,
        padding: 18,
        borderRadius: 16,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        fontSize: 20,
        fontWeight: 700,
        color: theme.ink,
        lineHeight: 1.35,
      }}
    >
      {steps[active]}
    </div>
    <Skeleton widths={[90, 70, 84]} />
    <div
      style={{
        marginTop: "auto",
        padding: "12px 0",
        borderRadius: 12,
        background: theme.teal,
        color: "white",
        fontSize: 16,
        fontWeight: 700,
        textAlign: "center",
      }}
    >
      Continue
    </div>
  </div>
);

const traceSpans = (onScreen: string): string[] => {
  const m = onScreen.match(/Traces?[^:.]*:\s*([^.]+)/);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("with "))
    .map((s) => s.split(" ")[0]);
};

const DashboardScreen: React.FC<{
  scene: Scene;
  steps: string[];
  active: number;
}> = ({ scene, steps, active }) => {
  const frame = useCurrentFrame();
  const found = traceSpans(scene.on_screen).filter((s) => /^[a-z_]{3,}$/.test(s));
  const spans = found.length >= 2 ? found : [];
  const masked = scene.on_screen.includes("[PHONE]");
  const heading = spans.length ? "Trace · newest conversation" : steps[active];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: theme.ink }}>{heading}</div>
      {masked ? (
        <div
          style={{
            padding: 14,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            fontSize: 17,
            color: theme.ink,
          }}
        >
          user: “Please call me on{" "}
          <span
            style={{
              fontFamily: theme.mono,
              background: "rgba(212,81,14,0.12)",
              color: theme.orange,
              padding: "1px 6px",
              borderRadius: 4,
              fontWeight: 700,
            }}
          >
            [PHONE]
          </span>{" "}
          tomorrow”
        </div>
      ) : null}
      {spans.length
        ? spans.map((s, i) => {
            const appear = interpolate(frame, [20 + i * 12, 32 + i * 12], [0, 1], clamp);
            const h = hash(s + i);
            const offset = 6 + i * (70 / spans.length);
            const width = 10 + (h % 22);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  opacity: appear,
                  fontSize: 15,
                }}
              >
                <div style={{ width: 150, fontFamily: theme.mono, color: theme.ink, fontWeight: 700 }}>
                  {s}
                </div>
                <div style={{ flex: 1, height: 18, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: `${offset}%`,
                      width: `${width * appear}%`,
                      height: "100%",
                      borderRadius: 4,
                      background: s.startsWith("llm") || s === "generate" ? theme.orange : theme.teal,
                    }}
                  />
                </div>
                <div style={{ width: 60, textAlign: "right", fontFamily: theme.mono, color: theme.muted }}>
                  {40 + (h % 900)}ms
                </div>
              </div>
            );
          })
        : [0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                padding: 12,
                borderRadius: 10,
                background: theme.surface,
                border: `1px solid ${i === 0 ? theme.teal : theme.border}`,
                opacity: interpolate(frame, [10 + i * 8, 22 + i * 8], [0, 1], clamp),
              }}
            >
              <Skeleton widths={[60 - i * 5, 35]} />
            </div>
          ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Main scene                                                           */
/* ------------------------------------------------------------------ */

type SceneViewProps = {
  script: Script;
  scene: Scene;
  label: string;
  position: number;
  sceneCount: number;
  duration: number;
  site: string;
  repo: string;
};

export const SceneView: React.FC<SceneViewProps> = (props) => {
  const { scene, script } = props;
  if (scene.metrics) return <MetricsScene {...props} />;
  if (/end card/i.test(scene.title)) return <EndCard {...props} />;
  if (script.stack && scene.n === 1) return <StackTitle {...props} />;
  return <StoryboardScene {...props} />;
};

const StoryboardScene: React.FC<SceneViewProps> = (props) => {
  const { scene, duration } = props;
  const frame = useCurrentFrame();
  const steps = splitSteps(scene.on_screen);
  const active = Math.min(
    steps.length - 1,
    Math.floor(interpolate(frame, [10, duration * 0.8], [0, steps.length], clamp)),
  );
  const t = scene.on_screen.toLowerCase();
  const dash = /dashboard|traces?\b|eval review|approvals/.test(t);
  const phoneish =
    Boolean(scene.user_input) || /phone:|\btap\b|\btype\b|chat|\bmic\b|landing|\bask\b/.test(t);
  const mode = dash && phoneish ? "both" : dash ? "tablet" : "phone";
  const nav = ["Approvals", "Traces", "Evals"].find((n) => t.includes(n.toLowerCase().slice(0, 5)));
  const phoneContent = scene.user_input ? (
    <ChatScreen scene={scene} duration={duration} />
  ) : (
    <StepScreen steps={steps} active={active} />
  );
  const deviceIn = useEnter(4);

  return (
    <Chrome {...props}>
      <div style={{ position: "absolute", left: 120, top: 160, width: 860 }}>
        <FadeUp>
          <div style={{ fontSize: 30, fontWeight: 800, color: theme.orange }}>
            {String(scene.n).padStart(2, "0")}
          </div>
        </FadeUp>
        <FadeUp delay={4}>
          <div
            style={{ fontSize: 92, fontWeight: 800, color: theme.ink, lineHeight: 1.05, marginTop: 6 }}
          >
            {scene.title}
          </div>
        </FadeUp>
        <FadeUp delay={8}>
          <div
            style={{
              marginTop: 34,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              color: theme.muted,
              textTransform: "uppercase",
            }}
          >
            On screen
          </div>
        </FadeUp>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {steps.slice(0, 7).map((s, i) => {
            const shown = interpolate(
              frame,
              [10 + (i * duration * 0.8) / steps.length, 20 + (i * duration * 0.8) / steps.length],
              [0, 1],
              clamp,
            );
            const isActive = i === active;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                  opacity: interpolate(shown, [0, 1], [0.25, isActive ? 1 : 0.6]),
                  fontSize: steps.length > 5 ? 28 : 32,
                  lineHeight: 1.3,
                  color: theme.ink,
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    marginTop: 8,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    border: `3px solid ${theme.teal}`,
                    background: i < active ? theme.teal : isActive ? theme.mint : "transparent",
                  }}
                />
                <div>{s}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 1040,
          right: 100,
          top: 140,
          height: 640,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: deviceIn,
          transform: `translateY(${interpolate(deviceIn, [0, 1], [40, 0])}px)`,
        }}
      >
        {mode === "phone" ? <Phone width={310}>{phoneContent}</Phone> : null}
        {mode === "tablet" ? (
          <Tablet active={nav}>
            <DashboardScreen scene={scene} steps={steps} active={active} />
          </Tablet>
        ) : null}
        {mode === "both" ? (
          <div style={{ position: "relative", width: 780, height: 640 }}>
            <Tablet width={640} active={nav ?? "Traces"} style={{ position: "absolute", right: 0, top: 30 }}>
              <DashboardScreen scene={scene} steps={steps} active={active} />
            </Tablet>
            <Phone width={300} style={{ position: "absolute", left: 0, bottom: 0 }}>
              {phoneContent}
            </Phone>
          </div>
        ) : null}
      </div>
    </Chrome>
  );
};

/* ------------------------------------------------------------------ */
/* Special scenes                                                       */
/* ------------------------------------------------------------------ */

const humanize = (k: string) =>
  k === "hit_at_5"
    ? "Hit@5"
    : k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const MetricsScene: React.FC<SceneViewProps> = (props) => {
  const { scene } = props;
  const frame = useCurrentFrame();
  const runs = Object.entries(scene.metrics ?? {});
  const cols = runs.length ? Object.keys(runs[0][1]) : [];

  return (
    <Chrome {...props}>
      <div style={{ position: "absolute", left: 120, top: 160, right: 120 }}>
        <FadeUp>
          <div style={{ fontSize: 30, fontWeight: 800, color: theme.orange }}>
            {String(scene.n).padStart(2, "0")}
          </div>
          <div style={{ fontSize: 84, fontWeight: 800, color: theme.ink, lineHeight: 1.05 }}>
            {scene.title}: run comparison
          </div>
        </FadeUp>
        <FadeUp
          delay={8}
          style={{
            marginTop: 40,
            background: theme.surface,
            borderRadius: 24,
            border: `1px solid ${theme.border}`,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(18,56,42,0.1)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `200px repeat(${cols.length}, 1fr)`,
              fontSize: 24,
              fontWeight: 700,
              color: theme.muted,
              background: theme.bg,
              padding: "20px 30px",
            }}
          >
            <div>Run</div>
            {cols.map((c) => (
              <div key={c}>{humanize(c)}</div>
            ))}
          </div>
          {runs.map(([run, values], i) => {
            const appear = interpolate(frame, [30 + i * 45, 45 + i * 45], [0, 1], clamp);
            const latest = i === runs.length - 1;
            return (
              <div
                key={run}
                style={{
                  display: "grid",
                  gridTemplateColumns: `200px repeat(${cols.length}, 1fr)`,
                  alignItems: "center",
                  padding: "22px 30px",
                  fontSize: 30,
                  color: theme.ink,
                  fontWeight: latest ? 800 : 500,
                  borderTop: `1px solid ${theme.border}`,
                  background: latest ? "rgba(114,212,168,0.18)" : "transparent",
                  opacity: appear,
                  transform: `translateX(${interpolate(appear, [0, 1], [-30, 0])}px)`,
                }}
              >
                <div style={{ color: latest ? theme.teal : theme.ink }}>{humanize(run)}</div>
                {cols.map((c) => {
                  const raw = values[c];
                  const v =
                    typeof raw === "number" && raw <= 1 && c !== "questions"
                      ? raw.toFixed(2)
                      : String(raw ?? "");
                  const [main, note] = v.split(/\s(?=\()/);
                  return (
                    <div key={c}>
                      {main}
                      {note ? (
                        <div style={{ fontSize: 17, color: theme.muted, fontWeight: 500 }}>{note}</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </FadeUp>
      </div>
    </Chrome>
  );
};

const StackTitle: React.FC<SceneViewProps> = (props) => {
  const { scene, script } = props;
  const quoted = scene.on_screen.match(/'([^']+)'/)?.[1] ?? scene.title;
  const [head, ...tail] = quoted.split(":");
  return (
    <Chrome {...props}>
      <div style={{ position: "absolute", left: 120, right: 120, top: 160 }}>
        <FadeUp>
          <div style={{ fontSize: 130, fontWeight: 900, color: theme.ink, lineHeight: 1 }}>{head}</div>
        </FadeUp>
        {tail.length ? (
          <FadeUp delay={8}>
            <div style={{ fontSize: 64, fontWeight: 700, color: theme.teal, marginTop: 24, lineHeight: 1.15 }}>
              {tail.join(":").trim()}
            </div>
          </FadeUp>
        ) : null}
        <div style={{ marginTop: 44, display: "flex", flexWrap: "wrap", gap: 16 }}>
          {(script.stack ?? []).map((s, i) => (
            <FadeUp key={s} delay={20 + i * 6}>
              <span
                style={{
                  display: "inline-block",
                  fontSize: 30,
                  fontWeight: 700,
                  padding: "12px 24px",
                  borderRadius: 18,
                  background: theme.surface,
                  border: `2px solid ${theme.border}`,
                  color: theme.ink,
                }}
              >
                {s}
              </span>
            </FadeUp>
          ))}
        </div>
      </div>
    </Chrome>
  );
};

const EndCard: React.FC<SceneViewProps> = ({ scene, site, repo }) => {
  const frame = useCurrentFrame();
  const showRepo = /github/i.test(scene.on_screen);
  const fadeIn = interpolate(frame, [0, 12], [0, 1], clamp);
  const logoIn = useEnter(4);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.ink} 0%, ${theme.teal} 100%)`,
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeIn,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 40,
          padding: "40px 60px",
          transform: `scale(${interpolate(logoIn, [0, 1], [0.85, 1])})`,
          opacity: logoIn,
          boxShadow: "0 30px 90px rgba(0,0,0,0.3)",
        }}
      >
        <Img src={staticFile("logo.png")} style={{ height: 300 }} />
      </div>
      <FadeUp delay={14} style={{ marginTop: 50, textAlign: "center" }}>
        <div style={{ fontSize: 60, fontWeight: 800, color: "white", maxWidth: 1500, lineHeight: 1.2 }}>
          {scene.voiceover}
        </div>
      </FadeUp>
      <FadeUp delay={24} style={{ marginTop: 40, display: "flex", gap: 24 }}>
        <Pill color={theme.ink} bg={theme.mint}>
          {site.replace(/^https?:\/\//, "")}
        </Pill>
        {showRepo ? (
          <Pill color="white" bg="rgba(255,255,255,0.15)">
            {repo.replace(/^https?:\/\//, "")}
          </Pill>
        ) : null}
      </FadeUp>
    </AbsoluteFill>
  );
};
