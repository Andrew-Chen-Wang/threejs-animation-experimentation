import * as THREE from 'three';
import { makeStage } from '../lib/stage.js';
import { addLights, plane, tree, pin, WaveRing, lam } from '../lib/objects.js';
import { P } from '../lib/palette.js';
import { rng, sr, ramp, ease, el, place, project, lerp, clamp } from '../lib/util.js';

export default function build({ hud }) {
  const { scene, camera } = makeStage({ bg: P.paper, fov: 34, fog: [70, 150] });
  addLights(scene, { size: 40, dir: [-10, 30, 12], mapSize: 2048 });
  // patchwork of fields
  const r = rng(5);
  const tones = ['#e6dfcf', '#ddd5c3', '#ece6da', '#d3cbb8', '#e9e2d2', '#d9d0bc'];
  const N = 22, cell = 5.2;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const fields = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), N * N);
  fields.receiveShadow = true;
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  let k = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = (i - N / 2) * cell, z = (j - N / 2) * cell, h = 0.05 + r() * 0.12;
    m4.makeScale(cell - 0.35, h, cell - 0.35).setPosition(x, h / 2, z);
    fields.setMatrixAt(k, m4); fields.setColorAt(k, col.set(tones[Math.floor(r() * tones.length)])); k++;
  }
  scene.add(fields);
  // furrow lines on some fields
  const lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color('#b9b09d'), transparent: true, opacity: 0.7 });
  const lp = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (r() < 0.45) continue;
    const x = (i - N / 2) * cell, z = (j - N / 2) * cell, horiz = r() < 0.5;
    for (let q = -2; q <= 2; q++) {
      const o = q * cell * 0.17;
      if (horiz) lp.push(x - cell * 0.42, 0.2, z + o, x + cell * 0.42, 0.2, z + o); else lp.push(x + o, 0.2, z - cell * 0.42, x + o, 0.2, z + cell * 0.42);
    }
  }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  scene.add(new THREE.LineSegments(lg, lineMat));
  // under-paper (roads)
  const base = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), lam('#c9c0ad')); base.rotation.x = -Math.PI / 2; base.receiveShadow = true; scene.add(base);
  // tree clusters along a few hedgerows
  for (let c = 0; c < 9; c++) {
    const cx = (Math.floor(r() * N) - N / 2) * cell + cell / 2, cz = (Math.floor(r() * N) - N / 2) * cell;
    for (let q = 0; q < 5; q++) { const t = tree(c * 10 + q, { h: 2.2 + r() * 1.2 }); t.position.set(cx + 0.1, 0.1, cz + (q - 2) * 1.1); scene.add(t); }
  }
  // the plane and its sound
  const pl = plane({ scale: 2.2 }); scene.add(pl);
  const rings = Array.from({ length: 26 }, () => { const w = new WaveRing(P.ink, 0.4, 0.09); scene.add(w.mesh); return w; });
  const red = new WaveRing(P.red, 1, 0.22); scene.add(red.mesh);
  const target = new THREE.Vector3(5.2 * 2 - 0.0, 0.2, 5.2 * 1);
  red.mesh.position.copy(target);
  const pn = pin(1.3); pn.position.copy(target); scene.add(pn);
  const planePos = (t, out = new THREE.Vector3()) => out.set(-26 + t * 5.4, 14, -8 + t * 1.0);

  // HUD
  const coord = el('div', 'lbl', hud, '38.4700° N &nbsp;·&nbsp; 96.9200° W');
  const tag = el('div', 'lbl red', hud, 'LOCATED');
  const date = el('div', 'lbl', hud, '08 SEP 2026 &nbsp;·&nbsp; 20:37 UTC'); place(date, 540, 150, 0.5, 0);

  const tmp = new THREE.Vector3();
  return {
    scene, camera,
    caption: { y: 1340 },
    update(t) {
      planePos(t, pl.position); pl.rotation.set(0, -0.19, Math.sin(t * 0.8) * 0.05); pl.userData.spin(t);
      // wavefronts on the ground, emitted from beneath the plane
      rings.forEach((w, i) => {
        const period = 0.42, age = ((t - i * period) % (rings.length * period) + rings.length * period) % (rings.length * period);
        const te = t - age; planePos(te, tmp);
        w.mesh.position.set(tmp.x, 0.25, tmp.z);
        w.set(Math.max(0.01, age * 5.0), 'xz', 0.22);
        w.mat.opacity = 0.5 * (1 - age / (rings.length * period)) * (1 - sr(t, 3.9, 4.6));
      });
      // red ring closing on the location
      const rc = sr(t, 4.3, 5.8, ease.inOut);
      red.set(lerp(30, 0.9, rc), 'xz', 0.24); red.mat.opacity = sr(t, 4.0, 4.4) * (1 - sr(t, 6.6, 7.2) * 0.6);
      const drop = ramp(t, 5.6, 6.3); const b = ease.back(drop);
      pn.position.y = target.y + (1 - b) * 8; pn.scale.setScalar(1.3 * Math.min(1, drop * 3)); pn.visible = drop > 0;
      pn.rotation.y = t * 0.8;
      // camera: high orbit -> settles toward target
      const a = 0.35 + t * 0.03;
      const dist = lerp(78, 36, sr(t, 0, 8.6, ease.sine));
      const elev = lerp(1.05, 0.82, sr(t, 3.5, 8.6));
      const look = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), target, sr(t, 3.8, 6.4));
      camera.position.set(look.x + Math.sin(a) * Math.cos(elev) * dist, Math.sin(elev) * dist, look.z + Math.cos(a) * Math.cos(elev) * dist);
      camera.lookAt(look);
      camera.updateMatrixWorld();
      const p = project(tmp.copy(target).setY(3.6), camera);
      const ca = ramp(t, 6.0, 6.5);
      place(coord, p.x, p.y - 30, 0.5, 1); coord.style.opacity = ca;
      place(tag, p.x, p.y - 72, 0.5, 1); tag.style.opacity = ramp(t, 7.4, 7.8);
      date.style.opacity = ramp(t, 1.0, 1.6) * 0.8;
    },
  };
}
