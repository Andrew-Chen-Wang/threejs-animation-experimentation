# Findings: make the visuals explain the narration

## User feedback

On 2026-11-04, after reviewing the redesign, the user said the visuals were much more explanatory and worked in tandem with what the narration was saying. Treat this as the preferred direction for future animation work in this project.

This is positive qualitative feedback on the revised explanation. It is not a measured comprehension study or approval of every visual detail.

## Main finding

Design each scene around the reasoning in the spoken sentence. Identify what the viewer must notice, show the relevant change as it is described, and make the consequence visible before moving on.

In the first version, scenes often illustrated the topic while leaving the inference to the viewer. A plane appeared beside a curve; dots disappeared from a map; two curves were declared a match. The revised version showed the relationships that made those statements meaningful.

## What worked in this film

| Narration or idea | Visual treatment | What the viewer can see |
|---|---|---|
| Approaching sound is higher; receding sound is lower | One moving aircraft, a fixed microphone, expanding wavefronts, and a pitch graph driven by the same model | Aircraft motion changes wave arrival spacing, which changes heard pitch. |
| Faster flight makes a bigger drop | Compare slow and fast while holding distance fixed | The changed variable and its effect are visible together. |
| A closer pass makes a sharper drop | Compare near and far while holding speed fixed | The viewer can isolate the effect of distance. |
| Two planes pass 920 seconds apart | Reuse the same two event markers on the recorded and predicted timelines | A candidate can be rejected because its gap is wrong. |
| Silence is a clue | Show the empty recorded interval beside a candidate's predicted third flyby, highlight the contradiction, then reject the candidate | The reason for elimination appears before the result. |
| Sound takes time to travel | Keep the emission point fixed while the pulse expands and the aircraft moves onward | The source's earlier position and its current position are different. |
| One location matches both planes | Overlay labelled recorded and predicted traces for both events at the same candidate location | What is being compared, and what constitutes a match, are explicit. |
| The audio finds a small area; imagery identifies the camera | Show the search cell first, then the landmark check | The two sources of evidence answer different questions. |

These are design explanations for the improvement. The user's feedback supports the overall direction; it does not establish the separate contribution of each technique.

## Principles to carry forward

1. **Storyboard the inference.** For every sentence, write: what is known, what changes, and what the viewer should conclude.
2. **Synchronize meaning, not just timing.** The relevant object or relationship should change when the narration describes it. For example, reveal an extra predicted flyby during the explanation of silence, then cross out the candidate during its rejection.
3. **Show the reason before the result.** Give the viewer a visible contradiction or match before removing a candidate or announcing a winner.
4. **Keep identities stable.** Reuse the same candidates, event markers, axes, colors and line styles across related scenes. A rejected candidate must not silently return later.
5. **Change one variable per comparison.** Keep the camera, graph scale and other conditions stable so the effect is attributable to the intended cause.
6. **Make linked visuals actually agree.** If a vehicle, wave and chart describe the same event, derive them from shared state or a shared model. Independent decorative animation can contradict the explanation.
7. **Put labels beside their referents.** Identify the listener, the emission point, the observed trace and the prediction where they appear. Use words and line styles as well as color.
8. **Give attention a clear target.** Reduce scenery and competing motion during explanations. Keep captions in a quiet region and let the main visual demonstrate the relationship described in speech.
9. **Use 3D where space matters.** Aircraft motion, listener position and propagation benefit from spatial animation. Timelines and curve comparisons benefit from stable, readable diagrams.
10. **Keep evidence honest.** Label schematic examples and exaggerated motion. Do not imply that a drawn fit, simulated spectrogram or invented landscape is a recovered result.

## Workflow for the next film

### Before building

- Extract timed narration and identify its causal claims.
- Write one viewer question for each beat.
- Sketch the initial state, the visible change, and the concluding state.
- Decide which objects must persist between beats.
- Choose a consistent visual language for observations, predictions and rejected alternatives.
- Allocate time to notice the evidence before revealing the conclusion.

### While building

- Connect related animations to shared state.
- Align the important changes with the spoken clauses, not merely the chapter boundaries.
- Inspect intermediate moments. A good still at the middle of a scene can hide a confusing transition.
- Check that every label, arrow and movement serves the current explanation.

### During review

Watch with the narration and ask:

- Does the visual demonstrate the exact claim currently being spoken?
- Can I point to the cause and its consequence?
- Is it clear which object, time, place or trace each label refers to?
- Can I explain why a candidate was rejected before the film says so?
- Does any motion, scenery or text pull attention away from that reasoning?
- Are the diagrams readable at phone size?

Also review selected scenes muted: the relationships should remain visible, even when narration is needed for full context. This is a diagnostic, not a requirement that the entire film work without sound.

## Evidence from this revision

- The user reported that the redesigned visuals were more explanatory and worked with the narration.
- The acoustic model passed checks for arrival-time inversion, pitch direction, and speed/distance effects.
- Thirty-six narrative beats were sampled for visual review and text overflow.
- Playback, pause, chapter seeking and mobile layout were checked.
- The exported film retained the original audio stream exactly.

Technical checks establish implementation behavior. The user's review supplies the qualitative evidence that the explanatory direction improved. Further audience testing can use the questions in [explanation-design.md](explanation-design.md).

## Related material

- [Design critique, storyboard and research sources](explanation-design.md)
- [Film files, implementation and rebuild instructions](../README.md)

The research sources were consulted during the redesign. They support the general design principles; they do not independently validate this film.

## Follow-up: explanation also needs sustained motion

The user subsequently identified a weakness in version 2: the original kept models, graphs and other visuals moving, whereas our explanatory scenes often stopped after a reveal or highlight. The positive feedback on clarity did not mean the pacing and motion were finished.

### Diagnosis

A reveal is a moment, not a sustained action. Several scenes reached their final diagram early and then held it while the narration continued. Reading the storyboard or reviewing a single still did not expose that problem. A frame comparison of version 2 found almost no central-content movement in 186 of 357 sampled half-second intervals. The check excludes the caption/footer area and counts an interval as nearly static when fewer than 0.1% of sampled pixels change by more than 12 RGB levels. This is a diagnostic of movement, not a measure of attention or comprehension.

### Revised motion principles

- Give each shot an action that lasts through its explanatory beat: travel, propagate, trace, compare, scan, narrow or inspect.
- Animate the content during the sentence, beyond its entrance. A graph can develop; a search can advance across locations; a map can expand into the chosen cell.
- Keep one main focus of movement. Continuous motion does not require every object and label to move at once.
- Preserve reading anchors: headings, axes, identities and comparison geometry should stay stable when their stability explains the relationship.
- Keep time related visuals synchronized. Recorded and predicted timelines use the same readhead; plots retain the same data while being progressively read.
- Avoid making a wrong prediction deform into a correct one merely to create motion. That could imply that the evidence was adjusted to fit.
- A brief hold can let a conclusion register. A long, unintended hold needs a deliberate decision or a new action.

### Implemented motion pass

- Pitch traces develop across the scene with a travelling readhead and a faint complete contour for context.
- Recorded and predicted event timelines replay together, preserving the position of each event.
- The schematic spectrogram texture advances while the low trace is drawn.
- The candidate search sweeps geographically; candidate markers resolve as it reaches them.
- The national map continuously enlarges into the selected grid cell.
- Aircraft tracks, sound pulses and the landmark-inspection camera keep moving through their shots.
- The closing four-step recap carries a moving trace through the process.

Review consecutive frames and timed playback in addition to stills. Recheck the meaning of the motion: a lower static-frame count alone does not establish a better explanation or better retention.

### Final motion-pass validation

The final v3 export had 5 nearly static samples out of 357 under the same central-content check, compared with 186 in v2. The remaining low-change samples were at 133.0 s and 168.0–169.5 s; small movements can fall below the threshold. Physics checks, TypeScript, production build, sampled text bounds and arbitrary-seek determinism passed. The full 178.833-second export decoded successfully, and its encoded audio matched the original stream exactly. These are implementation and movement checks; the user has not yet reviewed this motion pass.

## Follow-up: preserve the 3D pencil-drawn visual identity

The user then pointed out that the clearer, more active diagrams had displaced too much of the reference's 3D pencil-drawing style. Improving clarity and movement did not authorize abandoning that visual identity.

The revised direction combines all three requirements: an explanatory scene, sustained motion, and a coherent pencil-drawn 3D world. Spatial content stays spatial: aircraft, sound propagation, listening locations, terrain, and camera inspection. Comparisons remain readable in compact paper insets. The insets accompany the scene rather than replacing it for most of the film.

The fourth version adds surface-attached directional hatching, graphite-like contours, paper grain, a more detailed rural setting, a raised geographic map, physical candidate markers, and moving cameras. Surface hatching moves with the modeled object, avoiding an unrelated animated texture over the entire image. Transparent sound waves are excluded from the solid-object outline pass so the effect does not obscure the scene.

The lesson is to evaluate clarity, motion and visual identity together. A revision that improves one dimension can regress another. The user's approval of explanatory improvements was specific to that improvement; the requested style remained part of the brief.
