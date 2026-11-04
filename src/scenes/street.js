import * as THREE from 'three';
import { makeStage } from '../lib/stage.js';
import { addLights, treeLine, pole, wire, ground, cloud, lam, mesh, outlineMat, fieldTexture } from '../lib/objects.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, svgEl } from '../lib/util.js';

export default function build({ hud }) {
  const { scene, camera } = makeStage({ bg: '#e9e6de', fov: 50, fog: [30, 120, '#e9e6de'] });
  addLights(scene, { size: 34, dir: [-6, 18, 10] });
  const tex = fieldTexture({ rows: 70, tufts: 0, line: 'rgba(120,108,90,0.22)' }); tex.rotation = Math.PI / 2; tex.center.set(0.5, 0.5);
  scene.add(ground(300, { repeat: 22, tex }));
  const trees = treeLine(scene, { seeds: 1, count: 15, x0: -17, x1: 17, z: -14, jitter: 3, h: [3.4, 5.0] });
  treeLine(scene, { seeds: 8, count: 11, x0: -26, x1: 26, z: -24, jitter: 3, h: [4, 5.5] });
  [[-6, 17, -45, 9], [7, 21, -55, 12]].forEach(([x, y, z, w], i) => { const c = cloud(9 + i, w); c.position.set(x, y, z); scene.add(c); });
  const road = mesh(new THREE.PlaneGeometry(300, 5), lam('#cbc3b1')); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 20); scene.add(road);
  for (let i = -30; i < 30; i++) { const m = mesh(new THREE.PlaneGeometry(1.6, 0.14), lam('#f2eee5'), { shadow: false }); m.rotation.x = -Math.PI / 2; m.position.set(i * 3.4, 0.02, 20); scene.add(m); }
  const pl = pole({ height: 8 }); pl.position.set(0.6, 0, 26); pl.rotation.y = Math.PI; scene.add(pl);
  scene.add(wire(new THREE.Vector3(-0.3, 7.65, 26), new THREE.Vector3(-60, 7.8, 26), 1.5));
  scene.add(wire(new THREE.Vector3(1.5, 7.65, 26), new THREE.Vector3(60, 7.8, 26), 1.5));
  // red tree outlines
  const outl = []; trees.traverse((o) => { if (o.isMesh && o.material.side === THREE.BackSide) outl.push(o); });
  const redOut = outlineMat(0.06, P.red), base = outl[0] && outl[0].material;
  const chip = el('div', 'lbl', hud, '<span style="display:inline-block;width:14px;height:14px;background:#c23a2c;border-radius:3px;margin-right:10px"></span>STREET VIEW &nbsp;·&nbsp; 2025'); place(chip, 60, 120); chip.style.fontSize = '20px';
  const svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;inset:0;overflow:visible' }, hud);
  const arrows = [0, 1].map(() => svgEl('path', { d: 'M-40 18 L0 -12 L40 18', fill: 'none', stroke: '#f6f2ea', 'stroke-width': 10, 'stroke-linejoin': 'round' }, svg));
  const circ = svgEl('circle', { r: 110, fill: 'none', stroke: P.red, 'stroke-width': 6, 'stroke-dasharray': 700, 'stroke-dashoffset': 700 }, svg);
  const match = el('div', 'lbl red', hud, 'MATCH ✓'); match.style.fontSize = '26px';
  const camL = el('div', 'lbl red', hud, 'CAM 01'); camL.style.fontSize = '24px';
  const wp = new THREE.Vector3();
  return {
    scene, camera, caption: { y: 1420 },
    update(t) {
      const turn = sr(t, 141.0, 142.6, ease.inOut);
      const k = sr(t, 138.3, 141, ease.sine);
      pl.userData.camera.getWorldPosition(wp);
      const from = new THREE.Vector3(lerp(5, 1.5, k), 1.7, lerp(22, 19.5, k));
      const to = new THREE.Vector3(1.4, 5.6, 20.5);
      camera.position.lerpVectors(from, to, turn);
      const lookA = new THREE.Vector3(0, 3.2, 0), lookB = wp.clone();
      camera.lookAt(lookA.lerp(lookB, ease.inOut(turn)));
      camera.updateMatrixWorld();
      const m = ramp(t, 140.2, 140.9);
      outl.forEach((o, i) => { o.material = m * outl.length > i ? redOut : base; });
      const ap = [project(new THREE.Vector3(1.5, 0.05, 20), camera), project(new THREE.Vector3(-4.5, 0.05, 20), camera)];
      arrows.forEach((a, i) => { a.setAttribute('transform', `translate(${ap[i].x},${ap[i].y}) scale(1,0.5)`); a.style.opacity = (1 - turn) * (ap[i].z < 1 ? 1 : 0); });
      place(match, 540, 600, 0.5, 0.5); match.style.opacity = ramp(t, 140.6, 141.0) * (1 - ramp(t, 141.2, 141.5));
      const cp = project(wp, camera);
      circ.setAttribute('cx', cp.x); circ.setAttribute('cy', cp.y); circ.setAttribute('stroke-dashoffset', 700 * (1 - sr(t, 142.3, 142.9)));
      place(camL, cp.x + 130, cp.y, 0, 0.5); camL.style.opacity = ramp(t, 142.6, 142.9);
      pl.userData.led.material.color.set(Math.floor(t * 2) % 2 ? '#ff3b22' : '#7a1f14');
      chip.style.opacity = 1 - turn;
    },
  };
}
