# The Sound That Finds You

A vertical (9:16) Three.js explainer that re-tells the narration of
[this reel](https://www.instagram.com/reel/DfSsHlYtpNc/): how a faint propeller plane in a
security-camera clip's audio can pin down the exact pole the camera hangs on. The method is by
**colsto** (YouTube).

The visuals here are new, not a frame-by-frame copy. They keep the reference's language: cream paper,
grey illustration, one red accent, bold serif captions with a red key word, and mono HUD labels.
Each beat was re-staged as its own 3D scene.

## Run it

```bash
npm install
npm run fetch-audio   # optional: pulls the narration with yt-dlp into public/audio/ (git-ignored)
npm run dev           # open the printed URL
```

Space plays and pauses. ←/→ seek by 2 s (with Shift, by 10 s). `?t=95` starts at 95 s. Without the
audio file, the piece runs silently on its own clock, and the captions still play.

## Render an MP4

```bash
npx vite --port 5173 &
node scripts/render.mjs out/final.mp4 --w 1080 --fps 60
```

Each frame is rendered on its own (`?render` mode exposes `window.__frame(t)`), so the output is
frame-accurate. If `public/audio/narration.m4a` exists, the narration is muxed in. Use `GPU=1` for
hardware GL. The default is SwiftShader, at about 0.25 s per frame at 540p.

## How it's built

| Piece | File |
|---|---|
| Engine: scene timeline, ink-bleed / paper-slide transitions, paper grain + vignette post pass | `src/main.js`, `src/lib/post.js` |
| Captions, timed to Whisper word timestamps (`data/transcript.json`) | `src/captions.js` |
| Scene schedule | `src/timeline.js` |
| Procedural spectrogram shader: noise bins, wind gusts, Doppler lines with harmonics, voice formants, red overlays, low-cut / MP3 / gain | `src/lib/spectro.js` |
| Real Doppler physics: wavefronts from past positions, heard pitch `f₀·c/(c+v_r)`, propagation delay | `src/lib/doppler.js` |
| US map: us-atlas geometry, relief texture, dot grid, synthetic ADS-B tracks, plane pings | `src/lib/usmap.js` |
| Illustrated props: plane, trees, person, pole + camera, clouds (ink outlines via inverted hull) | `src/lib/objects.js` |

### Scenes

| Time (s) | Scene | What happens |
|---|---|---|
| 0–9 | `intro` | Plane over patchwork fields; ground wavefronts; a red ring closes on a pin |
| 9–15 | `america` | Dot-grid US, candidates blink, dive into one dot |
| 15–19 | `pole` | Low-angle crane up a utility pole to the camera |
| 19–36 | `cctv` | CAM 01 feed; the sky becomes a spectrogram; zoom to low notes; +920 s; second line traced |
| 36–53 | `doppler` | Top-down wavefronts bunching up; live pitch chart for slow, fast, and close passes |
| 53–92 | `map` | ADS-B pings, 24 h replay, jets removed, spot grid, 70,000 → 15,000, "15 min of nothing" card |
| 92–104 | `shape` | Wobbly flight with a red trail; predicted line per spot |
| 104–113 | `trap` | "Where it was" vs "where it is"; ignoring the delay means no match |
| 113–121 | `match` | Candidate lines converge on both planes; score card |
| 121–130 | `harder`, `country` | One minute of audio, one faint plane, then a national rescan |
| 130–138 | `squares` | Log zoom from one 100 m square out to 765,000,000 of them |
| 138–144 | `street` | The same tree line (same seed) outlined in red, then turn to the camera |
| 144–159 | `hide`, `voice`, `phone` | Low cut, MP3 and gain on a desk print; plane under a voice; phone call |
| 159–170 | `colsto` | Credit cards, 5,000 lines of code, NOT RELEASED |
| 170–179 | `sky`, `globe`, `finale` | Plane overhead with its pitch line in the sky; globe; end card |

The location, coordinates, scores, and tail numbers are illustrative.

See [docs/DESIGN.md](docs/DESIGN.md) for why each scene is designed the way it is (the explanation-first redesign),
and [docs/PROCESS.md](docs/PROCESS.md) for how it was built, the iteration log, and the learnings.
