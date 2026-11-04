# Playbook: the next explainer in this style

A repeatable recipe for working with a coding agent, distilled from building this piece. The aim is
the same *style and quality* on a new subject, not a copy of anyone's video.

## 0. Inputs
- A narration: your own voice-over, or a reference you're studying privately.
- One or two reference videos for the look.

## 1. Extract (about 10 minutes)
```bash
yt-dlp -o "ref.%(ext)s" <url>
ffmpeg -i ref.mp4 -vf "fps=1/3,scale=360:-1,tile=10x3" sheet_%02d.jpg    # style contact sheets
ffmpeg -i ref.mp4 -ac 1 -ar 16000 audio.wav
```
Transcribe with `faster-whisper` (`word_timestamps=True`; pass a numpy array from `soundfile`).
Save the result as `data/transcript.json`.

## 2. Write the style sheet (keep the grammar, drop the scenes)
From the contact sheets, write down only *rules*:
- **Palette, as roles:** paper, ink, greys, one colour per recurring actor, and one accent reserved
  for "the answer". (In this piece: plane 1 blue, plane 2 ochre, red = answer.)
- **Type:** a bold serif for captions with one accent word per chunk, plus all-caps mono for HUD
  labels.
- **Frame budget** for 9:16, in pixels: HUD, scene, chart, captions, and a persistent overview strip.
- **Motion:** continuous camera drift, an ink-bleed dissolve between scenes, paper grain on top.

## 3. Write the explanation script *before* any code
For every caption chunk, fill in one row:

| Time | Narration | What must the viewer understand? | Clearest picture | Signal (what draws the eye) |
|---|---|---|---|---|

Check each row against these rules:
- **New encoding?** Teach it with a familiar case first.
- **Two views of one thing?** Link them: a shared cursor, the same colour, or a circle on the cause
  and the effect.
- **A comparison?** Use side-by-side panels with the same axes, changing one variable at a time.
- **A general rule?** Show one worked example first.
- **Long argument?** Use chapters, plus a persistent overview (clues so far, what's left).
- **Does any decoration hide data?** Remove it during that beat.

## 4. Build on the skeleton in this repo
- `src/main.js` (timeline, transitions, post pass), `src/captions.js` and `src/lib/*` are
  reusable as-is.
- One file per scene: `build({hud})` returns `{scene, camera, update(t), caption}`. `t` is
  absolute narration time; never use deltas.
- Choreograph with `ramp` / `sr` / `ease` against word timestamps.
- Put type and charts in DOM/SVG on the 1080×1920 frame; put the world in WebGL. Use `project()`
  to tie labels to 3D objects.
- Drive motion with real models (physics, real geography) wherever possible.

## 5. Review loop (the part that matters most)
```bash
npx vite --port 5173 &                              # keep it running in the background
node scripts/shots.mjs shots 2.5 6.5 11 ... 178     # 15–50 timestamps
scripts/sheet.sh shots sheet.jpg 8 240              # one image of the whole piece
```
On every sheet, check:
- Is the subject in frame? (Portrait cameras lose things sideways.)
- Do captions, cards and the overview strip collide?
- Can you tell what each beat is saying **with the sound off**?
- Is the accent colour only on the answer?

Fix, then re-shoot only the timestamps you touched. Then do one full sweep for regressions.

## 6. Ship
- **Live page:** `npm run artifact` (build plus packaging), then publish
  `out/artifact/` (`index.html` plus `app.js`, and `audio/narration.mp3` for private use).
- **Video:** `node scripts/render.mjs out/final.mp4 --w 1080 --fps 60` (add `GPU=1` if you have
  one). Don't edit the project while it renders.

## Pitfalls already paid for
See the iteration log in [PROCESS.md](PROCESS.md#5-iteration-log). The ones most likely to bite
again:
- `tanh` NaN in GLSL.
- `#include` lines must stand alone.
- Mixing relative and absolute time bases.
- Portrait framing.
- Fixed-size dots in close-ups.
- Absolute asset paths on static hosts.
- `.m4a` isn't served by artifacts.
