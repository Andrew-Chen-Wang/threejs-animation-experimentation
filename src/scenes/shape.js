// CHAPTER 4 · THE PROOF (part 1): the exact shape of the line.
// Linked highlight: the biggest bend in the heard curve is circled, and so is the part of the flight that caused it.
// Then small multiples: three spots, three different predicted lines, same axes.
import * as THREE from 'three';
import { makeStage } from '../lib/stage.js';
import { addLights, plane, person, tree, ground, lam } from '../lib/objects.js';
import { heardCurve } from '../lib/doppler.js';
import { ChartCard } from '../lib/chart.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, partial, svgEl, pathD } from '../lib/util.js';

const C = 16;
export default function build({ hud }) {
  const { scene, camera } = makeStage({ bg: P.paper, fov: 38, fog: [50, 130] });
  addLights(scene, { size: 40, dir: [-10, 26, 12] });
  scene.add(ground(300, { repeat: 30 }));
  [[-12, -8], [-10, -9.5], [9, -11], [12, -7], [-16, 6], [14, 8], [3, 12], [-4, -15], [18, -2]].forEach(([x, z], i) => { const t = tree(110 + i, { h: 2.4 + (i % 3) * 0.6 }); t.position.set(x, 0, z); scene.add(t); });
  const pl = plane({ scale: 0.8 }); scene.add(pl);
  const trailMat = lam(P.p1); let trail = null;
  const W = { k: 0 };
  const path = (te, out = new THREE.Vector3()) => {
    const u = te - 98.5, k = W.k;
    return out.set(5.2 * u + k * 2.2 * Math.sin(u * 0.9), 5 + k * 1.8 * Math.sin(u * 0.6 + 1.0), -5 + k * (4.2 * Math.sin(u * 0.45 + 0.6) + 1.2 * Math.sin(u * 1.3)));
  };
  const SP = [[0, 0, 'A'], [-9, 6, 'B'], [9, -13, 'C']].map(([x, z, n]) => {
    const g = new THREE.Group();
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.ink), transparent: true, depthWrite: false }));
    d.rotation.x = -Math.PI / 2; d.position.y = 0.04; g.add(d); g.position.set(x, 0, z); scene.add(g);
    const lbl = el('div', 'lbl', hud, n === 'A' ? 'SPOT A' : 'SPOT ' + n); lbl.style.fontSize = '20px';
    return { g, lbl, n, L: new THREE.Vector3(x, 1.6, z) };
  });
  const you = person(); scene.add(you);
  const mark = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.09, 8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.red) })); scene.add(mark);

  const chart = new ChartCard(hud, { x: 60, y: 905, w: 960, h: 330, title: 'WHAT SPOT A WOULD HEAR', right: 'PITCH ↑ &nbsp;&nbsp; TIME →', pad: [70, 50, 40, 40] });
  const legend = el('div', 'lbl', hud, ''); legend.style.fontSize = '18px';
  const bendL = el('div', 'lbl red', hud, 'A TURN'); bendL.style.fontSize = '20px';
  const bendL3 = el('div', 'lbl red', hud, 'THIS TURN'); bendL3.style.fontSize = '20px';
  const xd = [91.5, 106], yd = [0.62, 1.48];
  // small multiples card
  const mc = el('div', 'card', hud); Object.assign(mc.style, { left: '60px', top: '860px', width: '960px', height: '400px' });
  const msvg = svgEl('svg', { width: 960, height: 400, style: 'position:absolute;inset:0' }, mc);
  svgEl('text', { x: 26, y: 40, 'font-family': 'IBM Plex Mono', 'font-size': 18, 'font-weight': 600, 'letter-spacing': 3, fill: '#4a453d' }, msvg).textContent = 'EACH SPOT HEARS ITS OWN LINE';
  const minis = ['A', 'B', 'C'].map((n, i) => {
    const x0 = 26 + i * 308, w = 290;
    svgEl('rect', { x: x0, y: 64, width: w, height: 300, rx: 6, fill: '#efe9dd' }, msvg);
    svgEl('text', { x: x0 + 14, y: 94, 'font-family': 'IBM Plex Mono', 'font-size': 18, 'font-weight': 600, 'letter-spacing': 2, fill: P.ink }, msvg).textContent = 'SPOT ' + n;
    return { x0, w, p: svgEl('path', { fill: 'none', stroke: P.ink, 'stroke-width': 5, 'stroke-linecap': 'round' }, msvg) };
  });
  const tmp = new THREE.Vector3(), q = new THREE.Vector3();
  return {
    scene, camera, caption: { y: 1420 },
    update(t) {
      W.k = sr(t, 95.3, 96.8, ease.inOut);
      path(t, pl.position); path(t + 0.05, q);
      pl.lookAt(q); pl.rotateY(-Math.PI / 2); pl.userData.spin(t);
      if (trail) { scene.remove(trail); trail.geometry.dispose(); }
      const pts = []; for (let i = 0; i <= 60; i++) pts.push(path(t - 9 + i * 9 / 60, new THREE.Vector3()));
      trail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.08, 6), trailMat); trail.castShadow = true; scene.add(trail);
      const spread = sr(t, 100.3, 101.6, ease.inOut);
      const follow = new THREE.Vector3(pl.position.x * 0.9, 3, -3).lerp(new THREE.Vector3(0, 0, -2), spread);
      camera.position.set(follow.x - 6 + 2 * spread, lerp(11, 30, spread), lerp(16, 24, spread)); camera.lookAt(follow); camera.updateMatrixWorld();
      you.position.set(0, 0, 0.8); you.rotation.y = Math.atan2(pl.position.x, pl.position.z);
      SP.forEach((s, i) => {
        const a = i === 0 ? ramp(t, 92.4, 92.9) : ramp(t, 100.7 + i * 0.25, 101.0 + i * 0.25);
        s.g.scale.setScalar(Math.max(0.001, ease.back(a)));
        const p = project(s.g.position.clone().setY(0.2), camera); place(s.lbl, p.x, p.y + 24, 0.5, 0); s.lbl.style.opacity = a;
      });
      // chart for spot A: straight-line guess (dotted) vs the real, wobbly flight (blue)
      const kk = W.k; W.k = 0; const ghost = heardCurve(path, SP[0].L, C, 1, 90, 107, 300); W.k = kk;
      const real = heardCurve(path, SP[0].L, C, 1, 88, 107, 360).filter((d) => d.tr > xd[0] && d.tr < xd[1]);
      chart.setPath('ghost', chart.map(ghost.filter((d) => d.tr > xd[0] && d.tr < xd[1]), xd, yd, (d) => d.tr, (d) => d.f), { stroke: '#b9b09f', 'stroke-width': 4, 'stroke-dasharray': '2 9', opacity: ramp(t, 95.4, 96) });
      const rp = chart.map(real, xd, yd, (d) => d.tr, (d) => d.f).filter((_, j) => real[j].tr <= t + 0.001);
      chart.setPath('real', rp, { stroke: P.p1, 'stroke-width': 6 });
      // linked highlight: biggest deviation from the straight-line guess
      let bi = -1, bv = 0; real.forEach((d, j) => { if (d.tr > t || d.tr < 96) return; const g = ghost.reduce((a, b) => (Math.abs(b.tr - d.tr) < Math.abs(a.tr - d.tr) ? b : a)); const dv = Math.abs(g.f - d.f); if (dv > bv) { bv = dv; bi = j; } });
      const hl = ramp(t, 98.4, 98.9) * (1 - ramp(t, 100.3, 100.6));
      if (bi >= 0) {
        const cpt = chart.map([real[bi]], xd, yd, (d) => d.tr, (d) => d.f)[0];
        chart.setPath('hl', [[cpt[0] - 26, cpt[1]], [cpt[0] + 26, cpt[1]]], { stroke: P.red, 'stroke-width': 0 });
        const ring = chart.path('ring', {}); ring.setAttribute('d', `M${cpt[0] - 30} ${cpt[1]} a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0`); ring.setAttribute('stroke', P.red); ring.setAttribute('stroke-width', 4); ring.style.opacity = hl;
        place(bendL, 60 + cpt[0], 905 + cpt[1] - 40, 0.5, 1); bendL.style.opacity = hl; bendL.textContent = 'BEND IN THE LINE';
        path(real[bi].te, mark.position); mark.lookAt(camera.position); mark.visible = hl > 0.01; mark.scale.setScalar(Math.max(0.001, hl));
        const mp = project(mark.position, camera); place(bendL3, mp.x, mp.y - 60, 0.5, 1); bendL3.style.opacity = hl; bendL3.textContent = 'CAUSED BY THIS TURN';
      } else { mark.visible = false; bendL.style.opacity = bendL3.style.opacity = 0; }
      legend.innerHTML = '<span style="color:#a39a8a">··· IF IT FLEW STRAIGHT</span> &nbsp; <span style="color:#2f6690">— THE REAL FLIGHT</span>';
      place(legend, 540, 1215, 0.5, 0.5); legend.style.opacity = ramp(t, 95.5, 96) * (1 - ramp(t, 100.4, 100.7));
      chart.opacity = ramp(t, 92.4, 92.9) * (1 - ramp(t, 100.4, 100.8));
      // small multiples
      const ma = ramp(t, 100.6, 101.0); mc.style.opacity = ma; mc.style.display = ma > 0 ? 'block' : 'none';
      SP.forEach((s, i) => {
        const m = minis[i]; const cv = heardCurve(path, s.L, C, 1, 88, 107, 300).filter((d) => d.tr > 92 && d.tr < 105.5);
        const pts2 = cv.map((d) => [m.x0 + 14 + (d.tr - 92) / 13.5 * (m.w - 28), 340 - (d.f - 0.62) / 0.86 * 220]);
        m.p.setAttribute('d', pathD(partial(pts2, sr(t, 101.0 + i * 0.35, 102.2 + i * 0.35))));
      });
    },
  };
}
