// Brand settings: the single place to make the templates yours.
// Change colours, fonts, handle, avatar, number format and on-screen labels here;
// every template reads from this file.

import { loadFont as loadSerif } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadSans } from "@remotion/google-fonts/Poppins";

const serif = loadSerif("normal", { weights: ["700", "900"], subsets: ["latin"] });
const serifItalic = loadSerif("italic", { weights: ["400", "700"], subsets: ["latin"] });
const sans = loadSans("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });

export const BRAND = {
  colors: {
    accent: "#3B5BDB", // main colour: pills, highlights, closing scene
    accentDark: "#2B44A8",
    accentTint: "#E3E9FF", // light text on the accent background
    accentLight: "#8FA6FF", // accent that stays readable on dark photos
    accentWash: "#ECEFFE", // very light background tint
    paper: "#F7F6F3", // light background
    ink: "#121212", // text and dark background
    grey: "#8A8A8A",
    line: "#E5E2DC",
  },
  fonts: {
    serif: serif.fontFamily,
    serifItalic: serifItalic.fontFamily,
    sans: sans.fontFamily,
  },
  handle: "@yourhandle",
  avatar: "brand/avatar.svg", // a real photo of you works best (square, face centred)
  locale: "en-US", // number format: "it-IT" gives 1.540 · 21,2
  labels: {
    sources: "Sources",
    reality: "In reality",
    myth: "Myth",
    iThought: "I thought",
    iThoughtThat: "I thought that",
    was: "was",
    yourAnswer: "Write your answer below 👇",
    answerBeforeTime: "⏱ Answer in the comments before time runs out",
    question: "Question",
    round: "Round",
    of: "of",
    source: "Source",
  },
} as const;

export const FORMATS = {
  squarePost: { width: 1080, height: 1080 },
  vertical: { width: 1080, height: 1920 }, // TikTok, Reels, Shorts, Stories
} as const;
