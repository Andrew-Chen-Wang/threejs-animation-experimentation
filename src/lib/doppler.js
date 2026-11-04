import * as THREE from 'three';
const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _v = new THREE.Vector3(), _r = new THREE.Vector3();
/**
 * Heard pitch over time for a source moving along path(te) -> Vector3 (writes into out),
 * listener L, sound speed c, emitted frequency f0. Returns [{tr, f, te}] sorted by receive time.
 */
export function heardCurve(path, L, c, f0, te0, te1, n = 240) {
  const out = []; const h = 1e-3;
  for (let i = 0; i <= n; i++) {
    const te = te0 + (te1 - te0) * i / n;
    path(te, _p); path(te + h, _q); _v.subVectors(_q, _p).divideScalar(h);
    _r.subVectors(_p, L); const d = _r.length();
    const vr = _v.dot(_r) / d;              // >0 when moving away
    out.push({ te, tr: te + d / c, f: f0 * c / (c + vr), d });
  }
  return out;
}
/** emission time whose sound reaches L at time tr (fixed-point) */
export function emitTimeFor(path, L, c, tr) {
  let te = tr;
  for (let i = 0; i < 30; i++) { path(te, _p); te = tr - _p.distanceTo(L) / c; }
  return te;
}
