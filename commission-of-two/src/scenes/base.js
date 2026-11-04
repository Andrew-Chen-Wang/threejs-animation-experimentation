import * as THREE from 'three';
export function base({ clear = 0xdcdcda, focus = [0.5, 0.16, 9], fov = 32, fog } = {}) {
  const scene = new THREE.Scene();
  if (fog) scene.fog = new THREE.Fog(fog[0], fog[1], fog[2]);
  const camera = new THREE.PerspectiveCamera(fov, 9 / 16, 0.1, 400);
  return { scene, camera, clear, focus };
}
const _t = new THREE.Vector3();
export function aim(cam, p, look, roll = 0) {
  cam.position.set(p[0], p[1], p[2]); cam.up.set(0, 1, 0); cam.lookAt(_t.set(look[0], look[1], look[2]));
  if (roll) cam.rotateZ(roll);
}
/** linear interpolate two camera poses */
export function aimLerp(cam, A, B, k, roll = 0) {
  const p = A[0].map((v, i) => v + (B[0][i] - v) * k), l = A[1].map((v, i) => v + (B[1][i] - v) * k);
  aim(cam, p, l, roll);
}
