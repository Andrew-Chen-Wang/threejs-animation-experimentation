// CHAPTER 4 · THE PROOF (part 2): lay every predicted line over the real ones.
// Real lines keep their plane colours; predictions are thin ink; the one that fits turns red.
// The score bar answers "compared to what?": first place against second place.
import * as THREE from 'three';
import { lineF } from '../lib/spectro.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, lerp, rng, svgEl, pathD, partial } from '../lib/util.js';

export default function build({ hud }) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.paper);
  const camera = new THREE.PerspectiveCamera(30, 9 / 16, 0.1, 10);
  const R1 = [0, 2.0, 5, 95], R2 = [0, 1.5, 8, 102];
  const r = rng(9);
  const cands = Array.from({ length: 14 }, (_, i) => ({ d1: [(r() - 0.5) * 3, (r() - 0.5) * 1.8, (r() - 0.5) * 6, (r() - 0.5) * 16], d2: [(r() - 0.5) * 3, (r() - 0.5) * 1.4, (r() - 0.5) * 8, (r() - 0.5) * 16] }));
  cands[0].d1 = [0, 0, 0, 0]; cands[0].d2 = [0, 0, 0, 0];
  const mk = (y, title, col) => {
    const card = el('div', 'card', hud); Object.assign(card.style, { left: '60px', top: y + 'px', width: '960px', height: '380px' });
    const s = svgEl('svg', { width: 960, height: 380, style: 'position:absolute;inset:0;overflow:visible' }, card);
    svgEl('text', { x: 26, y: 40, 'font-family': 'IBM Plex Mono', 'font-size': 20, 'font-weight': 600, 'letter-spacing': 3, fill: col }, s).textContent = title;
    svgEl('text', { x: 934, y: 40, 'text-anchor': 'end', 'font-family': 'IBM Plex Mono', 'font-size': 16, 'font-weight': 600, 'letter-spacing': 2, fill: '#8a8378' }, s).textContent = 'PITCH ↑  TIME →';
    const real = svgEl('path', { fill: 'none', stroke: col, 'stroke-width': 14, 'stroke-linecap': 'round', opacity: 0.85 }, s);
    const preds = cands.map(() => svgEl('path', { fill: 'none', stroke: P.ink, 'stroke-width': 2.5, opacity: 0 }, s));
    const tag = svgEl('text', { 'font-family': 'IBM Plex Mono', 'font-size': 20, 'font-weight': 600, 'letter-spacing': 2, fill: P.red }, s);
    return { card, s, real, preds, tag };
  };
  const A = mk(150, 'PLANE 1 · HEARD ON THE CLIP', P.p1), B = mk(560, 'PLANE 2 · HEARD 920 S LATER', P.p2);
  const legend = el('div', 'lbl', hud, '<span style="color:#2f6690">▬ HEARD</span> &nbsp;&nbsp; <span style="color:#23201c">— PREDICTED FOR ONE SPOT</span>'); legend.style.fontSize = '18px'; place(legend, 540, 112, 0.5, 0.5);
  const board = el('div', 'card', hud); Object.assign(board.style, { left: '60px', top: '975px', width: '960px', height: '250px' });
  const bs = svgEl('svg', { width: 960, height: 250, style: 'position:absolute;inset:0' }, board);
  svgEl('text', { x: 26, y: 40, 'font-family': 'IBM Plex Mono', 'font-size': 18, 'font-weight': 600, 'letter-spacing': 3, fill: '#4a453d' }, bs).textContent = 'HOW WELL EACH SPOT FITS';
  const bar1 = svgEl('rect', { x: 260, y: 74, height: 54, rx: 4, fill: P.red }, bs), bar2 = svgEl('rect', { x: 260, y: 152, height: 54, rx: 4, fill: '#b5ac9b' }, bs);
  const t1 = svgEl('text', { x: 26, y: 110, 'font-family': 'IBM Plex Mono', 'font-size': 22, 'font-weight': 600, fill: P.red, 'letter-spacing': 2 }, bs); t1.textContent = 'BEST SPOT';
  const t2 = svgEl('text', { x: 26, y: 188, 'font-family': 'IBM Plex Mono', 'font-size': 22, 'font-weight': 600, fill: '#6d665a', 'letter-spacing': 2 }, bs); t2.textContent = 'NEXT BEST';
  const v1 = svgEl('text', { y: 110, 'font-family': 'IBM Plex Mono', 'font-size': 22, 'font-weight': 600, fill: P.red }, bs), v2 = svgEl('text', { y: 188, 'font-family': 'IBM Plex Mono', 'font-size': 22, 'font-weight': 600, fill: '#6d665a' }, bs);
  const curve = (L, dx, wob) => { const pts = []; for (let i = 0; i <= 120; i++) { const tt = -8 + i * 16 / 120; pts.push([60 + (tt + 8) / 16 * 840, 330 - (lineF(L, wob, tt) - 80) / 34 * 250]); } return pts; };
  return {
    scene, camera, caption: { y: 1400 },
    update(t) {
      [[A, R1, 'd1', 0.3], [B, R2, 'd2', 0.4]].forEach(([C, R, key, wob], ci) => {
        C.real.setAttribute('d', pathD(curve(R, 0, wob)));
        const conv = sr(t, 116.3, 117.0, ease.inOut);
        cands.forEach((c, i) => {
          const app = ramp(t, 113.3 + i * 0.12, 113.6 + i * 0.12);
          const L = R.map((v, j) => v + c[key][j]);
          const pts = curve(L, 0, wob);
          const p = C.preds[i];
          p.setAttribute('d', pathD(partial(pts, sr(t, 113.3 + i * 0.12, 114.1 + i * 0.12))));
          if (i === 0) { p.setAttribute('stroke', conv > 0 ? P.red : P.ink); p.setAttribute('stroke-width', lerp(2.5, 5, conv)); p.setAttribute('stroke-dasharray', conv > 0 ? '14 10' : ''); p.style.opacity = app; }
          else p.style.opacity = app * 0.45 * (1 - conv * 0.85);
        });
        C.tag.textContent = 'BEST SPOT: EXACT FIT'; C.tag.setAttribute('x', 600); C.tag.setAttribute('y', 80); C.tag.style.opacity = ramp(t, 116.8, 117.2);
        C.card.style.opacity = ramp(t, 112.9 + ci * 0.2, 113.3 + ci * 0.2);
      });
      legend.style.opacity = ramp(t, 113.2, 113.6);
      const b1 = sr(t, 116.9, 117.7, ease.out) * 600, b2 = sr(t, 119.0, 119.5, ease.out) * 600 * (3.1 / 20.4);
      bar1.setAttribute('width', b1); bar2.setAttribute('width', b2);
      v1.setAttribute('x', 260 + b1 + 14); v1.textContent = b1 > 1 ? '20.4' : ''; v2.setAttribute('x', 260 + b2 + 14); v2.textContent = b2 > 1 ? '3.1' : '';
      board.style.opacity = ramp(t, 116.6, 117.0);
      t2.style.opacity = ramp(t, 118.9, 119.2);
    },
  };
}
