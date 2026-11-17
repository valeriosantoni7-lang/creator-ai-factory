import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "./brand";

// -----------------------------------------------------------------------------
// Shared kit for every template: colour tokens, easing, backgrounds, pills, flags,
// signature, safe zone, closing scene, media background and sound effects.
// Everything is driven by useCurrentFrame(), so renders are deterministic.
// -----------------------------------------------------------------------------

export const C = {
  paper: BRAND.colors.paper,
  ink: BRAND.colors.ink,
  accent: BRAND.colors.accent,
  accentDark: BRAND.colors.accentDark,
  accentTint: BRAND.colors.accentTint,
  accentLight: BRAND.colors.accentLight,
  accentWash: BRAND.colors.accentWash,
  grey: BRAND.colors.grey,
  line: BRAND.colors.line,
  green: "#1E8C4E",
} as const;

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// 0 → 1 between start and start+dur, with a soft ease-out.
export const enter = (frame: number, start: number, dur = 18) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const pop = (frame: number, fps: number, start: number, damping = 12) =>
  spring({ frame: Math.max(0, frame - start), fps, config: { damping, mass: 0.7 } });

// Video openings: the hook must be readable from the FIRST frame, because that is
// where viewers decide to stay. No fade-in from zero: the title is visible at once
// and only settles (a small scale and position snap).
// Usage: style={{ opacity: 1, transform: hookTransform(hookIn(frame, fps)) }}
export const hookIn = (frame: number, fps: number) =>
  spring({ frame, fps, config: { damping: 14, mass: 0.6 } });
export const hookTransform = (h: number) => `translateY(${(1 - h) * 14}px) scale(${1.035 - h * 0.035})`;

// Typewriter text (string slicing, never per-character opacity).
export const typed = (text: string, frame: number, start: number, cps = 38, fps = 30) => {
  const n = Math.max(0, Math.floor(((frame - start) / fps) * cps));
  return text.slice(0, n);
};

const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundImage: GRAIN_URI,
        backgroundPosition: `${(frame * 7) % 220}px ${(frame * 11) % 220}px`,
        mixBlendMode: "multiply",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

// Background: paper, solid accent or ink, with a slowly drifting dot grid
// so the screen is never completely still.
export const Backdrop: React.FC<{ tone?: "paper" | "accent" | "ink" }> = ({ tone = "paper" }) => {
  const frame = useCurrentFrame();
  const bg = tone === "accent" ? C.accent : tone === "ink" ? C.ink : C.paper;
  const dot =
    tone === "paper" ? "rgba(17,17,17,0.07)" : "rgba(255,255,255,0.10)";
  const shift = (frame * 0.6) % 48;
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${dot} 2px, transparent 2.5px)`,
          backgroundSize: "48px 48px",
          backgroundPosition: `${shift}px ${shift * 0.5}px`,
        }}
      />
      {tone === "accent" ? (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.16), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(0,0,0,0.25), transparent 60%)",
          }}
        />
      ) : null}
      <Grain opacity={tone === "paper" ? 0.05 : 0.08} />
    </AbsoluteFill>
  );
};

export const Pill: React.FC<{
  children: React.ReactNode;
  tone?: "accent" | "white" | "ghost";
  size?: number;
}> = ({ children, tone = "accent", size = 28 }) => (
  <div
    style={{
      display: "inline-block",
      padding: `${size * 0.42}px ${size * 0.95}px`,
      borderRadius: 999,
      fontFamily: BRAND.fonts.sans,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: size * 0.01,
      background: tone === "accent" ? C.accent : tone === "white" ? "#fff" : "transparent",
      color: tone === "accent" ? "#fff" : tone === "white" ? C.accent : "#fff",
      border: tone === "ghost" ? "2px solid rgba(255,255,255,0.6)" : "none",
    }}
  >
    {children}
  </div>
);

// Real flags instead of country codes: flag-icons SVGs (MIT) in public/flags/1x1 and 4x3.
// Accepts an ISO code ("ch") or a flag emoji already in the data ("🇨🇭").
export const flagCode = (v?: string): string | null => {
  if (!v) return null;
  const t = v.trim();
  if (/^[a-z]{2}$/i.test(t)) return t.toLowerCase();
  const cps = Array.from(t).map((ch) => ch.codePointAt(0) ?? 0);
  if (cps.length === 2 && cps.every((c) => c >= 0x1f1e6 && c <= 0x1f1ff)) {
    return cps.map((c) => String.fromCharCode(c - 0x1f1e6 + 97)).join("");
  }
  return null;
};

export const Flag: React.FC<{ value?: string; size?: number; radius?: number; wide?: boolean }> = ({
  value,
  size = 64,
  radius,
  wide = false,
}) => {
  const code = flagCode(value);
  if (!code) return value ? <span>{value}</span> : null;
  const w = wide ? Math.round((size * 4) / 3) : size;
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        width: w,
        height: size,
        borderRadius: radius ?? size * 0.24,
        overflow: "hidden",
        verticalAlign: "middle",
        flexShrink: 0,
        boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
      }}
    >
      <Img
        src={staticFile(`flags/${wide ? "4x3" : "1x1"}/${code}.svg`)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          boxShadow: "inset 0 0 0 2px rgba(17,17,17,0.10)",
        }}
      />
    </span>
  );
};

// Signature: your photo + handle, like an author line.
export const Handle: React.FC<{ dark?: boolean; size?: number }> = ({ dark = false, size = 27 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: size * 0.55,
      fontFamily: BRAND.fonts.sans,
      fontWeight: 700,
      fontSize: size,
      color: dark ? "rgba(255,255,255,0.88)" : "rgba(17,17,17,0.72)",
    }}
  >
    <Img
      src={staticFile(BRAND.avatar)}
      style={{
        width: size * 2.1,
        height: size * 2.1,
        borderRadius: "50%",
        objectFit: "cover",
        objectPosition: "50% 22%",
        border: `3px solid ${dark ? "rgba(255,255,255,0.9)" : "#fff"}`,
        boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
      }}
    />
    {BRAND.handle}
  </div>
);

// Bottom safe zone: on Instagram and TikTok the last ~380 px sit under the app's name,
// caption and audio overlay. Keep signature, scores and sources above it.
export const SAFE_BOTTOM = 380;

// Brand frame: handle bottom left, progress segments bottom right,
// optional counter top left.
export const BrandFrame: React.FC<{
  dark?: boolean;
  counter?: string;
  segments?: number;
  active?: number;
}> = ({ dark = false, counter, segments = 0, active = 0 }) => {
  const ink = dark ? "rgba(255,255,255,0.75)" : "rgba(17,17,17,0.55)";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {counter ? (
        <div
          style={{
            position: "absolute",
            top: 120,
            left: 80,
            fontFamily: BRAND.fonts.sans,
            fontWeight: 700,
            fontSize: 28,
            color: ink,
          }}
        >
          {counter}
        </div>
      ) : null}
      <div style={{ position: "absolute", bottom: SAFE_BOTTOM, left: 80 }}>
        <Handle dark={dark} />
      </div>
      {segments > 0 ? (
        <div style={{ position: "absolute", bottom: SAFE_BOTTOM + 24, right: 80, display: "flex", gap: 8 }}>
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 34,
                height: 6,
                borderRadius: 3,
                background: i <= active ? (dark ? "#fff" : C.accent) : dark ? "rgba(255,255,255,0.3)" : C.line,
              }}
            />
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// Shared closing scene: solid accent, serif title, pulsing white button.
// Kept to 2.8 s (a long static ending makes viewers leave); sources live inside it.
export const CTA_FRAMES = 84;
export const CtaEnd: React.FC<{ title: string; accent: string; button: string; source?: string; disclaimer?: string }> = ({
  title,
  accent,
  button,
  source,
  disclaimer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = pop(frame, fps, 0, 14);
  const a = enter(frame, 6, 14);
  const b = enter(frame, 14, 14);
  const src = enter(frame, 20, 14);
  const pulse = 1 + Math.sin((frame / fps) * Math.PI * 2) * 0.025;
  return (
    <AbsoluteFill>
      <Backdrop tone="accent" />
      <Sfx at={0} s="whoosh" v={0.4} />
      <Sfx at={14} s="pop" v={0.5} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          padding: source ? "0 90px 260px" : "0 90px",
          textAlign: "center",
          gap: 60,
        }}
      >
        <div style={{ transform: `scale(${0.88 + t * 0.12})`, opacity: Math.min(1, t * 1.4) }}>
          <div
            style={{
              fontFamily: BRAND.fonts.serif,
              fontWeight: 900,
              fontSize: 104,
              lineHeight: 1.04,
              color: "#fff",
              letterSpacing: -2,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: BRAND.fonts.serifItalic,
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 84,
              lineHeight: 1.1,
              color: C.accentTint,
              marginTop: 18,
              opacity: a,
              transform: `translateY(${(1 - a) * 30}px)`,
            }}
          >
            {accent}
          </div>
        </div>
        <div
          style={{
            opacity: b,
            transform: `translateY(${(1 - b) * 30}px) scale(${pulse})`,
            background: "#fff",
            color: C.accent,
            fontFamily: BRAND.fonts.sans,
            fontWeight: 800,
            fontSize: 40,
            padding: "28px 64px",
            borderRadius: 999,
            boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          }}
        >
          {button}
        </div>
      </AbsoluteFill>
      {source ? (
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            bottom: SAFE_BOTTOM + 90,
            opacity: src,
            fontFamily: BRAND.fonts.sans,
            color: "rgba(255,255,255,0.9)",
            textAlign: "left",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 26, marginBottom: 8 }}>{BRAND.labels.sources}</div>
          <div style={{ fontWeight: 500, fontSize: 27, lineHeight: 1.38 }}>{source}</div>
          {disclaimer ? (
            <div style={{ fontWeight: 500, fontSize: 24, lineHeight: 1.35, marginTop: 10, color: "rgba(255,255,255,0.78)" }}>{disclaimer}</div>
          ) : null}
        </div>
      ) : null}
      <BrandFrame dark />
    </AbsoluteFill>
  );
};

// Numbers in the brand locale (useGrouping "always": Italian would not group 4-digit numbers).
export const fmtNum = (n: number, decimals = 0) =>
  n.toLocaleString(BRAND.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: "always" as unknown as boolean,
  });

// Full-screen photo or video background with a slow Ken Burns move and a dark
// veil for legibility. src is relative to public/ (e.g. "stock/city.jpg").
export const MediaBg: React.FC<{
  src: string;
  duration: number;
  zoom?: "in" | "out";
  shade?: number;
}> = ({ src, duration, zoom = "out", shade = 0.55 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, duration], [0, 1], { extrapolateRight: "clamp" });
  const scale = zoom === "out" ? 1.14 - t * 0.12 : 1.02 + t * 0.12;
  const isVideo = /\.(mp4|webm|mov)$/i.test(src);
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: `scale(${scale}) translateY(${(t - 0.5) * -24}px)`,
  };
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      {isVideo ? (
        <OffthreadVideo src={staticFile(src)} muted style={style} />
      ) : (
        <Img src={staticFile(src)} style={style} />
      )}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,${shade * 0.7}) 0%, rgba(0,0,0,${shade * 0.25}) 35%, rgba(0,0,0,${shade * 0.6}) 62%, rgba(0,0,0,${Math.min(0.92, shade + 0.3)}) 100%)`,
        }}
      />
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};

// Sound effects at low volume, so the trending audio you add in the app stays on top.
// Files in public/sfx (Kenney, CC0: see public/sfx/CREDITS.md). Swap in your own sounds here.
export const SFX = {
  whoosh: "sfx/ui-scroll_002.ogg",
  whip: "sfx/ui-scroll_002.ogg",
  page: "sfx/ui-drop_002.ogg",
  switch: "sfx/ui-click_002.ogg",
  shutter: "sfx/ui-click_002.ogg",
  ding: "sfx/ui-confirmation_002.ogg",
  click: "sfx/ui-click_002.ogg",
  confirm: "sfx/ui-confirmation_002.ogg",
  pluck: "sfx/ui-pluck_001.ogg",
  drop: "sfx/ui-drop_002.ogg",
  pop: "sfx/ui-maximize_004.ogg",
  tick: "sfx/ui-glass_002.ogg",
  impact: "sfx/impact-light.ogg",
} as const;

export const Sfx: React.FC<{ at: number; s: keyof typeof SFX; v?: number }> = ({ at, s, v = 0.45 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={75} layout="none">
    <Audio src={staticFile(SFX[s])} volume={v} />
  </Sequence>
);
