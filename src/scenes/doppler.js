// CHAPTER 2 · READING THE LINE
// 1. Linked view: the plane above, what you hear below, a "now" dot tying them together.
// 2. Small multiples: change ONE thing (speed, then distance) and compare side by side.
// 3. Read the curve: drop size -> speed, steepness -> closest distance, midpoint -> when.
import * as THREE from 'three';
import { makeStage } from '../lib/stage.js';
import { addLights, plane, person, tree, ground, WaveRing, lam, mesh } from '../lib/objects.js';
import { heardCurve } from '../lib/doppler.js';
import { ChartCard } from '../lib/chart.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, clamp, svgEl, pathD } from '../lib/util.js';

const C = 20, H = 3.2;
const RUN = { t0: 36.2, tca: 39.25, v: 5, d: 6 };
const curveFor = (v, d) => heardCurve((te, o = new THREE.Vector3()) => o.set(v * te, H, -d), new THREE.Vector3(0, 1.6, 0), C, 1, -8, 8, 400);

function panel(parent, x, y, w, title) {
  const g = svgEl('g', { transform: `translate(${x},${y})` }, parent);
  svgEl('text', { x: 0, y: 0, 'font-family': 'IBM Plex Mono', 'font-size': 22, 'font-weight': 600, 'letter-spacing': 3, fill: P.ink }, g).textContent = title;
  // mini map
  const mapY = 34, mapH = 330;
  svgEl('rect', { x: 0, y: mapY, width: w, height: mapH, fill: '#ece6d8', rx: 6 }, g);
  const cid = 'clip' + Math.round(x);
  const cp = svgEl('clipPath', { id: cid }, g); svgEl('rect', { x: 0, y: mapY, width: w, height: mapH, rx: 6 }, cp);
  const track = svgEl('line', { x1: 10, x2: w - 10, stroke: '#b8ae9a', 'stroke-width': 3, 'stroke-dasharray': '8 8' }, g);
  const rings = svgEl('g', { 'clip-path': `url(#${cid})` }, g);
  const you = svgEl('circle', { r: 10, fill: P.red }, g);
  const youT = svgEl('text', { 'font-family': 'IBM Plex Mono', 'font-size': 15, 'font-weight': 600, fill: P.red, 'letter-spacing': 2 }, g); youT.textContent = 'YOU';
  const pl = svgEl('path', { d: 'M18 0 L-12 -10 L-6 0 L-12 10 Z M3 -18 L8 -18 L8 18 L3 18 Z', fill: P.ink }, g);
  const dist = svgEl('path', { stroke: P.ink, 'stroke-width': 2, fill: 'none' }, g);
  const distT = svgEl('text', { 'font-family': 'IBM Plex Mono', 'font-size': 14, 'font-weight': 600, fill: P.ink, 'letter-spacing': 1 }, g);
  // chart
  const cy = mapY + mapH + 36, ch = 400;
  svgEl('rect', { x: 0, y: cy, width: w, height: ch, fill: '#f6f2ea', rx: 6, stroke: '#ddd5c4' }, g);
  const base = svgEl('line', { x1: 14, x2: w - 14, stroke: '#b8ae9a', 'stroke-width': 2, 'stroke-dasharray': '5 7' }, g);
  const ghost = svgEl('path', { fill: 'none', stroke: '#c9c0ae', 'stroke-width': 4 }, g);
  const cur = svgEl('path', { fill: 'none', stroke: P.p1, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
  const dot = svgEl('circle', { r: 11, fill: P.p1, stroke: '#f6f2ea', 'stroke-width': 3 }, g);
  const br = svgEl('path', { fill: 'none', stroke: P.red, 'stroke-width': 4 }, g);
  const brT = svgEl('text', { 'font-family': 'IBM Plex Mono', 'font-size': 18, 'font-weight': 600, fill: P.red, 'letter-spacing': 2 }, g);
  return { g, w, mapY, mapH, cy, ch, track, rings, you, youT, pl, dist, distT, base, ghost, cur, dot, br, brT, ringEls: [] };
}

export default function build({ hud }) {
  const { scene, camera } = makeStage({ bg: P.paper, fov: 36, fog: [60, 140] });
  addLights(scene, { size: 30, dir: [-8, 24, 14] });
  scene.add(ground(300, { repeat: 26 }));
  const road = mesh(new THREE.PlaneGeometry(200, 2.2), lam('#cfc7b5'), { shadow: true }); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 3.2); scene.add(road);
  for (let i = -40; i < 40; i++) { const m = mesh(new THREE.PlaneGeometry(1.2, 0.12), lam('#f3efe5'), { shadow: false }); m.rotation.x = -Math.PI / 2; m.position.set(i * 2.6, 0.02, 3.2); scene.add(m); }
  [[-9, 9], [-7, 10.5], [8, 10], [11, 8.5], [-13, -10], [5, -12], [14, -9], [-3, -14]].forEach(([x, z], i) => { const t = tree(70 + i, { h: 2.6 + (i % 3) * 0.5 }); t.position.set(x, 0, z); scene.add(t); });
  const you = person(); you.rotation.y = Math.PI * 0.85; scene.add(you);
  const youDot = new THREE.Mesh(new THREE.CircleGeometry(0.45, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.red), transparent: true, opacity: 0.85, depthWrite: false })); youDot.rotation.x = -Math.PI / 2; youDot.position.y = 0.03; scene.add(youDot);
  const pl = plane({ scale: 0.75 }); scene.add(pl);
  const rings = Array.from({ length: 48 }, () => { const w = new WaveRing(P.ink, 0.5, 0.07); scene.add(w.mesh); return w; });
  const path = (te, o = new THREE.Vector3()) => o.set(RUN.v * (te - RUN.tca), H, -RUN.d);

  // ---- phase 1 HUD: linked chart ----
  const chart = new ChartCard(hud, { x: 60, y: 905, w: 960, h: 330, title: 'WHAT YOU HEAR', right: 'PITCH ↑ &nbsp;&nbsp; TIME →', pad: [70, 60, 54, 40] });
  const R = chart.rect, xd = [-3.2, 3.2], yd = [0.6, 1.8];
  const yBase = chart.map([[0, 1]], xd, yd)[0][1];
  chart.setPath('base', [[R.x0, yBase], [R.x1, yBase]], { stroke: '#a39a8a', 'stroke-width': 2, 'stroke-dasharray': '6 8' });
  chart.text('baseT', "ENGINE'S TRUE PITCH", R.x1, yBase - 10, { 'text-anchor': 'end', 'font-size': 14, fill: '#8a8378' });
  const youL = el('div', 'lbl red', hud, 'YOU'); youL.style.fontSize = '24px';
  const sq = el('div', 'lbl', hud, 'SQUEEZED'); sq.style.fontSize = '20px';
  const st = el('div', 'lbl', hud, 'STRETCHED'); st.style.fontSize = '20px';
  const curve1 = curveFor(RUN.v, RUN.d);

  // ---- phases 2-4 HUD: comparison card ----
  const card = el('div', 'card', hud); Object.assign(card.style, { left: '60px', top: '120px', width: '960px', height: '1130px' });
  const csvg = svgEl('svg', { width: 960, height: 1130, viewBox: '0 0 960 1130', style: 'position:absolute;inset:0;overflow:visible' }, card);
  const head = svgEl('text', { x: 36, y: 62, 'font-family': 'IBM Plex Mono', 'font-size': 26, 'font-weight': 600, 'letter-spacing': 4, fill: '#4a453d' }, csvg);
  const sub = svgEl('text', { x: 36, y: 96, 'font-family': 'IBM Plex Mono', 'font-size': 18, 'font-weight': 500, 'letter-spacing': 2, fill: '#8a8378' }, csvg);
  const A = panel(csvg, 36, 160, 420, ''), B = panel(csvg, 504, 160, 420, '');
  const big = svgEl('g', {}, csvg);
  const bigCurve = svgEl('path', { fill: 'none', stroke: P.p1, 'stroke-width': 9, 'stroke-linecap': 'round' }, big);
  const bigBase = svgEl('line', { x1: 60, x2: 900, stroke: '#a39a8a', 'stroke-width': 2, 'stroke-dasharray': '6 8' }, big);
  const ann = [0, 1, 2].map(() => ({ p: svgEl('path', { fill: 'none', stroke: P.red, 'stroke-width': 4 }, big), t: svgEl('text', { 'font-family': 'IBM Plex Mono', 'font-size': 22, 'font-weight': 600, fill: P.red, 'letter-spacing': 2 }, big), s: svgEl('text', { 'font-family': 'IBM Plex Mono', 'font-size': 17, 'font-weight': 500, fill: '#6d665a', 'letter-spacing': 1 }, big) }));
  const rd = svgEl('text', { x: 480, y: 1060, 'text-anchor': 'middle', 'font-family': 'IBM Plex Mono', 'font-size': 26, 'font-weight': 600, 'letter-spacing': 2 }, csvg);

  const pxU = 21; // svg px per world unit in the mini maps
  function drawPanel(pn, v, d, tau, tcaL, ghostCurve, label) {
    const { w, mapY, mapH, cy, ch } = pn;
    const ty = mapY + 90, ly = ty + d * pxU;
    pn.track.setAttribute('y1', ty); pn.track.setAttribute('y2', ty);
    pn.you.setAttribute('cx', w / 2); pn.you.setAttribute('cy', ly);
    pn.youT.setAttribute('x', w / 2 + 16); pn.youT.setAttribute('y', ly + 6);
    const te = tau - tcaL, px = w / 2 + v * te * pxU;
    pn.pl.setAttribute('transform', `translate(${px},${ty})`);
    pn.dist.setAttribute('d', `M${w / 2 - 30} ${ty} L${w / 2 - 30} ${ly}`);
    pn.distT.setAttribute('x', w / 2 - 40); pn.distT.setAttribute('y', (ty + ly) / 2 + 5); pn.distT.setAttribute('text-anchor', 'end'); pn.distT.textContent = d > 3 ? 'FAR' : 'NEAR';
    // rings (clipped to the map by skipping big ones)
    const n = 14; while (pn.ringEls.length < n) pn.ringEls.push(svgEl('circle', { fill: 'none', stroke: '#7d7568', 'stroke-width': 2 }, pn.rings));
    pn.ringEls.forEach((c, k) => {
      const tk = Math.floor(te / 0.22) * 0.22 - k * 0.22, age = te - tk;
      const r = C * age * pxU, cx = w / 2 + v * tk * pxU;
      c.setAttribute('cx', cx); c.setAttribute('cy', ty); c.setAttribute('r', Math.max(0, r));
      c.style.opacity = Math.max(0, 0.75 - age / 1.8);
    });
    // chart
    const xd2 = [-1.6, 1.6], yd2 = [0.6, 1.8];
    const mx = (x) => 14 + (x - xd2[0]) / (xd2[1] - xd2[0]) * (w - 28), my = (y) => cy + ch - 16 - (y - yd2[0]) / (yd2[1] - yd2[0]) * (ch - 32);
    pn.base.setAttribute('y1', my(1)); pn.base.setAttribute('y2', my(1));
    const cv = curveFor(v, d).filter((p) => p.tr > xd2[0] && p.tr < xd2[1]);
    const shown = cv.filter((p) => p.tr <= te);
    pn.cur.setAttribute('d', shown.length > 1 ? pathD(shown.map((p) => [mx(p.tr), my(p.f)])) : '');
    const last = shown[shown.length - 1]; pn.dot.style.opacity = last ? 1 : 0; if (last) { pn.dot.setAttribute('cx', mx(last.tr)); pn.dot.setAttribute('cy', my(last.f)); }
    pn.ghost.setAttribute('d', ghostCurve ? pathD(curveFor(...ghostCurve).filter((p) => p.tr > xd2[0] && p.tr < xd2[1]).map((p) => [mx(p.tr), my(p.f)])) : '');
    return { cv, mx, my };
  }

  return {
    scene, camera, caption: { y: 1420 },
    update(t) {
      // ---- 3D linked view ----
      path(t, pl.position); pl.userData.spin(t);
      rings.forEach((w, k) => {
        const te = RUN.t0 + k * 0.2, age = t - te;
        if (age < 0) { w.mesh.visible = false; return; }
        const p = path(te); w.mesh.visible = true; w.mesh.position.set(p.x, 0.05, p.z);
        w.set(C * age * 0.98, 'xz', 0.08); w.mat.opacity = 0.55 * Math.max(0, 1 - age / 2.8);
      });
      const k = sr(t, 36.2, 42.6, ease.sine);
      camera.position.set(lerp(-3, 2, k), lerp(25, 23, k), lerp(9, 10, k)); camera.lookAt(lerp(-0.3, 0.3, k), 0, 1.0); camera.updateMatrixWorld();
      const yp = project(new THREE.Vector3(0, 2.2, 0), camera); place(youL, yp.x + 26, yp.y - 10, 0, 1); youL.style.opacity = ramp(t, 36.5, 37);
      const ahead = project(path(t).add(new THREE.Vector3(4.2, -H, 1.2)), camera), behind = project(path(t).add(new THREE.Vector3(-5.2, -H, 1.2)), camera);
      place(sq, ahead.x, ahead.y, 0.5, 0.5); sq.style.opacity = ramp(t, 37.9, 38.3) * (1 - ramp(t, 39.6, 39.9));
      place(st, behind.x, behind.y, 0.5, 0.5); st.style.opacity = ramp(t, 40.9, 41.3) * (1 - ramp(t, 42.3, 42.6));
      const pts = curve1.filter((d) => d.tr > xd[0] && d.tr < xd[1] && d.tr + RUN.tca <= t);
      const sp = chart.map(pts, xd, yd, (d) => d.tr, (d) => d.f);
      chart.setPath('c', sp, { stroke: P.p1, 'stroke-width': 7 });
      const last = sp[sp.length - 1];
      chart.setPath('now', last ? [[last[0], R.y0], [last[0], R.y1]] : [], { stroke: P.ink, 'stroke-width': 2, opacity: 0.35 });
      if (last) chart.text('nowT', 'NOW', last[0] + 8, R.y0 + 16, { 'font-size': 14 });
      chart.text('hi', 'HIGHER', R.x0 + 10, chart.map([[0, 1.3]], xd, yd)[0][1], { fill: P.red, 'font-size': 18, opacity: ramp(t, 38.9, 39.2) });
      chart.text('lo', 'LOWER', R.x1 - 100, chart.map([[0, 0.72]], xd, yd)[0][1], { fill: P.red, 'font-size': 18, opacity: ramp(t, 41.1, 41.4) });
      chart.opacity = ramp(t, 36.4, 36.9);

      // ---- comparison card ----
      const ca = sr(t, 42.45, 42.85, ease.out);
      card.style.opacity = ca; card.style.transform = `translateY(${(1 - ca) * 40}px)`;
      card.style.display = ca > 0 ? 'block' : 'none';
      if (ca <= 0) return;
      const phase = t < 45.15 ? 'speed' : t < 48.6 ? 'dist' : 'read';
      const showPanels = phase !== 'read';
      A.g.style.display = B.g.style.display = showPanels ? '' : 'none'; big.style.display = showPanels ? 'none' : '';
      if (phase === 'speed') {
        head.textContent = 'CHANGE ONE THING: SPEED'; sub.textContent = 'same distance · same engine';
        const tau = t - 42.6;
        A.g.children[0].textContent = 'SLOW'; B.g.children[0].textContent = 'FAST';
        const a = drawPanel(A, 5, 6, tau, 1.35, null), b = drawPanel(B, 8.5, 6, tau, 1.35, [5, 6]);
        const brk = (pn, r, label) => { const hi = r.cv[0].f, lo = r.cv[r.cv.length - 1].f; const x = pn.w - 30;
          pn.br.setAttribute('d', `M${x - 12} ${r.my(hi)} L${x} ${r.my(hi)} L${x} ${r.my(lo)} L${x - 12} ${r.my(lo)}`); pn.brT.setAttribute('x', x - 20); pn.brT.setAttribute('y', r.my(lo) + 30); pn.brT.setAttribute('text-anchor', 'end'); pn.brT.textContent = label; };
        brk(A, a, 'SMALL DROP'); brk(B, b, 'BIG DROP');
        A.br.style.opacity = A.brT.style.opacity = B.br.style.opacity = B.brT.style.opacity = ramp(t, 44.1, 44.4);
      } else if (phase === 'dist') {
        head.textContent = 'CHANGE ONE THING: DISTANCE'; sub.textContent = 'same speed · same engine';
        const tau = t - 45.2;
        A.g.children[0].textContent = 'FAR'; B.g.children[0].textContent = 'NEAR';
        const a = drawPanel(A, 5, 6, tau, 1.5, null), b = drawPanel(B, 5, 1.6, tau, 1.5, [5, 6]);
        const brk = (pn, r, label) => { // width of the transition (10%-90% of the drop)
          const hi = r.cv[0].f, lo = r.cv[r.cv.length - 1].f; const f1 = hi - (hi - lo) * 0.1, f2 = hi - (hi - lo) * 0.9;
          const p1 = r.cv.find((p) => p.f < f1), p2 = r.cv.find((p) => p.f < f2); if (!p1 || !p2) return;
          const y = r.my(lo) + 26; pn.br.setAttribute('d', `M${r.mx(p1.tr)} ${y - 10} L${r.mx(p1.tr)} ${y} L${r.mx(p2.tr)} ${y} L${r.mx(p2.tr)} ${y - 10}`);
          pn.brT.setAttribute('x', (r.mx(p1.tr) + r.mx(p2.tr)) / 2); pn.brT.setAttribute('y', y - 60); pn.brT.setAttribute('text-anchor', 'middle'); pn.brT.textContent = label; };
        brk(A, a, 'GENTLE'); brk(B, b, 'SHARP');
        A.br.style.opacity = A.brT.style.opacity = B.br.style.opacity = B.brT.style.opacity = ramp(t, 47.3, 47.6);
      } else {
        head.textContent = 'SO ONE LINE TELLS YOU'; sub.textContent = 'plane 1, read off the clip';
        const cv = curveFor(5, 3.5).filter((p) => p.tr > -2 && p.tr < 2);
        const mx = (x) => 90 + (x + 2) / 4 * 780, my = (y) => 760 - (y - 0.6) / 1.2 * 560;
        const draw = cv.filter((p) => mx(p.tr) <= lerp(90, 870, sr(t, 48.6, 49.4)));
        bigCurve.setAttribute('d', pathD(draw.map((p) => [mx(p.tr), my(p.f)])));
        bigBase.setAttribute('y1', my(1)); bigBase.setAttribute('y2', my(1));
        const hi = cv[0].f, lo = cv[cv.length - 1].f;
        const mid = cv.reduce((a, p) => (Math.abs(p.f - 1) < Math.abs(a.f - 1) ? p : a));
        const f1 = hi - (hi - lo) * 0.15, f2 = hi - (hi - lo) * 0.85; const q1 = cv.find((p) => p.f < f1), q2 = cv.find((p) => p.f < f2);
        const set = (i, d, tx, ty, label, s, a) => { ann[i].p.setAttribute('d', d); ann[i].t.setAttribute('x', tx); ann[i].t.setAttribute('y', ty); ann[i].t.textContent = label; ann[i].s.setAttribute('x', tx); ann[i].s.setAttribute('y', ty + 26); ann[i].s.textContent = s; ann[i].p.style.opacity = ann[i].t.style.opacity = ann[i].s.style.opacity = a; };
        set(0, `M880 ${my(hi)} L900 ${my(hi)} L900 ${my(lo)} L880 ${my(lo)}`, 640, my(lo) + 70, 'SIZE OF DROP → SPEED', 'faster plane, bigger drop', ramp(t, 49.5, 49.9));
        set(1, `M${mx(q1.tr)} ${my(f1) - 40} L${mx(q2.tr)} ${my(f2) - 40}`, mx(q2.tr) + 20, my(f1) - 60, 'STEEPNESS → DISTANCE', 'closer pass, sharper drop', ramp(t, 51.2, 51.6));
        set(2, `M${mx(mid.tr)} ${my(mid.f) + 40} L${mx(mid.tr)} 820`, mx(mid.tr) - 200, 860, 'MIDDLE → WHEN IT PASSED', 'to the second, on the clip', ramp(t, 51.9, 52.3));
        rd.innerHTML = `<tspan fill="${P.p1}">PLANE 1 ≈105 KT · 900 M</tspan>`;
        rd.style.opacity = ramp(t, 50.4, 50.8);
      }
    },
  };
}
