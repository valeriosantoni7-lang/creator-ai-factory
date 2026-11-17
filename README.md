# creator-ai-factory

Three open tools from a one-person creator business about working and living in Switzerland, shared as a starting point for your own.

| Folder | What it is | Status |
|---|---|---|
| [`agents/`](agents/) | **AI factory**: a team of scheduled Claude agents (director, content, numbers, publishing, site check, comment drafts) coordinated through two shared files and a weekly measure → experiment → apply loop | Prompt templates + rules |
| [`content-factory/`](content-factory/) | **Content factory**: data-driven vertical videos with [Remotion](https://www.remotion.dev): quiz, myth vs reality, POV story, animated Swiss map, news, A vs B, chart over time. One JSON in, one MP4 out | Working, 7 templates |
| [`swiss-tools/`](swiss-tools/) | **Swiss net salary 2026**: social contributions + official withholding tax for all 26 cantons, a reusable JS engine and the parser that rebuilds the data every January | Working, tested |

## Why

Most "AI for creators" kits are single prompts. This is the system around them: what each agent does, what it must never do, how they hand work to each other, and the video templates and tools they use. It runs a real (small) business; the lessons from what broke are in [`agents/README.md`](agents/README.md#lessons-learned-what-breaks).

## Quick start

```bash
# videos
cd content-factory && npm install && npm run dev          # Remotion Studio
npm run render -- examples/compare.json                    # → out/compare.mp4

# net salary calculator
cd swiss-tools/net-salary && node test.js                  # reference checks
python3 -m http.server 8000                                # open http://localhost:8000
```

## Good to know

- **Not advice.** The Swiss tools give general information, not tax or financial advice.
- **Bring your own brand.** Colours, fonts, handle, avatar and on-screen labels live in `content-factory/src/social/brand.ts`. Example texts are placeholders: replace every number with your own data and a real source.
- **No media included** beyond flags, CC0 sounds and two placeholder images. Use your own photos or footage you have the rights to.
- **Remotion licence.** Remotion is free for individuals and companies with up to 3 employees; bigger companies need a company licence.

## Licence

MIT for the code in this repository (see [`LICENSE`](LICENSE); third-party parts in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)). Made by [@valerio.swiss](https://valerioswiss.com) as a personal project.
