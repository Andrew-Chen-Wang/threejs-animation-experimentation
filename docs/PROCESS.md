# How "The Sound That Finds You" was made

This covers how I built the animation, the bugs I hit while iterating, and what I'd do the same way
next time. The aim was a piece of the same quality as
[the reference reel](https://www.instagram.com/reel/DfSsHlYtpNc/), not a frame-by-frame copy of it.

## 1. The brief, reframed

Past attempts failed because an agent tried to match every detail of someone else's video. That's a
losing game. The reel has hundreds of small decisions and no source to check against. So I kept two
things from the reference and replaced everything else:

- **Kept:** the narration (the script and its exact timing) and the *visual grammar*: cream paper,
  grey illustration, one red accent, bold serif captions with one red key word, small all-caps
  monospace HUD labels, and continuous camera motion.
- **Replaced:** every scene. Each sentence of the script got its own staging. Where the original
  used a race car and a tractor to explain Doppler, this one shows top-down wavefronts and a live
  pitch chart computed from physics.

Once the goal was "same grammar, new sentences", there was no reference frame left to fall short of.
Each scene only had to make its one point clearly.

## 2. Extraction pipeline

| Step | Tool | Output |
|---|---|---|
| Download | `yt-dlp <url>` | 1080×1920, 60 fps, 178.8 s MP4 plus metadata (caption, credits) |
| Style study | `ffmpeg -vf fps=1/3,scale=360:-1` then `tile=10x3` | Two contact sheets of 60 frames, plus a few full-resolution stills |
| Transcript | `faster-whisper` `small.en`, `word_timestamps=True` | `data/transcript.json` with a start time for every word |
| Audio | `ffmpeg -vn -c:a aac` | `public/audio/narration.m4a` (git-ignored) |

A **contact sheet** puts 30 frames in one image. It was the best tool for reading the style quickly:
palette, type placement, how often the shot changes, and where the captions sit (about 66–70% down
the frame).

**Word timestamps are the backbone.** Every animation beat in the code is keyed to an absolute
narration time read from that file, e.g. `sr(t, 26.3, 26.9)` draws the ellipse as "There." is spoken.

## 3. Architecture

```
main.js       renderer, scene timeline, transitions, playback / render mode
timeline.js   [{name, start, end, build, trans}] for 20 scenes
captions.js   caption chunks with *red* words, time-driven fade and blur-in
lib/          shared builders: objects, spectro, doppler, usmap, feed, desk, chart, post
scenes/*.js   one file per beat; build() returns {scene, camera, update(t), caption}
```

These decisions made iteration fast:

1. **Every scene is a pure function of absolute time.** `update(t)` takes the narration clock
   (seconds), never a delta. Scrubbing, seeking, `?t=95`, and frame-accurate offline rendering all
   come free. Nothing accumulates state, so there are no "jump to 120 s and it's broken" bugs.
2. **Small easing vocabulary.** `ramp(t,a,b)` gives 0→1, `sr(t,a,b,ease)` is the eased version, and
   `window01` fades in and out. Most choreography is one line, like
   `pin.scale = ease.back(ramp(t, 5.6, 6.3))`.
3. **WebGL for the world, DOM for the type.** 3D, shaders and spectrograms go in WebGL. Captions,
   HUD labels, counters, chart cards and stamps go in DOM/SVG on a fixed 1080×1920 frame that's
   CSS-scaled to the window. Text stays crisp at any size, and labels follow 3D objects through a
   `project(worldPos, camera)` helper.
4. **One post pass makes everything paper.** Every scene renders to an MSAA HalfFloat target. A
   final shader adds static paper fibres, per-frame grain and a soft vignette, and handles
   transitions: an fbm "ink-bleed" dissolve, or a vertical paper slide. This pass ties 20 different
   scenes together.
5. **Fixed layout budget in frame pixels.** Black HUD band 0–230, sky 230–760, tree line to 1126
   (horizon), chart cards around 905–1235, captions around 1340–1430 (up to about 1545 for three
   lines), and the case file at 1608–1808. Scenes are composed against this budget so captions
   never collide with content.
6. **Shared builders over bespoke scenes.** `buildFeed()` (CCTV view), `buildUSMap()`,
   `buildDesk()`, `plane()`, `tree(seed)`, `pole()` and `spectroPanel()` are reused across scenes.
   The same seeded tree line appears in the CCTV feed, the street view and the outro, which is what
   makes "the same trees" read as true.

## 4. Techniques worth reusing

- **Illustrated look without textures:** Lambert materials in warm greys, plus an inverted-hull
  outline: a back-face mesh pushed out along its normals, with thickness as a uniform. Add soft
  PCF shadows and distance fog that fades to the paper colour.
- **Procedural spectrogram (`lib/spectro.js`):** one fragment shader maps uv to (time, frequency).
  - **Noise:** screen-space noise bins, with low-frequency "wind gusts" that make vertical bands.
  - **Doppler lines:** `f(t) = fc − df·tanh((t−tc)/w)` plus harmonics at 2× and 3×.
  - **Voice:** formant-shaped harmonic stacks.
  - **Red predicted lines:** anti-aliased with `|g| / length(dFdx g, dFdy g)` so they stay a
    constant pixel width at any zoom.
  - **Effects:** low-cut, MP3 block quantisation and gain are uniforms, so the "how do you hide it"
    beat is just animating them.
- **Real Doppler (`lib/doppler.js`):** heard pitch is `f₀·c/(c+v_r)` at receive time `te + d/c`.
  The same function drives the wavefront rings, the live chart, the "where it was / where it is"
  ghost plane (fixed-point solve for the emission time) and the "no delay" wrong prediction.
- **US map from real data:** `us-atlas` Albers topojson. The relief texture is drawn on a canvas
  (ridged noise weighted toward the Rockies and Appalachians). About 9k grid dots are one
  `InstancedMesh` with per-instance colour. ADS-B tracks are one `LineSegments` whose
  time-of-day attribute is revealed by a `uClock` uniform, so the 24-hour replay is a single
  uniform tween.
- **765 million squares:** one shader with multi-scale grid lines (100 m, 1 km, 10 km, 100 km),
  each faded by its on-screen spacing. The camera zooms exponentially over 0.42 → 5200 km, with
  near/far rescaled every frame, and the real US map fades in near the top of the zoom.
- **Typed captions:** `*word*` marks the red word, each word blurs in with a 35 ms stagger, and
  the text sits on a paper-coloured halo made of stacked `text-shadow`s so it reads over anything.

## 5. Iteration log

### Round 1: building it

I checked each round with **screenshot contact sheets**: headless Chromium, `?render` mode, 12–50
timestamps tiled into one image. One sheet covers the whole piece in a single look. That loop was
the main reason the result came together.

| Symptom | Cause | Fix |
|---|---|---|
| Whisper crashed (`metadata_errors`) | faster-whisper / PyAV version mismatch | Decode with `soundfile` and pass a numpy array |
| Map shaders failed to compile | `#include <colorspace_fragment>` on the same line as code | Chunk includes need their own line |
| Every outlined mesh invalid | The outline shader used `objectNormal`, which MeshBasic doesn't define | Use the `normal` attribute |
| Risk of dozens of shader programs | The outline thickness was baked into the program cache key | Make thickness a uniform with a constant cache key |
| Spectrogram went **black** after "+920 s" | `tanh(469)` overflows to `inf/inf = NaN` in GLSL | Clamp the tanh argument to ±9. Mirror shader maths carefully. |
| Trees filled the whole CCTV sky | Trees too tall and too close for a fov-50 portrait camera | Shorter trees, farther back; derive the horizon pixel from camera pitch |
| Spectrogram looked blown out | Noise energy too high relative to the lines | `uNoise` 1.0 → 0.5; the faint plane is then actually faint |
| Plane missing in the Doppler, shape and outro scenes | **Portrait frames are narrow**: horizontal FOV is only about 17–28° | Cameras follow the plane, look targets moved, paths shortened |
| Doppler chart curve went vertical | v/c = 0.8 gives a 4.7× pitch ratio | Keep v/c ≤ 0.4; c = 20, v = 5 / 8.5 |
| Listener hidden under the chart card | Look target placed scene content inside the card's band | Recompose against the layout budget |
| Pole blocked the street view | Pole sat between the camera and the trees | Move the pole behind the start position; turn around to reveal it |
| `<circle r=-28>` console errors | JS `%` of a negative number stays negative | `((x % 1) + 1) % 1` |
| "Multiple instances of Three.js" | `three/examples/jsm/...` import pulled a second copy under Vite | Replace RoundedBoxGeometry with an extruded rounded-rect `Shape` |
| Canvas-drawn cards risked fallback fonts | Scenes were built before web fonts finished loading | `document.fonts.load(...)` for each face, then build the scenes |
| Offline render died at frame 3570 | I edited `index.html` mid-render; Vite hot-reloaded the page | Never touch watched files during a render, or render from `vite build && vite preview` |

### Round 2: redesigning for clarity

The first version looked right but didn't explain well. The design reasoning is in
[DESIGN.md](DESIGN.md); these are the implementation problems that redesign ran into.

| Symptom | Cause | Fix |
|---|---|---|
| Linked chart drew no curve | `heardCurve()` returns receive times relative to closest approach; I compared them to absolute narration time | Keep one time base per curve, and convert at the boundary (`d.tr + RUN.tca <= t`) |
| Worked example on the map unreadable | The "zoom" went to a height of 13, which still showed half the country | Camera keyframes `[time, height, focus]`, interpolated in log-height; 3.2 for a single spot, 9 for airfields, 46 for the country |
| Background dots drowned the example | Grid dots have a fixed world size, so close-ups turn them into large blobs | Shrink and fade dots by camera closeness |
| Case-file chips overflowed the card | Each new clue added a chip; seven didn't fit | Show only the three newest clues and let the evidence strip carry the rest |
| Bird chirp didn't read as a bird | A 0.1 s chirp is a few pixels wide in a 28 s window | Make reading-guide examples big enough to see at thumbnail size (w 0.45 s, 900 Hz sweep) |
| Page threw `cut.setAttribute is not a function` | A new SVG element was named `cut`, the same as an existing local inside `update()` | Name overlays by role (`cutPoly`), not by the concept they show |
| Screenshot run failed to navigate | The dev server died between turns | Start Vite as a long-running background task and probe it before shooting |
| Contact sheets out of order | Zero-padded names sorted `102` before `11.0` | `scripts/sheet.sh` sorts numerically by timestamp |

### Round 3: publishing as an artifact

| Symptom | Cause | Fix |
|---|---|---|
| Built page couldn't find its JS | Vite's default absolute `/assets/...` paths | `base: './'` and fixed `app.js` / `index.css` names in `vite.config.js` |
| Audio wouldn't publish | Artifacts don't serve `.m4a` (they do serve `.mp3`, `.wav`, `.ogg`, `.mp4`, `.webm`) | Convert to MP3; the page probes `.m4a`, then `.mp3`, then `.wav` |
| Audio never found once hosted | The probe used `/audio/...`, an absolute path | Relative `audio/narration.*` works in dev, in `vite preview` and in the artifact |
| Visitors without the file heard nothing | No way to supply audio in the browser | A "Load narration" file picker plays a local file through an object URL |

`scripts/build-artifact.mjs` packages `dist/` the way the artifact needs it (see the README).

## 6. Learnings

### Making it
1. **Don't replicate; re-stage.** Copy the grammar (palette, type, caption rhythm, HUD vocabulary)
   and write your own sentences. The detail an agent misses in a copy is the detail you'd notice.
   An original scene can't be "missing" anything.
2. **Narration timing is the spec.** Word timestamps turn "make it feel synced" into concrete
   numbers. Each visual beat lands on a named word ("There.", "gone.", "MP3").
3. **Make time the only input.** A deterministic `update(t)` is what makes everything else work:
   scrubbing, screenshots at arbitrary times, offline rendering, and debugging any moment without
   playing up to it.
4. **Look at the whole thing at once.** A 50-frame contact sheet catches framing, layout and
   continuity problems that you'd never spot one frame at a time. Two or three rounds of sheets fixed
   more than any amount of reading code.
5. **Portrait is its own medium.** Most 3D instincts assume landscape. Put action along the
   vertical axis, keep subjects near the centre line, and budget vertical bands for HUD, scene,
   chart, captions and the case file.
6. **Real models make better motion than hand-keyed curves.** Physics-driven wavefronts and pitch
   curves look right without tuning, and every scene that uses them agrees with every other.
7. **Shared builders give you continuity for free.** Using the same seeded trees, map and plane
   everywhere makes the story feel like one world.

### Explaining it (round 2)
8. **Style and clarity are separate jobs.** Round 1 matched the reference's look and inherited its
   confusion. Make a separate pass that only asks, beat by beat: *what must the viewer understand
   now, and what is the clearest picture of it?*
9. **Teach every encoding before using it.** Show a familiar case first (bird high, wind low) before
   the unfamiliar data (a faint plane line).
10. **Link views explicitly.** Two pictures of one thing need a visible tie: a shared "NOW" cursor,
    the same colour, or a circle on the cause and on the effect.
11. **Compare side by side, changing one variable.** Two panels with the same axes beat "remember
    the last curve". Ghost the other case into each panel and name the difference with a bracket.
12. **Show one concrete case before the general sweep.** Spot A passes, B fails, C fails for the
    silence. Only then animate 9,000 dots.
13. **Give the viewer a map of the argument.** A persistent case file (chapter, clues, evidence,
    candidates left) answers "where are we and what's left" at every moment.
14. **Colour needs roles, not just restraint.** Round 1's rule ("red always means look here") still
    produced confusion, because red was used for planes, counters *and* the answer. Give each
    actor its own hue (plane 1 blue, plane 2 ochre) and reserve red for the answer.
15. **Remove decoration that hides data.** The trees were lovely, and they covered the low notes.
16. **Get the physics right; it makes the explanation simpler.** Harmonics explain why low-cut and
    phone filtering fail in one image. Hand-waving needs more words and still doesn't convince.

### Shipping it
17. **Design for the host you'll publish on.** Use relative paths, served file types, and a
    file-picker fallback for media you can't or won't bundle.
18. **Never edit watched files while a render runs.** Render from a built bundle instead.

## 7. Known gaps and next steps

- Real-time playback hasn't been watched end to end on a GPU, only checked through screenshots and
  the round-1 540p offline render. Performance on low-end laptops is unknown.
- There is no MP4 of the redesigned version yet (`node scripts/render.mjs`).
- The spectrograms are procedural, not computed from the actual audio. A real STFT texture of the
  narration would make the "Talk over it?" scene literal.
- The map scenes update about 9k instance matrices on the CPU every frame. Moving the dot states
  into a shader (per-instance attributes plus time uniforms) would be cheaper.
- The shape scene rebuilds its trail `TubeGeometry` every frame. A `Line2` or shader trail would
  scale better.
- Case-file text is sized for a 1080-wide frame. On a phone it's legible but small.
- The location, coordinates, scores and tail numbers are illustrative. The worked-example spots and
  flight paths are hand-placed for teaching, not taken from real ADS-B data.

For a step-by-step recipe to make the next piece in this style, see [PLAYBOOK.md](PLAYBOOK.md).
