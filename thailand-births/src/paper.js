// Cut-paper building blocks: paper materials, extruded cut-outs with a pale cut edge,
// torn slips with printed text, flat printed labels.
import * as THREE from 'three';
import { rng } from './util.js';

export const C = {
  wall: '#262626', floor: '#303030', paper: '#e9e6df', skin: '#e6e2da', white: '#dcd9d2',
  g1: '#b9b6b0', g2: '#8b8986', g3: '#5c5b59', g4: '#3a3938', ink: '#141414', red: '#c42620',
};
export const FONT = { sans: 'Inter', mono: 'IBM Plex Mono', thai: 'Noto Sans Thai' };
const PPU = 260; // canvas pixels per world unit for printed textures

// ---------- textures ----------
let _grain;
export function grain() {
  if (_grain) return _grain;
  const n = 512, c = document.createElement('canvas'); c.width = c.height = n;
  const x = c.getContext('2d'), img = x.createImageData(n, n), r = rng(7);
  for (let i = 0; i < n * n; i++) { const v = 222 + r() * 33; img.data.set([v, v, v, 255], i * 4); }
  x.putImageData(img, 0, 0);
  for (let i = 0; i < 1400; i++) { // paper fibres
    x.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'; x.lineWidth = 0.6 + r();
    const px = r() * n, py = r() * n, a = r() * 6.28, l = 4 + r() * 14;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + 0.5) * l * 0.5, py + Math.sin(a + 0.5) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  _grain = new THREE.CanvasTexture(c); _grain.wrapS = _grain.wrapT = THREE.RepeatWrapping; _grain.repeat.set(0.9, 0.9);
  _grain.colorSpace = THREE.SRGBColorSpace; _grain.anisotropy = 4;
  return _grain;
}

const _mats = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!_mats.has(key)) _mats.set(key, new THREE.MeshStandardMaterial({ color, map: grain(), bumpMap: grain(), bumpScale: 0.35, roughness: 0.93, metalness: 0, ...opts }));
  return _mats.get(key);
}
function edgeMat(color) {
  const c = new THREE.Color(color).lerp(new THREE.Color('#f4f1ea'), 0.55);
  return mat('#' + c.getHexString(), { bumpScale: 0 });
}

// ---------- shapes ----------
export function rectShape(w, h, cx = 0, cy = 0, r = 0) {
  const s = new THREE.Shape(), x = cx - w / 2, y = cy - h / 2;
  if (!r) { s.moveTo(x, y); s.lineTo(x + w, y); s.lineTo(x + w, y + h); s.lineTo(x, y + h); s.closePath(); return s; }
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
export function circleShape(r, cx = 0, cy = 0) { const s = new THREE.Shape(); s.absarc(cx, cy, r, 0, Math.PI * 2, false); return s; }
export function polyShape(pts) { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; }
export function ringRect(w, h, th, cx = 0, cy = 0) { const s = rectShape(w, h, cx, cy); s.holes.push(rectShape(w - 2 * th, h - 2 * th, cx, cy)); return s; }
export function heartShape(sz = 1) {
  const s = new THREE.Shape(), k = sz;
  s.moveTo(0, -0.5 * k); s.bezierCurveTo(-0.15 * k, -0.33 * k, -0.55 * k, -0.1 * k, -0.55 * k, 0.17 * k);
  s.bezierCurveTo(-0.55 * k, 0.45 * k, -0.15 * k, 0.55 * k, 0, 0.28 * k);
  s.bezierCurveTo(0.15 * k, 0.55 * k, 0.55 * k, 0.45 * k, 0.55 * k, 0.17 * k);
  s.bezierCurveTo(0.55 * k, -0.1 * k, 0.15 * k, -0.33 * k, 0, -0.5 * k); return s;
}
// A rectangle with torn edges (top/bottom by default), like a strip ripped out of a newspaper.
export function tornShape(w, h, seed = 1, jag = 0.035, sides = false) {
  const r = rng(seed), pts = [], step = 0.045;
  const edge = (x0, y0, x1, y1, torn, nx, ny) => {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / step));
    for (let i = 0; i < n; i++) { const k = i / n, j = torn ? (r() - 0.5) * 2 * jag : 0; pts.push([x0 + (x1 - x0) * k + nx * j, y0 + (y1 - y0) * k + ny * j]); }
  };
  edge(-w / 2, -h / 2, w / 2, -h / 2, true, 0, 1); edge(w / 2, -h / 2, w / 2, h / 2, sides, 1, 0);
  edge(w / 2, h / 2, -w / 2, h / 2, true, 0, 1); edge(-w / 2, h / 2, -w / 2, -h / 2, sides, 1, 0);
  return polyShape(pts);
}

// ---------- cut-outs ----------
// An extruded paper piece. The bevel catches light as a pale cut edge, like the white rim on paper cut-outs.
export function cutout(shape, color, o = {}) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: o.depth ?? 0.018, bevelEnabled: true, bevelThickness: 0.006, bevelSize: o.bevel ?? 0.01, bevelSegments: 1, curveSegments: o.curve ?? 20 });
  let face;
  if (o.map) { // normalise UVs to the shape's bounding box so a printed texture fills it
    geo.computeBoundingBox(); const bb = geo.boundingBox, uv = geo.attributes.uv, p = geo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (p.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
    face = new THREE.MeshStandardMaterial({ map: o.map, roughness: 0.93, bumpMap: grain(), bumpScale: 0.25 });
  } else face = mat(color);
  const m = new THREE.Mesh(geo, [face, edgeMat(o.edge ?? color)]);
  m.castShadow = true; m.receiveShadow = true; return m;
}
export const at = (obj, x = 0, y = 0, z = 0) => { obj.position.set(x, y, z); return obj; };

// ---------- printed text ----------
const fontStr = (weight, px, fam) => `${weight} ${px}px "${fam}"`;
function measure(text, font) { const x = measure.c || (measure.c = document.createElement('canvas').getContext('2d')); x.font = font; return x.measureText(text).width; }

// Torn paper slip with one or more printed lines.
// lines: [{t, size, font, weight, color, mark:[substr...]}] (mark: words boxed in red, returned as boxes)
export function slip(lines, o = {}) {
  if (typeof lines === 'string') lines = [{ t: lines }];
  const L = lines.map((l) => ({ size: 0.2, font: FONT.sans, weight: 600, color: C.ink, ...l }));
  const padX = o.padX ?? 0.16, padY = o.padY ?? 0.12, gap = o.gap ?? 0.06;
  L.forEach((l) => { l.w = measure(l.t, fontStr(l.weight, l.size * PPU, l.font)) / PPU; l.h = l.size * (l.font === FONT.thai ? 1.5 : 1.25); });
  const w = o.w ?? Math.max(...L.map((l) => l.w)) + padX * 2, h = L.reduce((a, l) => a + l.h, 0) + gap * (L.length - 1) + padY * 2;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w * PPU); cv.height = Math.ceil(h * PPU);
  const x = cv.getContext('2d');
  x.fillStyle = o.bg ?? C.paper; x.fillRect(0, 0, cv.width, cv.height);
  if (o.shade !== false) { const gr = x.createLinearGradient(0, 0, cv.width, cv.height); gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0.10)'); x.fillStyle = gr; x.fillRect(0, 0, cv.width, cv.height); }
  if (o.photo) o.photo(x, cv.width, cv.height);
  const boxes = []; let y = padY;
  for (const l of L) {
    x.font = fontStr(l.weight, l.size * PPU, l.font); x.fillStyle = l.color; x.textBaseline = 'middle';
    const align = l.align ?? o.align ?? 'center';
    const x0 = align === 'left' ? padX : align === 'right' ? w - padX - l.w : (w - l.w) / 2;
    x.fillText(l.t, x0 * PPU, (y + l.h / 2) * PPU);
    for (const m of l.mark ?? []) {
      const i = l.t.indexOf(m); if (i < 0) continue;
      const bx = x0 + measure(l.t.slice(0, i), x.font) / PPU, bw = measure(m, x.font) / PPU;
      boxes.push({ x: bx + bw / 2 - w / 2, y: h / 2 - (y + l.h / 2), w: bw + 0.06, h: l.h * 0.92, key: m });
    }
    y += l.h + gap;
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const shape = o.torn === false ? rectShape(w, h, 0, 0, o.round ?? 0) : tornShape(w, h, o.seed ?? Math.round(w * 97 + h * 31), o.jag ?? 0.03, o.sides);
  const m = cutout(shape, '#fff', { map: tex, edge: o.edge ?? C.paper });
  const g = new THREE.Group(); g.add(m); g.userData.w = w; g.userData.h = h;
  g.userData.boxes = boxes.map((b) => { const r = cutout(ringRect(b.w, b.h, 0.022), C.red, { depth: 0.004, bevel: 0.002 }); r.position.set(b.x, b.y, 0.04); r.visible = false; g.add(r); r.userData.key = b.key; return r; });
  if (o.rot) g.rotation.z = o.rot;
  return g;
}

// Printed type straight on the backdrop (big mono numbers like "65%").
export function label(text, o = {}) {
  const size = o.size ?? 0.5, font = fontStr(o.weight ?? 500, size * PPU, o.font ?? FONT.mono);
  const w = measure(text, font) / PPU + 0.1, h = size * 1.3;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w * PPU); cv.height = Math.ceil(h * PPU);
  const x = cv.getContext('2d'); x.font = font; x.fillStyle = o.color ?? C.paper; x.textBaseline = 'middle'; x.textAlign = 'center';
  x.fillText(text, cv.width / 2, cv.height / 2);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.35, roughness: 0.9 }));
  m.castShadow = true; m.userData.w = w; return m;
}

// A canvas-drawn texture on a flat card (for small illustrations: baby tokens, banknotes, posters).
export function drawnCard(w, h, draw, o = {}) {
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w * PPU); cv.height = Math.ceil(h * PPU);
  const x = cv.getContext('2d'); draw(x, cv.width, cv.height);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return cutout(o.torn ? tornShape(w, h, o.seed ?? 3, 0.025) : rectShape(w, h, 0, 0, o.round ?? 0), '#fff', { map: tex, edge: o.edge ?? '#d8d5ce', depth: o.depth });
}
export { PPU };
