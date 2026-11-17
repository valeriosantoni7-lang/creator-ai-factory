import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { z } from "zod";
import { BRAND } from "./brand";
import { Backdrop, BrandFrame, C, CTA_FRAMES, CtaEnd, enter, Flag, fmtNum, MediaBg, Pill, pop, SAFE_BOTTOM, Sfx } from "./kit";

// -----------------------------------------------------------------------------
// ReelConfronto — "A contro B" verticale 1080x1920 
// Apertura a schermo diviso con le due foto e il VS → un round per voce
// (valori che salgono, vincitore evidenziato, punteggio) → verdetto con le
// fonti → CTA. Per città, Paesi, permessi, stipendi, tasse, ETF a confronto.
// -----------------------------------------------------------------------------

const T = 9;
const INTRO = 105;
const ROUND = 108;
const VERDICT = 130;

const Side = z.object({
  name: z.string(),
  flag: z.string().optional(),
  media: z.string().describe("Foto o video in public/ (es. 'stock/zurigo.jpg')"),
});

const Val = z.object({
  value: z.number().optional(),
  decimals: z.number().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  text: z.string().optional().describe("Al posto del numero (es. '5°', 'Francese')"),
});

export const ReelConfrontoSchema = z.object({
  title: z.string().describe("Domanda d'apertura (es. 'Zurigo o Ginevra?')"),
  titleAccent: z.string().describe("Seconda riga in corsivo"),
  a: Side,
  b: Side,
  rounds: z
    .array(
      z.object({
        label: z.string(),
        a: Val,
        b: Val,
        winner: z.enum(["a", "b", "tie"]),
        note: z.string().optional().describe("Badge sotto il vincitore (es. '+240 CHF al mese')"),
        context: z.string().optional().describe("Riga piccola sotto il titolo (es. 'single, 80.000 CHF lordi')"),
      }),
    )
    .min(2)
    .max(6),
  verdict: z.string(),
  verdictAccent: z.string().optional(),
  source: z.string(),
  ctaTitle: z.string(),
  ctaAccent: z.string(),
  ctaButton: z.string(),
});

export type ReelConfrontoProps = z.infer<typeof ReelConfrontoSchema>;
type Round = ReelConfrontoProps["rounds"][number];

export const calculateReelConfrontoDuration = (p: ReelConfrontoProps) =>
  INTRO + p.rounds.length * ROUND + VERDICT + CTA_FRAMES - (p.rounds.length + 2) * T;

const score = (rounds: Round[], upTo: number) => {
  let a = 0;
  let b = 0;
  rounds.slice(0, upTo).forEach((r) => {
    if (r.winner === "a") a++;
    if (r.winner === "b") b++;
  });
  return { a, b };
};

// Testo e numeri devono stare nella scheda larga 440 px.
const textSize = (v: z.infer<typeof Val>) => {
  const len =
    v.value !== undefined
      ? fmtNum(v.value, v.decimals ?? 0).length + (v.prefix ?? "").length + (v.suffix ? 2 : 0)
      : (v.text ?? "").length;
  if (len <= 3) return 130;
  if (len <= 6) return 100;
  if (len <= 8) return 80;
  if (len <= 11) return 64;
  return 52;
};

const ValueText: React.FC<{ v: z.infer<typeof Val>; progress: number }> = ({ v, progress }) => {
  if (v.value === undefined) return <>{v.text ?? ""}</>;
  return (
    <>
      {v.prefix ?? ""}
      {fmtNum(v.value * progress, v.decimals ?? 0)}
      {v.suffix ? <span style={{ fontSize: "0.42em", marginLeft: 10, fontWeight: 700 }}>{v.suffix}</span> : null}
    </>
  );
};

// --- Apertura: due foto affiancate, nomi e VS -------------------------------
const IntroScene: React.FC<{ p: ReelConfrontoProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const left = enter(frame, 0, 16);
  const right = enter(frame, 6, 16);
  const vs = pop(frame, fps, 22, 9);
  const t1 = enter(frame, 30, 16);
  const t2 = enter(frame, 42, 16);
  const half = (side: ReelConfrontoProps["a"], x: number, from: number, dir: 1 | -1) => (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: x,
        width: 540,
        overflow: "hidden",
        transform: `translateX(${(1 - from) * 540 * dir}px)`,
      }}
    >
      <MediaBg src={side.media} duration={INTRO} zoom={dir === -1 ? "in" : "out"} shade={0.5} />
      <div
        style={{
          position: "absolute",
          bottom: SAFE_BOTTOM + 250,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#fff",
          fontFamily: BRAND.fonts.serif,
          fontWeight: 900,
          fontSize: 92,
          letterSpacing: -2,
          textShadow: "0 8px 30px rgba(0,0,0,0.45)",
        }}
      >
        {side.flag ? (
          <div style={{ marginBottom: 18 }}>
            <Flag value={side.flag} size={104} />
          </div>
        ) : null}
        {side.name}
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sfx at={0} s="whip" v={0.45} />
      <Sfx at={22} s="impact" v={0.55} />
      {half(p.a, 0, left, -1)}
      {half(p.b, 540, right, 1)}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 537, width: 6, background: "#fff", opacity: vs }} />
      <div
        style={{
          position: "absolute",
          top: 960 - 95,
          left: 540 - 95,
          width: 190,
          height: 190,
          borderRadius: "50%",
          background: C.accent,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: BRAND.fonts.sans,
          fontWeight: 900,
          fontSize: 76,
          letterSpacing: 2,
          transform: `scale(${vs}) rotate(${(1 - vs) * -40}deg)`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
          border: "8px solid #fff",
        }}
      >
        VS
      </div>
      <div style={{ position: "absolute", top: 230, left: 70, right: 70, textAlign: "center" }}>
        <div
          style={{
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 108,
            lineHeight: 1.02,
            letterSpacing: -2.5,
            color: "#fff",
            opacity: t1,
            transform: `translateY(${(1 - t1) * -30}px)`,
            textShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        >
          {p.title}
        </div>
        <div
          style={{
            fontFamily: BRAND.fonts.serifItalic,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 70,
            color: C.accentTint,
            marginTop: 14,
            opacity: t2,
            textShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
        >
          {p.titleAccent}
        </div>
      </div>
      <BrandFrame dark />
    </AbsoluteFill>
  );
};

// --- Un round: due schede, valori che salgono, vincitore -------------------
const Card: React.FC<{
  side: ReelConfrontoProps["a"];
  v: z.infer<typeof Val>;
  progress: number;
  state: "neutro" | "vince" | "perde" | "tie";
  enterAt: number;
  note?: string;
}> = ({ side, v, progress, state, enterAt, note }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = enter(frame, enterAt, 16);
  const win = state === "vince";
  const lose = state === "perde";
  const badge = pop(frame, fps, 62, 10);
  const scale = win ? 1 + badge * 0.04 : lose ? 1 - badge * 0.03 : 1;
  return (
    <div
      style={{
        position: "relative",
        width: 440,
        height: 820,
        borderRadius: 40,
        overflow: "hidden",
        background: "#fff",
        boxShadow: win ? `0 30px 80px rgba(200,30,40,0.30)` : "0 24px 60px rgba(17,17,17,0.10)",
        border: win ? `8px solid ${C.accent}` : "8px solid transparent",
        opacity: e * (lose ? 1 - badge * 0.4 : 1),
        transform: `translateY(${(1 - e) * 120}px) scale(${scale})`,
      }}
    >
      <div style={{ height: 330, overflow: "hidden", position: "relative" }}>
        <Img
          src={staticFile(side.media.replace(/\.(mp4|webm|mov)$/i, ".jpg"))}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.08 - progress * 0.06})` }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 30,
            bottom: 22,
            color: "#fff",
            fontFamily: BRAND.fonts.sans,
            fontWeight: 800,
            fontSize: 42,
          }}
        >
          {side.flag ? (
            <span style={{ marginRight: 14 }}>
              <Flag value={side.flag} size={44} />
            </span>
          ) : null}
          {side.name}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 330,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
          padding: "0 24px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: textSize(v),
            lineHeight: 1.05,
            letterSpacing: -2,
            color: win ? C.accent : C.ink,
            whiteSpace: "nowrap",
          }}
        >
          <ValueText v={v} progress={progress} />
        </div>
        {win || state === "tie" ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              transform: `scale(${badge})`,
            }}
          >
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                background: state === "tie" ? C.ink : C.accent,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: BRAND.fonts.sans,
                fontWeight: 900,
                fontSize: state === "tie" ? 40 : 54,
              }}
            >
              {state === "tie" ? "=" : "✓"}
            </div>
            {note && win ? (
              <div
                style={{
                  fontFamily: BRAND.fonts.sans,
                  fontWeight: 800,
                  fontSize: 28,
                  color: C.accent,
                  background: C.accentWash,
                  padding: "10px 22px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                }}
              >
                {note}
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ height: 92 }} />
        )}
      </div>
    </div>
  );
};

const RoundScene: React.FC<{ p: ReelConfrontoProps; i: number }> = ({ p, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = p.rounds[i];
  const head = enter(frame, 0, 14);
  const progress = interpolate(frame, [18, 54], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const decided = frame >= 62;
  const stateOf = (side: "a" | "b") =>
    !decided ? "neutro" : r.winner === "tie" ? "tie" : r.winner === side ? "vince" : "perde";
  const before = score(p.rounds, i);
  const after = score(p.rounds, i + 1);
  const s = decided ? after : before;
  const bump = pop(frame, fps, 64, 10);
  const drift = interpolate(frame, [0, ROUND], [1, 1.02]);
  return (
    <AbsoluteFill>
      <Backdrop tone="paper" />
      <Sfx at={0} s="whoosh" v={0.35} />
      <Sfx at={20} s="tick" v={0.35} />
      <Sfx at={62} s={r.winner === "tie" ? "switch" : "confirm"} v={0.5} />
      <AbsoluteFill style={{ padding: "210px 60px 0", alignItems: "center", transform: `scale(${drift})` }}>
        <div style={{ opacity: head, transform: `translateY(${(1 - head) * -30}px)` }}>
          <Pill tone="accent" size={24}>
            {BRAND.labels.round} {i + 1} {BRAND.labels.of} {p.rounds.length}
          </Pill>
        </div>
        <div
          style={{
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 76,
            lineHeight: 1.08,
            letterSpacing: -1.5,
            color: C.ink,
            textAlign: "center",
            marginTop: 30,
            opacity: head,
          }}
        >
          {r.label}
        </div>
        {r.context ? (
          <div
            style={{
              fontFamily: BRAND.fonts.sans,
              fontWeight: 600,
              fontSize: 30,
              color: C.grey,
              marginTop: 14,
              opacity: enter(frame, 8, 14),
            }}
          >
            {r.context}
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 40, marginTop: 56 }}>
          <Card side={p.a} v={r.a} progress={progress} state={stateOf("a")} enterAt={6} note={r.note} />
          <Card side={p.b} v={r.b} progress={progress} state={stateOf("b")} enterAt={12} note={r.note} />
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: SAFE_BOTTOM + 110,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: BRAND.fonts.sans,
          fontWeight: 800,
          fontSize: 40,
          color: C.ink,
          letterSpacing: 1,
        }}
      >
        {p.a.name}{" "}
        <span style={{ display: "inline-block", margin: "0 14px", color: C.accent, transform: `scale(${decided ? 1 + (1 - bump) * 0.4 : 1})` }}>
          {s.a} – {s.b}
        </span>{" "}
        {p.b.name}
      </div>
      <BrandFrame segments={p.rounds.length} active={i} />
    </AbsoluteFill>
  );
};

// --- Verdetto -----------------------------------------------------------------
const VerdictScene: React.FC<{ p: ReelConfrontoProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = score(p.rounds, p.rounds.length);
  const big = pop(frame, fps, 4, 10);
  const v1 = enter(frame, 26, 18);
  const v2 = enter(frame, 40, 18);
  const src = enter(frame, 60, 18);
  return (
    <AbsoluteFill>
      <Backdrop tone="accent" />
      <Sfx at={4} s="impact" v={0.55} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 80px", textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
            color: "#fff",
            fontFamily: BRAND.fonts.sans,
            fontWeight: 800,
            fontSize: 44,
            transform: `scale(${0.7 + big * 0.3})`,
            opacity: Math.min(1, big * 1.5),
          }}
        >
          <span>
            <Flag value={p.a.flag} size={50} /> {p.a.name}
          </span>
          <span style={{ fontFamily: BRAND.fonts.serif, fontWeight: 900, fontSize: 200, letterSpacing: -6 }}>
            {s.a}–{s.b}
          </span>
          <span>
            <Flag value={p.b.flag} size={50} /> {p.b.name}
          </span>
        </div>
        <div
          style={{
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 84,
            lineHeight: 1.06,
            color: "#fff",
            marginTop: 60,
            opacity: v1,
            transform: `translateY(${(1 - v1) * 30}px)`,
          }}
        >
          {p.verdict}
        </div>
        {p.verdictAccent ? (
          <div
            style={{
              fontFamily: BRAND.fonts.serifItalic,
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 66,
              color: C.accentTint,
              marginTop: 18,
              opacity: v2,
            }}
          >
            {p.verdictAccent}
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            bottom: SAFE_BOTTOM + 120,
            left: 80,
            right: 80,
            fontFamily: BRAND.fonts.sans,
            fontWeight: 600,
            fontSize: 24,
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.8)",
            opacity: src,
          }}
        >
          {p.source}
        </div>
      </AbsoluteFill>
      <BrandFrame dark />
    </AbsoluteFill>
  );
};

export const ReelConfronto: React.FC<ReelConfrontoProps> = (p) => {
  const t = linearTiming({ durationInFrames: T });
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO}>
          <IntroScene p={p} />
        </TransitionSeries.Sequence>
        {p.rounds.map((_, i) => (
          <React.Fragment key={i}>
            {i === 0 ? (
              <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={t} />
            ) : (
              <TransitionSeries.Transition presentation={slide({ direction: i % 2 ? "from-right" : "from-left" })} timing={t} />
            )}
            <TransitionSeries.Sequence durationInFrames={ROUND}>
              <RoundScene p={p} i={i} />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence durationInFrames={VERDICT}>
          <VerdictScene p={p} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={t} />
        <TransitionSeries.Sequence durationInFrames={CTA_FRAMES}>
          <CtaEnd title={p.ctaTitle} accent={p.ctaAccent} button={p.ctaButton} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
