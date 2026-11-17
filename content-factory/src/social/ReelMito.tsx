import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { z } from "zod";
import { BRAND } from "./brand";
import { Backdrop, BrandFrame, C, CTA_FRAMES, CtaEnd, enter, hookIn, hookTransform, MediaBg, Pill, pop, SAFE_BOTTOM, typed, Sfx } from "./kit";

// -----------------------------------------------------------------------------
// ReelMito — "Pensavo che… / In realtà…" verticale 1080x1920
// Intro → per ogni mito: si scrive, viene barrato, sale la realtà → CTA.
// Pensato per le differenze culturali e i luoghi comuni sulla Svizzera.
// -----------------------------------------------------------------------------

const INTRO_FRAMES = 66; // the hook is readable from the very first frame
const TRANSITION_FRAMES = 10;
const TYPE_START = 12;
const CPS = 55; // caratteri al secondo della scrittura del mito

export const ReelMitoSchema = z.object({
  title: z.string().describe("Titolo dell'intro (es. 'Cosa pensavo della Svizzera')"),
  titleAccent: z.string().describe("Seconda riga in corsivo rosso (es. 'e com'è davvero.')"),
  items: z
    .array(
      z.object({
        myth: z.string().describe("Il luogo comune, max ~90 caratteri"),
        reality: z.string().describe("Com'è davvero, max ~110 caratteri"),
      }),
    )
    .min(2)
    .max(5),
  ctaTitle: z.string(),
  ctaAccent: z.string(),
  ctaButton: z.string(),
  // Labels: "I thought" is first person; for myths that are not your own experience
  // use "Many people think" instead.
  introLabel: z.string().optional().describe("Etichetta barrata nell'intro (default 'Pensavo')"),
  mythLabel: z.string().optional().describe("Etichetta sopra ogni mito (default 'Pensavo che')"),
  // Optional: real clip behind the intro, counter label, and real client quotes before the CTA
  // (regola delle 2 clip nuove per video). Tutti facoltativi: i video vecchi restano uguali.
  introMedia: z.string().optional().describe("Clip o foto vera dietro l'apertura (public/, massimo 8 s)"),
  counterLabel: z.string().optional().describe("Parola del contatore in alto (default 'Mito': 'Mito 1 di 3')"),
  quotes: z
    .array(
      z.object({
        text: z.string().describe("A real review sentence, unedited (you may shorten it with […]); only with the client's consent"),
        author: z.string().describe("First name and service, e.g. 'Anna · 1:1 call'"),
        note: z.string().optional().describe("Small line below, e.g. 'Real review'"),
        media: z.string().optional().describe("Clip o foto vera di sfondo (public/)"),
      }),
    )
    .max(2)
    .optional(),
});

export type ReelMitoProps = z.infer<typeof ReelMitoSchema>;

// Tempi di ogni mito, calcolati dalla lunghezza dei testi.
const timing = (item: ReelMitoProps["items"][number], fps = 30) => {
  const typeEnd = TYPE_START + Math.ceil((item.myth.length / CPS) * fps);
  const strike = Math.max(58, typeEnd + 8);
  const real = strike + 22;
  const words = item.reality.split(" ").length;
  const total = Math.max(150, real + words * 3 + 62);
  return { strike, real, total };
};

type Quote = NonNullable<ReelMitoProps["quotes"]>[number];
const quoteFrames = (q: Quote) => Math.max(150, 40 + q.text.split(" ").length * 4 + 84);

export const calculateReelMitoDuration = (p: ReelMitoProps) =>
  INTRO_FRAMES +
  p.items.reduce((s, it) => s + timing(it).total, 0) +
  (p.quotes ?? []).reduce((s, q) => s + quoteFrames(q), 0) +
  CTA_FRAMES -
  (p.items.length + (p.quotes?.length ?? 0) + 1) * TRANSITION_FRAMES;

const IntroScene: React.FC<{ title: string; accent: string; label: string; media?: string }> = ({
  title,
  accent,
  label,
  media,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = hookIn(frame, fps);
  const a = enter(frame, 5, 10);
  const tag1 = enter(frame, 20, 12);
  const tag2 = enter(frame, 28, 12);
  const strikeW = interpolate(frame, [34, 46], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      {media ? <MediaBg src={media} duration={INTRO_FRAMES} zoom="in" shade={0.72} /> : <Backdrop tone="ink" />}
      <Sfx at={0} s="whoosh" v={0.5} />
      <Sfx at={34} s="switch" v={0.4} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 90px", gap: 56 }}>
        <div style={{ opacity: 1, transform: hookTransform(t), transformOrigin: "left center" }}>
          <div
            style={{
              fontFamily: BRAND.fonts.serif,
              fontWeight: 900,
              fontSize: 120,
              lineHeight: 1.03,
              letterSpacing: -3,
              color: "#fff",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: BRAND.fonts.serifItalic,
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 96,
              lineHeight: 1.08,
              color: C.accentLight,
              marginTop: 12,
              opacity: a,
              transform: `translateY(${(1 - a) * 40}px)`,
            }}
          >
            {accent}
          </div>
        </div>
        <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
          <div style={{ opacity: tag1, transform: `translateX(${(1 - tag1) * -40}px)`, position: "relative" }}>
            <Pill tone="ghost">{label}</Pill>
            <div
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                height: 6,
                width: `calc(${strikeW}% - 24px)`,
                background: C.accent,
                borderRadius: 3,
              }}
            />
          </div>
          <div style={{ fontFamily: BRAND.fonts.sans, fontSize: 40, color: "rgba(255,255,255,0.6)", opacity: tag2 }}>→</div>
          <div style={{ opacity: tag2, transform: `translateX(${(1 - tag2) * 40}px)` }}>
            <Pill tone="accent">{BRAND.labels.reality}</Pill>
          </div>
        </div>
      </AbsoluteFill>
      <BrandFrame dark />
    </AbsoluteFill>
  );
};

const ItemScene: React.FC<{
  item: ReelMitoProps["items"][number];
  index: number;
  total: number;
  mythLabel: string;
  counterLabel: string;
}> = ({ item, index, total, mythLabel, counterLabel }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { strike, real } = timing(item, fps);
  const top = enter(frame, 0, 16);
  const strikeW = interpolate(frame, [strike, strike + 14], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const mythColor = frame >= strike + 6 ? "#9A9690" : C.ink;
  const stamp = pop(frame, fps, strike + 8, 9);
  const bottom = enter(frame, real, 18);
  const words = item.reality.split(" ");
  const check = pop(frame, fps, real + words.length * 3 + 10, 10);
  const drift = interpolate(frame, [0, 300], [1, 1.03]);

  return (
    <AbsoluteFill>
      <Backdrop tone="paper" />
      <Sfx at={strike} s="switch" v={0.45} />
      <Sfx at={strike + 8} s="drop" v={0.5} />
      <Sfx at={real} s="whoosh" v={0.35} />
      <Sfx at={real + words.length * 3 + 10} s="confirm" v={0.45} />
      <AbsoluteFill style={{ padding: "250px 70px 0", gap: 40, transform: `scale(${drift})` }}>
        {/* Il mito */}
        <div
          style={{
            position: "relative",
            background: "#ECE8E1",
            borderRadius: 36,
            padding: "46px 52px 56px",
            opacity: top,
            transform: `translateY(${(1 - top) * -50}px)`,
          }}
        >
          <Pill tone="accent" size={24}>
            {mythLabel}
          </Pill>
          <div
            style={{
              fontFamily: BRAND.fonts.serif,
              fontWeight: 700,
              fontSize: 64,
              lineHeight: 1.22,
              color: mythColor,
              marginTop: 30,
              minHeight: 160,
            }}
          >
            <span
              style={{
                backgroundImage: `linear-gradient(${C.accent}, ${C.accent})`,
                backgroundSize: `${strikeW}% 7px`,
                backgroundPosition: "0 58%",
                backgroundRepeat: "no-repeat",
                WebkitBoxDecorationBreak: "clone",
                boxDecorationBreak: "clone",
              }}
            >
              {typed(item.myth, frame, TYPE_START, CPS, fps)}
            </span>
          </div>
          <div
            style={{
              position: "absolute",
              right: 34,
              top: -34,
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: C.accent,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: BRAND.fonts.sans,
              fontWeight: 800,
              fontSize: 60,
              transform: `scale(${stamp}) rotate(${-14 + stamp * 4}deg)`,
              boxShadow: "0 14px 30px rgba(200,30,40,0.35)",
            }}
          >
            ✗
          </div>
        </div>

        {/* La realtà */}
        <div
          style={{
            position: "relative",
            background: "#fff",
            borderRadius: 36,
            borderLeft: `14px solid ${C.accent}`,
            padding: "46px 52px 92px",
            boxShadow: "0 30px 70px rgba(17,17,17,0.10)",
            opacity: bottom,
            transform: `translateY(${(1 - bottom) * 140}px)`,
          }}
        >
          <div
            style={{
              fontFamily: BRAND.fonts.sans,
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: 0.3,
              color: C.accent,
              textTransform: "none",
            }}
          >
            {BRAND.labels.reality}
          </div>
          <div
            style={{
              fontFamily: BRAND.fonts.serif,
              fontWeight: 900,
              fontSize: 66,
              lineHeight: 1.18,
              color: C.ink,
              marginTop: 24,
            }}
          >
            {words.map((w, i) => {
              const e = enter(frame, real + 6 + i * 3, 10);
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    marginRight: 18,
                    opacity: e,
                    transform: `translateY(${(1 - e) * 24}px)`,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
          <div
            style={{
              position: "absolute",
              right: 34,
              bottom: -34,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: C.ink,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: BRAND.fonts.sans,
              fontWeight: 800,
              fontSize: 54,
              transform: `scale(${check})`,
            }}
          >
            ✓
          </div>
        </div>
      </AbsoluteFill>
      <BrandFrame counter={`${counterLabel} ${index + 1} ${BRAND.labels.of} ${total}`} segments={total} active={index} />
    </AbsoluteFill>
  );
};

// A real client quote over a real clip: accent quote marks, text that slides in
// parola per parola, nome e nota sotto. Tutto sopra la zona sicura in basso.
const QuoteScene: React.FC<{ q: Quote }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = quoteFrames(q);
  const mark = pop(frame, fps, 4, 12);
  const words = q.text.split(" ");
  const who = enter(frame, 40 + words.length * 4 + 6, 16);
  return (
    <AbsoluteFill>
      {q.media ? <MediaBg src={q.media} duration={dur} zoom="out" shade={0.66} /> : <Backdrop tone="ink" />}
      {/* velo uniforme: la frase sta a metà schermo, dove la sfumatura di MediaBg è più chiara */}
      <AbsoluteFill style={{ background: "rgba(18,17,16,0.42)" }} />
      <Sfx at={0} s="whoosh" v={0.35} />
      <Sfx at={40 + words.length * 4 + 6} s="pop" v={0.4} />
      <AbsoluteFill
        style={{ justifyContent: "center", padding: `0 84px ${SAFE_BOTTOM - 80}px`, gap: 34 }}
      >
        <div
          style={{
            fontFamily: BRAND.fonts.serifItalic,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 220,
            lineHeight: 0.6,
            height: 110,
            color: C.accentLight,
            opacity: Math.min(1, mark * 1.3),
            transform: `scale(${0.7 + mark * 0.3})`,
            transformOrigin: "left center",
          }}
        >
          «
        </div>
        <div
          style={{
            fontFamily: BRAND.fonts.serif,
            fontWeight: 700,
            fontSize: 64,
            lineHeight: 1.22,
            color: "#fff",
            textShadow: "0 2px 24px rgba(0,0,0,0.35)",
          }}
        >
          {words.map((w, i) => {
            const e = enter(frame, 40 + i * 4, 12);
            return (
              <span
                key={i}
                style={{ display: "inline-block", marginRight: 16, opacity: e, transform: `translateY(${(1 - e) * 22}px)` }}
              >
                {w}
              </span>
            );
          })}
        </div>
        <div style={{ opacity: who, transform: `translateY(${(1 - who) * 24}px)` }}>
          <div style={{ fontFamily: BRAND.fonts.sans, fontWeight: 800, fontSize: 38, color: "#fff" }}>{q.author}</div>
          {q.note ? (
            <div style={{ fontFamily: BRAND.fonts.sans, fontWeight: 500, fontSize: 28, color: "rgba(255,255,255,0.72)", marginTop: 10 }}>
              {q.note}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
      <BrandFrame dark />
    </AbsoluteFill>
  );
};

export const ReelMito: React.FC<ReelMitoProps> = (props) => {
  const t = linearTiming({ durationInFrames: TRANSITION_FRAMES });
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO_FRAMES}>
          <IntroScene
            title={props.title}
            accent={props.titleAccent}
            label={props.introLabel ?? BRAND.labels.iThought}
            media={props.introMedia}
          />
        </TransitionSeries.Sequence>
        {props.items.map((it, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={t} />
            <TransitionSeries.Sequence durationInFrames={timing(it).total}>
              <ItemScene
                item={it}
                index={i}
                total={props.items.length}
                mythLabel={props.mythLabel ?? BRAND.labels.iThoughtThat}
                counterLabel={props.counterLabel ?? BRAND.labels.myth}
              />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
        {(props.quotes ?? []).map((q, i) => (
          <React.Fragment key={`q${i}`}>
            <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t} />
            <TransitionSeries.Sequence durationInFrames={quoteFrames(q)}>
              <QuoteScene q={q} />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
        <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={t} />
        <TransitionSeries.Sequence durationInFrames={CTA_FRAMES}>
          <CtaEnd title={props.ctaTitle} accent={props.ctaAccent} button={props.ctaButton} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
