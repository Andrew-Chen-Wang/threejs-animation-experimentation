import * as THREE from 'three';
import { spectroPanel, lineF } from '../lib/spectro.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, lerp, svgEl, pathD } from '../lib/util.js';

export default function build({ hud }) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0f0e0d');
  const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5 * 16 / 9, -0.5 * 16 / 9, 0.1, 10); camera.position.z = 1;
  const H = 16 / 9;
  const spec = spectroPanel(1, H * 0.62); spec.position.y = H * 0.12; scene.add(spec);
  const S = spec.userData; S.u.uVoice.value = 1; S.u.uNoise.value = 0.35; S.u.uBins.value = 160; S.u.uHarm.value = 0;
  const L = [150, 40, 3, 64];
  S.setLine(0, L, 0, 0.5);
  const svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;inset:0;overflow:visible' }, hud);
  const br = svgEl('path', { fill: 'none', stroke: P.red, 'stroke-width': 5 }, svg);
  const vl = el('div', 'lbl light', hud, 'MY VOICE'); vl.style.fontSize = '22px';
  const pl = el('div', 'lbl', hud, 'PLANE &nbsp;·&nbsp; 20 S'); pl.style.color = '#ef5a48'; pl.style.fontSize = '24px';
  const top = el('div', 'lbl light', hud, 'THIS VIDEO &nbsp;·&nbsp; PITCH ↑ TIME →'); place(top, 60, 260); top.style.fontSize = '20px';
  const toPx = (t, f) => { const v = S.toLocal(t, f); return [(v.x + 0.5) * 1080, (H / 2 - (v.y + spec.position.y)) / H * 1920]; };
  return {
    scene, camera, caption: { y: 1500, dark: true },
    update(t) {
      const s = t;
      const z = sr(t, 152.2, 153.2, ease.inOut);
      S.setWin(s - 20, s, lerp(-60, -12, z), Math.exp(lerp(Math.log(4200), Math.log(560), z)));
      S.setLine(0, L, lerp(0.15, 0.55, z), 0.5);
      // bracket under the plane line covering the last 20 s
      const a = ramp(t, 153.7, 154.2);
      const pts = []; for (let i = 0; i <= 60; i++) { const ts = s - 20 + i * 20 / 60; pts.push(toPx(ts, lineF(L, 0.5, ts) - 16)); }
      br.setAttribute('d', a > 0 ? pathD(pts) : ''); br.style.opacity = a;
      const e = toPx(s - 10, lineF(L, 0.5, s - 10) - 16); place(pl, e[0], e[1] + 18, 0.5, 0); pl.style.opacity = a;
      const v = toPx(s - 6, 420); place(vl, v[0], v[1], 0.5, 0.5); vl.style.opacity = ramp(t, 152.4, 152.9);
    },
  };
}
