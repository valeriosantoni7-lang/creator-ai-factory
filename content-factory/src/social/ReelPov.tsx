import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { z } from "zod";
import { BRAND } from "./brand";
import { Backdrop, BrandFrame, C, CTA_FRAMES, CtaEnd, enter, MediaBg, pop, typed, Sfx } from "./kit";

// -----------------------------------------------------------------------------
// ReelPov — storia in prima persona in testo cinetico, verticale 1080x1920
// "POV: …" → momenti con orario, frase parola per parola, parola evidenziata,
// emoji → frase finale → CTA. Use only true facts from your own life.
// -----------------------------------------------------------------------------

const INTRO_FRAMES = 72; // the first sentence is readable from the very first frame
const PUNCH_FRAMES = 96;
const TRANSITION_FRAMES = 9;

export const ReelPovSchema = z.object({
  title: z.string().describe("Dopo 'POV:' (es. 'il tuo primo giorno di lavoro in Svizzera')"),
  beats: z
    .array(
      z.object({
        time: z.string().optional().describe("Orario o momento (es. '07:58', 'Mese 1')"),
        text: z.string().describe("Frase breve, max ~70 caratteri"),
        highlight: z.string().optional().describe("Parola della frase da evidenziare in rosso"),
        emoji: z.string().optional(),
        media: z.string().optional().describe("Clip o foto vera di sfondo per questo momento (public/, massimo 8 s)"),
      }),
    )
    .min(3)
    .max(7),
  punchline: z.string().describe("Frase finale (es. 'Benvenuto in Svizzera.')"),
  introMedia: z.string().optional().describe("Clip o foto vera dietro l'apertura (public/, massimo 8 s)"),
  source: z.string().optional().describe("Fonte mostrata in piccolo nella frase finale"),
  ctaTitle: z.string(),
  ctaAccent: z.string(),
  ctaButton: z.string(),
});

export type ReelPovProps = z.infer<typeof ReelPovSchema>;

const beatFrames = (b: ReelPovProps["beats"][number]) =>
  Math.max(78, 22 + b.text.split(" ").length * 4 + 44);

export const calculateReelPovDuration = (p: ReelPovProps) =>
  INTRO_FRAMES +
  p.beats.reduce((s, b) => s + beatFrames(b), 0) +
  PUNCH_FRAMES +
  CTA_FRAMES -
  (p.beats.length + 2) * TRANSITION_FRAMES;

const IntroScene: React.FC<{ title: string; media?: string }> = ({ title, media }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, 0, 9);
  // The hook is readable from the first frame. La prima frase del titolo è già scritta,
  // il resto si scrive subito dopo (con un titolo di una sola frase si vede tutto dall'inizio).
  const dot = title.indexOf(". ");
  const head = dot >= 0 ? title.slice(0, dot + 1) : title;
  const tail = dot >= 0 ? title.slice(dot + 1) : "";
  return (
    <AbsoluteFill>
      {media ? <MediaBg src={media} duration={INTRO_FRAMES} zoom="in" shade={0.74} /> : <Backdrop tone="ink" />}
      <Sfx at={0} s="impact" v={0.55} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 90px" }}>
        <div
          style={{
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 280,
            lineHeight: 0.9,
            letterSpacing: -8,
            color: C.accent,
            transform: `scale(${0.9 + p * 0.1})`,
            transformOrigin: "left bottom",
          }}
        >
          POV:
        </div>
        <div
          style={{
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 92,
            lineHeight: 1.1,
            letterSpacing: -1.5,
            color: "#fff",
            marginTop: 36,
            minHeight: 320,
          }}
        >
          {head}
          {typed(tail, frame, 10, 34, fps)}
          <span style={{ opacity: Math.floor(frame / 8) % 2 ? 0 : 1, color: C.accent }}>|</span>
        </div>
      </AbsoluteFill>
      <BrandFrame dark />
    </AbsoluteFill>
  );
};

const BeatScene: React.FC<{
  beat: ReelPovProps["beats"][number];
  index: number;
  total: number;
}> = ({ beat, index, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dark = index % 2 === 1 || !!beat.media;
  const words = beat.text.split(" ");
  const chip = pop(frame, fps, 0, 12);
  const emoji = pop(frame, fps, 14 + words.length * 4, 8);
  const wobble = Math.sin(frame / 6) * 4;
  const push = interpolate(frame, [0, beatFrames(beat)], [1, 1.05]);
  const hl = (beat.highlight ?? "").toLowerCase().replace(/[.,!?:;]/g, "");
  return (
    <AbsoluteFill>
      {beat.media ? (
        <MediaBg src={beat.media} duration={beatFrames(beat)} zoom={index % 2 ? "in" : "out"} shade={0.78} />
      ) : (
        <Backdrop tone={dark ? "ink" : "paper"} />
      )}
      <Sfx at={0} s="pluck" v={0.45} />
      {beat.emoji ? <Sfx at={14 + words.length * 4} s="pop" v={0.45} /> : null}
      <AbsoluteFill style={{ padding: "300px 80px 0", transform: `scale(${push})` }}>
        {beat.time ? (
          <div
            style={{
              alignSelf: "flex-start",
              background: dark ? "#fff" : C.ink,
              color: dark ? C.ink : "#fff",
              fontFamily: BRAND.fonts.sans,
              fontWeight: 800,
              fontSize: 56,
              letterSpacing: 2,
              padding: "16px 34px",
              borderRadius: 20,
              transform: `scale(${chip}) rotate(${-3 + chip * 3}deg)`,
              transformOrigin: "left center",
            }}
          >
            {beat.time}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 96,
            lineHeight: 1.12,
            letterSpacing: -2,
            color: dark ? "#fff" : C.ink,
            marginTop: 70,
          }}
        >
          {words.map((w, i) => {
            const s = 14 + i * 4;
            const e = enter(frame, s, 9);
            const isHl = hl !== "" && w.toLowerCase().replace(/[.,!?:;]/g, "") === hl;
            const mark = interpolate(frame, [s + 6, s + 16], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: 22,
                  opacity: e,
                  transform: `translateY(${(1 - e) * 36}px)`,
                  color: isHl ? "#fff" : undefined,
                  padding: isHl ? "0 12px" : undefined,
                  backgroundImage: isHl ? `linear-gradient(${C.accent}, ${C.accent})` : undefined,
                  backgroundSize: isHl ? `${mark}% 100%` : undefined,
                  backgroundRepeat: "no-repeat",
                  borderRadius: isHl ? 12 : undefined,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      {beat.emoji ? (
        <div
          style={{
            position: "absolute",
            right: 110,
            top: 1100, // sopra la zona sicura e i segmenti
            fontSize: 220,
            transform: `scale(${emoji}) rotate(${wobble}deg)`,
          }}
        >
          {beat.emoji}
        </div>
      ) : null}
      <BrandFrame dark={dark} segments={total} active={index} />
    </AbsoluteFill>
  );
};

const PunchScene: React.FC<{ text: string; source?: string }> = ({ text, source }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <AbsoluteFill>
      <Backdrop tone="accent" />
      <Sfx at={4} s="impact" v={0.55} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 90px" }}>
        <div
          style={{
            fontFamily: BRAND.fonts.serifItalic,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 112,
            lineHeight: 1.08,
            color: "#fff",
          }}
        >
          {words.map((w, i) => {
            const e = enter(frame, 6 + i * 5, 12);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: 26,
                  opacity: e,
                  transform: `scale(${0.6 + e * 0.4})`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
        {source ? (
          <div
            style={{
              fontFamily: BRAND.fonts.sans,
              fontSize: 34,
              lineHeight: 1.3,
              color: "rgba(255,255,255,0.85)",
              marginTop: 60,
              opacity: enter(frame, 30, 14),
            }}
          >
            {BRAND.labels.source}: {source}
          </div>
        ) : null}
      </AbsoluteFill>
      <BrandFrame dark />
    </AbsoluteFill>
  );
};

export const ReelPov: React.FC<ReelPovProps> = (props) => {
  const t = linearTiming({ durationInFrames: TRANSITION_FRAMES });
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO_FRAMES}>
          <IntroScene title={props.title} media={props.introMedia} />
        </TransitionSeries.Sequence>
        {props.beats.map((b, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Transition
              presentation={i % 2 === 0 ? slide({ direction: "from-right" }) : slide({ direction: "from-bottom" })}
              timing={t}
            />
            <TransitionSeries.Sequence durationInFrames={beatFrames(b)}>
              <BeatScene beat={b} index={i} total={props.beats.length} />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence durationInFrames={PUNCH_FRAMES}>
          <PunchScene text={props.punchline} source={props.source} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={t} />
        <TransitionSeries.Sequence durationInFrames={CTA_FRAMES}>
          <CtaEnd title={props.ctaTitle} accent={props.ctaAccent} button={props.ctaButton} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
