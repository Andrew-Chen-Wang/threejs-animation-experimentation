import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const RED = 0xd8402e;
export const FW = 1080, FH = 1920;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ramp = (t, a, b) => clamp((t - a) / (b - a));
export const ease = {
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  back: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
/** eased 0..1 between times a and b */
export const sr = (t, a, b, fn = ease.inOut) => fn(ramp(t, a, b));
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function el(tag, cls, parent, html) {
  const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e;
}
const _v = new THREE.Vector3();
export function project(pos, camera) { _v.copy(pos).project(camera); return { x: (_v.x * 0.5 + 0.5) * FW, y: (-_v.y * 0.5 + 0.5) * FH }; }

const CJK = /([　-〿一-鿿＀-￯「」，。：、（）]+)/g;
/** markup: wraps CJK runs; [[text]] draws a red box around text */
export function mark(s) {
  return s.replace(CJK, '<span class="cn">$1</span>').replace(/\[\[(.+?)\]\]/g, '<span class="box">$1</span>');
}

/**
 * A label: stack of chips. lines: strings or {t, cls, dx}. win(t, a, b) reveals with a left-to-right wipe.
 */
export function tag(hud, lines, { align = 'left', gap = 8 } = {}) {
  const root = el('div', 'tag', hud);
  root.style.alignItems = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
  root.style.gap = gap + 'px';
  const chips = lines.map((l) => {
    const o = typeof l === 'string' ? { t: l } : l;
    const c = el('div', 'chip ' + (o.cls || ''), root, mark(o.t));
    if (o.dx) c.style.marginLeft = o.dx + 'px';
    return c;
  });
  let last = -1;
  const api = {
    root, chips,
    show(p) {
      p = clamp(p); if (p === last) return api; last = p;
      root.style.display = p <= 0 ? 'none' : 'flex';
      const n = chips.length;
      chips.forEach((c, i) => {
        const q = clamp(p * (n + 0.6) - i * 0.85);
        c.style.clipPath = q >= 1 ? 'none' : `inset(0 ${(100 - q * 100).toFixed(1)}% 0 0)`;
        c.style.visibility = q <= 0 ? 'hidden' : 'visible';
      });
      return api;
    },
    at(x, y, ax = 0, ay = 0) { root.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${-ax * 100}%, ${-ay * 100}%)`; return api; },
    /** reveal over [a, a+d], hide at b */
    win(t, a, b = 1e9, d = 0.3) { return api.show(t < b ? ramp(t, a, a + d) : 0); },
    set(i, s) { chips[i].innerHTML = mark(s); return api; },
  };
  api.show(0);
  return api;
}
/** a big number with a small pixel subtitle */
export function counter(hud, sub) {
  const root = el('div', 'counter', hud);
  const n = el('div', 'num', root); const s = el('div', 'sub', root, mark(sub || ''));
  const api = { root, n, s, at(x, y) { root.style.transform = `translate(${x}px, ${y}px) translate(-50%, 0)`; return api; },
    val(v) { const txt = typeof v === 'number' ? String(Math.round(v)) : v; if (n.textContent !== txt) n.textContent = txt; return api; },
    sub(t) { const h = mark(t); if (s.innerHTML !== h) s.innerHTML = h; return api; },
    vis(on) { root.style.display = on ? 'block' : 'none'; return api; } };
  return api.vis(false);
}

// ---------- 3D ----------
export const mat = (color = 0xdddddd, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...o });
export function rig(scene, { key = 2.4, amb = 1.15, pos = [-8, 14, 6], size = 22, target = [0, 0, 0] } = {}) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, amb));
  const d = new THREE.DirectionalLight(0xffffff, key);
  d.position.set(pos[0] + target[0], pos[1] + target[1], pos[2] + target[2]); d.target.position.set(...target);
  d.castShadow = true; d.shadow.mapSize.set(2048, 2048);
  const c = d.shadow.camera; c.left = -size; c.right = size; c.top = size; c.bottom = -size; c.near = 0.5; c.far = 120;
  d.shadow.bias = -0.0004; d.shadow.normalBias = 0.03; d.shadow.radius = 4;
  scene.add(d); scene.add(d.target);
  return d;
}
export function ground(scene, color = 0xd9d9d7, size = 400, y = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat(color)); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; scene.add(m); return m;
}
export function box(w, h, d, color = 0xeeeeee, r = 0) {
  const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, color instanceof THREE.Material ? color : mat(color)); m.castShadow = true; m.receiveShadow = true; return m;
}
export const redMat = () => mat(RED, { roughness: 0.75 });

// clay pawn parts (1 unit ≈ 1 m)
export const GEO = {
  body: new RoundedBoxGeometry(0.3, 0.5, 0.24, 2, 0.07),
  standBody: new RoundedBoxGeometry(0.34, 1.15, 0.26, 2, 0.09),
  head: new RoundedBoxGeometry(0.17, 0.19, 0.17, 2, 0.06),
  cap: new RoundedBoxGeometry(0.22, 0.06, 0.24, 1, 0.02),
  seat: new THREE.BoxGeometry(0.5, 0.1, 0.46),
  back: new THREE.BoxGeometry(0.5, 0.66, 0.07),
  desk: new THREE.BoxGeometry(1, 0.08, 0.42),
};

/**
 * Instanced pawns, optionally on chairs. items: [{x, z, ry}]. kind: 'seated' | 'standing'.
 * set(i, {vis:0..1, color, chair}) — vis scales the pawn (0 = an empty chair).
 */
export function pawns(scene, items, { kind = 'seated', color = 0x2f2f2f, chairs = kind === 'seated', chairColor = 0xf2f2f0, military = false, desks = false } = {}) {
  const n = items.length, seated = kind === 'seated';
  const all = [];
  const mk = (geo, m, off, isChair) => { const im = new THREE.InstancedMesh(geo, m, n); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); all.push({ im, off, isChair }); return im; };
  const pm = mat(0xffffff, { roughness: 0.85 });
  if (seated) { mk(GEO.body, pm, [0, 0.76, -0.04]); mk(GEO.head, pm, [0, 1.15, -0.02]); if (military) mk(GEO.cap, pm, [0, 1.27, 0]); }
  else { mk(GEO.standBody, pm, [0, 0.58, 0]); mk(GEO.head, pm, [0, 1.3, 0]); if (military) mk(GEO.cap, pm, [0, 1.42, 0.01]); }
  if (chairs) { const cm = mat(0xffffff); mk(GEO.seat, cm, [0, 0.45, 0.02], true); mk(GEO.back, cm, [0, 0.72, -0.24], true); }
  if (desks) { mk(GEO.desk, mat(0xffffff), [0, 0.95, 0.55], true); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), o = new THREE.Vector3(), e = new THREE.Euler();
  const cP = new THREE.Color(color), cC = new THREE.Color(chairColor), tmp = new THREE.Color();
  const st = items.map((it) => ({ x: it.x, y: it.y || 0, z: it.z, ry: it.ry || 0, vis: 1, color: null, chair: null, dx: 0, dz: 0, dy: 0 }));
  function write(i) {
    const it = st[i];
    e.set(0, it.ry, 0); q.setFromEuler(e);
    for (const part of all) {
      o.set(...part.off).applyQuaternion(q);
      if (part.isChair) { p.set(it.x, it.y, it.z).add(o); s.setScalar(1); part.im.setColorAt(i, it.chair != null ? tmp.set(it.chair) : cC); }
      else {
        const v = it.vis; p.set(it.x + it.dx, it.y + it.dy + (seated ? 0.45 : 0) * (1 - v), it.z + it.dz).add(o.multiplyScalar(v)); s.setScalar(Math.max(v, 1e-4));
        part.im.setColorAt(i, it.color != null ? tmp.set(it.color) : cP);
      }
      m4.compose(p, q, s); part.im.setMatrixAt(i, m4);
      part.im.instanceMatrix.needsUpdate = true; part.im.instanceColor.needsUpdate = true;
    }
  }
  for (let i = 0; i < n; i++) write(i);
  return { st, n, set(i, o2) { const it = st[i]; let ch = false; for (const k in o2) if (it[k] !== o2[k]) { it[k] = o2[k]; ch = true; } if (ch) write(i); } };
}

/** one solo pawn as a group (for hero shots) */
export function pawn({ military = false, color = 0x2f2f2f, standing = true, scale = 1 } = {}) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.8 });
  const body = new THREE.Mesh(standing ? GEO.standBody : GEO.body, m); body.position.y = standing ? 0.58 : 0.76; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(GEO.head, m); head.position.y = standing ? 1.3 : 1.15; head.castShadow = true; g.add(head);
  if (military) {
    const cap = new THREE.Mesh(GEO.cap, mat(0x1c1c1c)); cap.position.set(0, head.position.y + 0.12, 0.01); cap.castShadow = true; g.add(cap);
    for (const sx of [-1, 1]) { const b = box(0.13, 0.03, 0.2, 0xe8e8e8); b.position.set(sx * 0.15, body.position.y + (standing ? 0.53 : 0.24), 0); g.add(b); }
  }
  g.scale.setScalar(scale);
  return g;
}

/** auditorium: stage + red table + carpet + blocks of seated pawns. returns {group, crowd} */
export function auditorium(scene, { seed = 3, blockRows = 7, blockCols = 10 } = {}) {
  const r = rng(seed);
  const tiles = ground(scene, 0xdcdcda);
  // floor tile lines
  const lines = new THREE.GridHelper(200, 200, 0xc6c6c4, 0xc6c6c4); lines.position.y = 0.003; scene.add(lines);
  const stage = box(22, 1.1, 8, 0xe9e9e7); stage.position.set(0, 0.55, -14); scene.add(stage);
  const wall = box(18, 5, 0.6, 0xf1f1ef); wall.position.set(0, 3.4, -17.3); scene.add(wall);
  const table = box(14, 0.9, 1.0, redMat()); table.position.set(0, 1.55, -12.4); scene.add(table);
  const lead = [];
  for (let i = 0; i < 9; i++) lead.push({ x: -6 + i * 1.5, z: -13.4, y: 1.1 });
  const leaders = pawns(scene, lead, { chairs: false });
  const carpet = box(1.6, 0.04, 40, redMat()); carpet.position.set(0, 0.03, 8); scene.add(carpet);
  const items = [];
  for (const bx of [-12, -6.2, 6.2, 12]) for (const bz of [-6, 3, 12, 21]) {
    for (let rr = 0; rr < blockRows; rr++) for (let c = 0; c < blockCols; c++) {
      if (r() < 0.04) continue;
      items.push({ x: bx + (c - (blockCols - 1) / 2) * 0.52, z: bz + rr * 1.0, ry: 0 });
    }
  }
  const crowd = pawns(scene, items, { chairs: false, kind: 'seated' });
  return { crowd, leaders, table, carpet, stage };
}

/** canvas texture */
export function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.cv = cv;
  return t;
}

/** faceless halftoned bust drawn on a canvas (for chart cards) — returns a data URL */
export function bustURL({ military = false, seed = 1, w = 180, h = 200, cap = military } = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  const r = rng(seed);
  const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, '#a4a4a4'); grd.addColorStop(1, '#5a5a5a'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) { g.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`; g.beginPath(); g.ellipse(r() * w, r() * h * 0.6, 20 + r() * 50, 15 + r() * 30, 0, 0, 7); g.fill(); }
  const cx = w * (0.48 + (r() - 0.5) * 0.06), hy = h * 0.42, hr = w * 0.19;
  g.fillStyle = military ? '#2a2c2a' : '#202020';
  g.beginPath(); g.moveTo(0, h); g.quadraticCurveTo(w * 0.05, hy + hr * 1.6, cx, hy + hr * 1.35); g.quadraticCurveTo(w * 0.95, hy + hr * 1.6, w, h); g.fill();
  if (!military) { g.fillStyle = '#e0e0e0'; g.beginPath(); g.moveTo(cx - hr * 0.45, hy + hr * 1.35); g.lineTo(cx, h); g.lineTo(cx + hr * 0.45, hy + hr * 1.35); g.fill();
    g.fillStyle = '#333'; g.beginPath(); g.moveTo(cx - hr * 0.1, hy + hr * 1.45); g.lineTo(cx, h); g.lineTo(cx + hr * 0.1, hy + hr * 1.45); g.fill(); }
  else { g.fillStyle = '#d8d8d8'; for (const s of [-1, 1]) { g.save(); g.translate(cx + s * hr * 1.9, hy + hr * 1.8); g.rotate(s * 0.25); g.fillRect(-hr * 0.55, -hr * 0.12, hr * 1.1, hr * 0.24); g.restore(); } }
  g.fillStyle = '#9a9a9a'; g.fillRect(cx - hr * 0.42, hy + hr * 0.6, hr * 0.84, hr * 0.8);
  const hg = g.createRadialGradient(cx - hr * 0.35, hy - hr * 0.35, hr * 0.1, cx, hy, hr * 1.15); hg.addColorStop(0, '#e2e2e2'); hg.addColorStop(1, '#727272');
  g.fillStyle = hg; g.beginPath(); g.ellipse(cx, hy, hr * 0.9, hr * 1.08, 0, 0, 7); g.fill();
  if (cap) { g.fillStyle = '#2c2e2c'; g.beginPath(); g.ellipse(cx, hy - hr * 0.78, hr * 1.25, hr * 0.42, 0, Math.PI, 0); g.fill(); g.fillRect(cx - hr * 1.0, hy - hr * 0.82, hr * 2.0, hr * 0.3);
    g.fillStyle = '#111'; g.beginPath(); g.ellipse(cx, hy - hr * 0.5, hr * 1.02, hr * 0.16, 0, 0, Math.PI); g.fill(); }
  else { g.fillStyle = '#1e1e1e'; g.beginPath(); g.ellipse(cx, hy - hr * 0.55, hr * 0.92, hr * 0.6, 0, Math.PI * 1.02, Math.PI * 1.98); g.fill(); }
  // halftone it
  const img = g.getImageData(0, 0, w, h); const d = img.data; const out = g.createImageData(w, h);
  const cell = 4;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; const L = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
    const u = (x + y) / cell, v = (x - y) / cell; const fx = u - Math.floor(u) - 0.5, fy = v - Math.floor(v) - 0.5;
    const rad = Math.sqrt(1 - L) * 0.62; const inDot = Math.hypot(fx, fy) < rad;
    const val = 0.75 * L * 255 + 0.25 * (inDot ? 20 : 235);
    out.data[i] = out.data[i + 1] = out.data[i + 2] = val; out.data[i + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  return cv.toDataURL('image/png');
}

/** dark document texture: rows of grey serif Chinese text */
const POOL = '中国共产党第二十届中央委员会全体会议公报新华社北京月日电出席这次的有委员候补列席人员同志主持会议讨论通过决定给予开除党籍处分军事委员会副主席关于审查调查严重违反政治纪律和规矩搞团伙利用职务便利为他人晋升等提供帮助收受巨额钱款增选政治局坚持推进全面从严治党确保国家安全建设发展';
export function docTexture({ seed = 1, w = 1024, h = 1800, dark = true, size = 26 } = {}) {
  const r = rng(seed);
  return canvasTex(w, h, (g) => {
    g.fillStyle = dark ? '#2b2b2b' : '#d9d9d6'; g.fillRect(0, 0, w, h);
    g.fillStyle = dark ? 'rgba(200,200,196,.42)' : 'rgba(40,40,40,.7)';
    g.font = `500 ${size}px 'Noto Serif SC', serif`; g.filter = 'blur(1.2px)'; g.textBaseline = 'top';
    for (let y = 60; y < h - 60; y += size * 1.9) {
      const indent = r() < 0.22 ? size * 2 : 0; const end = r() < 0.15 ? w * (0.3 + r() * 0.5) : w - 60;
      let s = ''; for (let x = 60 + indent; x < end; x += size) s += POOL[Math.floor(r() * POOL.length)];
      g.fillText(s, 60 + indent, y);
    }
  });
}
