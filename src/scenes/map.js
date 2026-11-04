import * as THREE from 'three';
import { makeStage, framePt, viewSize } from '../lib/stage.js';
import { buildUSMap, toW, TARGET } from '../lib/usmap.js';
import { spectroPanel } from '../lib/spectro.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, svgEl, fmt, hash1, clamp } from '../lib/util.js';

export default function build({ hud }) {
  const { scene, camera } = makeStage({ bg: '#e4e2dc', fov: 30 });
  scene.add(camera);
  const map = buildUSMap(); scene.add(map.group);
  const D = map.data;
  const tw = toW(...TARGET); const target = new THREE.Vector3(tw[0], 0, tw[1]);
  const red = new THREE.Color(P.red), ink = new THREE.Color('#2a2622'), land = new THREE.Color('#d6d0c3'), c = new THREE.Color();

  // ---- HUD ----
  const hdr = el('div', 'lbl', hud, '08 SEP 2026'); hdr.style.fontSize = '30px'; place(hdr, 540, 300, 0.5, 0);
  const sub = el('div', 'lbl', hud, ''); place(sub, 540, 345, 0.5, 0);
  const clock = el('div', 'big-num', hud, ''); clock.style.fontSize = '84px'; clock.style.color = P.ink;
  const count = el('div', 'big-num', hud, ''); count.style.fontSize = '84px';
  const count2 = el('div', 'big-num', hud, ''); count2.style.fontSize = '84px';
  const strike = el('div', '', hud); Object.assign(strike.style, { position: 'absolute', height: '6px', background: P.red, transformOrigin: '0 50%' });
  const unit = el('div', 'lbl', hud, 'SPOTS THAT HEARD BOTH PLANES'); unit.style.fontSize = '19px';
  // ADS-B card
  const card = el('div', 'card', hud); Object.assign(card.style, { width: '470px', height: '210px', padding: '24px 28px', fontFamily: 'IBM Plex Mono', fontSize: '22px', lineHeight: '1.6', color: P.ink, letterSpacing: '1px' });
  const svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;inset:0;overflow:visible' }, hud);
  hud.insertBefore(svg, card);
  const leader = svgEl('line', { stroke: P.red, 'stroke-width': 3, 'stroke-dasharray': '6 6' }, svg);
  const pdot = svgEl('circle', { r: 10, fill: 'none', stroke: P.red, 'stroke-width': 4 }, svg);
  const airports = D.airports.filter((a) => Math.hypot(a.x - TARGET[0], a.y - TARGET[1]) < 70).slice(0, 14).map((a) => ({ a, e: svgEl('g', {}, svg) }));
  airports.forEach(({ e }) => { svgEl('circle', { r: 22, fill: 'none', stroke: P.ink, 'stroke-width': 3 }, e); svgEl('path', { d: 'M-12 0 L12 0 M0 -9 L0 9 M-5 8 L5 8', stroke: P.ink, 'stroke-width': 3, fill: 'none' }, e); });
  const apLbl = el('div', 'lbl', hud, 'AIRFIELD'); apLbl.style.fontSize = '18px';
  // tracked plane for the ADS-B card: a prop track near the target
  let ti = 0, best = 1e9;
  D.tracks.forEach((tr, i) => { if (tr.kind !== 1) return; const d = Math.hypot(tr.pts[0][0] - TARGET[0] - 40, tr.pts[0][1] - TARGET[1]); if (d < best) { best = d; ti = i; } });

  // ---- "15 minutes of nothing" spectrogram card (camera-attached) ----
  const CD = 6;
  const cardBack = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color('#f6f2ea'), depthTest: false, transparent: true }));
  const vs = viewSize(camera, CD);
  const cw = 960 / 1080 * vs.w, ch = 520 / 1920 * vs.h;
  cardBack.scale.set(cw, ch, 1); cardBack.renderOrder = 20;
  const spec = spectroPanel(cw * 0.94, ch * 0.78, { depthTest: false, transparent: true }); spec.renderOrder = 21;
  const cardG = new THREE.Group(); cardG.add(cardBack, spec); spec.position.set(0, -ch * 0.06, 0.001); camera.add(cardG);
  const S = spec.userData;
  S.setWin(-80, 1080, -20, 220); S.u.uBins.value = 150; S.u.uNoise.value = 0.5;
  S.setLine(0, [60, 14, 6, 100], 1.3, 0); S.setLine(1, [980, 12, 9, 104], 1.9, 0);
  const sLbl = el('div', 'lbl', hud, 'PLANE 1'); const sLbl2 = el('div', 'lbl', hud, 'PLANE 2'); sLbl.style.color = sLbl2.style.color = '#f3eee4';
  const gap = el('div', 'lbl', hud, '15 MIN &nbsp;·&nbsp; NO PLANE'); gap.style.color = '#f3eee4'; gap.style.fontSize = '26px';
  const gapLine = svgEl('path', { stroke: '#f3eee4', 'stroke-width': 3, fill: 'none' }, svg);
  const cardHdr = el('div', 'lbl', hud, 'THE CLIP &nbsp;·&nbsp; PITCH ↑ TIME →'); cardHdr.style.fontSize = '18px';

  const camAt = (t) => {
    const z1 = sr(t, 78.6, 80.2, ease.inOut), z2 = sr(t, 85.6, 87.8, ease.inOut);
    const zoom = z1 * (1 - z2);
    const look = new THREE.Vector3(0, 0, 0.35).lerp(target.clone().add(new THREE.Vector3(0.6, 0, 0.6)), zoom);
    const h = lerp(lerp(48, 44, sr(t, 53, 78, ease.sine)), 13, zoom);
    return { look, h, zoom };
  };

  return {
    scene, camera, caption: { y: 1390 },
    update(t) {
      const { look, h, zoom } = camAt(t);
      camera.position.set(look.x + Math.sin(t * 0.05) * 0.3, h, look.z + h * 0.22); camera.lookAt(look); camera.updateMatrixWorld();

      // planes: live pings, then the day replay
      const liveA = ramp(t, 53.6, 54.3) * (1 - ramp(t, 62.0, 63.2));
      const props = lerp(0.35, 1, sr(t, 59.6, 60.6));
      map.setPlanes(14 + (t - 53) * 0.01, t, { jets: 1, props, size: 30 });
      map.planeMat.uniforms.uAlpha.value = liveA;
      map.planeMat.uniforms.uPingA.value = ramp(t, 53.8, 54.6);
      const day = sr(t, 61.9, 64.3, ease.inOut) * 24;
      const tu = map.trackMat.uniforms;
      tu.uClock.value = t < 61.9 ? -1 : day;
      tu.uJet.value = 1 - sr(t, 66.4, 67.4);
      tu.uProp.value = lerp(1, 0.28, sr(t, 68.0, 69.0)) * (1 - sr(t, 86.8, 88));
      tu.uAll.value = 1;

      // dots
      const dotsOn = t > 68.0;
      const sweep = (a, b, x) => { const p = lerp(-0.15, 1.15, ramp(t, a, b)); return Math.exp(-Math.pow((x - p) / 0.06, 2)); };
      D.dots.forEach((d, i) => {
        if (!dotsOn) { map.dots.set(i, 0, land); return; }
        const xn = d.x / 975;
        const appear = ramp(t, 68.1 + xn * 1.4, 68.4 + xn * 1.4);
        const sw = sweep(70.6, 72.2, xn) + sweep(72.3, 74.4, xn);
        let s = 0.02 * appear * (1 + sw * 0.8);
        c.copy(land).lerp(ink, 0.45 + 0.5 * sw);
        if (d.yes) {
          const ry = ramp(t, 75.3 + xn * 1.1 + d.n * 0.3, 75.6 + xn * 1.1 + d.n * 0.3);
          c.lerp(red, ry); s *= 1 + ry * 0.3;
          if (!d.keep) { const g = ramp(t, 87.5 + d.n * 2.2, 87.8 + d.n * 2.2); c.lerp(land, g); s *= 1 - g * 0.55; }
        } else {
          c.lerp(land, ramp(t, 75.3, 76.3) * 0.5);
        }
        if (d.isTarget) s *= 1 + ramp(t, 89.5, 90.5) * 0.4;
        map.dots.set(i, s, c);
      });
      map.dots.commit();

      // labels
      sub.innerHTML = t < 61.9 ? 'LIVE &nbsp;·&nbsp; ADS-B BROADCASTS' : t < 64.8 ? 'EVERY FLIGHT, ALL DAY' : t < 68.0 ? 'PROPELLER PLANES ONLY' : 'EVERY SPOT IN THE COUNTRY';
      hdr.style.opacity = sub.style.opacity = ramp(t, 53.2, 53.7) * (1 - zoom);
      sub.style.color = t >= 64.8 && t < 68 ? P.red : P.ink;
      clock.textContent = `${String(Math.floor(day)).padStart(2, '0')}:${String(Math.floor((day % 1) * 60)).padStart(2, '0')} UTC`;
      place(clock, 540, 470, 0.5, 0); clock.style.opacity = ramp(t, 61.9, 62.2) * (1 - ramp(t, 67.6, 68.1));
      // counters
      const cA = ramp(t, 75.4, 75.8) * (1 - ramp(t, 78.5, 78.9)) + ramp(t, 87.3, 87.7);
      count.textContent = '≈ ' + fmt(70000 * sr(t, 75.4, 77.4, ease.out));
      place(count, 540, 455, 0.5, 0); count.style.opacity = Math.min(1, cA);
      count.style.color = t > 89.7 ? '#9d968a' : P.red;
      const st = sr(t, 89.4, 89.9);
      const cr = count.getBoundingClientRect ? null : null;
      strike.style.width = '420px'; place(strike, 330, 510, 0, 0.5, `scaleX(${st})`); strike.style.opacity = count.style.opacity;
      count2.textContent = fmt(15000); place(count2, 540, 560, 0.5, 0); count2.style.opacity = ramp(t, 90.5, 90.8);
      place(unit, 540, t > 90.5 ? 665 : 560, 0.5, 0); unit.style.opacity = Math.min(1, cA) * (t > 89.4 && t < 90.5 ? 0 : 1);
      unit.innerHTML = t > 90.5 ? 'SPOTS LEFT' : 'SPOTS THAT HEARD BOTH PLANES';

      // ADS-B card
      const ca = ramp(t, 55.3, 55.8) * (1 - ramp(t, 61.6, 62.0));
      const tr = D.tracks[ti]; const hour = 14 + (t - 53) * 0.01;
      const lt = (((hour - tr.t0) % 24) + 24) % 24; const dur = tr.t1 - tr.t0; const kk = Math.min(1, (lt % dur) / dur) * (tr.pts.length - 1);
      const j = Math.min(tr.pts.length - 2, Math.floor(kk)); const ax = tr.pts[j][0] + (tr.pts[j + 1][0] - tr.pts[j][0]) * (kk - j), ay = tr.pts[j][1] + (tr.pts[j + 1][1] - tr.pts[j][1]) * (kk - j);
      const [wx, wz] = toW(ax, ay); const pp = project(new THREE.Vector3(wx, 0, wz), camera);
      const sec = Math.floor(t); const jitter = (n) => (hash1(sec * 7 + n) - 0.5);
      card.innerHTML = `<div style="display:flex;justify-content:space-between;font-weight:600;color:#c23a2c;font-size:18px;letter-spacing:3px"><span>ADS-B BROADCAST</span><span>${sec % 2 ? '●' : '○'} 1 / SEC</span></div>
        <div style="font-weight:600">N4127K &nbsp;·&nbsp; SINGLE PROP</div>
        <div>${(38.5127 + jitter(1) * 0.002).toFixed(4)}° N &nbsp; ${(96.881 + jitter(2) * 0.002).toFixed(4)}° W</div>
        <div>${fmt(2450 + Math.round(jitter(3) * 40))} FT &nbsp;·&nbsp; ${112 + Math.round(jitter(4) * 4)} KT</div>`;
      place(card, 545, 1030, 0, 0); card.style.opacity = ca;
      leader.setAttribute('x1', pp.x); leader.setAttribute('y1', pp.y); leader.setAttribute('x2', 545); leader.setAttribute('y2', 1030);
      leader.style.opacity = ca; pdot.setAttribute('cx', pp.x); pdot.setAttribute('cy', pp.y); pdot.style.opacity = ca;

      // airports in the zoomed view
      airports.forEach(({ a, e }, k) => {
        const [x, z] = toW(a.x, a.y); const q = project(new THREE.Vector3(x, 0, z), camera);
        e.setAttribute('transform', `translate(${q.x},${q.y}) scale(${0.6 + zoom * 0.6})`);
        e.style.opacity = ramp(t, 78.9 + k * 0.08, 79.3 + k * 0.08) * (1 - ramp(t, 85.4, 86));
        if (k === 0) { place(apLbl, q.x, q.y + 30, 0.5, 0); apLbl.style.opacity = e.style.opacity; }
      });

      // spectrogram card (silence between the planes)
      const sa = sr(t, 80.3, 80.9, ease.out) * (1 - sr(t, 85.2, 85.8, ease.in));
      cardG.visible = sa > 0.001;
      const cp = framePt(camera, CD, 540, lerp(2400, 660, sa));
      cardG.position.copy(cp); cardG.rotation.z = (1 - sa) * 0.08;
      S.u.uReveal.value = sr(t, 80.6, 81.6);
      const fx = (tt) => project(S.toWorld(tt, 0), camera).x;
      const yTop = 660 - 190, yLine = project(S.toWorld(0, 100), camera).y;
      place(sLbl, fx(60), yTop, 0.5, 0); place(sLbl2, fx(980), yTop, 0.5, 0);
      sLbl.style.opacity = sLbl2.style.opacity = sa;
      const gx0 = fx(140), gx1 = fx(900), gy = 660 + 40;
      gapLine.setAttribute('d', `M${gx0} ${gy - 18} L${gx0} ${gy} L${gx1} ${gy} L${gx1} ${gy - 18}`);
      gapLine.style.opacity = ramp(t, 81.9, 82.3) * sa;
      place(gap, (gx0 + gx1) / 2, gy - 50, 0.5, 0.5); gap.style.opacity = ramp(t, 82.1, 82.5) * sa;
      place(cardHdr, 92, 660 - 238, 0, 0); cardHdr.style.opacity = sa;
    },
  };
}
