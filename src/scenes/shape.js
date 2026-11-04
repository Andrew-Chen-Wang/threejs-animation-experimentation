import * as THREE from 'three';
import { makeStage } from '../lib/stage.js';
import { addLights, plane, person, tree, ground, lam, mesh } from '../lib/objects.js';
import { heardCurve } from '../lib/doppler.js';
import { ChartCard } from '../lib/chart.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, partial } from '../lib/util.js';

const C = 16;
export default function build({ hud }) {
  const { scene, camera } = makeStage({ bg: P.paper, fov: 38, fog: [50, 130] });
  addLights(scene, { size: 40, dir: [-10, 26, 12] });
  scene.add(ground(300, { repeat: 30 }));
  [[-12, -8], [-10, -9.5], [9, -11], [12, -7], [-16, 6], [14, 8], [3, 12], [-4, -15], [18, -2]].forEach(([x, z], i) => { const t = tree(110 + i, { h: 2.4 + (i % 3) * 0.6 }); t.position.set(x, 0, z); scene.add(t); });
  const you = person(); scene.add(you);
  const pl = plane({ scale: 0.8 }); scene.add(pl);
  const trailMat = lam(P.red); let trail = null;
  const W = { k: 0 };
  const path = (te, out = new THREE.Vector3()) => {
    const u = te - 98.5, k = W.k;
    const x = 5.2 * u + k * 2.2 * Math.sin(u * 0.9);
    const z = -5 + k * (4.2 * Math.sin(u * 0.45 + 0.6) + 1.2 * Math.sin(u * 1.3));
    const y = 5 + k * (1.8 * Math.sin(u * 0.6 + 1.0));
    return out.set(x, y, z);
  };
  const spots = [[0, 0], [-9, 6], [8, 5], [-5, -14], [11, -12]].map(([x, z], i) => {
    const g = new THREE.Group();
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(i === 0 ? P.red : P.ink), transparent: true, depthWrite: false }));
    d.rotation.x = -Math.PI / 2; d.position.y = 0.04; g.add(d); g.position.set(x, 0, z); scene.add(g);
    const lbl = el('div', 'lbl', hud, i === 0 ? 'YOU' : 'SPOT ' + 'ABCDE'[i]); lbl.style.fontSize = '19px'; if (i === 0) lbl.style.color = P.red;
    return { g, d, lbl, L: new THREE.Vector3(x, 1.6, z) };
  });
  const chart = new ChartCard(hud, { x: 60, y: 905, w: 960, h: 330, title: 'PREDICTED LINE', right: 'PITCH ↑ &nbsp;&nbsp; TIME →', pad: [70, 50, 40, 40] });
  const legend = el('div', 'lbl', hud, ''); legend.style.fontSize = '18px';
  const tmp = new THREE.Vector3(), q = new THREE.Vector3();
  const xd = [91.5, 106], yd = [0.62, 1.48];
  return {
    scene, camera, caption: { y: 1420 },
    update(t) {
      W.k = sr(t, 95.3, 96.8, ease.inOut);
      path(t, pl.position); path(t + 0.05, q);
      pl.lookAt(q); pl.rotateY(-Math.PI / 2);
      const lat = path(t + 0.4, new THREE.Vector3()).sub(q).z - q.clone().sub(pl.position).z * 7;
      pl.rotateX(THREE.MathUtils.clamp(lat * 0.5, -0.6, 0.6) * W.k);
      pl.userData.spin(t);
      // trail
      if (trail) { scene.remove(trail); trail.geometry.dispose(); }
      const pts = []; for (let i = 0; i <= 60; i++) { const te = t - 7 + i * 7 / 60; pts.push(path(te, new THREE.Vector3())); }
      trail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.07, 6), trailMat); trail.castShadow = true;
      scene.add(trail);
      // camera
      const k = sr(t, 92.2, 104.2, ease.sine);
      const spread = sr(t, 100.3, 101.6, ease.inOut);
      const follow = new THREE.Vector3(pl.position.x * 0.9, 3, -3).lerp(new THREE.Vector3(1, 0, 3.6), spread);
      camera.position.set(follow.x - 6 + 4 * k, lerp(11, 30, spread), lerp(16, 30, spread));
      camera.lookAt(follow); camera.updateMatrixWorld();
      // spots
      spots.forEach((s, i) => {
        const a = i === 0 ? ramp(t, 92.4, 92.9) : ramp(t, 100.7 + i * 0.25, 101.0 + i * 0.25);
        s.g.scale.setScalar(Math.max(0.001, ease.back(a)));
        const p = project(s.g.position.clone().setY(0.2), camera); place(s.lbl, p.x, p.y + 24, 0.5, 0); s.lbl.style.opacity = a;
      });
      you.position.set(0, 0, 0); you.rotation.y = Math.atan2(pl.position.x, pl.position.z);
      // chart: straight ghost vs real wobble, then a line per spot
      const ghostK = W.k; W.k = 0;
      const ghost = heardCurve(path, spots[0].L, C, 1, 90, 107, 300); W.k = ghostK;
      const R = chart.rect;
      const g = chart.map(ghost.filter((d) => d.tr > xd[0] && d.tr < xd[1]), xd, yd, (d) => d.tr, (d) => d.f);
      chart.setPath('ghost', g, { stroke: '#b9b09f', 'stroke-width': 4, 'stroke-dasharray': '2 9', opacity: ramp(t, 95.4, 96) });
      spots.forEach((s, i) => {
        const cur = heardCurve(path, s.L, C, 1, 88, 107, 360).filter((d) => d.tr > xd[0] && d.tr < xd[1]);
        let sp = chart.map(cur, xd, yd, (d) => d.tr, (d) => d.f);
        if (i === 0) sp = sp.filter((_, j) => cur[j].tr <= t + 0.001 || t > 100.4);
        else sp = partial(sp, sr(t, 100.9 + i * 0.25, 102.4 + i * 0.25));
        const a = i === 0 ? 1 : ramp(t, 100.9 + i * 0.25, 101.1 + i * 0.25);
        chart.setPath('s' + i, sp, { stroke: i === 0 ? P.red : ['#3a3631', '#6d665b', '#8f877a', '#565048'][i - 1], 'stroke-width': i === 0 ? 6 : 3.5, opacity: a });
        const last = sp[sp.length - 1]; if (last && i > 0) chart.text('l' + i, 'ABCDE'[i], Math.min(R.x1 + 14, last[0] + 10), last[1] + 6, { opacity: a, 'font-size': 15 });
      });
      legend.innerHTML = t < 100.6 ? '<span style="color:#a39a8a">··· STRAIGHT &amp; STEADY</span> &nbsp; <span style="color:#c23a2c">— REAL FLIGHT</span>' : 'ONE PREDICTED LINE PER SPOT';
      place(legend, 540, 1215, 0.5, 0.5); legend.style.opacity = ramp(t, 95.5, 96);
      chart.opacity = ramp(t, 92.4, 92.9);
    },
  };
}
