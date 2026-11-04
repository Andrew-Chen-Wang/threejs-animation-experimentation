# Explaining it properly: design rationale

The first version copied the reference reel's *look*, and with it the reel's weakness. It was
beautiful, but a first-time viewer couldn't follow the argument. This redesign keeps the narration
and the paper/grey/red look, but every scene was rethought around one question: *what must the
viewer understand at this moment, and what's the clearest picture of it?*

## What was wrong (and in the original reel)

| Problem | Example |
|---|---|
| **Encodings are never taught.** | The spectrogram arrives as a wall of noise. Nobody says that up = higher note and right = later. |
| **Nothing links the cause to its effect.** | The plane flies past and a curve is drawn, but the viewer has to work out which point of the curve belongs to which moment. |
| **Comparisons are sequential, not side by side.** | "Faster = bigger drop" was shown by replaying the pass and asking the viewer to remember the previous curve. |
| **The search is abstract.** | "Ask every spot" was a sweep of dots changing colour. Nobody sees what one spot is actually asked. |
| **No sense of progress.** | Each scene stood alone. The viewer never knew how many clues had been gathered or how close the search was to an answer. |
| **Red meant everything.** | Plane lines, highlights, counters and the answer were all red, so red meant nothing. |
| **Decoration hid data.** | The CCTV tree line covered the bottom of the spectrogram, which is exactly where the low notes are. |
| **The physics was hand-waved.** | Why can't you hide the plane by cutting the low notes? (Because it leaves faint higher copies, harmonics, which carry the same curve.) |

## Principles applied

Sources are listed at the end. The principles:

1. **Teach the encoding concretely, before the real data.** (Sanderson: *concrete before abstract*.)
   The spectrogram first shows sounds everybody knows: a bird chirp high up, wind and traffic at the
   bottom. Only then does the faint plane appear. Spectrogram guides use the same trick, a whistled
   tune whose line follows the melody.
2. **Signaling.** (Mayer.) Mark where to look *before* it changes. A red bracket on the pitch axis
   marks "ZOOM IN" on the low notes before the zoom. A red ellipse marks the plane line. A "NOW"
   cursor marks the current moment on the chart.
3. **Temporal contiguity.** (Mayer.) Each visual beat is keyed to the spoken word from the Whisper
   timestamps: the ellipse draws on "There.", the drop bracket appears on "bigger", the ✗ lands on
   "gone".
4. **Linked representations.** (Bret Victor.) Two views of the same thing are visibly tied together:
   - the plane above and the pitch chart below share a moving "NOW" dot;
   - the biggest bend in the curve is circled, and so is the turn in the flight that caused it;
   - each plane keeps its colour in every view (spectrogram, map paths, charts, case file).
5. **Small multiples / "compared to what?"** (Tufte.) Speed and distance are each shown as two
   side-by-side panels with identical axes that differ in **one** variable. Each panel includes the
   other curve as a grey ghost, and a bracket names the difference: SMALL DROP / BIG DROP,
   GENTLE / SHARP. The final match has a score bar for first place *and* second place, so "wasn't
   close" is something you can see.
6. **Segmenting plus a persistent overview.** (Mayer.) The story is split into chapters: The Case,
   1 The Clue, 2 Reading the Line, 3 The Search, 4 The Proof, 5 A Harder Test, Found. A **case
   file** strip stays at the bottom of the frame. It shows the chapter, the newest clues, the
   evidence timeline (plane 1, the 920-second silent gap, plane 2, with speed and distance read
   off), and a running count of possible locations: 765,000,000 → 70,000 → 15,000 → 1. The viewer
   always knows where they are in the argument.
7. **A worked example before the generalisation.** "Ask every spot" now zooms in on three real spots
   with their hearing range:
   - **A** hears plane 1 ✓ and plane 2 ✓.
   - **B** hears plane 1 ✓ but misses plane 2 ✗.
   - **C**, in the silence chapter, would have heard a third plane during the gap, so it's ✗.

   Only then does the national sweep run.
8. **Colour has a job.** Slate blue is plane 1, ochre is plane 2, grey is anything else, and **red
   only means "look here / the answer"**. The surviving candidate spots are ink, not red, so the red
   of the final spot means something.
9. **Answer first, then the question.** The hook pins the clip to the exact spot ("FOUND"), then
   pulls back to the whole country ("WHERE?"), then states the only known fact (the date). The
   viewer knows the destination before the journey starts.
10. **Make the scale concrete.** The 100 m square contains a football pitch. The square count
    animates from 1 to 765 million as the camera zooms out to the whole country.
11. **Remove what competes.** The trees sink out of the way when the sky becomes a spectrogram.
    Grid dots fade and shrink in the close-up views so the worked example stands out.
12. **Correct physics, explained.**
    - The curve encodes three things: drop size → speed, steepness → closest distance, and the
      midpoint → when the plane passed. The third comes from the technical replication, not the
      reel.
    - The delay scene measures how late the sound is (~2 s) and how far the plane moved (~100 m).
    - Low-cut and phone filtering are shown removing the main line while the higher copies
      (harmonics) survive, which is the real reason those tricks fail.

## Chapter map

| Time | Chapter | One idea per beat |
|---|---|---|
| 0–9 | Hook | A quiet feed (nothing to see or hear) → the clip pinned to an exact spot → FOUND |
| 9–17 | The Case | Could be anywhere (765 M squares) · all we have is the date · dive to the pole |
| 17–36 | 1 The Clue | Waveform shows nothing → spectrogram taught with bird/wind → zoom band → plane 1 (blue) → +920 s → plane 2 (ochre) → the shape traced |
| 36–53 | 2 Reading the Line | Linked view (now dot, squeezed/stretched, true-pitch baseline) → speed small multiples → distance small multiples → one curve, three readings |
| 53–92 | 3 The Search | ADS-B pings → day replay → jets out → worked example A/B → 70,000 → silence card → worked example C → 15,000 |
| 92–121 | 4 The Proof | The bend linked to the turn → spots A/B/C small multiples → the sound-delay trap, measured → predicted lines over heard lines → score bars |
| 121–130 | 5 A Harder Test | One minute, one faint plane, known time → the national rescan finds the same spot |
| 130–144 | Found | One football-pitch-sized square of 765 M → Street View tree match → the camera |
| 144–159 | Can you hide it? | Low-cut leaves harmonics → MP3 buries them → gain recovers them · a voice on top · the phone band |
| 159–179 | Credit & outro | colsto · 5,000 lines · not released · plane overhead → globe → end card |

## Sources

- R. E. Mayer, multimedia learning principles (signaling, segmenting, temporal contiguity):
  [Mayer 2020 summary (PDF)](https://ugc.futurelearn.com/uploads/files/7d/d6/7dd6188d-c343-4311-b064-ac98d2c95abc/Multimedia_Principles._R._E._Mayer__2020.pdf),
  [Lucidea overview](https://lucidea.com/blog/mayers-12-principles-of-multimedia-learning)
- Grant Sanderson (3Blue1Brown), "concrete before abstract": [3Blue1Brown FAQ](https://www.3blue1brown.com/faq/)
- Bret Victor, explorable explanations and the ladder of abstraction:
  [Explorable explanation (Wikipedia)](https://en.wikipedia.org/wiki/Bret_Victor)
- Edward Tufte, small multiples and "compared to what?": [Small multiple (Wikipedia)](https://en.wikipedia.org/wiki/Small_multiple)
- Reading spectrograms with familiar sounds: [How to read a spectrogram](https://scienceinsights.org/how-to-read-a-spectrogram-axes-scales-patterns/)
- What the method actually measures (speed, closest distance, closest-approach time, silence filter,
  harmonics surviving phone-band filtering): [cbonitz/doppler-experiments](https://github.com/cbonitz/doppler-experiments)
