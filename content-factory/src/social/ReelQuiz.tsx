import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { z } from "zod";
import { BRAND } from "./brand";
import { Backdrop, BrandFrame, C, CTA_FRAMES, CtaEnd, enter, Pill, pop, Sfx } from "./kit";

// -----------------------------------------------------------------------------
// ReelQuiz — "Indovina" verticale 1080x1920
// Intro → per ogni domanda: opzioni, conto alla rovescia 3-2-1, risposta → CTA.
// Il conto alla rovescia lascia il tempo di fermare il video e commentare.
// -----------------------------------------------------------------------------

const INTRO_FRAMES = 66;
const Q_FRAMES = 195;
const TRANSITION_FRAMES = 10;
const COUNT_START = 50;
const STEP = 25; // un numero ogni 25 frame: 3, 2, 1
const REVEAL = COUNT_START + 3 * STEP + 3;

export const ReelQuizSchema = z.object({
  category: z.string().describe("Etichetta in alto (es. 'Quiz · Vita in Svizzera')"),
  title: z.string().describe("Titolo dell'intro (es. '3 prezzi svizzeri.')"),
  titleAccent: z.string().describe("Seconda riga in corsivo (es. 'Quanti ne indovini?')"),
  questions: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).min(2).max(4),
        correct: z.number().int().min(0).describe("Indice dell'opzione giusta (da 0)"),
        reveal: z.string().describe("Risposta grande (es. '4,80 CHF')"),
        note: z.string().describe("Una riga di spiegazione o fonte"),
      }),
    )
    .min(1)
    .max(4),
  ctaTitle: z.string(),
  ctaAccent: z.string(),
  ctaButton: z.string(),
});

export type ReelQuizProps = z.infer<typeof ReelQuizSchema>;

export const calculateReelQuizDuration = (p: ReelQuizProps) =>
  INTRO_FRAMES + p.questions.length * Q_FRAMES + CTA_FRAMES - (p.questions.length + 1) * TRANSITION_FRAMES;

const IntroScene: React.FC<{ category: string; title: string; accent: string }> = ({
  category,
  title,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = pop(frame, fps, 4, 13);
  const a = enter(frame, 18, 18);
  const h = enter(frame, 30, 16);
  const rot = interpolate(frame, [0, INTRO_FRAMES], [-8, 6]);
  return (
    <AbsoluteFill>
      <Backdrop tone="accent" />
      <Sfx at={0} s="whoosh" v={0.5} />
      <Sfx at={6} s="impact" v={0.5} />
      <div
        style={{
          position: "absolute",
          right: -120,
          top: 380,
          fontFamily: BRAND.fonts.serif,
          fontWeight: 900,
          fontSize: 1100,
          lineHeight: 1,
          color: "rgba(255,255,255,0.08)",
          transform: `rotate(${rot}deg)`,
        }}
      >
        ?
      </div>
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 90px", gap: 40 }}>
        <div style={{ opacity: enter(frame, 0, 12) }}>
          <Pill tone="white">{category}</Pill>
        </div>
        <div style={{ transform: `scale(${0.9 + t * 0.1})`, transformOrigin: "left center", opacity: Math.min(1, t * 1.5) }}>
          <div
            style={{
              fontFamily: BRAND.fonts.serif,
              fontWeight: 900,
              fontSize: 128,
              lineHeight: 1.02,
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
              fontSize: 92,
              lineHeight: 1.08,
              color: C.accentTint,
              marginTop: 14,
              opacity: a,
              transform: `translateY(${(1 - a) * 40}px)`,
            }}
          >
            {accent}
          </div>
        </div>
        <div
          style={{
            fontFamily: BRAND.fonts.sans,
            fontWeight: 600,
            fontSize: 34,
            color: "rgba(255,255,255,0.85)",
            opacity: h,
          }}
        >
          {BRAND.labels.answerBeforeTime}
        </div>
      </AbsoluteFill>
      <BrandFrame dark />
    </AbsoluteFill>
  );
};

const LETTERS = ["A", "B", "C", "D"];

const Countdown: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const local = frame - COUNT_START;
  if (local < 0 || frame >= REVEAL) return null;
  const step = Math.min(2, Math.floor(local / STEP));
  const n = 3 - step;
  const progress = Math.min(1, local / (3 * STEP));
  const s = pop(frame, fps, COUNT_START + step * STEP, 10);
  const R = 84;
  const circ = 2 * Math.PI * R;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
      <div style={{ position: "relative", width: 220, height: 220 }}>
        <svg width={220} height={220} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx={110} cy={110} r={R} stroke={C.line} strokeWidth={14} fill="none" />
          <circle
            cx={110}
            cy={110}
            r={R}
            stroke={C.accent}
            strokeWidth={14}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * progress}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 120,
            color: C.ink,
            transform: `scale(${0.6 + s * 0.4})`,
          }}
        >
          {n}
        </div>
      </div>
      <div style={{ fontFamily: BRAND.fonts.sans, fontWeight: 600, fontSize: 30, color: C.grey }}>
        {BRAND.labels.yourAnswer}
      </div>
    </div>
  );
};

const QuestionScene: React.FC<{
  q: ReelQuizProps["questions"][number];
  index: number;
  total: number;
}> = ({ q, index, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const qIn = enter(frame, 0, 18);
  const revealed = frame >= REVEAL;
  const r = pop(frame, fps, REVEAL, 11);
  const ans = enter(frame, REVEAL + 8, 16);
  const ansPop = pop(frame, fps, REVEAL + 8, 10);

  return (
    <AbsoluteFill>
      <Backdrop tone="paper" />
      {q.options.map((_, i) => (
        <Sfx key={i} at={14 + i * 7} s="click" v={0.3} />
      ))}
      {[0, 1, 2].map((k) => (
        <Sfx key={`t${k}`} at={COUNT_START + k * STEP} s="tick" v={0.5} />
      ))}
      <Sfx at={REVEAL} s="confirm" v={0.55} />
      <Sfx at={REVEAL + 8} s="pop" v={0.4} />
      <AbsoluteFill style={{ padding: "230px 80px 0", flexDirection: "column" }}>
        <div
          style={{
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 76,
            lineHeight: 1.1,
            letterSpacing: -1.5,
            color: C.ink,
            opacity: qIn,
            transform: `translateY(${(1 - qIn) * 40}px)`,
          }}
        >
          {q.question}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 56 }}>
          {q.options.map((opt, i) => {
            const e = enter(frame, 14 + i * 7, 16);
            const isRight = i === q.correct;
            const fadeWrong = revealed && !isRight ? interpolate(frame, [REVEAL, REVEAL + 10], [1, 0.32], { extrapolateRight: "clamp" }) : 1;
            const scale = revealed && isRight ? 1 + r * 0.04 : 1;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 28,
                  minHeight: 118,
                  padding: "18px 34px",
                  borderRadius: 28,
                  background: revealed && isRight ? C.accent : "#fff",
                  border: `3px solid ${revealed && isRight ? C.accent : C.line}`,
                  boxShadow: revealed && isRight ? "0 22px 50px rgba(200,30,40,0.35)" : "0 8px 24px rgba(17,17,17,0.05)",
                  opacity: e * fadeWrong,
                  transform: `translateX(${(1 - e) * 80}px) scale(${scale})`,
                }}
              >
                <div
                  style={{
                    width: 66,
                    height: 66,
                    flexShrink: 0,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: BRAND.fonts.sans,
                    fontWeight: 800,
                    fontSize: 32,
                    background: revealed && isRight ? "#fff" : "transparent",
                    color: C.accent,
                    border: `3px solid ${revealed && isRight ? "#fff" : C.accent}`,
                  }}
                >
                  {revealed && isRight ? "✓" : LETTERS[i]}
                </div>
                <div
                  style={{
                    fontFamily: BRAND.fonts.sans,
                    fontWeight: 600,
                    fontSize: 42,
                    lineHeight: 1.2,
                    color: revealed && isRight ? "#fff" : C.ink,
                  }}
                >
                  {opt}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 70, display: "flex", justifyContent: "center", minHeight: 300 }}>
          {revealed ? (
            <div style={{ textAlign: "center", opacity: ans, transform: `translateY(${(1 - ans) * 40}px)` }}>
              <div
                style={{
                  fontFamily: BRAND.fonts.serif,
                  fontWeight: 900,
                  fontSize: 124,
                  lineHeight: 1,
                  letterSpacing: -2,
                  color: C.accent,
                  transform: `scale(${0.8 + ansPop * 0.2})`,
                }}
              >
                {q.reveal}
              </div>
              <div
                style={{
                  fontFamily: BRAND.fonts.sans,
                  fontWeight: 500,
                  fontSize: 34,
                  lineHeight: 1.35,
                  color: "#444",
                  marginTop: 22,
                  maxWidth: 900,
                }}
              >
                {q.note}
              </div>
            </div>
          ) : (
            <Countdown frame={frame} fps={fps} />
          )}
        </div>
      </AbsoluteFill>
      <BrandFrame counter={`${BRAND.labels.question} ${index + 1} ${BRAND.labels.of} ${total}`} segments={total} active={index} />
    </AbsoluteFill>
  );
};

export const ReelQuiz: React.FC<ReelQuizProps> = (props) => {
  const t = linearTiming({ durationInFrames: TRANSITION_FRAMES });
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO_FRAMES}>
          <IntroScene category={props.category} title={props.title} accent={props.titleAccent} />
        </TransitionSeries.Sequence>
        {props.questions.map((q, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t} />
            <TransitionSeries.Sequence durationInFrames={Q_FRAMES}>
              <QuestionScene q={q} index={i} total={props.questions.length} />
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
