import * as THREE from 'three';
import { makeStage } from '../lib/stage.js';
import { addLights, plane, person, tree, ground, WaveRing, lam, mesh } from '../lib/objects.js';
import { heardCurve } from '../lib/doppler.js';
import { ChartCard } from '../lib/chart.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, clamp } from '../lib/util.js';

const C = 20;      // (slowed-down) speed of sound, world units / s
const H = 3.2;     // flight altitude
const RUNS = [
  { t0: 36.2, t1: 42.6, tca: 39.25, v: 5, d: 6, name: 'SLOW' },
  { t0: 42.6, t1: 45.15, tca: 43.9, v: 8.5, d: 6, name: 'FAST' },
  { t0: 45.15, t1: 48.6, tca: 46.75, v: 5, d: 1.6, name: 'CLOSE' },
  { t0: 48.6, t1: 60, tca: 50.6, v: 5, d: 6, name: '' },
];
const runAt = (t) => RUNS.find((r) => t >= r.t0 && t < r.t1) || RUNS[RUNS.length - 1];

export default function build({ hud }) {
  const { scene, camera } = makeStage({ bg: P.paper, fov: 36, fog: [60, 140] });
  addLights(scene, { size: 30, dir: [-8, 24, 14] });
  scene.add(ground(300, { repeat: 26 }));
  const road = mesh(new THREE.PlaneGeometry(200, 2.2), lam('#cfc7b5'), { shadow: true }); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 3.2); scene.add(road);
  const dash = []; for (let i = -40; i < 40; i++) { const m = mesh(new THREE.PlaneGeometry(1.2, 0.12), lam('#f3efe5'), { shadow: false }); m.rotation.x = -Math.PI / 2; m.position.set(i * 2.6, 0.02, 3.2); scene.add(m); dash.push(m); }
  [[-9, 9], [-7, 10.5], [8, 10], [11, 8.5], [-13, -10], [5, -12], [14, -9], [-3, -14]].forEach(([x, z], i) => { const t = tree(70 + i, { h: 2.6 + (i % 3) * 0.5 }); t.position.set(x, 0, z); scene.add(t); });
  const you = person(); you.position.set(0, 0, 0); you.rotation.y = Math.PI * 0.85; scene.add(you);
  const youDot = new THREE.Mesh(new THREE.CircleGeometry(0.45, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.red), transparent: true, opacity: 0.85, depthWrite: false })); youDot.rotation.x = -Math.PI / 2; youDot.position.y = 0.03; scene.add(youDot);
  const pl = plane({ scale: 0.75 }); scene.add(pl);
  const rings = Array.from({ length: 48 }, () => { const w = new WaveRing(P.ink, 0.5, 0.07); scene.add(w.mesh); return w; });
  const L = new THREE.Vector3(0, 1.6, 0);
  const pathFor = (run, z) => (te, out = new THREE.Vector3()) => out.set(run.v * (te - run.tca), H, z);

  // HUD
  const chart = new ChartCard(hud, { x: 60, y: 905, w: 960, h: 330, title: 'WHAT YOU HEAR', right: 'PITCH ↑ &nbsp;&nbsp; TIME →', pad: [70, 150, 54, 40] });
  const R = chart.rect;
  const xd = [-3.2, 3.2], yd = [0.6, 1.8];
  chart.setPath('mid', [[R.x0, chart.map([[0, 1]], xd, yd)[0][1]], [R.x1, chart.map([[0, 1]], xd, yd)[0][1]]], { stroke: '#bdb3a0', 'stroke-width': 2, 'stroke-dasharray': '6 8' });
  const cx = chart.map([[0, 0]], xd, yd)[0][0];
  chart.setPath('vline', [[cx, R.y0], [cx, R.y1]], { stroke: '#bdb3a0', 'stroke-width': 2, 'stroke-dasharray': '6 8' });
  chart.text('lvl', 'PASSING YOU', cx, R.y1 + 34, { 'text-anchor': 'middle', 'font-size': 15 });
  const youL = el('div', 'lbl red', hud, 'YOU'); youL.style.fontSize = '24px';
  const hdrL = el('div', 'lbl', hud, 'FROM ABOVE'); place(hdrL, 60, 110); hdrL.style.fontSize = '20px';
  const hdrR = el('div', 'lbl', hud, 'SOUND SLOWED DOWN'); place(hdrR, 1020, 110, 1, 0); hdrR.style.fontSize = '20px';
  const spd = el('div', 'lbl', hud, ''); spd.style.fontSize = '20px';
  const tmp = new THREE.Vector3();
  const curves = RUNS.map((run) => heardCurve(pathFor(run, -run.d), L, C, 1, run.tca - 8, run.tca + 8, 400));

  return {
    scene, camera, caption: { y: 1420 },
    update(t) {
      const run = runAt(t); const ri = RUNS.indexOf(run);
      const path = pathFor(run, -run.d);
      path(t, pl.position); pl.userData.spin(t);
      pl.rotation.set(0, 0, 0);
      // fade the plane in/out at run edges
      const vis = Math.min(ramp(t, run.t0, run.t0 + 0.25), 1 - ramp(t, run.t1 - 0.25, run.t1));
      pl.scale.setScalar(0.75 * Math.max(0.001, vis));
      // wavefronts
      rings.forEach((w, k) => {
        const te = run.t0 + k * 0.2;
        const age = t - te;
        if (age < 0) { w.mesh.visible = false; return; }
        path(te, tmp); w.mesh.visible = true;
        w.mesh.position.set(tmp.x, 0.05, tmp.z);
        w.set(C * age * 0.98, 'xz', 0.08);
        w.mat.opacity = 0.55 * Math.max(0, 1 - age / 2.8) * vis;
      });
      // camera
      const k = sr(t, 36.2, 52.9, ease.sine);
      camera.position.set(lerp(-3, 2, k), lerp(25, 23, k), lerp(9, 10, k));
      camera.lookAt(lerp(-0.3, 0.3, k), 0, 1.0); camera.updateMatrixWorld();
      const yp = project(tmp.set(0, 2.2, 0), camera);
      place(youL, yp.x + 26, yp.y - 10, 0, 1); youL.style.opacity = ramp(t, 36.5, 37);
      const pp = project(pl.position, camera);
      spd.innerHTML = run.name && vis > 0.5 ? (ri === 1 ? '<span style="color:#c23a2c">FASTER</span>' : ri === 2 ? '<span style="color:#c23a2c">CLOSER</span>' : '') : '';
      place(spd, pp.x, pp.y - 50, 0.5, 1);
      // chart: past runs ghosted, current run drawn live
      RUNS.forEach((r, i) => {
        if (i > ri || i === 3) { chart.setPath('c' + i, []); return; }
        const pts = curves[i].filter((d) => d.tr - r.tca > xd[0] && d.tr - r.tca < xd[1] && (i < ri || d.tr <= t));
        const sp = chart.map(pts, xd, yd, (d) => d.tr - r.tca, (d) => d.f);
        const cur = i === ri;
        chart.setPath('c' + i, sp, { stroke: cur ? P.red : '#a39b8c', 'stroke-width': cur ? 6 : 4 });
        const last = sp[sp.length - 1];
        if (last) chart.text('n' + i, r.name, R.x1 + 16, last[1] + 6, { fill: cur ? P.red : '#8a8378', 'font-size': 16 });
      });
      // final summary annotations
      const sa = ramp(t, 48.9, 49.4), sb = ramp(t, 50.5, 51.0);
      const s0 = chart.map([[0, 1]], xd, yd)[0];
      const top = chart.map([[0, curves[1][0].f]], xd, yd)[0][1], bot = chart.map([[0, curves[1][curves[1].length - 1].f]], xd, yd)[0][1];
      chart.setPath('brk', [[R.x0 + 30, top], [R.x0 + 18, top], [R.x0 + 18, bot], [R.x0 + 30, bot]], { stroke: P.ink, 'stroke-width': 3, opacity: sa });
      chart.text('brkT', 'DROP = SPEED', R.x0 + 40, (top + bot) / 2 + 6, { fill: P.ink, opacity: sa, 'font-size': 15 });
      chart.setPath('slope', [[s0[0] - 34, s0[1] - 70], [s0[0] + 34, s0[1] + 70]], { stroke: P.ink, 'stroke-width': 3, 'stroke-dasharray': '4 6', opacity: sb });
      chart.text('slT', 'STEEPNESS = DISTANCE', s0[0] + 46, s0[1] - 52, { fill: P.ink, opacity: sb, 'font-size': 15 });
      chart.opacity = ramp(t, 36.4, 36.9);
    },
  };
}
