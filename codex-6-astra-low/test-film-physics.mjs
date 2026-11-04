import assert from "node:assert/strict";
import {
  arrivalTime,
  emissionTime,
  heardPitch,
  SOUND_SPEED,
  SOURCE_PITCH,
} from "./src/film/physics.ts";
for (const v of [0, 30, 60, 85])
  for (const d of [180, 400, 950])
    for (const e of [-20, -2, 0, 2, 20]) {
      const a = arrivalTime(e, v, d);
      assert.ok(a >= e);
      assert.ok(Math.abs(emissionTime(a, v, d) - e) < 1e-8);
    }
assert.ok(heardPitch(-15) > SOURCE_PITCH);
assert.ok(heardPitch(20) < SOURCE_PITCH);
assert.ok(Math.abs(heardPitch(400 / SOUND_SPEED) - SOURCE_PITCH) < 1e-8);
assert.ok(
  heardPitch(-20, 85) - heardPitch(20, 85) >
    heardPitch(-20, 30) - heardPitch(20, 30),
);
const slope = (d) =>
  (heardPitch(d / SOUND_SPEED + 0.01, 60, d) -
    heardPitch(d / SOUND_SPEED - 0.01, 60, d)) /
  0.02;
assert.ok(Math.abs(slope(180)) > Math.abs(slope(950)));
console.log(
  "Physics checks passed: arrival inversion, pitch direction, closest approach, speed effect, distance effect.",
);
