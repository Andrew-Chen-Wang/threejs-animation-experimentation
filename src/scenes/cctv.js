import * as THREE from 'three';
import { buildFeed, FEED } from '../lib/feed.js';
import { lineF } from '../lib/spectro.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, svgEl, clamp, pathD, partial } from '../lib/util.js';

export default function build({ hud }) {
  const F = buildFeed(hud, { seed: 1 });
  const { scene, camera, spec } = F;
  const S = spec.userData;
  const L1 = [12, 2.0, 5, 95], L2 = [942, 1.5, 8, 102];
  // overlay svg
  const svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;inset:0;overflow:visible' }, hud);
  const ell = svgEl('ellipse', { rx: 150, ry: 60, fill: 'none', stroke: '#f3eee4', 'stroke-width': 5, 'stroke-dasharray': 700, 'stroke-dashoffset': 700 }, svg);
  const wave = svgEl('path', { fill: 'none', stroke: P.ink, 'stroke-width': 3, 'stroke-linejoin': 'round' }, svg);
  const trace = svgEl('path', { fill: 'none', stroke: P.red, 'stroke-width': 7, 'stroke-linecap': 'round' }, svg);
  const head = svgEl('circle', { r: 11, fill: P.red, stroke: '#f3eee4', 'stroke-width': 3 }, svg);
  const waveLbl = el('div', 'lbl', hud, 'AUDIO'); place(waveLbl, 70, 1176, 0, 1); waveLbl.style.fontSize = '18px';
  const pitch = el('div', 'lbl light', hud, 'PITCH ↑'); place(pitch, 60, FEED.top + 30); pitch.style.fontSize = '20px';
  const time = el('div', 'lbl light', hud, 'TIME →'); place(time, 60, 700); time.style.fontSize = '20px';
  const ticks = [0, 1, 2].map(() => { const e = el('div', 'lbl light', hud, ''); e.style.fontSize = '20px'; return e; });
  const tag = el('div', 'lbl light', hud, 'PROPELLER &nbsp;·&nbsp; ~95 HZ'); tag.style.fontSize = '22px';
  const big = el('div', 'big-num', hud, ''); big.style.fontSize = '120px'; big.style.color = '#f3eee4'; big.style.textShadow = '0 4px 30px rgba(0,0,0,.6)';
  const tmp = new THREE.Vector3();

  const sigT = (t) => t - 22.62 + 20 + 920 * sr(t, 30.7, 32.6, ease.expoInOut);
  return {
    scene, camera, caption: { y: 1330 },
    update(t) {
      F.sway(t);
      const s = sigT(t);
      F.setClock(s + 180);
      // spectrogram reveal + zoom into low notes
      const rev = sr(t, 22.62, 23.9, ease.inOut);
      spec.visible = rev > 0;
      S.u.uReveal.value = rev;
      F.clouds.forEach((c) => { c.visible = rev < 0.6; });
      const z = sr(t, 24.8, 26.2, ease.expoInOut);
      const f1 = Math.exp(lerp(Math.log(8000), Math.log(150), z)), f0 = lerp(-1000, -24, z);
      S.setWin(s - 28, s, f0, f1);
      S.u.uNoise.value = lerp(0.55, 0.45, z);
      S.u.uBins.value = 120;
      S.setLine(0, L1, 0.6, 0.3);
      S.setLine(1, L2, lerp(0, 1.7, ramp(t, 31.0, 32.0)), 0.4);
      S.setRed(0, L2, 0, 0.4);
      F.band.material.color.set('#141311');
      // axis labels
      [150, 100, 50].forEach((hz, i) => {
        const fz = z > 0.6 ? hz : [8000, 5000, 2000][i];
        const p = S.toLocal(s, fz); spec.localToWorld(p); const q = project(p, camera);
        ticks[i].innerHTML = fz >= 1000 ? `${fz / 1000} kHz` : `${fz} Hz`;
        place(ticks[i], 1030, q.y, 1, 0.5); ticks[i].style.opacity = rev * (q.y > FEED.top + 20 && q.y < 760 ? 0.85 : 0);
      });
      pitch.style.opacity = time.style.opacity = rev;
      // ellipse around the faint plane
      const ep = project(S.toWorld(L1[0], L1[3]), camera);
      ell.setAttribute('cx', ep.x); ell.setAttribute('cy', ep.y);
      ell.setAttribute('stroke-dashoffset', 700 * (1 - sr(t, 26.3, 26.9)));
      ell.style.opacity = 1 - ramp(t, 30.5, 30.9);
      place(tag, ep.x, ep.y - 80, 0.5, 1); tag.style.opacity = ramp(t, 26.8, 27.2) * (1 - ramp(t, 30.4, 30.8));
      // audio waveform "listen"
      const wa = ramp(t, 18.9, 19.3) * (1 - ramp(t, 22.4, 22.9));
      const pts = []; for (let i = 0; i <= 200; i++) { const x = 70 + i * 4.7; const k = i / 200; const env = 0.25 + 0.75 * Math.abs(Math.sin(k * 9 + t * 1.3)) * Math.abs(Math.sin(k * 23 - t * 2)); pts.push([x, 1215 + Math.sin(i * 1.9 + t * 40) * 26 * env * Math.sin(k * Math.PI)]); }
      wave.setAttribute('d', pathD(pts)); wave.style.opacity = wa; waveLbl.style.opacity = wa;
      // 920 s counter
      const cA = ramp(t, 30.6, 30.9) * (1 - ramp(t, 33.2, 33.6));
      big.textContent = `+${Math.round(920 * sr(t, 30.7, 32.6, ease.expoInOut))} s`;
      place(big, 540, 420, 0.5, 0.5); big.style.opacity = cA;
      // red trace along the second line
      const tr = sr(t, 34.1, 35.4, ease.inOut);
      const tp = []; for (let i = 0; i <= 120; i++) { const ts = L2[0] - 9 + i * 18 / 120; if (ts > s) break; tp.push(project(S.toWorld(ts, lineF(L2, 0.4, ts)), camera)); }
      const pp = partial(tp.map((p) => [p.x, p.y]), tr);
      trace.setAttribute('d', pp.length > 1 ? pathD(pp) : ''); trace.style.opacity = ramp(t, 34.1, 34.2);
      const last = pp[pp.length - 1] || [0, 0]; head.setAttribute('cx', last[0]); head.setAttribute('cy', last[1]); head.style.opacity = tr > 0 && tr < 1 ? 1 : (tr >= 1 ? 1 : 0);
    },
  };
}
