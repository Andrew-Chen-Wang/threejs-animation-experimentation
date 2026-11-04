import * as THREE from 'three';
import { makeStage } from '../lib/stage.js';
import { addLights, pole, wire, tree, cloud, ground, fieldTexture } from '../lib/objects.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, svgEl } from '../lib/util.js';

export default function build({ hud }) {
  const { scene, camera } = makeStage({ bg: P.sky, fov: 38, fog: [40, 140] });
  addLights(scene, { size: 25, dir: [-8, 20, 10] });
  scene.add(ground(400, { repeat: 40 }));
  const pl = pole({ height: 9 }); scene.add(pl);
  const top = 9 - 0.6;
  for (const x of [-0.9, 0.9, -0.35]) {
    scene.add(wire(new THREE.Vector3(x, top + 0.25, 0), new THREE.Vector3(x - 1, top + 0.4, -60), 1.4));
    scene.add(wire(new THREE.Vector3(x, top + 0.25, 0), new THREE.Vector3(x + 2, top + 0.3, 60), 1.6));
  }
  [[-9, -10], [-6, -14], [7, -12], [11, -16], [-14, -18], [3, -22], [16, -9]].forEach(([x, z], i) => { const t = tree(40 + i, { h: 4 + (i % 3) }); t.position.set(x, 0, z); scene.add(t); });
  [[-12, 22, -50], [10, 26, -60], [-2, 30, -70]].forEach(([x, y, z], i) => { const c = cloud(i + 3, 10); c.position.set(x, y, z); scene.add(c); });
  const camObj = pl.userData.camera;
  const svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;inset:0' }, hud);
  const circ = svgEl('circle', { r: 120, fill: 'none', stroke: P.red, 'stroke-width': 6, 'stroke-dasharray': 760, 'stroke-dashoffset': 760, transform: 'rotate(-90)' }, svg);
  const g = svgEl('g', {}, svg); g.appendChild(circ);
  const lbl = el('div', 'lbl red', hud, 'CAM 01');
  const lbl2 = el('div', 'lbl', hud, 'POLE #4471 &nbsp;·&nbsp; 38.4700° N 96.9200° W'); lbl2.style.fontSize = '19px';
  const wp = new THREE.Vector3();
  return {
    scene, camera, caption: { y: 1420 },
    update(t) {
      const k = sr(t, 14.6, 18.7, ease.sine);
      const push = sr(t, 17.6, 18.8, ease.in);
      const ang = lerp(-0.7, 0.15, k);
      const R = lerp(10, 6.5, k);
      camObj.getWorldPosition(wp);
      const look = new THREE.Vector3(0, lerp(5.5, wp.y, sr(t, 15.0, 16.4)), 0);
      camera.position.set(Math.sin(ang) * R, lerp(1.6, 4.2, k), Math.cos(ang) * R);
      if (push > 0) { const lens = wp.clone().add(new THREE.Vector3(0, -0.05, 0.75)); camera.position.lerp(lens.add(new THREE.Vector3(0, 0, 0.6)), push); look.lerp(wp.clone().add(new THREE.Vector3(0, -0.2, 0)), push); }
      camera.lookAt(look); camera.updateMatrixWorld();
      pl.userData.led.material.color.set(Math.floor(t * 2) % 2 ? '#ff3b22' : '#7a1f14');
      const p = project(wp.clone().add(new THREE.Vector3(0, 0, 0.3)), camera);
      g.setAttribute('transform', `translate(${p.x},${p.y})`);
      circ.setAttribute('stroke-dashoffset', 760 * (1 - sr(t, 15.8, 16.5)));
      svg.style.opacity = 1 - ramp(t, 17.5, 17.9);
      place(lbl, p.x + 140, p.y - 16, 0, 0.5); lbl.style.opacity = ramp(t, 16.2, 16.6) * (1 - ramp(t, 17.5, 17.9));
      place(lbl2, p.x + 140, p.y + 20, 0, 0.5); lbl2.style.opacity = ramp(t, 16.4, 16.8) * (1 - ramp(t, 17.5, 17.9));
    },
  };
}
