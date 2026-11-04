# Commission of Two

A Three.js reconstruction of the YouTube Short
["Xi's Military Commission of Two"](https://www.youtube.com/shorts/4JLSAa9XzIQ) (Sam's POV). It runs 140 s
at 9:16 and is cut to the narration's word timings.

The look follows the reference: grey clay 3D (white chairs, dark blocky figures), heavy tilt-shift
blur, a rounded old-monitor frame, a fine halftone and grain, red as the only colour, pixel-font
label chips, dark "document" shots with red boxes around key Chinese phrases, and two-word captions.

The reference also uses press photos of real officials and a presenter talking to camera. Those are
**not** reproduced. Officials appear as faceless clay figures and halftoned silhouette cards marked
"illustrative", and the presenter shots are replaced by more clay scenes.

## Watch it

[`renders/commission-of-two-540p.mp4`](renders/commission-of-two-540p.mp4) is a silent 540×960, 30 fps render. The narration isn't committed.

## Run

```bash
npm install                 # from the repository root
npm run dev:commission      # open the printed URL
```

Space plays and pauses. ←/→ seek by 2 s (with Shift, by 10 s). `?t=60` starts at 60 s.
The narration is read from `public/audio/narration.m4a`. Without it, the piece runs silently on its own clock with captions.

## Render

```bash
npx vite -c commission-of-two/vite.config.js --port 5180 &
cd commission-of-two && PORT=5180 node ../scripts/render.mjs renders/out.mp4 --w 540 --fps 30
```

`node commission-of-two/shots.mjs <dir> 12 40.5 99` saves still frames for checking.

## Files

| Piece | File |
|---|---|
| Playback, render hooks, cut glitch | `src/main.js` |
| Post pass: tilt-shift, grey grade that keeps red, halftone, grain | `src/post.js` |
| Clay pawns (instanced), auditorium, label chips, counters, silhouette cards | `src/kit.js` |
| Clay shots: hall, seat counts, succession, formations, carpet, round table | `src/scenes/clay.js` |
| Document shots, org chart, CMC roster, term boxes | `src/scenes/docs.js` |
| Shot list (cut times) | `src/timeline.js` |
| Word timings (YouTube auto-captions, corrected against the video description) | `src/words.json` |

Names, dates, and quotes in the labels follow the reference video. Seat counts are illustrative.
