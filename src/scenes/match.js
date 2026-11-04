import * as THREE from 'three';
import { buildFeed, FEED } from '../lib/feed.js';
import { spectroPanel, lineF } from '../lib/spectro.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, rng, fmt } from '../lib/util.js';

export default function build({ hud }) {
  const F = buildFeed(hud, { seed: 1 });
  const { scene, camera } = F;
  const A = F.spec; A.visible = true;
  const gp = A.geometry.parameters;
  // split the sky into two strips: plane 1 (top) and plane 2 (bottom)
  A.scale.y = 0.5; const y0 = A.position.y;
  A.position.y = y0 + gp.height * 0.25;
  const B = spectroPanel(gp.width, gp.height * 0.5); B.position.copy(A.position); B.position.y = y0 - gp.height * 0.25; camera.add(B);
  const a = A.userData, b = B.userData;
  a.h = gp.height * 0.5;
  const L1 = [12, 2.0, 5, 95], L2 = [930, 1.5, 8, 102];
  a.setWin(0, 24, 60, 135); b.setWin(918, 942, 60, 135);
  a.setLine(0, L1, 0.9, 0.3); b.setLine(0, L2, 1.6, 0.4);
  a.u.uNoise.value = b.u.uNoise.value = 0.5;
  const r = rng(9);
  const cands = Array.from({ length: 8 }, (_, i) => ({ d: [(r() - 0.5) * 7, (r() - 0.5) * 2, (r() - 0.5) * 6, (r() - 0.5) * 22], d2: [(r() - 0.5) * 7, (r() - 0.5) * 1.6, (r() - 0.5) * 8, (r() - 0.5) * 22] }));
  cands[0].d = [0, 0, 0, 0]; cands[0].d2 = [0, 0, 0, 0];
  const l1 = el('div', 'lbl light', hud, 'PLANE 1'); place(l1, 60, FEED.top + 26); l1.style.fontSize = '20px';
  const l2 = el('div', 'lbl light', hud, 'PLANE 2 &nbsp;·&nbsp; 920 S LATER'); l2.style.fontSize = '20px';
  const board = el('div', 'card', hud); Object.assign(board.style, { width: '700px', padding: '24px 30px', fontFamily: 'IBM Plex Mono', color: P.ink });
  board.innerHTML = `<div style="font-size:17px;font-weight:600;letter-spacing:3px;color:#6d665a;margin-bottom:12px">MATCH SCORE</div>
   <div style="display:flex;justify-content:space-between;font-size:30px;font-weight:600;color:#c23a2c"><span>1ST &nbsp;38.47 N 96.92 W</span><span>20.4</span></div>
   <div class="second" style="display:flex;justify-content:space-between;font-size:30px;font-weight:500;color:#8a8378;margin-top:6px"><span>2ND &nbsp;35.11 N 89.98 W</span><span>3.1</span></div>`;
  const second = board.querySelector('.second');
  return {
    scene, camera, caption: { y: 1330 },
    update(t) {
      F.sway(t); F.setClock(t - 112.9 + 260);
      F.clouds.forEach((c) => (c.visible = false));
      place(l2, 60, FEED.top + (FEED.horizon - FEED.top) / 2 + 26 * 0 + 14);
      cands.forEach((c, i) => {
        const appear = ramp(t, 113.3 + i * 0.12, 113.6 + i * 0.12);
        const conv = sr(t, 115.3, 116.9, ease.inOut);
        const keep = i === 0 ? 1 : 1 - sr(t, 116.3, 116.9);
        const k = i === 0 ? 1 - conv : 1 - conv * 0.15;
        const wob = Math.sin(t * 2 + i) * (1 - conv) * 0.6;
        a.setRed(i, L1.map((v, j) => v + c.d[j] * k + (j === 3 ? wob * 3 : 0)), appear * keep * (i === 0 ? 1 : 0.85), 0.3);
        b.setRed(i, L2.map((v, j) => v + c.d2[j] * k + (j === 3 ? wob * 3 : 0)), appear * keep * (i === 0 ? 1 : 0.85), 0.4);
      });
      a.u.uRW.value = b.u.uRW.value = lerp(1.6, 3.2, sr(t, 116.4, 117));
      place(board, 540, 980, 0.5, 0.5, `scale(${lerp(0.9, 1, ease.back(ramp(t, 116.4, 116.9)))})`);
      board.style.opacity = ramp(t, 116.4, 116.8);
      second.style.opacity = ramp(t, 118.9, 119.3);
      second.style.color = t > 119.6 ? '#b0a898' : '#8a8378';
    },
  };
}
