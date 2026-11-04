import * as THREE from 'three';
import { buildDesk } from '../lib/desk.js';
import { spectroPanel } from '../lib/spectro.js';
import { mesh, lam } from '../lib/objects.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp } from '../lib/util.js';

export default function build({ hud }) {
  const { scene, camera } = buildDesk();
  const phone = new THREE.Group(); scene.add(phone);
  const sh = new THREE.Shape(); const w = 1.7, h = 3.4, r = 0.4;
  sh.moveTo(-w + r, -h); sh.lineTo(w - r, -h); sh.quadraticCurveTo(w, -h, w, -h + r); sh.lineTo(w, h - r); sh.quadraticCurveTo(w, h, w - r, h); sh.lineTo(-w + r, h); sh.quadraticCurveTo(-w, h, -w, h - r); sh.lineTo(-w, -h + r); sh.quadraticCurveTo(-w, -h, -w + r, -h);
  const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 10 }); bg.rotateX(-Math.PI / 2);
  const body = mesh(bg, lam('#24221f')); body.position.y = 0.02; phone.add(body);
  const spec = spectroPanel(3.0, 3.0); spec.rotation.x = -Math.PI / 2; spec.position.set(0, 0.285, -0.2); phone.add(spec);
  const S = spec.userData; S.setWin(0, 20, 0, 900); S.setLine(0, [10, 1.8, 12, 130], 2.2, 0.4, P.p1Glow); S.u.uNoise.value = 0.55; S.u.uMp3.value = 0.4; S.u.uBand.value = 1; S.u.uHarm.value = 1.4;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 6.3), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ece7dc') })); scr.rotation.x = -Math.PI / 2; scr.position.y = 0.283; phone.add(scr);
  const hang = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.red) })); hang.rotation.x = -Math.PI / 2; hang.position.set(0, 0.29, 2.4); phone.add(hang);
  const call = el('div', 'lbl', hud, ''); call.style.fontSize = '30px'; call.style.textAlign = 'center';
  const ln = el('div', 'lbl', hud, 'PHONES DROP EVERYTHING BELOW 300 HZ.<br/>THE HIGHER COPIES GET THROUGH.'); ln.style.fontSize = '16px'; ln.style.textAlign = 'center'; ln.style.lineHeight = '1.5';
  return {
    scene, camera, caption: { y: 1430 },
    update(t) {
      const k = sr(t, 156.1, 159.0, ease.sine);
      const drop = ease.out(ramp(t, 156.2, 156.9));
      phone.position.set(0, lerp(3, 0, drop), lerp(-1, 0, drop)); phone.rotation.y = lerp(-0.5, -0.12, drop) + k * 0.06;
      camera.position.set(lerp(-1, 1, k), lerp(19, 17.5, k), lerp(7, 6.4, k)); camera.lookAt(0, 0, 1.4); camera.updateMatrixWorld();
      const sec = Math.floor(14 + (t - 156.2));
      call.innerHTML = `CALL<br/><span style="font-size:22px">0:${String(sec).padStart(2, '0')}</span>`;
      const cp = project(phone.localToWorld(new THREE.Vector3(0, 0.3, -2.75)), camera); place(call, cp.x, cp.y, 0.5, 0.5);
      const lp = project(phone.localToWorld(new THREE.Vector3(0, 0.3, 1.65)), camera); place(ln, lp.x, lp.y, 0.5, 0.5);
      S.setWin(t - 166, t - 146, 0, 900);
    },
  };
}
