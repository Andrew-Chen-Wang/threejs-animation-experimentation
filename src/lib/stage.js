import * as THREE from 'three';
import { P } from './palette.js';
export function makeStage({ bg = P.paper, fov = 40, near = 0.1, far = 600, fog = null } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  if (fog) scene.fog = new THREE.Fog(new THREE.Color(fog[2] || bg), fog[0], fog[1]);
  const camera = new THREE.PerspectiveCamera(fov, 9 / 16, near, far);
  return { scene, camera };
}
/** size of the view rectangle at distance d */
export function viewSize(camera, d) { const h = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); return { h, w: h * camera.aspect }; }
/** convert frame px (1080x1920) to a point on the camera plane at distance d (camera-local) */
export function framePt(camera, d, px, py) { const { w, h } = viewSize(camera, d); return new THREE.Vector3((px / 1080 - 0.5) * w, (0.5 - py / 1920) * h, -d); }
