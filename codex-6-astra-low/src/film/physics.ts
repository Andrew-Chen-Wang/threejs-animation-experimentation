/** Point-source demonstration in a stationary, homogeneous medium. SI units. */
export const SOUND_SPEED = 343;
export const SOURCE_PITCH = 180;
export function arrivalTime(emission: number, speed = 60, distance = 400) {
  return emission + Math.hypot(speed * emission, distance) / SOUND_SPEED;
}
export function emissionTime(arrival: number, speed = 60, distance = 400) {
  let lo = arrival - 200,
    hi = arrival;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (arrivalTime(mid, speed, distance) < arrival) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
export function heardPitch(arrival: number, speed = 60, distance = 400) {
  const emission = emissionTime(arrival, speed, distance);
  const x = speed * emission;
  const radial = (speed * x) / Math.hypot(x, distance);
  return (SOURCE_PITCH * SOUND_SPEED) / (SOUND_SPEED + radial);
}
