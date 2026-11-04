import * as THREE from 'three';
import { P, C } from './palette.js';
import { rng } from './util.js';

const matCache = new Map();
export function lam(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color: new THREE.Color(color), ...extra }));
  return matCache.get(key);
}
export function basic(color, extra = {}) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(color), ...extra }); }

/** inverted-hull ink outline */
const outlineMats = new Map();
export function outlineMat(thick = 0.02, color = P.ink, opacity = 1) {
  const key = `${thick}|${color}|${opacity}`;
  if (outlineMats.has(key)) return outlineMats.get(key);
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), side: THREE.BackSide, transparent: opacity < 1, opacity });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uThick = { value: thick };
    sh.vertexShader = 'uniform float uThick;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n transformed += normalize(normal) * uThick;`);
  };
  m.customProgramCacheKey = () => 'ink-outline';
  outlineMats.set(key, m);
  return m;
}
export function outlined(mesh, thick = 0.02, color = P.ink) {
  const o = new THREE.Mesh(mesh.geometry, outlineMat(thick, color));
  o.castShadow = false; o.receiveShadow = false;
  mesh.add(o);
  return mesh;
}
export function mesh(geo, mat, { shadow = true, outline = 0, outlineColor } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadow; m.receiveShadow = shadow;
  if (outline) outlined(m, outline, outlineColor);
  return m;
}

export function addLights(scene, { shadow = true, size = 30, intensity = 1, dir = [-6, 14, 8], target = [0, 0, 0], mapSize = 2048 } = {}) {
  const hemi = new THREE.HemisphereLight(0xffffff, new THREE.Color(P.paper2), 2.1 * intensity);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff6ea, 1.5 * intensity);
  sun.position.set(...dir).add(new THREE.Vector3(...target));
  sun.target.position.set(...target);
  scene.add(sun, sun.target);
  if (shadow) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(mapSize, mapSize);
    const c = sun.shadow.camera; c.left = -size; c.right = size; c.top = size; c.bottom = -size; c.near = 0.5; c.far = 200;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  }
  return { hemi, sun };
}

/** canvas texture of ploughed paper field */
export function fieldTexture({ rows = 48, tufts = 220, base = P.paper, line = 'rgba(120,108,90,0.13)', seed = 3, size = 1024 } = {}) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d'); const r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  g.strokeStyle = line; g.lineWidth = 2;
  for (let i = 0; i < rows; i++) { const y = (i + 0.5) * size / rows; g.beginPath(); g.moveTo(0, y); g.lineTo(size, y); g.stroke(); }
  g.strokeStyle = 'rgba(80,72,60,0.35)'; g.lineWidth = 2.2;
  for (let i = 0; i < tufts; i++) {
    const x = r() * size, y = Math.floor(r() * rows) * size / rows + size / rows * 0.5;
    for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + k * 5 + (r() - .5) * 3, y - 9 - r() * 6); g.stroke(); }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}
export function ground(size = 400, { repeat = 30, tex } = {}) {
  const t = tex || fieldTexture();
  t.repeat.set(repeat, repeat);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshLambertMaterial({ map: t }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true;
  return m;
}

const sphereGeo = new THREE.IcosahedronGeometry(1, 3);
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 10);

/** illustrated broad-leaf tree */
export function tree(seed = 1, { h = 3.2, tone = 0 } = {}) {
  const r = rng(seed * 9973 + 7);
  const g = new THREE.Group();
  const trunkH = h * (0.45 + r() * 0.1);
  const trunk = mesh(cylGeo, lam('#6b655b'));
  trunk.scale.set(0.09 * h / 3, trunkH, 0.09 * h / 3); trunk.position.y = trunkH / 2;
  g.add(trunk);
  const greys = ['#a7a196', '#9b958a', '#b1ab9f', '#928c81'];
  const n = 4 + Math.floor(r() * 4);
  const W = h * (0.32 + r() * 0.18);
  for (let i = 0; i < n; i++) {
    const s = W * (0.5 + r() * 0.45);
    const b = mesh(sphereGeo, lam(greys[(i + tone) % greys.length]), { outline: 0.03, outlineColor: '#4a453d' });
    b.scale.setScalar(s);
    const a = r() * Math.PI * 2, rr = (r() * 0.8) * W * 0.8;
    b.position.set(Math.cos(a) * rr, trunkH + W * 0.35 + r() * W * 0.7, Math.sin(a) * rr * 0.6);
    g.add(b);
  }
  return g;
}

/** fluffy paper cloud */
export function cloud(seed = 1, w = 6) {
  const r = rng(seed * 31 + 5); const g = new THREE.Group();
  const n = 5 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const s = w * (0.16 + r() * 0.16);
    const b = mesh(sphereGeo, lam('#f7f4ee'), { shadow: false });
    b.scale.set(s, s * 0.8, s * 0.6);
    b.position.set((i / (n - 1) - 0.5) * w * 0.8 + (r() - 0.5) * 0.4, (1 - Math.abs(i / (n - 1) - 0.5) * 2) * s * 0.5 + r() * 0.3, (r() - .5) * 0.6);
    g.add(b);
  }
  const base = mesh(new THREE.BoxGeometry(w * 0.85, 0.08, 1.2), lam('#e6e1d6'), { shadow: false });
  base.position.y = -w * 0.08; g.add(base);
  return g;
}

/** small high-wing propeller plane, nose toward +x */
export function plane({ body = '#f3efe7', accent = P.red, scale = 1 } = {}) {
  const g = new THREE.Group();
  const prof = [[0, -1.9], [0.05, -1.85], [0.1, -1.4], [0.18, -0.6], [0.26, 0.1], [0.28, 0.6], [0.25, 0.95], [0.16, 1.12], [0.0, 1.16]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const fg = new THREE.LatheGeometry(prof, 20); fg.rotateZ(-Math.PI / 2);
  const fus = mesh(fg, lam(body), { outline: 0.025 }); fus.scale.set(1, 1.15, 1); g.add(fus);
  const stripe = mesh(new THREE.BoxGeometry(2.2, 0.05, 0.57), lam(accent), { shadow: false });
  stripe.position.set(-0.3, -0.02, 0); g.add(stripe);
  const win = mesh(new THREE.BoxGeometry(0.55, 0.16, 0.58), lam('#4a4640'), { shadow: false });
  win.position.set(0.45, 0.17, 0); g.add(win);
  const wing = mesh(new THREE.BoxGeometry(0.62, 0.06, 4.4), lam(body), { outline: 0.02 }); wing.position.set(0.3, 0.36, 0); g.add(wing);
  const tipL = mesh(new THREE.BoxGeometry(0.62, 0.065, 0.25), lam(accent), { shadow: false }); tipL.position.set(0.3, 0.36, 2.1); g.add(tipL);
  const tipR = tipL.clone(); tipR.position.z = -2.1; g.add(tipR);
  const hs = mesh(new THREE.BoxGeometry(0.4, 0.04, 1.5), lam(body), { outline: 0.02 }); hs.position.set(-1.7, 0.06, 0); g.add(hs);
  const vs = mesh(new THREE.BoxGeometry(0.5, 0.6, 0.04), lam(body), { outline: 0.02 }); vs.position.set(-1.72, 0.36, 0); vs.rotation.z = -0.25; g.add(vs);
  const strutGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 5);
  for (const s of [-1, 1]) { const st = mesh(strutGeo, lam('#6e685d')); st.position.set(0.25, 0.05, s * 0.6); st.rotation.x = s * 0.95; g.add(st); }
  const wheelGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.07, 12); wheelGeo.rotateX(Math.PI / 2);
  for (const [x, z] of [[0.2, 0.42], [0.2, -0.42], [1.0, 0]]) { const w = mesh(wheelGeo, lam('#3a3631')); w.position.set(x, -0.45, z); g.add(w); }
  const prop = new THREE.Group(); prop.position.set(1.2, 0, 0);
  const spinner = mesh(new THREE.ConeGeometry(0.1, 0.2, 12), lam(accent)); spinner.rotation.z = -Math.PI / 2; spinner.position.x = 0.05; prop.add(spinner);
  const blades = new THREE.Group();
  const bg = new THREE.BoxGeometry(0.03, 1.1, 0.08);
  for (const a of [0, Math.PI]) { const b = mesh(bg, lam('#3a3631')); b.position.y = 0; b.rotation.x = a; blades.add(b); }
  prop.add(blades);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.62, 32), new THREE.MeshBasicMaterial({ color: 0x5a554c, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
  disc.rotation.y = Math.PI / 2; prop.add(disc);
  g.add(prop);
  g.userData.blades = blades;
  g.userData.spin = (t) => { blades.rotation.x = t * 60; };
  g.scale.setScalar(scale);
  return g;
}

/** simple illustrated standing person, facing +z */
export function person({ coat = '#5b564e', trousers = '#2f2c28', skin = '#e9d9c4', hat = false } = {}) {
  const g = new THREE.Group();
  const legGeo = new THREE.CapsuleGeometry(0.09, 0.7, 4, 8);
  for (const s of [-1, 1]) { const l = mesh(legGeo, lam(trousers), { outline: 0.012 }); l.position.set(s * 0.11, 0.45, 0); g.add(l); }
  const body = mesh(new THREE.CapsuleGeometry(0.21, 0.55, 6, 12), lam(coat), { outline: 0.014 }); body.position.y = 1.15; body.scale.z = 0.75; g.add(body);
  const armGeo = new THREE.CapsuleGeometry(0.065, 0.55, 4, 8);
  for (const s of [-1, 1]) { const a = mesh(armGeo, lam(coat), { outline: 0.012 }); a.position.set(s * 0.27, 1.12, 0); a.rotation.z = s * 0.08; g.add(a); }
  const head = mesh(new THREE.SphereGeometry(0.15, 16, 12), lam(skin), { outline: 0.012 }); head.position.y = 1.67; g.add(head);
  const hair = mesh(new THREE.SphereGeometry(0.155, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), lam('#2d2a26')); hair.position.y = 1.69; hair.rotation.x = -0.25; g.add(hair);
  return g;
}

/** wooden utility pole with a security camera */
export function pole({ height = 9 } = {}) {
  const g = new THREE.Group();
  const wood = lam('#8a8174');
  const p = mesh(new THREE.CylinderGeometry(0.13, 0.17, height, 14), wood, { outline: 0.015 }); p.position.y = height / 2; g.add(p);
  // texture-ish rings
  for (let i = 0; i < 6; i++) { const r = mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.02, 14), lam('#6f675b'), { shadow: false }); r.position.y = 1 + i * 1.3; g.add(r); }
  const arm = mesh(new THREE.BoxGeometry(2.2, 0.14, 0.14), wood, { outline: 0.012 }); arm.position.y = height - 0.6; g.add(arm);
  for (const x of [-0.9, 0.9, -0.35]) { const ins = mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.22, 8), lam('#d8d2c5'), { outline: 0.008 }); ins.position.set(x, height - 0.42, 0); g.add(ins); }
  const box = mesh(new THREE.BoxGeometry(0.34, 0.5, 0.2), lam('#9a948a'), { outline: 0.012 }); box.position.set(0, 2.6, 0.22); g.add(box);
  // camera on bracket
  const cam = new THREE.Group(); cam.position.set(0, height - 2.0, 0.18);
  const br = mesh(new THREE.BoxGeometry(0.08, 0.08, 0.5), lam('#4b4740')); br.position.z = 0.2; cam.add(br);
  const housing = new THREE.Group(); housing.position.set(0, -0.05, 0.5); housing.rotation.x = 0.25;
  const hb = mesh(new THREE.BoxGeometry(0.34, 0.3, 0.8), lam('#ece7dd'), { outline: 0.015 }); hb.position.z = 0.25; housing.add(hb);
  const hood = mesh(new THREE.BoxGeometry(0.42, 0.04, 0.95), lam('#d9d3c7'), { outline: 0.01 }); hood.position.set(0, 0.18, 0.3); housing.add(hood);
  const lens = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 20), lam('#1f1d1a')); lens.rotation.x = Math.PI / 2; lens.position.z = 0.66; housing.add(lens);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.08, 20), new THREE.MeshBasicMaterial({ color: 0x3b4a55 })); glass.position.z = 0.695; housing.add(glass);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff3b22') })); led.position.set(0.12, -0.08, 0.66); housing.add(led);
  cam.add(housing); g.add(cam);
  g.userData.camera = housing; g.userData.led = led; g.userData.top = height;
  return g;
}

/** catenary wire as a thin tube */
export function wire(a, b, sag = 0.6, r = 0.018, color = '#3a3631') {
  const pts = [];
  for (let i = 0; i <= 24; i++) { const k = i / 24; const p = new THREE.Vector3().lerpVectors(a, b, k); p.y -= Math.sin(k * Math.PI) * sag; pts.push(p); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, r, 5), lam(color));
  m.castShadow = true; return m;
}

/** red map pin */
export function pin(scale = 1) {
  const g = new THREE.Group();
  const head = mesh(new THREE.SphereGeometry(0.35, 24, 16), lam(P.red), { outline: 0.02 }); head.position.y = 1.15; g.add(head);
  const dot = mesh(new THREE.SphereGeometry(0.12, 12, 8), lam('#f6efe4'), { shadow: false }); dot.position.set(0, 1.2, 0.27); g.add(dot);
  const cone = mesh(new THREE.ConeGeometry(0.28, 0.9, 20), lam(P.red)); cone.rotation.x = Math.PI; cone.position.y = 0.6; g.add(cone);
  g.scale.setScalar(scale);
  return g;
}

/** flat ring (for sound wavefronts) lying in XZ */
export function ringMesh(radius = 1, width = 0.04, color = P.ink, opacity = 0.6, seg = 128) {
  const geo = new THREE.RingGeometry(1 - width / 2, 1 + width / 2, seg); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }));
  m.scale.setScalar(radius);
  return m;
}

/** thin ring outline with constant world width: rebuilds geometry radius */
export class WaveRing {
  constructor(color = P.ink, opacity = 0.5, w = 0.05, seg = 160) {
    this.geo = new THREE.BufferGeometry();
    this.seg = seg; this.w = w;
    const pos = new Float32Array((seg + 1) * 2 * 3); this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const idx = []; for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } this.geo.setIndex(idx);
    this.mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(this.geo, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 5;
  }
  /** plane: 'xz' or 'xy' */
  set(r, plane = 'xz', w = this.w) {
    const p = this.geo.attributes.position.array; const r0 = Math.max(0, r - w / 2), r1 = r + w / 2;
    for (let i = 0; i <= this.seg; i++) {
      const a = i / this.seg * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), o = i * 6;
      if (plane === 'xz') { p[o] = c * r0; p[o + 1] = 0; p[o + 2] = s * r0; p[o + 3] = c * r1; p[o + 4] = 0; p[o + 5] = s * r1; }
      else { p[o] = c * r0; p[o + 1] = s * r0; p[o + 2] = 0; p[o + 3] = c * r1; p[o + 4] = s * r1; p[o + 5] = 0; }
    }
    this.geo.attributes.position.needsUpdate = true;
  }
}

export function treeLine(scene, { seeds = 1, count = 14, x0 = -20, x1 = 20, z = -10, jitter = 2, h = [2.5, 4.2] } = {}) {
  const r = rng(seeds); const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const t = tree(seeds * 100 + i, { h: h[0] + r() * (h[1] - h[0]), tone: i });
    t.position.set(x0 + (x1 - x0) * (i + r() * 0.6) / count, 0, z + (r() - 0.5) * jitter);
    group.add(t);
  }
  scene.add(group);
  return group;
}
