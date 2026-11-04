// A security-camera "feed": sky, tree line, ground, top letterbox with CAM HUD and an optional spectrogram sky.
import * as THREE from 'three';
import { makeStage, framePt, viewSize } from './stage.js';
import { addLights, treeLine, cloud, ground, fieldTexture } from './objects.js';
import { spectroPanel } from './spectro.js';
import { P } from './palette.js';
import { el, place } from './util.js';

export const FEED = { top: 230, horizon: 1126 };

export function buildFeed(hud, { seed = 1 } = {}) {
  const { scene, camera } = makeStage({ bg: '#e9e6de', fov: 50, fog: [30, 120, '#e9e6de'] });
  addLights(scene, { size: 30, dir: [-6, 18, 10] });
  const tex = fieldTexture({ rows: 70, tufts: 0, line: 'rgba(120,108,90,0.22)' });
  tex.rotation = Math.PI / 2; tex.center.set(0.5, 0.5);
  const gr = ground(300, { repeat: 22, tex }); scene.add(gr);
  camera.position.set(0, 1.7, 16); camera.lookAt(0, 3.0, 0); camera.updateMatrixWorld();
  scene.add(camera);
  const trees = treeLine(scene, { seeds: seed, count: 15, x0: -17, x1: 17, z: -14, jitter: 3, h: [3.4, 5.0] });
  const back = treeLine(scene, { seeds: seed + 7, count: 11, x0: -26, x1: 26, z: -24, jitter: 3, h: [4, 5.5] });
  const clouds = [[-6, 17, -45, 9], [7, 21, -55, 12], [-11, 25, -60, 8], [12, 14, -40, 7]].map(([x, y, z, w], i) => { const c = cloud(seed * 5 + i, w); c.position.set(x, y, z); scene.add(c); return c; });
  // letterbox band attached to the camera
  const d = 2;
  const { w: vw, h: vh } = viewSize(camera, d);
  const bandH = FEED.top / 1920 * vh;
  const band = new THREE.Mesh(new THREE.PlaneGeometry(vw * 1.02, bandH), new THREE.MeshBasicMaterial({ color: new THREE.Color('#141311'), depthTest: false }));
  band.position.copy(framePt(camera, d, 540, FEED.top / 2)); band.renderOrder = 10; camera.add(band);
  // spectrogram "sky" (behind trees)
  const D = 70; const v = viewSize(camera, D);
  const sh = (FEED.horizon - FEED.top) / 1920 * v.h * 1.02;
  const spec = spectroPanel(v.w * 1.02, sh, { depthWrite: true });
  spec.position.copy(framePt(camera, D, 540, (FEED.top + FEED.horizon) / 2)); camera.add(spec);
  spec.visible = false;
  // HUD
  const hL = el('div', 'lbl light', hud, 'CAM 01<br/>08 SEP 2026'); hL.style.fontSize = '28px'; hL.style.lineHeight = '1.5'; place(hL, 60, 80);
  const hR = el('div', 'lbl light', hud, ''); hR.style.fontSize = '28px'; hR.style.lineHeight = '1.5'; hR.style.textAlign = 'right'; place(hR, 1020, 80, 1, 0);
  return {
    scene, camera, trees, back, clouds, spec, band, gr,
    hud: { hL, hR },
    setClock(t, base = 20 * 3600 + 37 * 60) {
      const s = Math.floor(base + t); const hh = Math.floor(s / 3600) % 24, mm = Math.floor(s / 60) % 60, ss = s % 60;
      const blink = Math.floor(t * 2) % 2 ? 'visibility:hidden' : '';
      hR.innerHTML = `<span class="rec-dot" style="${blink}"></span>REC<br/>${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    },
    sway(t) { trees.children.forEach((tr, i) => { tr.rotation.z = Math.sin(t * 0.9 + i) * 0.012; }); clouds.forEach((c, i) => { c.position.x += 0.0; }); },
  };
}
