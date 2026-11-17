# content-factory

Vertical videos (1080×1920, 30 fps) for TikTok, Reels and Shorts, generated from data with [Remotion](https://www.remotion.dev). Every template keeps the hook readable on the first frame, never holds a still screen for long, keeps the signature and sources above the apps' bottom overlay (`SAFE_BOTTOM`) and ends with a short closing scene.

| Composition | Format | Main props |
|---|---|---|
| `ReelQuiz` | Quiz with countdown and reveal | `questions[] {question, options, correct, reveal, note}` |
| `ReelMito` | "I thought… / In reality…" | `items[] {myth, reality}`, optional `introMedia`, `quotes` |
| `ReelPov` | First-person story in kinetic type | `beats[] {time, text, highlight, emoji}`, `punchline` |
| `ReelMappa` | Animated map of Switzerland | `mode: route \| bubbles \| cantons`, `points[]` |
| `ReelNotizia` | News in scenes | `scenes[]` of type `hook, numbers, map, impact, steps, source` |
| `ReelConfronto` | A vs B, round by round | `a`, `b` (name, flag, media), `rounds[]`, `verdict` |
| `ReelTrend` | Chart that runs over time | `xs`, `series[] {label, color, values}`, `milestones` |

## Use

```bash
npm install
npm run dev                                   # preview and edit props in Remotion Studio
npm run render -- examples/myth.json          # one JSON job → one MP4 in out/
```

A job file is `{ "template": "<composition id>", "out": "out/name.mp4", "props": { ... } }`. Props you leave out keep the example values in `src/Root.tsx`.

## Make it yours

- `src/social/brand.ts`: colours, fonts, handle, avatar (`public/brand/`), number locale and every on-screen label.
- `src/social/kit.tsx`: shared building blocks (backgrounds, pills, flags, signature, safe zone, closing scene, media background, sound effects).
- Photos and clips go in `public/` and are referenced by path (e.g. `"media": "stock/city.jpg"`). Only use media you have the rights to.
- Some internal comments in the templates are still in Italian.

If rendering hangs on "Opening browser", set `CHROME_PATH` to your installed Chrome (see `remotion.config.ts`).

## Credits

Flags: flag-icons (MIT). Sounds: Kenney (CC0). Swiss borders: swisstopo / FSO via swiss-maps (`scripts/topo2ts.py` rebuilds them).
