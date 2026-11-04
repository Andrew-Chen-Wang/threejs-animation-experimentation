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
frame-accurate. If a narration file exists in `public/audio/`, it's muxed in. Use `GPU=1` for
hardware GL. The default is SwiftShader, at about 0.25 s per frame at 540p.

## Publish it as a web page

```bash
npm run build
node scripts/build-artifact.mjs    # -> out/artifact/ (add --no-audio to leave the narration out)
```

`out/artifact/` is a self-contained static site (`index.html`, `app.js`, and `audio/narration.mp3`
if you have the audio). Any static host works, including a private claude.ai artifact. Without the
audio file, viewers can load their own copy with the "Load narration" picker.

## How it's built

| Piece | File |
|---|---|
| Engine: scene timeline, ink-bleed / paper-slide transitions, paper grain + vignette post pass | `src/main.js`, `src/lib/post.js` |
| Captions, timed to Whisper word timestamps (`data/transcript.json`) | `src/captions.js` |
| Case file: chapter, clues, evidence timeline, candidates left | `src/lib/casefile.js` |
| Scene schedule | `src/timeline.js` |
| Procedural spectrogram shader: noise, colour-coded Doppler lines with harmonics, voice, red overlays, low-cut / phone band / MP3 / gain | `src/lib/spectro.js` |
| Real Doppler physics: wavefronts from past positions, heard pitch `f₀·c/(c+v_r)`, propagation delay | `src/lib/doppler.js` |
| US map: us-atlas geometry, relief texture, dot grid, synthetic ADS-B tracks, plane pings | `src/lib/usmap.js` |
| Illustrated props: plane, trees, person, pole + camera, clouds (ink outlines via inverted hull) | `src/lib/objects.js` |
| CCTV feed, desk, chart cards, "the clip" photo | `src/lib/feed.js`, `desk.js`, `chart.js`, `polaroid.js` |
| Tooling: screenshots, contact sheets, MP4 render, artifact packaging | `scripts/` |

Colour roles: **blue = plane 1**, **ochre = plane 2**, **red = the answer / look here**.

### Scenes

| Time (s) | Scene | What happens |
|---|---|---|
| 0–4.6 | `intro` | A quiet CCTV feed: nothing in the sky, nothing you can hear |
| 4.6–15 | `america` | The clip pinned to the exact spot (FOUND), then "WHERE?" over the whole country, then the date |
| 15–19 | `pole` | Crane up the utility pole to the camera |
| 19–36 | `cctv` | **Ch 1 The Clue.** The sky becomes a spectrogram taught with a bird and wind; the zoom band is marked; plane 1 (blue); +920 s; plane 2 (ochre); the shape traced |
| 36–53 | `doppler` | **Ch 2 Reading the Line.** Linked NOW cursor and true-pitch baseline; small multiples for speed, then distance; one curve read as speed / distance / time |
| 53–92 | `map` | **Ch 3 The Search.** ADS-B pings, 24 h replay, jets out; worked example (spots A, B); 70,000; silence card; worked example (C); 15,000 |
| 92–104 | `shape` | **Ch 4 The Proof.** Curve bend linked to the turn that caused it; small multiples for spots A, B, C |
| 104–113 | `trap` | Where it was vs where it is, measured (~2 s, ~100 m); ignoring the delay gives no match |
| 113–121 | `match` | Predicted lines over heard lines; the best fit turns red; first vs second score bars |
| 121–130 | `harder`, `country` | **Ch 5.** One minute, one faint plane, a known time; a national rescan finds the same spot |
| 130–138 | `squares` | One 100 m square (a football pitch) of 765,000,000 |
| 138–144 | `street` | The same tree line (same seed) outlined in red, then turn to the camera |
| 144–159 | `hide`, `voice`, `phone` | Low-cut leaves harmonics, MP3 buries them, gain recovers them; a voice on top; the phone band |
| 159–170 | `colsto` | Credit cards, 5,000 lines of code, NOT RELEASED |
| 170–179 | `sky`, `globe`, `finale` | Plane overhead with its pitch line in the sky; globe; end card |

The location, coordinates, scores, and tail numbers are illustrative.

## Docs

- [docs/DESIGN.md](docs/DESIGN.md): why each scene is designed the way it is (the explanation-first redesign), with sources.
- [docs/PROCESS.md](docs/PROCESS.md): how it was built, the full iteration log, and the learnings.
- [docs/PLAYBOOK.md](docs/PLAYBOOK.md): a step-by-step recipe for the next piece in this style.
