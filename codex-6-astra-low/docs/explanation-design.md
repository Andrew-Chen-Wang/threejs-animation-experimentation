# Explain the inference, one step at a time

## The problem with version 1

Version 1 associated pictures with narration but left the reasoning implicit. The Doppler graph was not computed from the aircraft motion. The listener was not an obvious reference point. Candidate dots disappeared without a visible rejection rule. Two curves were described as matching without identifying observation versus prediction. Spectrogram texture suggested measurement while the overlaid curves were illustrations. Extra headings, scenery, captions and numbers competed for attention.

## What a viewer should be able to explain afterward

1. A recording contains pitch changing over time, even when a person cannot pick out the plane by ear.
2. A moving source emits successive waves from different places. Their arrival spacing at one listener changes the heard pitch.
3. Public flight tracks allow a predicted sound trace to be computed for a proposed microphone location.
4. A candidate must explain both flybys, their time separation, and the quiet interval. A predicted extra flyby rejects it.
5. Of the survivors, the detailed observed/predicted curves identify the best match. Sound travel time must be included.
6. The audio search yields a small area; visual landmarks then identify the camera pole.

## Visual grammar

- Terracotta solid line: the recording / observed sound.
- Blue dashed line: a prediction made from aircraft tracks and a proposed location.
- Lettered circles: candidate microphone locations, carried across consecutive scenes.
- Grey with an X: rejected; show the mismatching evidence before removal.
- One horizontal axis always means time. One vertical axis always means pitch.
- The same plane 1 and plane 2 event markers persist from the first recording to the candidate comparisons.
- Fixed camera during a comparison. Motion changes one explanatory variable at a time.
- Label illustrative examples as such. No fabricated numerical fit scores or recovered flight data.

## Revised storyboard

| Time | Question | Visual demonstration |
|---|---|---|
| 0–18 s | How could a recording identify a place? | Camera → recorded trace → several candidate places; explicitly establish that the microphone's location is unknown. |
| 18–34 s | What can be measured in sound? | Explain spectrogram axes, isolate the low band, then carry two event markers onto a recording timeline separated by 920 s. |
| 34–42 s | Why does pitch fall as a plane passes? | A fixed listener, aircraft and expanding wavefronts; a pitch trace calculated from the same motion and travel time. |
| 42–54 s | What do speed and distance change? | Hold distance fixed to compare slow/fast; hold speed fixed to compare far/near. Label the changed feature on each graph. |
| 54–67 s | Where do predictions come from? | A track with timed position samples; move the aircraft between samples; select propeller aircraft before testing locations. |
| 67–80 s | Why do many locations still fit? | Three lettered candidate microphones; predicted plane 1/plane 2 event times compared with the same recorded timeline. Reveal a time-spacing mismatch before rejecting a candidate. |
| 80–92 s | How can silence be evidence? | Keep the same timelines. Candidate P predicts an extra event in the empty recorded interval; mark that event, then cross out P. Explain why Q survives. |
| 92–104 s | Why do nearby locations hear different curves? | One tracked aircraft and multiple listeners. Different distances and directions generate visibly different predictions. |
| 104–113 s | Why must travel time be included? | Freeze a sound's emission point, expand that pulse to the microphone, and show the aircraft's separate current position. Label emission and arrival separately. |
| 113–130 s | What counts as a match? | Solid observation and dashed prediction, labelled directly. Both plane 1 and plane 2 must match at the same candidate. Then an independent short recording tests the selected place again. |
| 130–143 s | Is the result the exact pole? | Zoom to a 100 m search cell, then compare schematic road/tree/pole landmarks. Distinguish the audio result from visual confirmation. |
| 143–159 s | Why can processing leave the clue? | Show before/after traces on identical axes. Lower amplitude/added speech can obscure a pattern while leaving it measurable; label these schematic examples, not actual filtering experiments. |
| 159–179 s | What should remain in memory? | Credit the investigation and recap: recording → predictions → comparisons → place. |

## Research informing these choices

- Cynthia Brame, *Effective Educational Videos* (2016): signaling, segmenting, removing extraneous material, and using narration and visuals for complementary information. https://doi.org/10.1187/CBE.16-03-0125
- Nielsen Norman Group, *Animation for Attention and Comprehension*: use motion for relationships and continuity; unrelated motion competes with the task. https://www.nngroup.com/articles/animation-usability/
- OpenStax, *University Physics*, 17.7: waves from a moving source and the observed frequency. https://openstax.org/books/university-physics-volume-1/pages/17-7-the-doppler-effect

These support the design decisions; they do not establish that viewers understand this particular film. That requires a viewer comprehension check using the six questions above.

## Physics and evidence boundaries

The demonstration uses a constant-speed subsonic point source in a uniform stationary medium. Arrival time is emission time plus distance divided by sound speed. Heard frequency is computed from radial velocity at emission. The model is explanatory and does not implement aircraft localization. Flight-track candidates and search counts illustrate the narration; they are not outputs of our own search. Quantitative claims remain attributed to the original narration. Illustrations of the camera's surroundings are not the real security-camera site.

The later shape comparison introduces another survivor, S; previously rejected R does not re-enter the search.

## Review outcome

The user reported that the revised visuals were more explanatory and worked in tandem with the narration. See [animation-findings.md](animation-findings.md) for the lessons, concrete examples and workflow to reuse. This is qualitative user feedback; a formal comprehension study has not been performed.

## Motion revision

After the clarity improvement, the user identified long static holds as a remaining weakness. Each explanatory beat now has a sustained action as well as a visual conclusion. Readheads and drawing traces make comparisons active; the search travels across the map; the chosen area grows into a cell; 3D inspection and wave propagation continue through their shots. Headings and comparison axes remain readable anchors. See the follow-up section in [animation-findings.md](animation-findings.md) for the diagnosis and motion-review method.
