import * as THREE from 'three';
import { makeStage } from './stage.js';
import { addLights, lam, mesh } from './objects.js';
import { spectroPanel } from './spectro.js';
import { rng } from './util.js';

export function deskTexture(seed = 2) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const g = cv.getContext('2d'); const r = rng(seed);
  g.fillStyle = '#d7ccb8'; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 260; i++) { const y = r() * 1024; g.strokeStyle = `rgba(${120 + r() * 30},${100 + r() * 20},${70 + r() * 20},${0.05 + r() * 0.08})`; g.lineWidth = 1 + r() * 3; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 3 + (r() - 0.5) * 2); g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
}
export function buildDesk({ fov = 32 } = {}) {
  const { scene, camera } = makeStage({ bg: '#d7ccb8', fov });
  addLights(scene, { size: 14, dir: [-5, 12, 6], mapSize: 2048 });
  const d = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshLambertMaterial({ map: deskTexture() }));
  d.rotation.x = -Math.PI / 2; d.receiveShadow = true; scene.add(d);
  return { scene, camera };
}
/** white-bordered photo card lying on the desk with a spectrogram print */
export function photoCard(w = 5, h = 4) {
  const g = new THREE.Group();
  const card = mesh(new THREE.BoxGeometry(w, 0.04, h), lam('#f7f4ee')); card.position.y = 0.02; g.add(card);
  const spec = spectroPanel(w * 0.9, h * 0.72); spec.rotation.x = -Math.PI / 2; spec.position.set(0, 0.045, -h * 0.07); g.add(spec);
  g.userData.spec = spec;
  return g;
}
/** paper card with a canvas-drawn face */
export function canvasCard(w, h, pxPerUnit, draw) {
  const cv = document.createElement('canvas'); cv.width = Math.round(w * pxPerUnit); cv.height = Math.round(h * pxPerUnit);
  const g = cv.getContext('2d'); g.fillStyle = '#f7f4ee'; g.fillRect(0, 0, cv.width, cv.height); draw(g, cv.width, cv.height);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const grp = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(w, 0.03, h), lam('#f3efe7')); body.position.y = 0.015; grp.add(body);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex })); face.rotation.x = -Math.PI / 2; face.position.y = 0.031; face.receiveShadow = true; grp.add(face);
  return grp;
}
