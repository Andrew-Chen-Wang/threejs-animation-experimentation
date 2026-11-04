import * as THREE from 'three';
import { buildFeed, FEED } from '../lib/feed.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, svgEl } from '../lib/util.js';

export default function build({ hud }) {
  const F = buildFeed(hud, { seed: 4 });
  const { scene, camera, spec } = F;
  spec.visible = true;
  const S = spec.userData;
  const L = [31, 2.4, 4, 98];
  S.setLine(0, L, 0.5, 0.35); S.u.uNoise.value = 0.55;
  const svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;inset:0;overflow:visible' }, hud);
  const br = svgEl('path', { fill: 'none', stroke: '#f3eee4', 'stroke-width': 4 }, svg);
  const ell = svgEl('ellipse', { rx: 140, ry: 56, fill: 'none', stroke: '#f3eee4', 'stroke-width': 5, 'stroke-dasharray': 650, 'stroke-dashoffset': 650 }, svg);
  const minL = el('div', 'lbl light', hud, '1 MIN OF AUDIO'); minL.style.fontSize = '22px';
  const ts = el('div', 'lbl', hud, ''); ts.style.fontSize = '34px';
  return {
    scene, camera, caption: { y: 1330 },
    update(t) {
      F.sway(t); F.clouds.forEach((c) => (c.visible = false));
      F.hud.hL.innerHTML = 'CAM 07<br/>?? ??? 2026';
      F.setClock(t - 120.7 + 1803, 19 * 3600);
      S.u.uReveal.value = sr(t, 120.8, 122.2, ease.inOut);
      S.setWin(0, 62, -24, 150);
      const y = FEED.top + 60;
      br.setAttribute('d', `M60 ${y + 16} L60 ${y} L1020 ${y} L1020 ${y + 16}`); br.style.opacity = ramp(t, 122.3, 122.7);
      place(minL, 540, y - 10, 0.5, 1); minL.style.opacity = 0;
      const ep = project(S.toWorld(L[0], L[3]), camera);
      ell.setAttribute('cx', ep.x); ell.setAttribute('cy', ep.y); ell.setAttribute('stroke-dashoffset', 650 * (1 - sr(t, 123.6, 124.2)));
      place(minL, 540, y + 40, 0.5, 0); minL.style.opacity = ramp(t, 122.3, 122.7);
      ts.innerHTML = 'RECORDED &nbsp;<span style="color:#c23a2c">19:30:03 UTC</span>';
      place(ts, 540, 1210, 0.5, 0.5, `scale(${lerp(1.15, 1, ease.out(ramp(t, 124.7, 125.1)))})`); ts.style.opacity = ramp(t, 124.7, 125.0);
    },
  };
}
