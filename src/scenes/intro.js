// HOOK, part 1: an ordinary security-camera feed. Nothing to see, nothing to hear.
import * as THREE from 'three';
import { buildFeed, FEED } from '../lib/feed.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, lerp, svgEl, pathD } from '../lib/util.js';

export default function build({ hud }) {
  const F = buildFeed(hud, { seed: 1 });
  const { scene, camera } = F;
  const svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;inset:0;overflow:visible' }, hud);
  const scan = svgEl('rect', { x: 70, y: FEED.top + 40, width: 940, height: 420, fill: 'none', stroke: P.ink, 'stroke-width': 3, 'stroke-dasharray': '10 10' }, svg);
  const sweep = svgEl('line', { y1: FEED.top + 40, y2: FEED.top + 460, stroke: P.ink, 'stroke-width': 3, opacity: 0.6 }, svg);
  const wave = svgEl('path', { fill: 'none', stroke: P.ink, 'stroke-width': 3, 'stroke-linejoin': 'round' }, svg);
  const skyL = el('div', 'lbl', hud, 'SKY · NO PLANE IN SIGHT'); skyL.style.fontSize = '20px'; place(skyL, 80, FEED.top + 480);
  const audL = el('div', 'lbl', hud, 'AUDIO · NO PLANE YOU CAN HEAR'); audL.style.fontSize = '20px'; place(audL, 70, 1172, 0, 1);
  return {
    scene, camera, caption: { y: 1400 },
    update(t) {
      F.sway(t); F.setClock(t + 195);
      camera.position.set(0, 1.7, lerp(17.5, 15.2, sr(t, 0, 4.8, ease.sine))); camera.lookAt(0, 3.0, 0); camera.updateMatrixWorld();
      const sa = ramp(t, 3.2, 3.5) * (1 - ramp(t, 4.5, 4.8));
      scan.style.opacity = sa; skyL.style.opacity = sa;
      const sx = lerp(70, 1010, ramp(t, 3.3, 4.1)); sweep.setAttribute('x1', sx); sweep.setAttribute('x2', sx); sweep.style.opacity = sa * 0.6;
      const pts = []; for (let i = 0; i <= 200; i++) { const k = i / 200; const env = 0.18 + 0.22 * Math.abs(Math.sin(k * 9 + t * 1.3)); pts.push([70 + i * 4.7, 1215 + Math.sin(i * 1.9 + t * 40) * 22 * env * Math.sin(k * Math.PI)]); }
      wave.setAttribute('d', pathD(pts)); wave.style.opacity = ramp(t, 0.4, 0.9);
      audL.style.opacity = ramp(t, 3.8, 4.1) * (1 - ramp(t, 4.5, 4.8));
      wave.style.stroke = t > 3.8 && t < 4.8 ? P.red : P.ink;
    },
  };
}
