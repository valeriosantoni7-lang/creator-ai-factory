import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { z } from "zod";
import { BRAND } from "./brand";
import { Backdrop, BrandFrame, C, CTA_FRAMES, CtaEnd, enter, Flag, fmtNum, hookIn, hookTransform, MediaBg, Pill, pop, Sfx } from "./kit";
import { MapScene, mapSceneFrames } from "./ReelMappa";

// -----------------------------------------------------------------------------
// ReelNotizia — notizia spiegata, verticale 1080x1920, a scene componibili:
// apertura su video o foto, numeri che salgono, mappa dei Cantoni, impatto
// personale, cosa fare, fonti → CTA. Formato "cosa è successo · cosa cambia
// per te · fonte" del pilastro Attualità.
// -----------------------------------------------------------------------------

const T = 9;

const Big = z.object({
  value: z.number(),
  decimals: z.number().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
});

const SceneSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hook"),
    tag: z.string(),
    title: z.string(),
    big: Big.optional(),
    sub: z.string().optional(),
    media: z.string(),
  }),
  z.object({
    type: z.literal("numbers"),
    title: z.string(),
    media: z.string().optional(),
    rows: z
      .array(
        z.object({
          label: z.string(),
          value: z.number(),
          decimals: z.number().optional(),
          suffix: z.string().optional(),
          from: z.number().optional(),
          delta: z.string().optional(),
          flag: z.string().optional().describe("Bandiera vera accanto all'etichetta: sigla ('ch') o emoji"),
        }),
      )
      .min(1)
      .max(4),
  }),
  z.object({
    type: z.literal("map"),
    category: z.string(),
    title: z.string(),
    titleAccent: z.string().optional(),
    mode: z.enum(["route", "bubbles", "cantons"]),
    points: z
      .array(
        z.object({
          city: z.string(),
          lon: z.number().optional(),
          lat: z.number().optional(),
          label: z.string(),
          value: z.number().optional(),
          valueText: z.string().optional(),
        }),
      )
      .min(1)
      .max(8),
    source: z.string().optional(),
    step: z.number().optional(),
  }),
  z.object({
    type: z.literal("impact"),
    title: z.string(),
    big: Big,
    unit: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.literal("steps"),
    title: z.string(),
    steps: z.array(z.string()).min(1).max(4),
  }),
  z.object({
    type: z.literal("source"),
    text: z.string(),
    disclaimer: z.string().optional(),
  }),
]);

export const ReelNotiziaSchema = z.object({
  scenes: z.array(SceneSchema).min(2).max(8),
  voiceover: z.string().optional().describe("Voice-over under the video, file in public/ (e.g. 'voice/news.m4a')"),
  ctaTitle: z.string(),
  ctaAccent: z.string(),
  ctaButton: z.string(),
});

export type ReelNotiziaProps = z.infer<typeof ReelNotiziaSchema>;
type Scene = ReelNotiziaProps["scenes"][number];

const sceneFrames = (s: Scene): number => {
  switch (s.type) {
    case "hook":
      return 100;
    case "numbers":
      return 50 + s.rows.length * 32 + 50;
    case "map":
      return mapSceneFrames(s);
    case "impact":
      return 126;
    case "steps":
      return 44 + s.steps.length * 36 + 56;
    case "source":
      return 78;
  }
};

// La pagina delle fonti non è più una scena a parte (3 secondi fermi quasi a fine video):
// fonti e avvertenza compaiono dentro la chiusura, sotto il pulsante.
const playScenes = (p: ReelNotiziaProps) => p.scenes.filter((s) => s.type !== "source");
const fonteOf = (p: ReelNotiziaProps) =>
  p.scenes.find((s): s is Extract<Scene, { type: "source" }> => s.type === "source");

export const calculateReelNotiziaDuration = (p: ReelNotiziaProps) => {
  const sc = playScenes(p);
  return sc.reduce((sum, s) => sum + sceneFrames(s), 0) + CTA_FRAMES - sc.length * T;
};

const countTo = (frame: number, start: number, dur: number, to: number, from = 0) =>
  interpolate(frame, [start, start + dur], [from, to], {
    easing: (x) => 1 - Math.pow(1 - x, 3),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// Decimali: quelli indicati, altrimenti 2 se il numero non è intero (392,40), 0 se lo è (412).
const dec = (n: number, d?: number) => d ?? (Number.isInteger(n) ? 0 : 2);

const bigText = (b: z.infer<typeof Big>, v: number) =>
  `${b.prefix ?? ""}${fmtNum(v, b.decimals ?? 0)}${b.suffix ?? ""}`;

const HookScene: React.FC<{ s: Extract<Scene, { type: "hook" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = sceneFrames(s);
  // Etichetta e titolo si leggono dal primo fotogramma, il numero arriva dopo un terzo di secondo.
  const t = hookIn(frame, fps);
  const bigIn = pop(frame, fps, 10, 10);
  const blink = Math.floor(frame / 12) % 2 === 0 ? 1 : 0.25;
  return (
    <AbsoluteFill>
      <MediaBg src={s.media} duration={dur} zoom="in" shade={0.62} />
      <Sfx at={0} s="whoosh" v={0.5} />
      <Sfx at={10} s="impact" v={0.6} />
      <Sfx at={40} s="click" v={0.35} />
      <AbsoluteFill style={{ padding: "230px 80px 0", gap: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.accent, opacity: blink, boxShadow: "0 0 18px rgba(255,60,60,0.9)" }} />
          <Pill>{s.tag}</Pill>
        </div>
        <div
          style={{
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 108,
            lineHeight: 1.04,
            letterSpacing: -2.5,
            color: "#fff",
            textShadow: "0 6px 30px rgba(0,0,0,0.5)",
            opacity: 1,
            transform: hookTransform(t),
            transformOrigin: "left center",
          }}
        >
          {s.title}
        </div>
        {s.big ? (
          <div
            style={{
              fontFamily: BRAND.fonts.serif,
              fontWeight: 900,
              fontSize: 260,
              lineHeight: 0.95,
              letterSpacing: -8,
              color: "#fff",
              textShadow: `0 12px 0 ${C.accent}, 0 30px 70px rgba(0,0,0,0.6)`,
              transform: `scale(${0.6 + bigIn * 0.4})`,
              transformOrigin: "left center",
              opacity: Math.min(1, bigIn * 2),
            }}
          >
            {bigText(s.big, countTo(frame, 10, 26, s.big.value))}
          </div>
        ) : null}
        {s.sub ? (
          <div style={{ fontFamily: BRAND.fonts.sans, fontWeight: 600, fontSize: 40, color: "rgba(255,255,255,0.92)", opacity: enter(frame, 40, 14) }}>
            {s.sub}
          </div>
        ) : null}
      </AbsoluteFill>
      <BrandFrame dark />
    </AbsoluteFill>
  );
};

const NumeriScene: React.FC<{ s: Extract<Scene, { type: "numbers" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop tone="paper" />
      <Sfx at={0} s="whoosh" v={0.4} />
      {s.media ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 520, overflow: "hidden", borderBottomLeftRadius: 60, borderBottomRightRadius: 60 }}>
          <MediaBg src={s.media} duration={sceneFrames(s)} zoom="out" shade={0.35} />
        </div>
      ) : null}
      <AbsoluteFill style={{ padding: `${s.media ? 440 : 230}px 80px 0` }}>
        <div
          style={{
            alignSelf: "flex-start",
            background: "#fff",
            borderRadius: 26,
            padding: "22px 34px",
            boxShadow: "0 18px 40px rgba(17,17,17,0.12)",
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 64,
            letterSpacing: -1,
            color: C.ink,
            opacity: enter(frame, 0, 14),
            transform: `translateY(${(1 - enter(frame, 0, 14)) * 30}px)`,
          }}
        >
          {s.title}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 50 }}>
          {s.rows.map((r, i) => {
            const st = 18 + i * 32;
            const e = enter(frame, st, 14);
            const v = countTo(frame, st, 30, r.value, r.from ?? 0);
            const d = pop(frame, fps, st + 26, 10);
            return (
              <div
                key={i}
                style={{
                  borderLeft: `10px solid ${i === 0 ? C.accent : C.ink}`,
                  paddingLeft: 30,
                  opacity: e,
                  transform: `translateX(${(1 - e) * 60}px)`,
                }}
              >
                <div style={{ fontFamily: BRAND.fonts.sans, fontWeight: 600, fontSize: 34, color: "#555" }}>
                  <Sfx at={st} s="click" v={0.35} />
                  {r.delta ? <Sfx at={st + 26} s="pluck" v={0.45} /> : null}
                  {r.flag ? <span style={{ marginRight: 16 }}><Flag value={r.flag} size={40} /></span> : null}
                  {r.label}
                  {r.from !== undefined ? <span style={{ color: C.grey }}> · {BRAND.labels.was} {fmtNum(r.from, dec(r.from))}</span> : null}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: BRAND.fonts.serif, fontWeight: 900, fontSize: 104, lineHeight: 1.05, color: C.ink, letterSpacing: -2 }}>
                    {fmtNum(v, dec(r.value, r.decimals))}
                    <span style={{ fontSize: 50, marginLeft: 12 }}>{r.suffix ?? ""}</span>
                  </div>
                  {r.delta ? (
                    <div style={{ transform: `scale(${d})` }}>
                      <Pill size={30}>{r.delta}</Pill>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <BrandFrame />
    </AbsoluteFill>
  );
};

const ImpattoScene: React.FC<{ s: Extract<Scene, { type: "impact" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = pop(frame, fps, 14, 10);
  const txt = enter(frame, 52, 16);
  return (
    <AbsoluteFill>
      <Backdrop tone="accent" />
      <Sfx at={14} s="impact" v={0.6} />
      <Sfx at={52} s="ding" v={0.3} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 80px", gap: 30 }}>
        <div style={{ fontFamily: BRAND.fonts.sans, fontWeight: 800, fontSize: 34, letterSpacing: 0.3, color: C.accentTint, textTransform: "none", opacity: enter(frame, 0, 12) }}>
          {s.title}
        </div>
        <div
          style={{
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 250,
            lineHeight: 0.95,
            letterSpacing: -8,
            color: "#fff",
            transform: `scale(${0.6 + b * 0.4})`,
            transformOrigin: "left center",
          }}
        >
          {bigText(s.big, countTo(frame, 14, 40, s.big.value))}
        </div>
        <div style={{ fontFamily: BRAND.fonts.serifItalic, fontStyle: "italic", fontWeight: 700, fontSize: 76, color: C.accentTint, opacity: enter(frame, 30, 14) }}>
          {s.unit}
        </div>
        <div
          style={{
            fontFamily: BRAND.fonts.sans,
            fontWeight: 500,
            fontSize: 40,
            lineHeight: 1.35,
            color: "#fff",
            marginTop: 20,
            opacity: txt,
            transform: `translateY(${(1 - txt) * 24}px)`,
          }}
        >
          {s.text}
        </div>
      </AbsoluteFill>
      <BrandFrame dark />
    </AbsoluteFill>
  );
};

const PassiScene: React.FC<{ s: Extract<Scene, { type: "steps" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop tone="ink" />
      <AbsoluteFill style={{ padding: "220px 80px 0" }}>
        <div
          style={{
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 86,
            lineHeight: 1.06,
            letterSpacing: -2,
            color: "#fff",
            opacity: enter(frame, 0, 14),
          }}
        >
          {s.title}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 60 }}>
          {s.steps.map((st, i) => {
            const start = 30 + i * 36;
            const e = enter(frame, start, 14);
            const n = pop(frame, fps, start + 4, 9);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 28,
                  alignItems: "center",
                  background: "#fff",
                  borderRadius: 30,
                  padding: "30px 36px",
                  opacity: e,
                  transform: `translateY(${(1 - e) * 50}px)`,
                }}
              >
                <Sfx at={start} s="click" v={0.4} />
                <div
                  style={{
                    width: 76,
                    height: 76,
                    flexShrink: 0,
                    borderRadius: "50%",
                    background: C.accent,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: BRAND.fonts.serif,
                    fontWeight: 900,
                    fontSize: 44,
                    transform: `scale(${n})`,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontFamily: BRAND.fonts.sans, fontWeight: 600, fontSize: 38, lineHeight: 1.3, color: C.ink }}>{st}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <BrandFrame dark />
    </AbsoluteFill>
  );
};

const FonteScene: React.FC<{ s: Extract<Scene, { type: "source" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop tone="paper" />
      <Sfx at={0} s="page" v={0.4} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 90px", gap: 30 }}>
        <div style={{ opacity: enter(frame, 0, 12) }}>
          <Pill>{BRAND.labels.sources}</Pill>
        </div>
        <div style={{ fontFamily: BRAND.fonts.sans, fontWeight: 600, fontSize: 40, lineHeight: 1.45, color: C.ink, opacity: enter(frame, 8, 16) }}>{s.text}</div>
        {s.disclaimer ? (
          <div style={{ fontFamily: BRAND.fonts.sans, fontWeight: 500, fontSize: 28, color: C.grey, opacity: enter(frame, 20, 16) }}>{s.disclaimer}</div>
        ) : null}
      </AbsoluteFill>
      <BrandFrame />
    </AbsoluteFill>
  );
};

const renderScene = (s: Scene) => {
  switch (s.type) {
    case "hook":
      return <HookScene s={s} />;
    case "numbers":
      return <NumeriScene s={s} />;
    case "map":
      return <MapScene {...s} />;
    case "impact":
      return <ImpattoScene s={s} />;
    case "steps":
      return <PassiScene s={s} />;
    case "source":
      return <FonteScene s={s} />;
  }
};

// Transizioni a rotazione tra le scene (un elemento per tipo: i tipi delle presentation non si mescolano).
const transitionAt = (i: number, timing: ReturnType<typeof linearTiming>) => {
  switch (i % 4) {
    case 0:
      return <TransitionSeries.Transition presentation={fade()} timing={timing} />;
    case 1:
      return <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />;
    case 2:
      return <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={timing} />;
    default:
      return <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />;
  }
};

export const ReelNotizia: React.FC<ReelNotiziaProps> = (p) => {
  const timing = linearTiming({ durationInFrames: T });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {p.voiceover ? <Audio src={staticFile(p.voiceover)} volume={1} /> : null}
      <TransitionSeries>
        {playScenes(p).map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 ? transitionAt(i, timing) : null}
            <TransitionSeries.Sequence durationInFrames={sceneFrames(s)}>{renderScene(s)}</TransitionSeries.Sequence>
          </React.Fragment>
        ))}
        <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={CTA_FRAMES}>
          <CtaEnd title={p.ctaTitle} accent={p.ctaAccent} button={p.ctaButton} source={fonteOf(p)?.text} disclaimer={fonteOf(p)?.disclaimer} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
