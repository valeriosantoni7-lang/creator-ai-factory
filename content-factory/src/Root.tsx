import React from "react";
import { Composition, Folder } from "remotion";
import { FORMATS } from "./social/brand";
import { ReelQuiz, ReelQuizSchema, calculateReelQuizDuration, type ReelQuizProps } from "./social/ReelQuiz";
import { ReelMito, ReelMitoSchema, calculateReelMitoDuration, type ReelMitoProps } from "./social/ReelMito";
import { ReelPov, ReelPovSchema, calculateReelPovDuration, type ReelPovProps } from "./social/ReelPov";
import { ReelMappa, ReelMappaSchema, calculateReelMappaDuration, type ReelMappaProps } from "./social/ReelMappa";
import { ReelNotizia, ReelNotiziaSchema, calculateReelNotiziaDuration, type ReelNotiziaProps } from "./social/ReelNotizia";
import { ReelConfronto, ReelConfrontoSchema, calculateReelConfrontoDuration, type ReelConfrontoProps } from "./social/ReelConfronto";
import { ReelTrend, ReelTrendSchema, calculateReelTrendDuration, type ReelTrendProps } from "./social/ReelTrend";

// Example props. They only show the shape of the data: replace every text and number
// with your own content and real sources before publishing anything.

const quiz: ReelQuizProps = {
  category: "Quiz · Example",
  title: "3 questions.",
  titleAccent: "How many do you know?",
  questions: [
    { question: "Example question one?", options: ["Option A", "Option B", "Option C"], correct: 1, reveal: "Option B", note: "Source: your official source" },
    { question: "Example question two?", options: ["Option A", "Option B", "Option C", "Option D"], correct: 2, reveal: "Option C", note: "Source: your official source" },
    { question: "Example question three?", options: ["Option A", "Option B"], correct: 0, reveal: "Option A", note: "Source: your official source" },
  ],
  ctaTitle: "How many did you get?",
  ctaAccent: "Tell me in the comments",
  ctaButton: "Follow for more",
};

const myth: ReelMitoProps = {
  title: "What I thought",
  titleAccent: "and what is true.",
  items: [
    { myth: "Example myth number one.", reality: "What is actually true, with a number and a source." },
    { myth: "Example myth number two.", reality: "What is actually true, with a number and a source." },
    { myth: "Example myth number three.", reality: "What is actually true, with a number and a source." },
  ],
  ctaTitle: "Which one surprised you?",
  ctaAccent: "Tell me in the comments",
  ctaButton: "Follow for more",
};

const pov: ReelPovProps = {
  title: "your first month in a new country",
  beats: [
    { time: "Day 1", text: "Example step with one key word.", highlight: "key", emoji: "🏛️" },
    { time: "Day 3", text: "Another step that really happened to you.", highlight: "really", emoji: "🏦" },
    { time: "Week 2", text: "A detail people do not expect.", highlight: "expect.", emoji: "🩺" },
    { time: "Month 1", text: "The moment it all made sense.", highlight: "sense.", emoji: "💸" },
  ],
  punchline: "Your closing line here.",
  ctaTitle: "The full checklist",
  ctaAccent: "is free on my site",
  ctaButton: "Link in bio",
};

const map: ReelMappaProps = {
  category: "Map · Example",
  title: "Example data",
  titleAccent: "city by city.",
  mode: "bubbles",
  points: [
    { city: "Zurich", label: "Example value for Zurich", value: 400, valueText: "400" },
    { city: "Geneva", label: "Example value for Geneva", value: 300, valueText: "300" },
    { city: "Lugano", label: "Example value for Lugano", value: 200, valueText: "200" },
    { city: "Basel", label: "Example value for Basel", value: 150, valueText: "150" },
  ],
  source: "Example source",
  ctaTitle: "Where would you go?",
  ctaAccent: "Write the city below",
  ctaButton: "Follow for more",
};

const news: ReelNotiziaProps = {
  scenes: [
    { type: "hook", tag: "News · example", title: "Your headline goes here.", big: { value: 5, decimals: 1, prefix: "+", suffix: "%" }, sub: "What the number means (source)", media: "demo/a.svg" },
    {
      type: "numbers",
      title: "The key numbers",
      rows: [
        { label: "Example row", from: 100, value: 105, suffix: "CHF" },
        { label: "Another row", value: 87.5, suffix: "CHF", delta: "+4.20" },
      ],
    },
    {
      type: "map",
      category: "Map · example",
      title: "Where it changes most",
      titleAccent: "canton by canton.",
      mode: "cantons",
      step: 48,
      points: [
        { city: "ZH", label: "Zurich · example", valueText: "+5.8%" },
        { city: "GE", label: "Geneva · example", valueText: "+4.4%" },
        { city: "TI", label: "Ticino · example", valueText: "+3.7%" },
      ],
      source: "Example source",
    },
    { type: "impact", title: "What it means for you", big: { value: 120, decimals: 0, prefix: "+" }, unit: "CHF a year", text: "One sentence that turns the number into a personal impact." },
    { type: "steps", title: "What you can do", steps: ["First concrete step", "Second concrete step", "Third concrete step"] },
    { type: "source", text: "Official source, date of publication", disclaimer: "General information, not personal advice." },
  ],
  ctaTitle: "What about you?",
  ctaAccent: "Tell me in the comments",
  ctaButton: "Follow for more",
};

const compare: ReelConfrontoProps = {
  title: "A or B?",
  titleAccent: "Same budget, two choices.",
  a: { name: "Option A", flag: "ch", media: "demo/a.svg" },
  b: { name: "Option B", flag: "it", media: "demo/b.svg" },
  rounds: [
    { label: "Example metric", context: "what is measured, and when", a: { value: 5500, suffix: "CHF" }, b: { value: 1600, suffix: "EUR" }, winner: "a", note: "example note" },
    { label: "Ranking", context: "example ranking", a: { text: "5th" }, b: { text: "12th" }, winner: "a" },
    { label: "Everyday language", a: { text: "German" }, b: { text: "Italian" }, winner: "tie" },
  ],
  verdict: "A wins on the numbers.",
  verdictAccent: "B wins on something else.",
  source: "Sources: your official sources. General information, not advice.",
  ctaTitle: "Which one would you pick?",
  ctaAccent: "A or B?",
  ctaButton: "Follow for more",
};

// Compound interest: pure maths with a hypothetical 5% yearly return, monthly compounding.
const trend: ReelTrendProps = {
  tag: "Money · Compound interest",
  title: "200 a month for 30 years",
  titleAccent: "how much does it become?",
  unit: "CHF",
  xs: Array.from({ length: 31 }, (_, i) => String(i)),
  xPrefix: "Year",
  series: [
    { label: "With a 5% yearly return", color: "accent", values: [0, 2456, 5037, 7751, 10603, 13601, 16753, 20066, 23548, 27209, 31056, 35101, 39353, 43822, 48520, 53458, 58649, 64105, 69840, 75869, 82207, 88868, 95871, 103232, 110969, 119102, 127651, 136638, 146084, 156014, 166452] },
    { label: "What you put in", color: "white", values: Array.from({ length: 31 }, (_, i) => i * 2400) },
  ],
  milestones: [
    { at: 15, text: "After 15 years interest is already a third of the total" },
    { at: 26, text: "Now interest is more than what you put in" },
  ],
  finalLabel: "After 30 years",
  finalLines: ["You put in 72,000 CHF", "Interest: 94,452 CHF"],
  note: "Maths example with a hypothetical 5% yearly return, before costs and taxes. Real returns vary and are not guaranteed. Not financial advice.",
  ctaTitle: "Time matters",
  ctaAccent: "more than the amount.",
  ctaButton: "Follow for more",
};

const V = { fps: 30, width: FORMATS.vertical.width, height: FORMATS.vertical.height };

export const RemotionRoot: React.FC = () => (
  <Folder name="Vertical">
    <Composition id="ReelQuiz" component={ReelQuiz} {...V} durationInFrames={calculateReelQuizDuration(quiz)} defaultProps={quiz} schema={ReelQuizSchema} calculateMetadata={({ props }) => ({ durationInFrames: calculateReelQuizDuration(props) })} />
    <Composition id="ReelMito" component={ReelMito} {...V} durationInFrames={calculateReelMitoDuration(myth)} defaultProps={myth} schema={ReelMitoSchema} calculateMetadata={({ props }) => ({ durationInFrames: calculateReelMitoDuration(props) })} />
    <Composition id="ReelPov" component={ReelPov} {...V} durationInFrames={calculateReelPovDuration(pov)} defaultProps={pov} schema={ReelPovSchema} calculateMetadata={({ props }) => ({ durationInFrames: calculateReelPovDuration(props) })} />
    <Composition id="ReelMappa" component={ReelMappa} {...V} durationInFrames={calculateReelMappaDuration(map)} defaultProps={map} schema={ReelMappaSchema} calculateMetadata={({ props }) => ({ durationInFrames: calculateReelMappaDuration(props) })} />
    <Composition id="ReelNotizia" component={ReelNotizia} {...V} durationInFrames={calculateReelNotiziaDuration(news)} defaultProps={news} schema={ReelNotiziaSchema} calculateMetadata={({ props }) => ({ durationInFrames: calculateReelNotiziaDuration(props) })} />
    <Composition id="ReelConfronto" component={ReelConfronto} {...V} durationInFrames={calculateReelConfrontoDuration(compare)} defaultProps={compare} schema={ReelConfrontoSchema} calculateMetadata={({ props }) => ({ durationInFrames: calculateReelConfrontoDuration(props) })} />
    <Composition id="ReelTrend" component={ReelTrend} {...V} durationInFrames={calculateReelTrendDuration()} defaultProps={trend} schema={ReelTrendSchema} />
  </Folder>
);
