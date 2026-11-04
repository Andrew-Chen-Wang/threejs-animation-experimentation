// Timing helpers. Everything is driven by absolute narration time t (seconds), never by deltas,
// so any frame can be rendered on its own (scrubbing, offline render).
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ramp = (t, a, b) => clamp((t - a) / (b - a));
export const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeInOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const backOut = (x) => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const sr = (t, a, b) => ease(ramp(t, a, b));
export const lerp = (a, b, k) => a + (b - a) * k;

export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}

// Appear / disappear an object. The object's resting transform is captured the first time.
// kinds: drop (falls in from above with a little paper wobble), pop (scales up), rise (from below),
// left / right (slides in), fade (scale only, used for flat labels).
export function show(obj, t, tin, tout = Infinity, kind = 'drop', dur = 0.5) {
  const u = obj.userData;
  if (!u.base) u.base = { p: obj.position.clone(), r: obj.rotation.z, s: obj.scale.clone() };
  const b = u.base;
  const pin = ramp(t, tin, tin + dur), pout = tout === Infinity ? 0 : ramp(t, tout, tout + 0.3);
  obj.visible = pin > 0 && pout < 1;
  if (!obj.visible) return 0;
  obj.position.copy(b.p); obj.rotation.z = b.r; obj.scale.copy(b.s);
  const k = backOut(pin), e = easeOut(pin);
  if (kind === 'drop') { obj.position.y += (1 - e) * 1.6; obj.rotation.z += Math.sin(pin * 9) * 0.06 * (1 - pin); }
  else if (kind === 'pop') obj.scale.multiplyScalar(Math.max(0.001, k));
  else if (kind === 'rise') obj.position.y -= (1 - e) * 1.8;
  else if (kind === 'left') obj.position.x -= (1 - e) * 3.5;
  else if (kind === 'right') obj.position.x += (1 - e) * 3.5;
  else if (kind === 'fade') obj.scale.multiplyScalar(Math.max(0.001, e));
  if (pout > 0) { const o = easeInOut(pout); obj.position.y += o * 0.9; obj.scale.multiplyScalar(Math.max(0.001, 1 - o)); }
  return pin * (1 - pout);
}
