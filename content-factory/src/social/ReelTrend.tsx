import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { z } from "zod";
import { BRAND } from "./brand";
import { Backdrop, BrandFrame, C, CTA_FRAMES, CtaEnd, enter, fmtNum, hookIn, hookTransform, MediaBg, Pill, pop, SAFE_BOTTOM, Sfx, typed } from "./kit";

// -----------------------------------------------------------------------------
// ReelTrend — grafico che corre nel tempo, verticale 1080x1920 
// Apertura → 1-3 linee che si disegnano anno per anno (puntino con il valore,
// contatore dell'anno, tappe che compaiono) → numero finale e confronto tra le
// serie → CTA. Per stipendi, prezzi, premi, cambio, interesse composto.
// -----------------------------------------------------------------------------

const T = 9;
const INTRO = 72; // title readable from the very first frame
const CHART = 330;
const FINAL = 140;

const COLORS = { accent: C.accent, white: "#FFFFFF", grey: "#9A9690", gold: "#E8B44A" } as const;

export const ReelTrendSchema = z.object({
  tag: z.string().describe("Pill sopra il titolo (es. 'Soldi · Interesse composto')"),
  title: z.string(),
  titleAccent: z.string(),
  unit: z.string().describe("Unità dei valori (es. 'CHF', '%')"),
  xs: z.array(z.string()).min(3).describe("Etichette dell'asse X (anni o tappe)"),
  xPrefix: z.string().optional().describe("Prima del contatore in alto (es. 'Anno')"),
  series: z
    .array(
      z.object({
        label: z.string(),
        color: z.enum(["accent", "white", "grey", "gold"]).optional(),
        decimals: z.number().optional(),
        values: z.array(z.number()),
      }),
    )
    .min(1)
    .max(3),
  milestones: z
    .array(z.object({ at: z.number().describe("Indice in xs"), text: z.string() }))
    .max(3)
    .optional(),
  finalLabel: z.string().describe("Sopra il numero finale (es. 'Dopo 30 anni')"),
  finalLines: z.array(z.string()).max(3).describe("Righe sotto il numero finale"),
  note: z.string().describe("Fonte o ipotesi (es. 'Esempio con rendimento ipotetico del 5% annuo, non garantito')"),
  ctaTitle: z.string(),
  ctaAccent: z.string(),
  ctaButton: z.string(),
  voiceover: z.string().optional().describe("Voice-over under the video, file in public/ (e.g. 'voice/trend.m4a')"),
  introMedia: z.string().optional().describe("Clip o foto vera dietro l'apertura (public/, es. 'stock/borsa-123.mp4'; massimo 8 s)"),
  finalMedia: z.string().optional().describe("Clip o foto vera dietro il numero finale, velata di rosso (public/)"),
});

export type ReelTrendProps = z.infer<typeof ReelTrendSchema>;

export const calculateReelTrendDuration = () => INTRO + CHART + FINAL + CTA_FRAMES - 3 * T;

const niceMax = (v: number) => {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
};

const IntroScene: React.FC<{ p: ReelTrendProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = hookIn(frame, fps);
  // mini linea che sale, come anteprima del grafico
  const draw = interpolate(frame, [8, 54], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const L = 900;
  return (
    <AbsoluteFill>
      {p.introMedia ? <MediaBg src={p.introMedia} duration={INTRO} zoom="in" shade={0.7} /> : <Backdrop tone="ink" />}
      <Sfx at={0} s="whoosh" v={0.4} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 90px" }}>
        <div>
          <Pill tone="accent" size={26}>
            {p.tag}
          </Pill>
        </div>
        <div
          style={{
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 118,
            lineHeight: 1.02,
            letterSpacing: -3,
            color: "#fff",
            marginTop: 44,
            transform: hookTransform(t),
            transformOrigin: "left center",
            opacity: 1,
          }}
        >
          {p.title}
        </div>
        <div
          style={{
            fontFamily: BRAND.fonts.serifItalic,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 74,
            color: C.accentLight,
            marginTop: 18,
            minHeight: 90,
          }}
        >
          {typed(p.titleAccent, frame, 6, 40, fps)}
        </div>
        <svg width={900} height={260} style={{ marginTop: 60 }}>
          <path
            d="M0 240 C 200 230, 380 200, 520 150 S 780 40, 900 10"
            stroke={C.accent}
            strokeWidth={14}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={L * 1.2}
            strokeDashoffset={L * 1.2 * (1 - draw)}
          />
        </svg>
      </AbsoluteFill>
      <BrandFrame dark />
    </AbsoluteFill>
  );
};

const ChartScene: React.FC<{ p: ReelTrendProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const n = p.xs.length;
  // avanzamento: 0 → n-1 con una pausa all'inizio e alla fine
  const prog = interpolate(frame, [24, CHART - 40], [0, n - 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => t * t * (3 - 2 * t),
  });
  const idx = Math.floor(prog);
  const frac = prog - idx;
  const W = 900;
  const H = 860; // finisce sopra la zona sicura (SAFE_BOTTOM)
  const left = 90;
  const top = 520;
  const maxV = niceMax(Math.max(...p.series.flatMap((s) => s.values)) * 1.05);
  const X = (i: number) => (i / (n - 1)) * W;
  const Y = (v: number) => H - (v / maxV) * H;
  const valAt = (vals: number[], f: number) => {
    const i = Math.min(vals.length - 1, Math.floor(f));
    const j = Math.min(vals.length - 1, i + 1);
    return vals[i] + (vals[j] - vals[i]) * (f - i);
  };
  const grid = enter(frame, 0, 20);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const xLabelEvery = Math.max(1, Math.round((n - 1) / 5));
  const zoom = interpolate(frame, [0, CHART], [1, 1.03]);
  const yearPop = 1 + (1 - frac) * 0.06 * (frame > 24 && frame < CHART - 40 ? 1 : 0);
  return (
    <AbsoluteFill>
      <Backdrop tone="ink" />
      <Sfx at={24} s="whoosh" v={0.35} />
      {(p.milestones ?? []).map((m, k) => {
        const at = interpolate(m.at, [0, n - 1], [24, CHART - 40]);
        return <Sfx key={k} at={at} s="pop" v={0.45} />;
      })}
      <Sfx at={CHART - 40} s="confirm" v={0.5} />
      {/* titolo piccolo e contatore dell'anno */}
      <div style={{ position: "absolute", top: 170, left: 90, right: 90, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ maxWidth: 560 }}>
          <div style={{ fontFamily: BRAND.fonts.sans, fontWeight: 800, fontSize: 26, letterSpacing: 0.3, color: C.accentLight, textTransform: "none" }}>
            {p.tag}
          </div>
          <div style={{ fontFamily: BRAND.fonts.serif, fontWeight: 900, fontSize: 58, lineHeight: 1.08, color: "#fff", marginTop: 10 }}>{p.title}</div>
        </div>
        <div style={{ textAlign: "right", transform: `scale(${yearPop})`, transformOrigin: "right top" }}>
          {p.xPrefix ? (
            <div style={{ fontFamily: BRAND.fonts.sans, fontWeight: 700, fontSize: 28, color: "rgba(255,255,255,0.6)", letterSpacing: 0.3, textTransform: "none" }}>
              {p.xPrefix}
            </div>
          ) : null}
          <div style={{ fontFamily: BRAND.fonts.serif, fontWeight: 900, fontSize: 120, lineHeight: 1, color: "#fff" }}>{p.xs[Math.round(prog)]}</div>
        </div>
      </div>
      {/* legenda con i valori correnti */}
      <div style={{ position: "absolute", top: 380, left: 90, right: 90, display: "flex", gap: 34, flexWrap: "wrap" }}>
        {p.series.map((s, k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: BRAND.fonts.sans, fontWeight: 700, fontSize: 28, color: "rgba(255,255,255,0.85)" }}>
            <span style={{ width: 26, height: 8, borderRadius: 4, background: COLORS[s.color ?? (k === 0 ? "accent" : "white")] }} />
            {s.label}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left, top, width: W, height: H, transform: `scale(${zoom})`, transformOrigin: "left bottom" }}>
        <svg width={W} height={H} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.accent} stopOpacity={0.45} />
              <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t} opacity={grid}>
              <line x1={0} x2={W} y1={Y(maxV * t)} y2={Y(maxV * t)} stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
              <text x={W} y={Y(maxV * t) - 12} textAnchor="end" fill="rgba(255,255,255,0.55)" stroke="#121212" strokeWidth={8} paintOrder="stroke" fontFamily={BRAND.fonts.sans} fontSize={24} fontWeight={600}>
                {fmtNum(maxV * t)} {t === 1 ? p.unit : ""}
              </text>
            </g>
          ))}
          {p.xs.map((x, i) =>
            i % xLabelEvery === 0 || i === n - 1 ? (
              <text key={i} x={X(i)} y={H + 44} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontFamily={BRAND.fonts.sans} fontSize={24} fontWeight={600} opacity={grid}>
                {x}
              </text>
            ) : null,
          )}
          {p.series.map((s, k) => {
            const pts: string[] = [];
            for (let i = 0; i <= idx; i++) pts.push(`${X(i)},${Y(s.values[i])}`);
            const cur = valAt(s.values, prog);
            pts.push(`${X(prog)},${Y(cur)}`);
            const color = COLORS[s.color ?? (k === 0 ? "accent" : "white")];
            return (
              <g key={k}>
                {k === 0 ? <polygon points={`0,${H} ${pts.join(" ")} ${X(prog)},${H}`} fill="url(#trendFill)" /> : null}
                <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={k === 0 ? 12 : 7} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={k === 0 ? undefined : "2 16"} />
                <circle cx={X(prog)} cy={Y(cur)} r={k === 0 ? 18 : 12} fill={color} stroke="#121212" strokeWidth={5} />
              </g>
            );
          })}
        </svg>
        {/* etichetta del valore che segue il puntino della prima serie */}
        {(() => {
          const s = p.series[0];
          const cur = valAt(s.values, prog);
          const x = X(prog);
          const y = Y(cur);
          return (
            <div
              style={{
                position: "absolute",
                left: Math.min(W - 330, Math.max(0, x - 165)),
                top: y - 120,
                width: 330,
                textAlign: "center",
                background: "#fff",
                color: C.ink,
                borderRadius: 22,
                padding: "14px 10px",
                fontFamily: BRAND.fonts.serif,
                fontWeight: 900,
                fontSize: 52,
                boxShadow: "0 18px 40px rgba(0,0,0,0.4)",
                opacity: enter(frame, 20, 10),
              }}
            >
              {fmtNum(cur, s.decimals ?? 0)} <span style={{ fontSize: 26, fontFamily: BRAND.fonts.sans, fontWeight: 800 }}>{p.unit}</span>
            </div>
          );
        })()}
        {(p.milestones ?? []).map((m, k) => {
          const shown = prog >= m.at;
          const startF = interpolate(m.at, [0, n - 1], [24, CHART - 40]);
          const e = enter(frame, startF, 14);
          const s = p.series[0];
          if (!shown) return null;
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: Math.min(W - 400, Math.max(0, X(m.at) - 200)),
                top: Y(s.values[m.at]) + 40,
                width: 400,
                background: C.accent,
                color: "#fff",
                borderRadius: 20,
                padding: "16px 22px",
                fontFamily: BRAND.fonts.sans,
                fontWeight: 800,
                fontSize: 30,
                lineHeight: 1.25,
                textAlign: "center",
                opacity: e,
                transform: `translateY(${(1 - e) * 20}px) scale(${0.9 + e * 0.1})`,
                boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
              }}
            >
              {m.text}
            </div>
          );
        })}
      </div>
      <BrandFrame dark />
    </AbsoluteFill>
  );
};

const FinalScene: React.FC<{ p: ReelTrendProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = p.series[0];
  const last = s.values[s.values.length - 1];
  const count = interpolate(frame, [8, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const lab = enter(frame, 0, 14);
  const big = pop(frame, fps, 6, 12);
  return (
    <AbsoluteFill>
      {p.finalMedia ? (
        <>
          <MediaBg src={p.finalMedia} duration={FINAL} zoom="out" shade={0.3} />
          <AbsoluteFill style={{ background: C.accent, opacity: 0.8 }} />
        </>
      ) : (
        <Backdrop tone="accent" />
      )}
      <Sfx at={6} s="impact" v={0.5} />
      <Sfx at={50} s="ding" v={0.35} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 80px", textAlign: "center" }}>
        <div style={{ fontFamily: BRAND.fonts.sans, fontWeight: 800, fontSize: 34, letterSpacing: 0.3, color: C.accentTint, textTransform: "none", opacity: lab }}>
          {p.finalLabel}
        </div>
        <div
          style={{
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 190,
            lineHeight: 1,
            letterSpacing: -6,
            color: "#fff",
            marginTop: 20,
            transform: `scale(${0.8 + big * 0.2})`,
          }}
        >
          {fmtNum(last * count, s.decimals ?? 0)}
        </div>
        <div style={{ fontFamily: BRAND.fonts.sans, fontWeight: 800, fontSize: 56, color: "#fff", marginTop: 6 }}>{p.unit}</div>
        <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 18 }}>
          {p.finalLines.map((l, k) => {
            const e = enter(frame, 56 + k * 12, 16);
            return (
              <div key={k} style={{ fontFamily: BRAND.fonts.serif, fontWeight: 700, fontSize: 50, lineHeight: 1.2, color: "#fff", opacity: e, transform: `translateY(${(1 - e) * 24}px)` }}>
                {l}
              </div>
            );
          })}
        </div>
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
            color: "rgba(255,255,255,0.85)",
            opacity: enter(frame, 80, 16),
          }}
        >
          {p.note}
        </div>
      </AbsoluteFill>
      <BrandFrame dark />
    </AbsoluteFill>
  );
};

export const ReelTrend: React.FC<ReelTrendProps> = (p) => {
  const t = linearTiming({ durationInFrames: T });
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {p.voiceover ? <Audio src={staticFile(p.voiceover)} volume={1} /> : null}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO}>
          <IntroScene p={p} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence durationInFrames={CHART}>
          <ChartScene p={p} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={t} />
        <TransitionSeries.Sequence durationInFrames={FINAL}>
          <FinalScene p={p} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={t} />
        <TransitionSeries.Sequence durationInFrames={CTA_FRAMES}>
          <CtaEnd title={p.ctaTitle} accent={p.ctaAccent} button={p.ctaButton} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
