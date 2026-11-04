import * as THREE from 'three';
import { buildDesk, photoCard } from '../lib/desk.js';
import { lam, mesh } from '../lib/objects.js';
import { lineF } from '../lib/spectro.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, svgEl, pathD } from '../lib/util.js';

export default function build({ hud }) {
  const { scene, camera } = buildDesk();
  const card = photoCard(6.4, 5.2); card.position.set(0, 0, -2.2); card.rotation.y = 0.03; scene.add(card);
  const spec = card.userData.spec, S = spec.userData;
  const L = [15, 2.2, 6, 100];
  S.setWin(0, 30, 20, 170); S.setLine(0, L, 1.0, 0.4); S.u.uNoise.value = 0.5;
  // fader
  const rail = mesh(new THREE.BoxGeometry(4.2, 0.08, 0.18), lam('#3b3732')); rail.position.set(-1.2, 0.04, 2.6); scene.add(rail);
  const fader = mesh(new THREE.BoxGeometry(0.4, 0.35, 0.7), lam('#efeae0'), { outline: 0.015 }); fader.position.set(-3.1, 0.18, 2.6); scene.add(fader);
  const fLine = mesh(new THREE.BoxGeometry(0.05, 0.36, 0.6), lam(P.red), { shadow: false }); fader.add(fLine);
  // knob
  const knob = new THREE.Group(); knob.position.set(2.6, 0, 2.6); scene.add(knob);
  const kb = mesh(new THREE.CylinderGeometry(0.75, 0.82, 0.5, 40), lam('#2d2a26'), { outline: 0.012 }); kb.position.y = 0.25; knob.add(kb);
  const cap = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 40), lam('#4a4640')); cap.position.y = 0.52; knob.add(cap);
  const mark = mesh(new THREE.BoxGeometry(0.08, 0.04, 0.45), lam('#f3eee4'), { shadow: false }); mark.position.set(0, 0.56, -0.32); knob.add(mark);
  // pencil
  const pencil = new THREE.Group(); const pb = mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.6, 6), lam('#3a3631')); pb.rotation.z = Math.PI / 2; pencil.add(pb);
  const tip = mesh(new THREE.ConeGeometry(0.09, 0.4, 6), lam('#e3cfae')); tip.rotation.z = -Math.PI / 2; tip.position.x = 2.0; pencil.add(tip);
  pencil.position.set(2.6, 0.1, 0.9); pencil.rotation.y = 0.5; scene.add(pencil);
  const fl = el('div', 'lbl', hud, 'LOW CUT'); fl.style.fontSize = '19px';
  const kl = el('div', 'lbl', hud, 'GAIN'); kl.style.fontSize = '19px';
  const stamp = el('div', 'stamp', hud, 'MP3'); stamp.style.fontSize = '58px';
  const svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;inset:0;overflow:visible' }, hud);
  const trace = svgEl('path', { fill: 'none', stroke: P.red, 'stroke-width': 7, 'stroke-linecap': 'round' }, svg);
  const cardLbl = el('div', 'lbl', hud, 'THE CLIP &nbsp;·&nbsp; LOW NOTES'); cardLbl.style.fontSize = '18px';
  return {
    scene, camera, caption: { y: 1430 },
    update(t) {
      const k = sr(t, 143.6, 151.2, ease.sine);
      camera.position.set(lerp(-0.6, 0.4, k), lerp(23, 21.5, k), lerp(8.5, 7.8, k)); camera.lookAt(0, 0, 0.9); camera.updateMatrixWorld();
      const cut = sr(t, 145.5, 146.3, ease.inOut);
      fader.position.x = lerp(-3.1, 0.6, cut);
      S.u.uLowCut.value = lerp(0, 135, cut);
      S.u.uMp3.value = sr(t, 146.95, 147.2);
      const up = sr(t, 148.5, 149.5, ease.inOut);
      knob.rotation.y = lerp(1.6, -2.2, up);
      S.u.uGain.value = lerp(1, 26, up);
      S.u.uContrast.value = lerp(2.2, 1.6, up);
      const sp = project(new THREE.Vector3(-2.2, 0.3, 3.4), camera); place(fl, sp.x, sp.y, 0, 0);
      const kp = project(new THREE.Vector3(2.6, 0.3, 3.7), camera); place(kl, kp.x, kp.y, 0.5, 0);
      const st = ramp(t, 146.95, 147.15);
      const cp = project(new THREE.Vector3(1.6, 0.1, -3.9), camera);
      place(stamp, cp.x, cp.y, 0.5, 0.5, `rotate(-12deg) scale(${lerp(2.2, 1, ease.out(st))})`); stamp.style.opacity = st;
      const head = project(new THREE.Vector3(-2.9, 0.05, 0.2), camera); place(cardLbl, head.x, head.y, 0, 0.5);
      // trace the recovered line
      const tr = sr(t, 149.9, 150.9);
      const pts = []; for (let i = 0; i <= 80; i++) { const ts = 4 + i * 22 / 80; const v = S.toLocal(ts, lineF(L, 0.4, ts)); const w = spec.localToWorld(v); const p = project(w, camera); pts.push([p.x, p.y]); }
      const n = Math.max(1, Math.floor(pts.length * tr)); trace.setAttribute('d', tr > 0 ? pathD(pts.slice(0, n)) : '');
    },
  };
}
