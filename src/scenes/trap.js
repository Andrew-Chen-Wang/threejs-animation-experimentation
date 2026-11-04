import * as THREE from 'three';
import { makeStage } from '../lib/stage.js';
import { addLights, plane, person, tree, cloud, ground, WaveRing, lam } from '../lib/objects.js';
import { heardCurve, emitTimeFor } from '../lib/doppler.js';
import { ChartCard } from '../lib/chart.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, svgEl } from '../lib/util.js';

const C = 7;
export default function build({ hud }) {
  const { scene, camera } = makeStage({ bg: P.sky, fov: 40, fog: [40, 120] });
  addLights(scene, { size: 30, dir: [-8, 20, 14] });
  scene.add(ground(300, { repeat: 34 }));
  [[-14, -18], [-9, -20], [-4, -19], [10, -17], [15, -21], [20, -18], [-22, -20]].forEach(([x, z], i) => { const t = tree(150 + i, { h: 3 + (i % 3) * 0.7 }); t.position.set(x, 0, z); scene.add(t); });
  [[-10, 16, -40, 9], [12, 19, -48, 11], [26, 13, -42, 7]].forEach(([x, y, z, w], i) => { const c = cloud(20 + i, w); c.position.set(x, y, z); scene.add(c); });
  const you = person(); you.position.set(-1, 0, 2); you.rotation.y = 0.5; scene.add(you);
  const pl = plane({ scale: 0.9 }); scene.add(pl);
  const ghost = plane({ scale: 0.9 }); scene.add(ghost);
  ghost.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.28; o.material.depthWrite = false; o.castShadow = false; } });
  const path = (te, out = new THREE.Vector3()) => out.set(-16 + (te - 104.2) * 3.9, 10, 0);
  const L = new THREE.Vector3(-1, 1.6, 2);
  const rings = Array.from({ length: 14 }, () => { const w = new WaveRing(P.ink, 0.4, 0.06); scene.add(w.mesh); return w; });
  const hot = new WaveRing(P.red, 1, 0.1); scene.add(hot.mesh);
  const svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;inset:0;overflow:visible' }, hud);
  const soundLn = svgEl('line', { stroke: P.red, 'stroke-width': 4, 'stroke-dasharray': '8 8' }, svg);
  const sightLn = svgEl('line', { stroke: P.ink, 'stroke-width': 2.5, 'stroke-dasharray': '3 7' }, svg);
  const wasL = el('div', 'lbl', hud, 'WHERE IT WAS<br/><span style="font-size:16px;color:#8a8378">WHAT YOU HEAR</span>'); wasL.style.textAlign = 'center'; wasL.style.fontSize = '21px';
  const isL = el('div', 'lbl red', hud, 'WHERE IT IS'); isL.style.fontSize = '21px';
  const chart = new ChartCard(hud, { x: 60, y: 1000, w: 960, h: 260, title: 'PREDICTED vs HEARD', right: '', pad: [64, 220, 34, 40] });
  const xd = [104, 113], yd = [0.6, 1.6];
  const X = el('div', 'stamp', hud, 'NO MATCH'); X.style.fontSize = '30px';
  const tmp = new THREE.Vector3(), g = new THREE.Vector3();
  const heard = heardCurve(path, L, C, 1, 100, 116, 300);
  // naive: assumes you hear the plane where it is right now
  const naive = heard.map((d) => ({ tr: d.te, f: d.f }));
  return {
    scene, camera, caption: { y: 1420 },
    update(t) {
      path(t, pl.position); pl.userData.spin(t); ghost.userData.spin(t);
      const te = emitTimeFor(path, L, C, t); path(te, ghost.position);
      const ga = ramp(t, 106.3, 106.8);
      ghost.visible = ga > 0.01;
      rings.forEach((w, k) => {
        const tk = 104.4 + k * 0.6, age = t - tk;
        if (age < 0) { w.mesh.visible = false; return; }
        path(tk, tmp); w.mesh.visible = true; w.mesh.position.copy(tmp).setZ(-0.5); w.set(C * age, 'xy', 0.07);
        w.mat.opacity = 0.45 * Math.max(0, 1 - age / 4.5);
      });
      hot.mesh.position.copy(ghost.position).setZ(-0.4); hot.set(C * (t - te), 'xy', 0.1); hot.mat.opacity = ga;
      // camera: side view, slight drift
      const k = sr(t, 104.2, 112.9, ease.sine);
      camera.position.set(lerp(-2, 4, k), 5.5, 30); camera.lookAt(lerp(-1, 3, k), 6.4, 0); camera.updateMatrixWorld();
      const p = project(pl.position, camera), q = project(ghost.position, camera), y = project(g.copy(L).setY(1.7), camera);
      soundLn.setAttribute('x1', q.x); soundLn.setAttribute('y1', q.y); soundLn.setAttribute('x2', y.x); soundLn.setAttribute('y2', y.y); soundLn.style.opacity = ga;
      sightLn.setAttribute('x1', p.x); sightLn.setAttribute('y1', p.y); sightLn.setAttribute('x2', y.x); sightLn.setAttribute('y2', y.y); sightLn.style.opacity = ramp(t, 108.4, 108.9);
      place(wasL, q.x, q.y - 70, 0.5, 1); wasL.style.opacity = ga;
      place(isL, p.x, p.y - 70, 0.5, 1); isL.style.opacity = ramp(t, 108.4, 108.9);
      // chart
      const show = ramp(t, 110.2, 110.7);
      chart.opacity = show;
      const R = chart.rect;
      const hp = chart.map(heard.filter((d) => d.tr > xd[0] && d.tr < xd[1]), xd, yd, (d) => d.tr, (d) => d.f);
      const np = chart.map(naive.filter((d) => d.tr > xd[0] && d.tr < xd[1]), xd, yd, (d) => d.tr, (d) => d.f);
      chart.setPath('h', hp, { stroke: P.ink, 'stroke-width': 5 });
      chart.setPath('n', np, { stroke: P.red, 'stroke-width': 5, 'stroke-dasharray': '10 10' });
      chart.text('hl', 'HEARD', R.x1 + 18, hp[hp.length - 1][1] - 4, { fill: P.ink });
      chart.text('nl', 'NO DELAY', R.x1 + 18, np[np.length - 1][1] + 24, { fill: P.red });
      const xs = ramp(t, 111.6, 111.8);
      place(X, 790, 1080, 0.5, 0.5, `rotate(-8deg) scale(${lerp(1.8, 1, ease.out(xs))})`); X.style.opacity = xs;
    },
  };
}
