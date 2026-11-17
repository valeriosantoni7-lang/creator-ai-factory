#!/usr/bin/env tsx
/**
 * Render one video from a JSON file.
 *
 *   npm run render -- examples/myth.json
 *
 * The JSON has: { "template": "ReelMito", "out": "out/myth.mp4", "props": { ... } }
 * "template" is a composition id from src/Root.tsx. Fields you leave out of "props"
 * keep the example values from src/Root.tsx.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run render -- <file.json>");
  process.exit(1);
}
const job = JSON.parse(fs.readFileSync(file, "utf-8")) as { template: string; out?: string; props?: Record<string, unknown> };
const out = job.out ?? path.join("out", `${path.basename(file, ".json")}.mp4`);
fs.mkdirSync(path.dirname(out), { recursive: true });
const propsFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "cf-")), "props.json");
fs.writeFileSync(propsFile, JSON.stringify(job.props ?? {}));

execFileSync("npx", ["remotion", "render", "src/index.ts", job.template, out, `--props=${propsFile}`], { stdio: "inherit" });
console.log(`Done: ${out}`);
