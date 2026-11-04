# Thailand Has Fewer Babies Than Japan

A 9:16, 2-minute Three.js cut-paper animation that re-tells the narration of the YouTube short
[Thailand Has Fewer Babies Than Japan](https://www.youtube.com/shorts/1AakgfT9qis) by
[Sam's POV](https://www.youtube.com/@sszuchan).

The visuals were rebuilt from scratch in Three.js. They follow the reference's visual language:
a dark grey paper set, cut-paper people with pale cut edges, torn newspaper clippings, grey tones
with a single red accent, mono-type numbers, two-word white captions, and film grain with a vignette.
The reference also cuts to a presenter on camera and shows press photos of officials. Those shots
are replaced with animated cut-paper beats, so the piece contains no real person's likeness.

- **Watch:** [`renders/thailand-births-720p.mp4`](renders/thailand-births-720p.mp4) (720×1280, 30 fps, with the original narration).
- **Interactive:** the live page is deployed with the other experiments, under `/thailand-births/` on the GitHub Pages site.

## Sound and timing

The soundtrack is the original short's narration, in [`public/narration.mp3`](public/narration.mp3).
On the live page the audio drives the clock, so scrubbing and seeking stay in sync. If the audio
can't load or play, the animation runs on its own clock and the captions still carry the script.

The captions use the reference's two-word chunks. Each chunk starts at its first word's start
time in a [faster-whisper](https://github.com/SYSTRAN/faster-whisper) transcript (`small.en`, word
timestamps). The few names Whisper misheard (Monsikarn Kanchanajittra, Mahidol, "chips in") were
matched by hand; see [`src/captions.js`](src/captions.js). The scene cues are keyed to those times.

## Scenes

| Time (s) | Beat | What you see |
|---|---|---|
| 0–24.8 | The floor | Woman and child on a "THAILAND" pedestal at exactly 1.0, under a red floor line marked on a ruler. The 2024 clipping ("1.00, a first"), then the pedestal sinks below the line for 2025. Pull back as Japan's taller 1.14 pedestal slides in. |
| 24.8–33.8 | Births | Cot cards stack up: 6 for 417,000 last year, 18 for 1.2 million in 1971, with a red ⅓ line. The 1971 stack then sheds cards down to today's height. |
| 33.8–44.5 | 2017 campaign | "2017", a "Have children for the nation" poster, and a red heart. An official hands over a folic-acid blister pack. The supplement clippings and the newspaper headline ("…besides vitamins?") arrive with an English gloss. |
| 44.5–50.8 | 600 baht | A mother holding a baby; six 100-baht notes fan in, then "≈ $18" and "LOW-INCOME FAMILIES ONLY". |
| 50.8–70.8 | NIDA 2023 poll | A row of young people. 65% (school to university, with a walker crossing), 64% (a parent walks a growing child along 0 to 15 as payments drop in), and 22% in red (a pile of cash). Each answer gets its own bar. |
| 70.8–84 | 1.6 million baht | A stack of note bundles rises one year at a time against an age ruler while the child grows into a graduate. Then $46,000, and six "1 YR" income blocks next to an average earner. |
| 84–94.1 | September proposal | "September", Parliament, an official at a podium raising a hand. 600 becomes five red notes (3,000 baht, $91 a month) for six children aged 0–5. |
| 94.1–100 | "Every birth matters" | The minister at the podium, with the quote's phrases boxed in red as they're spoken. |
| 100–110.3 | "Choose" | The researcher's name cards. A Y-shaped path forks behind her toward a desk and laptop ("a good economy") and a cot ("a good family"). She looks at each one as it's named. |
| 110.3–115.3 | The balance | Six years of income tips a scale. A $18-a-month note lands on the other pan and barely moves it. |
| 115.3–123.6 | Ending | Young adults walk in without children. Push back in on the Thailand pedestal under the red line. "National priority / TARGET 2027", then an "ALREADY BELOW 1" stamp. |

Figures that are not in the narration are illustrative: the 2025 pedestal height (the script only says
"below one"), and the card unit in the births stacks (about 67,000–70,000 births per card).

## Run and render

```bash
npm install
npm run dev:thailand -- --port 5174          # open the printed URL; ?t=60 starts at 60 s
npm run build:thailand                        # -> dist-thailand/
```

Space plays and pauses, M mutes, and ←/→ seek 2 s (10 s with Shift).

```bash
npx vite --config vite.thailand.config.js --port 5174 &
PORT=5174 node scripts/render.mjs out/thailand.mp4 --w 1080 --fps 30 --audio thailand-births/public/narration.mp3
```

`?render` mode exposes `window.__frame(t)`, so every frame is rendered on its own and the output is
frame-accurate. SwiftShader takes about 0.55 s per frame at 720p.

## How it's built

| Piece | File |
|---|---|
| Engine: beat switching, post pass (ACES, lens fringe, vignette, grain), captions, playback, render hooks | `src/main.js` |
| Paper kit: grain texture, extruded cut-outs with pale bevel edges, torn-edge shapes, printed slips with red word boxes, mono labels | `src/paper.js` |
| People (poseable arms and legs, blinking, walking, glasses, hair styles), babies, buildings, banknotes, bundles, pedestals, rulers, podium, desk, cot | `src/figures.js` |
| The 11 beats, each a scene posed from absolute time `t` | `src/beats.js` |
| Caption chunks and timings | `src/captions.js` |

Lighting is a soft spot light from the upper left that casts real shadow maps onto the wall, plus a
hemisphere fill. Every piece sits a few centimetres off the wall, so the shadows read as layered paper.

## Credits

- Script and original video: Sam's POV, [youtube.com/shorts/1AakgfT9qis](https://www.youtube.com/shorts/1AakgfT9qis). The quotes and figures are from the narration.
- Fonts: Inter, IBM Plex Mono, and Noto Sans Thai (SIL Open Font License), via Fontsource.
