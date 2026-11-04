// Cut-paper props and people.
import * as THREE from 'three';
import { C, FONT, cutout, rectShape, circleShape, polyShape, ringRect, heartShape, slip, label, drawnCard, at, mat } from './paper.js';
import { clamp } from './util.js';

const add = (parent, obj, x = 0, y = 0, z = 0) => { at(obj, x, y, z); parent.add(obj); return obj; };

// ---------- people ----------
// o: {h, kind:'man'|'woman'|'child'|'girl', top, bottom, hair, glasses, tie, smile, longHair, suit, seed}
export function person(o = {}) {
  const H = o.h ?? 1.6, kid = o.kind === 'child' || o.kind === 'girl';
  const fem = o.kind === 'woman' || o.kind === 'girl';
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const top = o.top ?? C.white, bottom = o.bottom ?? C.g4, hairC = o.hair ?? C.ink;
  const R = H * (kid ? 0.135 : 0.1), shY = H * (kid ? 0.66 : 0.76), waist = H * (kid ? 0.4 : 0.47), headY = shY + R * (kid ? 0.9 : 1.05);
  const sw = H * (kid ? 0.13 : 0.15); // half shoulder width
  // legs (pivot at hip so they can swing)
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); add(body, leg, s * sw * 0.42, waist + 0.02, 0.02);
    const skirt = fem && !o.pants, lw = skirt ? H * 0.035 : sw * 0.7, len = waist - H * 0.03;
    add(leg, cutout(rectShape(lw, len, 0, -len / 2), skirt ? C.skin : bottom), 0, 0, 0);
    add(leg, cutout(rectShape(lw * (skirt ? 2.2 : 1.25), H * 0.035, s * lw * 0.15, -len - H * 0.005, H * 0.008), C.ink), 0, 0, 0.01);
    legs.push(leg);
  }
  // torso / dress
  if (fem && !o.pants) {
    add(body, cutout(polyShape([[-sw * 0.88, shY], [sw * 0.88, shY], [sw * 0.75, waist + H * 0.02], [sw * 1.3, H * 0.24], [-sw * 1.3, H * 0.24], [-sw * 0.75, waist + H * 0.02]]), top), 0, 0, 0.05);
    add(body, cutout(polyShape([[-sw * 0.3, shY + 0.01], [sw * 0.3, shY + 0.01], [0, shY - H * 0.06]]), C.skin, { depth: 0.006 }), 0, 0, 0.085);
  } else {
    add(body, cutout(polyShape([[-sw, shY], [sw, shY], [sw * 0.93, waist], [-sw * 0.93, waist]]), top), 0, 0, 0.05);
    if (o.tie || o.suit) { // collar + tie
      if (o.suit) add(body, cutout(polyShape([[-sw * 0.32, shY + 0.005], [sw * 0.32, shY + 0.005], [0, shY - H * 0.12]]), C.white, { depth: 0.006 }), 0, 0, 0.08);
      add(body, cutout(polyShape([[-H * 0.016, shY], [H * 0.016, shY], [H * 0.022, shY - H * 0.2], [0, shY - H * 0.23], [-H * 0.022, shY - H * 0.2]]), o.tieC ?? (o.suit ? C.g4 : C.g2), { depth: 0.006 }), 0, 0, 0.1);
    }
  }
  // arms (pivot at shoulder)
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); add(body, arm, s * (sw + H * 0.02), shY - H * 0.015, 0.11);
    const aw = H * (kid ? 0.05 : 0.055), al = H * (kid ? 0.3 : 0.32);
    add(arm, cutout(rectShape(aw, al, 0, -al / 2 + aw / 2, aw * 0.2), o.sleeve ?? top), 0, 0, 0);
    add(arm, cutout(circleShape(aw * 0.62), C.skin), 0, -al + aw * 0.2, 0.01);
    arm.userData.len = al; arms.push(arm);
  }
  // neck + head
  add(body, cutout(rectShape(H * 0.05, R * 0.8, 0, shY + R * 0.2), C.skin), 0, 0, 0.03);
  const head = new THREE.Group(); add(body, head, 0, headY, 0.07);
  if (fem || o.longHair) add(head, cutout(rectShape(R * 2.25, R * (kid ? 1.7 : 2.1), 0, -R * (kid ? 0.25 : 0.45), R * 0.3), hairC), 0, 0, -0.045);
  add(head, cutout(circleShape(R), C.skin), 0, 0, 0);
  const hr = R * 1.07, arc = [];
  if (fem) { // hair framing the face
    for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI; arc.push([Math.cos(a) * hr, Math.sin(a) * hr * 1.02]); }
    add(head, cutout(polyShape([[hr, -0.9 * R], ...arc, [-hr, -0.9 * R], [-0.8 * R, -0.9 * R], [-0.8 * R, R * 0.36], [0.8 * R, R * 0.36], [0.8 * R, -0.9 * R]]), hairC), 0, 0, 0.03);
  } else { // short cut: a cap with a straight fringe and a little parting
    const a0 = Math.asin(0.28 / 1.07);
    for (let i = 0; i <= 20; i++) { const a = a0 - 0.12 + (i / 20) * (Math.PI - 2 * a0 + 0.24); arc.push([Math.cos(a) * hr, Math.sin(a) * hr]); }
    add(head, cutout(polyShape([...arc, [-R * 0.55, R * 0.42], [R * 0.2, R * 0.36], [R * 0.75, R * 0.3]]), hairC), 0, 0, 0.03);
  }
  const face = new THREE.Group(); add(head, face, 0, 0, 0.035);
  const eyes = [-1, 1].map((s) => add(face, cutout(circleShape(R * 0.075), C.ink, { depth: 0.004, bevel: 0.002 }), s * R * 0.36, -R * 0.06, 0));
  if (!fem && !kid && !o.glasses) [-1, 1].forEach((s) => add(face, cutout(rectShape(R * 0.3, R * 0.06, 0, 0), C.ink, { depth: 0.004, bevel: 0.002 }), s * R * 0.36, R * 0.2, 0));
  if (o.glasses) {
    [-1, 1].forEach((s) => add(face, cutout(ringRect(R * 0.56, R * 0.4, R * 0.06), C.ink, { depth: 0.004, bevel: 0.002 }), s * R * 0.36, -R * 0.05, 0.004));
    add(face, cutout(rectShape(R * 0.18, R * 0.05), C.ink, { depth: 0.004, bevel: 0.002 }), 0, 0, 0.004);
  }
  if (o.smile) {
    const s = new THREE.Shape(); s.absarc(0, 0, R * 0.26, Math.PI * 1.15, Math.PI * 1.85, false); s.absarc(0, 0, R * 0.19, Math.PI * 1.85, Math.PI * 1.15, true);
    add(face, cutout(s, C.ink, { depth: 0.004, bevel: 0.002 }), 0, -R * 0.2, 0);
  } else add(face, cutout(rectShape(R * 0.28, R * 0.055), C.ink, { depth: 0.004, bevel: 0.002 }), 0, -R * 0.48, 0);

  const seed = o.seed ?? Math.random() * 10;
  g.userData = { body, head, face, eyes, arms, legs, H, R, shY, seed, pose: {} };
  // update: idle sway, blinking, walking (walk = 0..1 amount), arm poses
  g.userData.update = (t, st = {}) => {
    const wk = st.walk ?? 0, ph = t * 7 + seed;
    body.rotation.z = Math.sin(t * 0.8 + seed) * 0.012;
    body.position.y = Math.abs(Math.sin(ph)) * 0.03 * wk;
    head.rotation.z = Math.sin(t * 0.6 + seed * 2) * 0.03 + (st.tilt ?? 0);
    face.position.x = (st.look ?? 0) * R * 0.18;
    const blink = ((t + seed * 1.7) % 3.9) < 0.12 ? 0.15 : 1; eyes.forEach((e) => (e.scale.y = blink));
    legs.forEach((l, i) => (l.rotation.z = Math.sin(ph + i * Math.PI) * 0.32 * wk));
    arms.forEach((a, i) => {
      const s = i ? 1 : -1, pose = st.arms?.[i];
      a.rotation.z = pose ?? (s * 0.05 + Math.sin(ph + i * Math.PI) * 0.35 * wk + Math.sin(t * 1.1 + seed + i) * 0.015);
    });
  };
  g.userData.update(0);
  return g;
}

export function baby(sz = 0.5) { // swaddled baby lying horizontally, centred
  const g = new THREE.Group();
  add(g, cutout(rectShape(sz * 0.78, sz * 0.36, 0, 0, sz * 0.17), C.paper), -sz * 0.08, 0, 0);
  add(g, cutout(polyShape([[-sz * 0.05, sz * 0.18], [sz * 0.18, sz * 0.15], [sz * 0.12, -sz * 0.17], [-sz * 0.12, -sz * 0.17]]), C.white, { depth: 0.006 }), 0, 0, 0.03);
  add(g, cutout(circleShape(sz * 0.17), C.skin), sz * 0.33, sz * 0.02, 0.01);
  add(g, cutout(polyShape([[0, sz * 0.17], [sz * 0.17, sz * 0.03], [sz * 0.14, sz * 0.12]]), C.g4, { depth: 0.004 }), sz * 0.33, sz * 0.02, 0.04);
  [-1, 1].forEach((s) => add(g, cutout(circleShape(sz * 0.014), C.ink, { depth: 0.003, bevel: 0.001 }), sz * 0.36, sz * 0.03 + s * sz * 0.05, 0.04));
  return g;
}

export function gradCap(R) {
  const g = new THREE.Group();
  add(g, cutout(polyShape([[-R * 1.5, 0], [0, R * 0.42], [R * 1.5, 0], [0, -R * 0.42]]), C.ink), 0, 0, 0.02);
  add(g, cutout(rectShape(R * 1.2, R * 0.5, 0, -R * 0.35), C.ink), 0, 0, 0);
  add(g, cutout(rectShape(R * 0.06, R * 0.75, R * 1.2, -R * 0.38), C.g1, { depth: 0.004 }), 0, 0, 0.04);
  return g;
}
export function heart(sz = 0.4, color = C.red) { return cutout(heartShape(sz), color); }

// ---------- buildings ----------
export function house(w = 1.2) { // a small school with a flag
  const g = new THREE.Group(), h = w * 0.55;
  add(g, cutout(rectShape(w, h, 0, h / 2), C.white), 0, 0, 0);
  add(g, cutout(polyShape([[-w * 0.58, h], [w * 0.58, h], [0, h + w * 0.35]]), C.g1), 0, 0, 0.02);
  for (let i = 0; i < 4; i++) add(g, cutout(rectShape(w * 0.12, h * 0.32, -w * 0.33 + i * w * 0.22, h * 0.55), C.g3, { depth: 0.006 }), 0, 0, 0.03);
  add(g, cutout(rectShape(w * 0.025, w * 0.5, 0, h + w * 0.5), C.g2), w * 0.0, 0, -0.02);
  add(g, cutout(rectShape(w * 0.2, w * 0.12, w * 0.11, h + w * 0.68), C.white), 0, 0, -0.01);
  return g;
}
export function temple(w = 1.6, cols = 6) { // columns + pediment: university / parliament
  const g = new THREE.Group(), h = w * 0.5;
  add(g, cutout(rectShape(w * 1.05, w * 0.06, 0, w * 0.03), C.white), 0, 0, 0.02);
  add(g, cutout(rectShape(w * 0.95, w * 0.05, 0, w * 0.085), C.g1), 0, 0, 0.01);
  for (let i = 0; i < cols; i++) add(g, cutout(rectShape(w * 0.07, h, -w * 0.4 + (i * w * 0.8) / (cols - 1), w * 0.11 + h / 2), C.white), 0, 0, 0.03);
  add(g, cutout(rectShape(w * 0.92, h * 0.98, 0, w * 0.11 + h / 2), C.g4), 0, 0, -0.02);
  add(g, cutout(rectShape(w, w * 0.07, 0, w * 0.11 + h + w * 0.035), C.white), 0, 0, 0.03);
  add(g, cutout(polyShape([[-w * 0.52, w * 0.18 + h], [w * 0.52, w * 0.18 + h], [0, w * 0.4 + h]]), C.white), 0, 0, 0.03);
  add(g, cutout(polyShape([[-w * 0.36, w * 0.21 + h], [w * 0.36, w * 0.21 + h], [0, w * 0.35 + h]]), C.g2, { depth: 0.006 }), 0, 0, 0.06);
  return g;
}

// ---------- money ----------
export function banknote(value = '100', o = {}) {
  const w = o.w ?? 0.9, h = w * 0.5, ink = o.ink ?? '#3c3b39', bg = o.bg ?? '#cfccc5';
  return drawnCard(w, h, (x, W, H) => {
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.strokeStyle = ink; x.globalAlpha = 0.45; x.lineWidth = W * 0.008;
    for (let i = 0; i < 26; i++) { x.beginPath(); x.ellipse(W * 0.72, H * 0.5, W * (0.05 + i * 0.008), H * (0.1 + i * 0.016), 0, 0, 6.3); x.stroke(); }
    x.globalAlpha = 1; x.lineWidth = W * 0.012; x.strokeRect(W * 0.04, H * 0.08, W * 0.92, H * 0.84);
    x.fillStyle = ink; x.font = `600 ${H * 0.26}px "${FONT.mono}"`; x.textBaseline = 'top'; x.fillText(value, W * 0.08, H * 0.12);
    x.font = `500 ${H * 0.13}px "${FONT.mono}"`; x.textBaseline = 'bottom'; x.fillText(o.unit ?? 'BAHT', W * 0.08, H * 0.88);
    x.textAlign = 'right'; x.font = `600 ${H * 0.2}px "${FONT.mono}"`; x.fillText(value, W * 0.93, H * 0.88);
    x.beginPath(); x.arc(W * 0.72, H * 0.5, H * 0.2, 0, 6.3); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fill();
  }, { edge: bg, depth: 0.008 });
}
export function bundle(w = 1.5, h = 0.16, d = 0.7, color = '#9c9a95') { // a stack of notes, side-on
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); m.castShadow = m.receiveShadow = true; g.add(m);
  const band = new THREE.Mesh(new THREE.BoxGeometry(w * 0.1, h * 1.04, d * 1.02), mat(C.white)); band.castShadow = true; g.add(band);
  for (const y of [-0.25, 0.05, 0.3]) { const l = new THREE.Mesh(new THREE.BoxGeometry(w * 1.001, h * 0.05, d * 1.001), mat('#7c7a76')); l.position.y = y * h; g.add(l); }
  return g;
}

// ---------- staging props ----------
export function pedestal(w, h, d, name) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d).translate(0, 0.5, 0), mat('#4a4948')); box.castShadow = box.receiveShadow = true;
  g.add(box);
  const lab = label(name, { size: 0.15, color: '#b9b6b0', weight: 500 }); lab.castShadow = false; g.add(lab);
  g.userData = { box, lab, w, d };
  g.userData.setH = (hh) => { box.scale.y = Math.max(0.001, hh); lab.position.set(0, hh - 0.32, d / 2 + 0.005); };
  g.userData.setH(h);
  return g;
}
export function ruler(h, ticks = [], o = {}) {
  const g = new THREE.Group();
  add(g, cutout(rectShape(0.16, h, 0, h / 2), '#3d3c3b'), 0, 0, 0);
  for (const tk of ticks) {
    add(g, cutout(rectShape(tk.major ? 0.12 : 0.07, 0.016, 0.02, 0), C.g1, { depth: 0.004, bevel: 0.002 }), 0.02, tk.y, 0.03);
    if (tk.text) { const l = label(tk.text, { size: o.size ?? 0.12, color: C.g1 }); l.castShadow = false; add(g, l, 0.2 + l.userData.w / 2, tk.y, 0.03); }
  }
  return g;
}
export function redLine(w) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, 0.9), mat(C.red, { bumpScale: 0 })); m.castShadow = m.receiveShadow = true; return m; }
export function podium(w = 1.0, h = 1.05) {
  const g = new THREE.Group();
  add(g, cutout(polyShape([[-w * 0.42, 0], [w * 0.42, 0], [w * 0.5, h], [-w * 0.5, h]]), '#3e3d3c'), 0, 0, 0);
  add(g, cutout(rectShape(w * 1.08, h * 0.08, 0, h), C.g3), 0, 0, 0.02);
  add(g, cutout(circleShape(w * 0.15, 0, h * 0.62), C.g1), 0, 0, 0.04);
  add(g, cutout(circleShape(w * 0.1, 0, h * 0.62), C.g3, { depth: 0.006 }), 0, 0, 0.07);
  const mic = cutout(rectShape(0.025, 0.42, 0, h + 0.2), C.ink); mic.rotation.z = 0.35; add(g, mic, w * 0.18, 0, 0.05);
  return g;
}
export function desk() { // desk with a laptop: "a good economy"
  const g = new THREE.Group();
  add(g, cutout(rectShape(1.0, 0.07, 0, 0.5), C.g1), 0, 0, 0.02);
  [-0.42, 0.42].forEach((x) => add(g, cutout(rectShape(0.06, 0.5, x, 0.25), C.g2), 0, 0, 0));
  add(g, cutout(rectShape(0.3, 0.24, 0, 0.12), C.g3), 0.25, 0, 0.01);
  add(g, cutout(polyShape([[-0.22, 0.54], [0.22, 0.54], [0.18, 0.86], [-0.18, 0.86]]), C.white), -0.1, 0, 0.04);
  add(g, cutout(rectShape(0.3, 0.22, 0, 0.7), C.g4, { depth: 0.004 }), -0.1, 0, 0.07);
  add(g, cutout(rectShape(0.5, 0.03, 0, 0.55), C.white), -0.1, 0, 0.05);
  [0, 1, 2].forEach((i) => add(g, cutout(rectShape(0.3, 0.035, 0, 0.56 + i * 0.045), i % 2 ? C.white : C.g1, { depth: 0.006 }), 0.32, 0, 0.05));
  return g;
}
export function crib() { // a cot with a baby: "a good family"
  const g = new THREE.Group();
  add(g, cutout(rectShape(0.95, 0.07, 0, 0.62), C.white), 0, 0, 0.05);
  add(g, cutout(rectShape(0.95, 0.07, 0, 0.18), C.white), 0, 0, 0.05);
  for (let i = 0; i < 8; i++) add(g, cutout(rectShape(0.035, 0.44, -0.4 + i * 0.115, 0.4), C.g1), 0, 0, 0.06);
  [-0.47, 0.47].forEach((x) => add(g, cutout(rectShape(0.07, 0.72, x, 0.36), C.white), 0, 0, 0.07));
  const b = baby(0.42); add(g, b, 0, 0.47, 0.02);
  return g;
}
export function packet(text = 'Folic acid 5 mg') { // blister pack of supplements
  return drawnCard(0.5, 0.32, (x, W, H) => {
    x.fillStyle = '#d8d6d0'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { x.beginPath(); x.arc(W * (0.17 + i * 0.22), H * (0.52 + j * 0.27), H * 0.09, 0, 6.3); x.fillStyle = '#f2f0ea'; x.fill(); x.strokeStyle = '#8b8986'; x.lineWidth = 3; x.stroke(); }
    x.fillStyle = '#2a2a2a'; x.font = `600 ${H * 0.16}px "${FONT.sans}"`; x.fillText(text, W * 0.06, H * 0.22);
  }, { round: 0.03, depth: 0.01 });
}
export function babyToken() { // a hospital-cot card: one unit in the births stacks
  return drawnCard(0.66, 0.4, (x, W, H) => {
    x.fillStyle = '#7f7d79'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#a3a19c'; x.fillRect(W * 0.06, H * 0.12, W * 0.88, H * 0.76);
    for (const [cx, rot] of [[0.3, -0.25], [0.7, 0.2]]) {
      x.save(); x.translate(W * cx, H * 0.5); x.rotate(rot);
      x.fillStyle = '#f1efea'; x.beginPath(); x.ellipse(0, 0, W * 0.15, H * 0.2, 0, 0, 6.3); x.fill();
      x.fillStyle = '#e1ded7'; x.beginPath(); x.arc(W * 0.12, -H * 0.02, H * 0.13, 0, 6.3); x.fill();
      x.fillStyle = '#3a3938'; x.fillRect(W * 0.14, -H * 0.06, W * 0.012, H * 0.03); x.fillRect(W * 0.14, H * 0.02, W * 0.012, H * 0.03);
      x.restore();
    }
  }, { edge: '#c9c7c1', round: 0.03, depth: 0.012 });
}
export { add };
