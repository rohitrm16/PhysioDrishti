import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "./theme";

export const useEnter = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 } });
};

export const FadeUp: React.FC<{
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, style }) => {
  const p = useEnter(delay);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [24, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Split narration into sentences and show the current one, timed by word count. */
export const Caption: React.FC<{ text: string; duration: number }> = ({
  text,
  duration,
}) => {
  const frame = useCurrentFrame();
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const weights = sentences.map((s) => s.split(/\s+/).length);
  const total = weights.reduce((a, b) => a + b, 0);
  const usable = duration - 12;
  let acc = 6;
  const spans = weights.map((w) => {
    const from = acc;
    acc += (w / total) * usable;
    return { from, to: acc };
  });
  const idx = Math.max(
    0,
    spans.findIndex((s) => frame >= s.from && frame < s.to),
  );
  const current = frame >= acc ? sentences.length - 1 : idx;
  const span = spans[current];
  const local = frame - span.from;
  const opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const words = sentences[current].split(/\s+/);
  const wordsShown = interpolate(
    frame,
    [span.from, span.from + (span.to - span.from) * 0.85],
    [0, words.length],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        bottom: 70,
        minHeight: 150,
        padding: "28px 40px",
        borderRadius: 28,
        background: theme.ink,
        color: "white",
        display: "flex",
        alignItems: "center",
        gap: 28,
        boxShadow: "0 20px 60px rgba(18,56,42,0.25)",
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 2,
          color: theme.mint,
          textTransform: "uppercase",
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
        }}
      >
        Voiceover
      </div>
      <div style={{ fontSize: 46, lineHeight: 1.3, fontWeight: 500, opacity }}>
        {words.map((w, i) => (
          <span key={i} style={{ opacity: i < wordsShown ? 1 : 0.28 }}>
            {w}{" "}
          </span>
        ))}
      </div>
    </div>
  );
};

export const Phone: React.FC<{
  children: React.ReactNode;
  width?: number;
  style?: React.CSSProperties;
}> = ({ children, width = 330, style }) => (
  <div
    style={{
      width,
      height: width * 2,
      borderRadius: width * 0.13,
      background: "#0E1A16",
      padding: width * 0.035,
      boxShadow: "0 30px 80px rgba(18,56,42,0.35)",
      ...style,
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: width * 0.1,
        background: theme.bg,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 46,
          background: theme.teal,
          color: "white",
          display: "flex",
          alignItems: "center",
          padding: "0 18px",
          fontSize: 17,
          fontWeight: 700,
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            background: theme.mint,
          }}
        />
        Drishti
      </div>
      <div style={{ flex: 1, padding: 14, position: "relative" }}>
        {children}
      </div>
    </div>
  </div>
);

export const Tablet: React.FC<{
  children: React.ReactNode;
  width?: number;
  active?: string;
  style?: React.CSSProperties;
}> = ({ children, width = 760, active, style }) => {
  const nav = ["Approvals", "Bookings", "Traces", "Evals", "Patients"];
  return (
    <div
      style={{
        width,
        height: width * 0.68,
        borderRadius: 34,
        background: "#0E1A16",
        padding: 18,
        boxShadow: "0 30px 80px rgba(18,56,42,0.3)",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 18,
          background: theme.bg,
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div
          style={{
            width: width * 0.22,
            background: theme.ink,
            padding: "22px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              color: theme.mint,
              fontWeight: 800,
              fontSize: 16,
              marginBottom: 12,
            }}
          >
            Dashboard
          </div>
          {nav.map((n) => (
            <div
              key={n}
              style={{
                fontSize: 15,
                padding: "8px 10px",
                borderRadius: 8,
                color: n === active ? theme.ink : "rgba(255,255,255,0.75)",
                background: n === active ? theme.mint : "transparent",
                fontWeight: n === active ? 700 : 500,
              }}
            >
              {n}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, padding: 22, position: "relative" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const Pill: React.FC<{
  children: React.ReactNode;
  color?: string;
  bg?: string;
}> = ({ children, color = theme.teal, bg = "rgba(10,107,94,0.1)" }) => (
  <span
    style={{
      display: "inline-block",
      padding: "8px 18px",
      borderRadius: 999,
      color,
      background: bg,
      fontWeight: 600,
      fontSize: 24,
    }}
  >
    {children}
  </span>
);
