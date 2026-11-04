// CHAPTER 1 · THE CLUE
// Teach the spectrogram with familiar sounds first (bird = high, wind = low), signal the zoom band
// before zooming, then name plane 1 (blue) and plane 2 (ochre). Trees sink away so nothing hides data.
import * as THREE from 'three';
import { buildFeed, FEED } from '../lib/feed.js';
import { lineF } from '../lib/spectro.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, svgEl, pathD, partial } from '../lib/util.js';

const BOTTOM = FEED.horizon;
export default function build({ hud }) {
  const F = buildFeed(hud, { seed: 1 });
  const { scene, camera, spec } = F;
  const S = spec.userData;
  const L1 = [12, 2.0, 5, 95], L2 = [942, 1.5, 8, 102];
  const BIRD = [10.5, 0.45, 900, 4300], BIRD2 = [15.5, 0.4, 800, 3900];
  const svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;inset:0;overflow:visible' }, hud);
  const ell = svgEl('ellipse', { rx: 150, ry: 62, fill: 'none', stroke: P.red, 'stroke-width': 6, 'stroke-dasharray': 720, 'stroke-dashoffset': 720 }, svg);
  const wave = svgEl('path', { fill: 'none', stroke: P.ink, 'stroke-width': 3, 'stroke-linejoin': 'round' }, svg);
  const trace = svgEl('path', { fill: 'none', stroke: P.p2Glow, 'stroke-width': 8, 'stroke-linecap': 'round' }, svg);
  const head = svgEl('circle', { r: 11, fill: P.p2Glow, stroke: '#141311', 'stroke-width': 3 }, svg);
  const yAx = svgEl('path', { d: `M44 ${BOTTOM - 20} L44 ${FEED.top + 60} M34 ${FEED.top + 76} L44 ${FEED.top + 60} L54 ${FEED.top + 76}`, stroke: '#f3eee4', 'stroke-width': 4, fill: 'none' }, svg);
  const xAx = svgEl('path', { d: `M44 ${BOTTOM - 20} L1000 ${BOTTOM - 20} M984 ${BOTTOM - 30} L1000 ${BOTTOM - 20} L984 ${BOTTOM - 10}`, stroke: '#f3eee4', 'stroke-width': 4, fill: 'none' }, svg);
  const band = svgEl('path', { fill: 'none', stroke: P.red, 'stroke-width': 6 }, svg);
  const pitch = el('div', 'lbl light', hud, 'HIGH NOTES'); pitch.style.fontSize = '22px'; place(pitch, 64, FEED.top + 56);
  const low = el('div', 'lbl light', hud, 'LOW NOTES'); low.style.fontSize = '22px'; place(low, 64, BOTTOM - 70);
  const time = el('div', 'lbl light', hud, 'TIME →'); time.style.fontSize = '22px'; place(time, 990, BOTTOM - 34, 1, 1);
  const birdL = el('div', 'lbl light', hud, 'BIRD'); birdL.style.fontSize = '22px';
  const windL = el('div', 'lbl light', hud, 'WIND, TRAFFIC'); windL.style.fontSize = '22px';
  const bandL = el('div', 'lbl', hud, 'ZOOM IN'); bandL.style.fontSize = '22px'; bandL.style.color = '#ff6a55';
  const ticks = [0, 1, 2].map(() => { const e = el('div', 'lbl light', hud, ''); e.style.fontSize = '20px'; return e; });
  const tag = el('div', 'lbl', hud, 'PLANE 1 &nbsp;·&nbsp; PROPELLER &nbsp;·&nbsp; ~95 HZ'); tag.style.fontSize = '22px'; tag.style.color = P.p1Glow;
  const quiet = el('div', 'lbl light', hud, 'TOO QUIET TO NOTICE BY EAR'); quiet.style.fontSize = '19px';
  const tag2 = el('div', 'lbl', hud, 'PLANE 2 &nbsp;·&nbsp; LOUDER'); tag2.style.fontSize = '22px'; tag2.style.color = P.p2Glow;
  const big = el('div', 'big-num', hud, ''); big.style.fontSize = '120px'; big.style.color = '#f3eee4'; big.style.textShadow = '0 4px 30px rgba(0,0,0,.6)';

  const sigT = (t) => t - 22.62 + 20 + 920 * sr(t, 30.7, 32.6, ease.expoInOut);
  return {
    scene, camera, caption: { y: 1340 },
    update(t) {
      F.sway(t);
      const s = sigT(t);
      F.setClock(s + 180);
      // spectrogram replaces the sky; trees sink out of the way
      const rev = sr(t, 22.62, 23.6, ease.inOut);
      spec.visible = rev > 0; S.u.uReveal.value = rev;
      F.clouds.forEach((c) => { c.visible = rev < 0.5; });
      const sink = sr(t, 22.4, 23.4, ease.inOut);
      F.trees.position.y = -sink * 9; F.back.position.y = -sink * 9;
      const z = sr(t, 24.9, 26.1, ease.expoInOut);
      const f1 = Math.exp(lerp(Math.log(8000), Math.log(165), z));
      S.setWin(s - 28, s, 0, f1);
      S.u.uNoise.value = lerp(0.5, 0.42, z) * (1 - 0.8 * sr(t, 34.2, 35.0));
      S.setLine(0, L1, 0.6, 0.3, t > 26.3 ? P.p1Glow : '#f2ede3');
      S.setLine(1, L2, lerp(0, 1.7, ramp(t, 31.0, 32.0)), 0.4, P.p2Glow);
      S.setLine(2, s < 20 ? BIRD : BIRD2, (1 - z) * 2.2, 0, '#f2ede3');
      S.u.uHarm.value = 0.6;
      const toPx = (tt, ff) => project(S.toWorld(tt, ff), camera);
      // reading guide: familiar sounds before the plane
      const guide = ramp(t, 23.3, 23.7) * (1 - ramp(t, 24.8, 25.1));
      yAx.style.opacity = xAx.style.opacity = rev;
      pitch.style.opacity = low.style.opacity = guide;
      time.style.opacity = rev;
      const bp = toPx(s < 20 ? BIRD[0] : BIRD2[0], 4400); place(birdL, bp.x, bp.y - 16, 0.5, 1); birdL.style.opacity = guide;
      place(windL, 600, BOTTOM - 70); windL.style.opacity = guide;
      // the zoom band, signalled before the zoom happens
      const yb0 = toPx(s, 0).y, yb1 = toPx(s, 165).y;
      band.setAttribute('d', `M1010 ${yb0} L1030 ${yb0} L1030 ${Math.min(yb1, yb0 - 14)} L1010 ${Math.min(yb1, yb0 - 14)}`);
      band.style.opacity = ramp(t, 24.4, 24.7) * (1 - ramp(t, 26.0, 26.3));
      place(bandL, 1000, Math.min(yb1, yb0 - 14) - 10, 1, 1); bandL.style.opacity = band.style.opacity;
      [150, 100, 50].forEach((hz, i) => {
        const q = toPx(s, hz);
        ticks[i].innerHTML = `${hz} Hz`;
        place(ticks[i], 1030, q.y, 1, 0.5); ticks[i].style.opacity = ramp(t, 26.0, 26.4) * (q.y > FEED.top + 20 && q.y < BOTTOM - 40 ? 0.85 : 0);
      });
      // "There."
      const ep = toPx(L1[0], L1[3]);
      ell.setAttribute('cx', ep.x); ell.setAttribute('cy', ep.y);
      ell.setAttribute('stroke-dashoffset', 720 * (1 - sr(t, 26.3, 26.8)));
      ell.style.opacity = 1 - ramp(t, 30.5, 30.9);
      place(tag, ep.x, ep.y - 84, 0.5, 1); tag.style.opacity = ramp(t, 26.6, 27.0) * (1 - ramp(t, 30.4, 30.8));
      place(quiet, ep.x, ep.y + 84, 0.5, 0); quiet.style.opacity = ramp(t, 28.4, 28.8) * (1 - ramp(t, 30.4, 30.8));
      // audio waveform "listen": a plain waveform shows nothing
      const wa = ramp(t, 18.9, 19.3) * (1 - ramp(t, 22.4, 22.9));
      const pts = []; for (let i = 0; i <= 200; i++) { const x = 70 + i * 4.7; const k = i / 200; const env = 0.25 + 0.75 * Math.abs(Math.sin(k * 9 + t * 1.3)) * Math.abs(Math.sin(k * 23 - t * 2)); pts.push([x, 1215 + Math.sin(i * 1.9 + t * 40) * 26 * env * Math.sin(k * Math.PI)]); }
      wave.setAttribute('d', pathD(pts)); wave.style.opacity = wa;
      // +920 s
      const cA = ramp(t, 30.6, 30.9) * (1 - ramp(t, 33.0, 33.4));
      big.textContent = `+${Math.round(920 * sr(t, 30.7, 32.6, ease.expoInOut))} s`;
      place(big, 540, 520, 0.5, 0.5); big.style.opacity = cA;
      const lp = toPx(L2[0] + 3, lineF(L2, 0.4, L2[0] + 3)); place(tag2, lp.x, lp.y + 50, 0.5, 0); tag2.style.opacity = ramp(t, 32.2, 32.6) * (1 - ramp(t, 34.0, 34.3));
      // "You already know this shape": clean the noise away and trace the S-curve
      const tr = sr(t, 34.2, 35.3, ease.inOut);
      const tp = []; for (let i = 0; i <= 120; i++) { const ts = L2[0] - 9 + i * 18 / 120; if (ts > s) break; const p = toPx(ts, lineF(L2, 0.4, ts)); tp.push([p.x, p.y]); }
      const pp = partial(tp, tr);
      trace.setAttribute('d', pp.length > 1 ? pathD(pp) : ''); trace.style.opacity = ramp(t, 34.2, 34.3);
      const last = pp[pp.length - 1] || [0, 0]; head.setAttribute('cx', last[0]); head.setAttribute('cy', last[1]); head.style.opacity = tr > 0 ? 1 : 0;
    },
  };
}
