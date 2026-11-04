import * as THREE from 'three';
import topo from 'us-atlas/nation-albers-10m.json';
import { feature } from 'topojson-client';
import { geoAlbersUsa, geoInterpolate } from 'd3-geo';
import { rng } from './util.js';
import { P } from './palette.js';

const proj = geoAlbersUsa().scale(1300).translate([487.5, 305]);
export const S = 0.012;                       // albers px -> world units
export const toW = (x, y) => [(x - 487.5) * S, (y - 305) * S];
export const ll = (lon, lat) => proj([lon, lat]);
// the (fictional) location the method converges on
export const TARGET_LL = [-96.92, 38.47];
export const TARGET = ll(...TARGET_LL);

export const CITIES = [
  [-74.0, 40.7, 10], [-118.2, 34.05, 9], [-87.63, 41.88, 8], [-95.37, 29.76, 7], [-112.07, 33.45, 6], [-75.16, 39.95, 6], [-98.49, 29.42, 5],
  [-117.16, 32.72, 5], [-96.8, 32.78, 7], [-122.42, 37.77, 7], [-97.74, 30.27, 5], [-81.66, 30.33, 4], [-82.99, 39.96, 4], [-80.84, 35.23, 5],
  [-122.33, 47.61, 6], [-104.99, 39.74, 6], [-77.04, 38.9, 7], [-71.06, 42.36, 7], [-86.78, 36.16, 5], [-83.05, 42.33, 5], [-122.68, 45.52, 5],
  [-115.14, 36.17, 5], [-90.05, 35.15, 4], [-84.39, 33.75, 7], [-94.58, 39.1, 5], [-80.19, 25.76, 7], [-93.27, 44.98, 5], [-90.2, 38.63, 5],
  [-82.46, 27.95, 5], [-81.38, 28.54, 5], [-111.89, 40.76, 4], [-97.52, 35.47, 4], [-97.34, 37.69, 3], [-95.99, 36.15, 3], [-106.65, 35.08, 3],
  [-110.97, 32.22, 3], [-119.79, 36.74, 3], [-121.49, 38.58, 4], [-89.4, 43.07, 3], [-85.76, 38.25, 4], [-86.16, 39.77, 4], [-79.99, 40.44, 4],
  [-78.64, 35.78, 4], [-76.61, 39.29, 4], [-73.76, 42.65, 3], [-96.7, 40.81, 3], [-100.78, 46.81, 2], [-108.5, 45.78, 2], [-116.2, 43.62, 3],
  [-92.29, 34.75, 3], [-91.15, 30.45, 3], [-90.07, 29.95, 4], [-88.04, 30.69, 3], [-86.8, 33.52, 4], [-84.29, 30.44, 3], [-77.44, 37.54, 4],
  [-101.85, 33.58, 2], [-106.49, 31.76, 3], [-103.23, 44.08, 2], [-98.0, 38.2, 2], [-99.73, 32.45, 2], [-117.43, 47.66, 3], [-96.73, 43.55, 2],
];

let cache = null;
function pip(x, y, ring) {
  let ins = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
export function usData() {
  if (cache) return cache;
  const f = feature(topo, topo.objects.nation);
  const geom = f.features ? f.features[0].geometry : f.geometry;
  let best = null, bestA = 0;
  for (const poly of geom.coordinates) {
    const r = poly[0]; let a = 0;
    for (let i = 0; i < r.length; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length]; a += x1 * y2 - x2 * y1; }
    if (Math.abs(a) > bestA) { bestA = Math.abs(a); best = poly; }
  }
  const ring = best[0];
  const inside = (x, y) => pip(x, y, ring) && !best.slice(1).some((h) => pip(x, y, h));
  // airports: cities + random small fields
  const r = rng(42);
  const airports = CITIES.map(([lo, la, w]) => { const p = ll(lo, la); return p ? { x: p[0], y: p[1], w, big: true } : null; }).filter(Boolean);
  while (airports.length < 260) {
    const x = 30 + r() * 920, y = 20 + r() * 570;
    if (inside(x, y)) airports.push({ x, y, w: 1, big: false });
  }
  airports.push({ x: TARGET[0] + 9, y: TARGET[1] - 6, w: 1, big: false, near: true });
  // dot grid
  const dots = []; const step = 5.4;
  for (let y = 10; y < 600; y += step) for (let x = 10; x < 965; x += step) {
    const jx = x + (Math.floor(y / step) % 2) * step * 0.5;
    if (inside(jx, y)) dots.push({ x: jx, y });
  }
  // classify dots: near a prop-active airport => "heard both planes"
  const hubs = airports.filter((a, i) => a.near || r() < 0.55);
  for (const d of dots) {
    let s = 0;
    for (const a of hubs) { const dd = Math.hypot(a.x - d.x, a.y - d.y); const R = 11 + a.w * 2.2; if (dd < R) s = Math.max(s, 1 - dd / R); }
    d.n = r();
    d.yes = s > 0.12 + d.n * 0.25;
    d.tgt = Math.hypot(d.x - TARGET[0], d.y - TARGET[1]);
    d.keep = d.yes && (d.tgt < 3 || r() < 0.21);
    d.score = Math.max(0, 1 - d.tgt / 260) * 0.6 + d.n * 0.4;
  }
  // nearest dot to target is THE spot
  let ti = 0; dots.forEach((d, i) => { if (d.tgt < dots[ti].tgt) ti = i; });
  dots[ti].yes = dots[ti].keep = true; dots[ti].isTarget = true;
  // flight tracks
  const tracks = [];
  const big = airports.filter((a) => a.big);
  const interp = (a, b) => geoInterpolate(proj.invert([a.x, a.y]), proj.invert([b.x, b.y]));
  for (let i = 0; i < 520; i++) {
    const a = big[Math.floor(r() * big.length)], b = big[Math.floor(r() * big.length)];
    if (a === b) continue;
    const it = interp(a, b); const pts = [];
    for (let k = 0; k <= 32; k++) { const p = proj(it(k / 32)); if (p) pts.push(p); }
    const len = Math.hypot(a.x - b.x, a.y - b.y);
    const t0 = r() * 21, dur = 0.6 + len / 180;
    tracks.push({ pts, t0, t1: t0 + dur, kind: 0 });
  }
  for (let i = 0; i < 1500; i++) {
    const a = airports[Math.floor(Math.pow(r(), 0.8) * airports.length)];
    const pts = []; let x = a.x, y = a.y, h = r() * 6.28; const R = 6 + r() * 26; const n = 20 + Math.floor(r() * 20);
    const loop = r() < 0.6;
    for (let k = 0; k <= n; k++) {
      if (loop) { const ang = h + k / n * Math.PI * 2; x = a.x + Math.cos(ang) * R * Math.sin(k / n * Math.PI) + (r() - .5); y = a.y + Math.sin(ang) * R * Math.sin(k / n * Math.PI) + (r() - .5); }
      else { h += (r() - 0.5) * 0.5; x += Math.cos(h) * R / n * 3; y += Math.sin(h) * R / n * 3; }
      pts.push([x, y]);
    }
    const t0 = r() * 23, dur = 0.3 + r() * 1.4;
    tracks.push({ pts, t0, t1: t0 + dur, kind: 1 });
  }
  cache = { ring, inside, airports, dots, tracks, targetIndex: ti };
  return cache;
}

/** value-noise in JS for land relief */
function makeNoise(seed) {
  const r = rng(seed); const N = 256; const perm = new Float32Array(N * N); for (let i = 0; i < N * N; i++) perm[i] = r();
  const v = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    const g = (a, b) => perm[((a & 255) * N) + (b & 255)];
    return (g(xi, yi) * (1 - u) + g(xi + 1, yi) * u) * (1 - w) + (g(xi, yi + 1) * (1 - u) + g(xi + 1, yi + 1) * u) * w; };
  return (x, y) => { let s = 0, a = 0.5, f = 1; for (let o = 0; o < 5; o++) { s += a * v(x * f, y * f); f *= 2.03; a *= 0.5; } return s; };
}

let landTex = null, shadowTex = null;
const TW = 2048, TH = 1280, TS = TW / 975;   // texture px per albers px
function ringPath(ring, g, s = TS, ox = 0, oy = 0) { g.beginPath(); ring.forEach(([x, y], i) => (i ? g.lineTo(x * s + ox, y * s + oy) : g.moveTo(x * s + ox, y * s + oy))); g.closePath(); }
function landTextures() {
  if (landTex) return [landTex, shadowTex];
  const { ring } = usData();
  const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH; const g = cv.getContext('2d');
  const img = g.createImageData(TW, TH); const nz = makeNoise(7), nz2 = makeNoise(11);
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    const ax = x / TS, ay = y / TS;
    const west = Math.max(0, 1 - Math.max(0, ax - 120) / 300);       // rockies/west relief
    const app = Math.exp(-Math.pow((ax - 790) / 50, 2)) * Math.exp(-Math.pow((ay - 260) / 120, 2)) * 0.6; // appalachians
    const ridged = 1 - Math.abs(nz(ax / 28, ay / 28) * 2 - 1);
    const relief = Math.pow(ridged, 3) * (0.25 + west * 0.95 + app);
    const base = nz2(ax / 60, ay / 60);
    let v = 236 - relief * 70 - base * 18 + (Math.random() - 0.5) * 6;
    const i = (y * TW + x) * 4; img.data[i] = v; img.data[i + 1] = v - 3; img.data[i + 2] = v - 10; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.globalCompositeOperation = 'destination-in'; ringPath(ring, g); g.fill();
  g.globalCompositeOperation = 'source-over'; ringPath(ring, g); g.strokeStyle = 'rgba(40,36,30,0.75)'; g.lineWidth = 2.2; g.stroke();
  landTex = new THREE.CanvasTexture(cv); landTex.colorSpace = THREE.SRGBColorSpace; landTex.anisotropy = 8;
  const sv = document.createElement('canvas'); sv.width = TW / 2; sv.height = TH / 2; const sg = sv.getContext('2d');
  sg.filter = 'blur(10px)'; ringPath(ring, sg, TS / 2, 6, 10); sg.fillStyle = 'rgba(40,30,20,0.32)'; sg.fill();
  shadowTex = new THREE.CanvasTexture(sv); shadowTex.colorSpace = THREE.SRGBColorSpace;
  return [landTex, shadowTex];
}

const trackVert = `attribute float aT; attribute float aKind; varying float vT; varying float vK; void main(){ vT=aT; vK=aKind; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const trackFrag = `uniform float uClock, uJet, uProp, uAll; uniform vec3 uColor, uHot; varying float vT; varying float vK;
void main(){ if (vT > uClock) discard; float a = mix(uJet, uProp, vK) * uAll; float hot = 1.0 - smoothstep(0.0, 0.5, uClock - vT);
  gl_FragColor = vec4(mix(uColor, uHot, hot*0.0), a * (0.32 + hot*0.4));
#include <colorspace_fragment>
}`;

const ptVert = `attribute float aPing; attribute float aSize; attribute float aRed; varying float vPing; varying float vRed; uniform float uScale;
void main(){ vPing=aPing; vRed=aRed; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = aSize * uScale; }`;
const ptFrag = `varying float vPing; varying float vRed; uniform vec3 uInk, uRed; uniform float uAlpha, uPingA;
void main(){ vec2 q = gl_PointCoord*2.0-1.0; float r = length(q); if (r>1.0) discard;
  float core = 1.0 - smoothstep(0.13, 0.19, r);
  float ring = (1.0 - smoothstep(0.035, 0.07, abs(r - (0.2 + vPing*0.78)))) * (1.0 - vPing) * uPingA;
  vec3 c = mix(uInk, uRed, vRed);
  float a = max(core, ring*0.8) * uAlpha; if (a < 0.01) discard;
  gl_FragColor = vec4(c, a);
#include <colorspace_fragment>
}`;

/** builds the paper US map into a group (lying in XZ, centered at origin) */
export function buildUSMap({ dotsVisible = true } = {}) {
  const D = usData();
  const group = new THREE.Group();
  const [lt, st] = landTextures();
  const w = TW / TS * S, h = TH / TS * S;
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: st, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(w / 2 - 487.5 * S, -0.02, h / 2 - 305 * S); group.add(shadow);
  const land = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: lt, transparent: true, depthWrite: false }));
  land.rotation.x = -Math.PI / 2; land.position.set(w / 2 - 487.5 * S, 0, h / 2 - 305 * S); group.add(land);
  shadow.renderOrder = 0; land.renderOrder = 1;

  // dots
  const dg = new THREE.CircleGeometry(1, 14); dg.rotateX(-Math.PI / 2);
  const dm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false });
  const dots = new THREE.InstancedMesh(dg, dm, D.dots.length);
  dots.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(D.dots.length * 3), 3);
  dots.renderOrder = 3; dots.frustumCulled = false; dots.visible = dotsVisible;
  group.add(dots);
  const _m = new THREE.Matrix4(), _c = new THREE.Color();
  const dotApi = {
    mesh: dots, data: D.dots,
    set(i, scale, color) {
      const d = D.dots[i]; const [x, z] = toW(d.x, d.y);
      _m.makeScale(scale, 1, scale).setPosition(x, 0.012, z); dots.setMatrixAt(i, _m);
      dots.setColorAt(i, _c.set(color));
    },
    commit() { dots.instanceMatrix.needsUpdate = true; dots.instanceColor.needsUpdate = true; },
  };

  // tracks
  const pos = [], aT = [], aK = [];
  for (const tr of D.tracks) {
    const n = tr.pts.length;
    for (let k = 1; k < n; k++) {
      const [x0, z0] = toW(...tr.pts[k - 1]), [x1, z1] = toW(...tr.pts[k]);
      pos.push(x0, 0.006, z0, x1, 0.006, z1);
      const ta = tr.t0 + (tr.t1 - tr.t0) * (k - 1) / (n - 1), tb = tr.t0 + (tr.t1 - tr.t0) * k / (n - 1);
      aT.push(ta, tb); aK.push(tr.kind, tr.kind);
    }
  }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  tg.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 1));
  tg.setAttribute('aKind', new THREE.Float32BufferAttribute(aK, 1));
  const tm = new THREE.ShaderMaterial({ vertexShader: trackVert, fragmentShader: trackFrag, transparent: true, depthWrite: false,
    uniforms: { uClock: { value: 0 }, uJet: { value: 1 }, uProp: { value: 1 }, uAll: { value: 1 }, uColor: { value: new THREE.Color('#1d1a17') }, uHot: { value: new THREE.Color(P.red) } } });
  const tracks = new THREE.LineSegments(tg, tm); tracks.renderOrder = 2; tracks.frustumCulled = false; group.add(tracks);

  // live planes (points with ping rings)
  const NP = D.tracks.length;
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
  pg.setAttribute('aPing', new THREE.BufferAttribute(new Float32Array(NP), 1));
  pg.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(NP), 1));
  pg.setAttribute('aRed', new THREE.BufferAttribute(new Float32Array(NP), 1));
  const pm = new THREE.ShaderMaterial({ vertexShader: ptVert, fragmentShader: ptFrag, transparent: true, depthWrite: false,
    uniforms: { uInk: { value: new THREE.Color('#1d1a17') }, uRed: { value: new THREE.Color(P.red) }, uAlpha: { value: 1 }, uPingA: { value: 1 }, uScale: { value: 1 } } });
  const planes = new THREE.Points(pg, pm); planes.renderOrder = 4; planes.frustumCulled = false; group.add(planes);
  /** place planes at "virtual hour" h; pingT drives the once-per-second ping */
  function setPlanes(hour, pingT, { jets = 1, props = 1, size = 34 } = {}) {
    const p = pg.attributes.position.array, ap = pg.attributes.aPing.array, as = pg.attributes.aSize.array, ar = pg.attributes.aRed.array;
    D.tracks.forEach((tr, i) => {
      // cycle the day so there are always planes airborne
      let lt = ((hour - tr.t0) % 24 + 24) % 24; const dur = tr.t1 - tr.t0;
      const vis = lt < dur ? (tr.kind ? props : jets) : 0;
      const k = Math.min(1, lt / dur) * (tr.pts.length - 1); const j = Math.min(tr.pts.length - 2, Math.floor(k)); const f = k - j;
      const a = tr.pts[j], b = tr.pts[j + 1];
      const [x, z] = toW(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
      p[i * 3] = x; p[i * 3 + 1] = 0.02; p[i * 3 + 2] = z;
      ap[i] = ((pingT + (i * 0.618) % 1) % 1);
      as[i] = vis > 0 ? size * vis : 0;
      ar[i] = 0;
    });
    pg.attributes.position.needsUpdate = pg.attributes.aPing.needsUpdate = pg.attributes.aSize.needsUpdate = pg.attributes.aRed.needsUpdate = true;
  }
  return { group, land, shadow, dots: dotApi, tracks, trackMat: tm, planes, planeMat: pm, setPlanes, data: D };
}
