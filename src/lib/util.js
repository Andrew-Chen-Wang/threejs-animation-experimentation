import * as THREE from 'three';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ramp = (t, a, b) => clamp((t - a) / (b - a));
export const ease = {
  linear: (x) => x,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  expoOut: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  expoInOut: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
  back: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
};
/** eased 0..1 between times a and b */
export const sr = (t, a, b, fn = ease.inOut) => fn(ramp(t, a, b));
/** fade in over [a,a+d], fade out over [b-d,b] */
export const window01 = (t, a, b, d = 0.3) => Math.min(ramp(t, a, a + d), 1 - ramp(t, b - d, b));

export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash1 = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function el(tag, cls, parent, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
export function css(e, styles) { Object.assign(e.style, styles); return e; }
export function place(e, x, y, ax = 0, ay = 0, extra = '') {
  e.style.left = '0px'; e.style.top = '0px';
  e.style.transform = `translate(${x}px, ${y}px) translate(${-ax * 100}%, ${-ay * 100}%) ${extra}`;
}

export const FW = 1080, FH = 1920;
const _v = new THREE.Vector3();
/** project a world position to frame pixels (1080x1920) */
export function project(pos, camera) {
  _v.copy(pos).project(camera);
  return { x: (_v.x * 0.5 + 0.5) * FW, y: (-_v.y * 0.5 + 0.5) * FH, z: _v.z };
}

export const fmt = (n) => Math.round(n).toLocaleString('en-US');

/** svg helper */
export function svgEl(tag, attrs = {}, parent) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
export function pathD(pts) {
  let d = '';
  for (let i = 0; i < pts.length; i++) d += (i ? 'L' : 'M') + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1);
  return d;
}
/** partial polyline (0..1 of its length) */
export function partial(pts, f) {
  if (f >= 1) return pts;
  if (f <= 0 || pts.length < 2) return pts.slice(0, 1);
  let total = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); total += l; }
  let target = total * f; const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (target >= seg[i - 1]) { out.push(pts[i]); target -= seg[i - 1]; }
    else { const k = target / seg[i - 1]; out.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]); break; }
  }
  return out;
}
