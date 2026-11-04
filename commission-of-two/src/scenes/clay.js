import * as THREE from 'three';
import { base, aim, aimLerp } from './base.js';
import { RED, rig, ground, box, redMat, pawns, pawn, auditorium, tag, counter, project, sr, ramp, ease, rng, clamp, lerp, mat } from '../kit.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- the plenum hall: stage, red table, red carpet ----------
export function hall({ hud, start, end, finale = false }) {
  const s = base({ focus: [0.66, 0.08, 11] });
  rig(s.scene, { size: 40, pos: [-14, 24, 10] });
  auditorium(s.scene, {});
  const ttl = finale ? tag(hud, ['中央军委 THE CMC, 2026', { t: '主席 XI + 副主席 ZHANG SHENGMIN', cls: 'sm', dx: 30 }], { align: 'center' }) : null;
  s.update = (lt, t) => {
    const k = ramp(t, start, end);
    if (!finale) aimLerp(s.camera, [[-20, 44, 40], [0, 0, -4]], [[-15, 34, 32], [0, 0, -6]], ease.sine(k), 0.05);
    else aimLerp(s.camera, [[-15, 34, 32], [0, 0, -6]], [[-20, 46, 42], [0, 0, -4]], ease.sine(k), 0.05);
    s.focus = [0.66 - 0.04 * k, 0.07, 12];
    if (ttl) ttl.at(540, 330, 0.5, 0).win(t, start + 0.8);
  };
  return s;
}

// ---------- top-down rows with desks: a quarter go missing ----------
export function absent({ hud, start }) {
  const s = base({ focus: [0.55, 0.12, 10] });
  rig(s.scene, { size: 30 });
  ground(s.scene, 0xd6d6d4);
  const items = [];
  for (const bx of [-4.2, 4.2]) for (let r = 0; r < 26; r++) for (let c = 0; c < 12; c++) items.push({ x: bx + (c - 5.5) * 0.66, z: -12 + r * 1.15 });
  const crowd = pawns(s.scene, items, { desks: true });
  const R = rng(9); const gone = items.map(() => R() < 0.25); const delay = items.map(() => R());
  const aisle = box(1.6, 0.02, 40, 0xc9c9c7); aisle.position.set(0, 0.01, 2); s.scene.add(aisle);
  s.update = (lt, t) => {
    aim(s.camera, [-9 + lt * 0.3, 22, 14 + lt * 0.2], [1, 0, -1], 0.42);
    for (let i = 0; i < items.length; i++) if (gone[i]) crowd.set(i, { vis: 1 - sr(t, 6.0 + delay[i] * 0.9, 6.25 + delay[i] * 0.9, ease.in) });
  };
  return s;
}

// ---------- low, close rows of members at desks ----------
export function members({ hud, start }) {
  const s = base({ focus: [0.48, 0.07, 14], fov: 30 });
  rig(s.scene, { pos: [-6, 10, 8], size: 20 });
  ground(s.scene, 0xcfcfcd);
  const items = [];
  for (let r = 0; r < 14; r++) for (let c = 0; c < 18; c++) items.push({ x: (c - 9) * 0.75, z: -r * 1.3 });
  pawns(s.scene, items, { desks: true });
  const head = tag(hud, ['20TH CENTRAL COMMITTEE  OCT 2026']);
  const kinds = [['MINISTRIES', '部委', 10.56], ['PROVINCES', '省份', 11.08], ['MILITARY', '军队', 11.84]].map(([en, cn, at], i) => ({ g: tag(hud, [`${cn} ${en}`]), at, i }));
  s.update = (lt, t) => {
    aim(s.camera, [2.2 - lt * 0.12, 2.0, 3.2], [-2.2 - lt * 0.1, 0.9, -5], -0.04);
    head.at(540, 300, 0.5, 0).win(t, 8.1);
    for (const k of kinds) k.g.at(540, 860 + k.i * 80, 0.5, 0).win(t, k.at);
  };
  return s;
}

// ---------- 376 seats: 371 then 279 ----------
export function count({ hud, start, end }) {
  const s = base({ focus: [0.45, 0.1, 12] });
  rig(s.scene, { size: 30, pos: [-10, 18, 6] });
  ground(s.scene, 0xd8d8d6);
  const back = box(14, 3, 0.4, 0xeeeeec); back.position.set(0, 1.5, -15); s.scene.add(back);
  const items = [];
  for (const bx of [-3.6, 3.6]) for (let r = 0; r < 19; r++) for (let c = 0; c < 10; c++) { if (r === 18 && c > 7) continue; items.push({ x: bx + (c - 4.5) * 0.66, z: -12 + r * 1.05 }); }
  const crowd = pawns(s.scene, items, {});
  const R = rng(4); const order = items.map((_, i) => i).sort(() => R() - 0.5);
  const first5 = order.slice(0, 5), more = order.slice(5, 97);
  const delay = items.map(() => R());
  const plen = tag(hud, ['FIRST PLENUM  OCT 23rd, 2022']);
  const ctr = counter(hud, 'OF 376 PRESENT  2022');
  const qs = more.filter((_, k) => k % 15 === 3).slice(0, 6).map((i) => ({ i, g: tag(hud, [{ t: '?', cls: 'sm redfill' }]) }));
  s.update = (lt, t) => {
    const up = sr(t, 18.0, 19.0);
    aimLerp(s.camera, [[1.5, 2.6, 9.5], [-1, 0.6, -2]], [[-7, 21, 12], [0, 0, -3]], up, lerp(0.02, 0.38, up));
    if (up < 0.01) s.camera.position.x -= lt * 0.08;
    s.focus = up > 0.5 ? [0.5, 0.14, 10] : [0.5, 0.08, 14];
    for (const i of first5) crowd.set(i, { vis: 1 - sr(t, 15.1 + delay[i] * 0.5, 15.35 + delay[i] * 0.5), chair: t > 15.2 ? 0xffffff : null });
    for (const i of more) crowd.set(i, { vis: 1 - sr(t, 19.0 + delay[i] * 0.9, 19.25 + delay[i] * 0.9) });
    plen.at(540, 240, 0.5, 0).win(t, 13.2, 15.0);
    ctr.vis(t > 15.05).at(540, 200);
    const v = t < 18.9 ? lerp(0, 371, sr(t, 15.08, 15.7, ease.out)) : lerp(371, 279, sr(t, 18.92, 19.9, ease.out));
    ctr.val(v).sub(t < 18.9 ? 'OF 376 PRESENT  2022' : 'OF 376 PRESENT  OCT 2026');
    for (const q of qs) { const p = project(V(crowd.st[q.i].x, 1.0, crowd.st[q.i].z), s.camera); q.g.at(p.x, p.y, 0.5, 1).win(t, 20.96 + (q.i % 5) * 0.12, end); }
  };
  return s;
}

// ---------- one row; they vanish one at a time ----------
export function vanish({ hud, start }) {
  const s = base({ focus: [0.52, 0.06, 14], fov: 30 });
  rig(s.scene, { pos: [-6, 12, 10] });
  ground(s.scene, 0xd4d4d2);
  const items = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 24; c++) items.push({ x: (c - 12) * 0.68, z: -r * 1.1 });
  const crowd = pawns(s.scene, items, {});
  const picks = [2, 5, 9, 11, 14, 18, 21].map((c) => c);
  const yr = tag(hud, ['跳过 PASSED OVER  OCT 2025']);
  const yr2 = tag(hud, ['开除 EXPELLED  OCT 2026'], {});
  s.update = (lt, t) => {
    aim(s.camera, [-5 + lt * 0.35, 1.9, 3.3], [1 + lt * 0.3, 0.8, -1.5], 0.0);
    picks.forEach((c, k) => { crowd.set(c, { color: t > 24.3 ? RED : null }); crowd.set(c, { vis: 1 - sr(t, 26.0 + k * 0.17, 26.35 + k * 0.17, ease.in) }); });
    yr.at(540, 300, 0.5, 0).win(t, 24.3);
    yr2.at(540, 370, 0.5, 0).win(t, 26.9);
  };
  return s;
}

// ---------- full members, and a numbered line of alternates ----------
export function roster({ hud, start }) {
  const s = base({ focus: [0.5, 0.08, 13], fov: 30 });
  rig(s.scene, { pos: [-9, 14, 8] });
  ground(s.scene, 0xd6d6d4);
  const full = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 12; c++) full.push({ x: -3 + c * 0.7, z: -2 - r * 1.05 });
  const fm = pawns(s.scene, full, {});
  const alt = [];
  for (let i = 0; i < 10; i++) alt.push({ x: -4.4 + i * 0.5, z: 1.5 + i * 0.72, ry: 0 });
  const am = pawns(s.scene, alt, { kind: 'standing', color: 0x7a7a7a, chairs: false });
  const nums = alt.map((a, i) => tag(hud, [{ t: String(i + 1), cls: 'sm ghost dk' }]));
  const lf = tag(hud, ['中央委员 FULL MEMBERS']);
  const la = tag(hud, ['候补 ALTERNATES']);
  const removed = 0; // front-left seat
  const seat = fm.st[removed];
  s.update = (lt, t) => {
    aim(s.camera, [-9 + lt * 0.1, 4.2, 10.5], [-0.6, 0.4, -1.6], 0.02);
    fm.set(removed, { vis: 1 - sr(t, 32.4, 32.9, ease.in), chair: t > 32.4 && t < 34.6 ? RED : null });
    // #1 walks to the empty seat, the rest shuffle up one place
    const w = sr(t, 33.6, 34.8);
    const a0 = alt[0];
    am.set(0, { dx: (seat.x - a0.x) * w, dz: (seat.z - a0.z) * w, vis: 1 - sr(t, 34.7, 34.9) });
    if (t > 34.8) fm.set(removed, { vis: 1 });
    for (let i = 1; i < alt.length; i++) { const k = sr(t, 34.0 + i * 0.04, 34.7 + i * 0.04); am.set(i, { dx: (alt[i - 1].x - alt[i].x) * k, dz: (alt[i - 1].z - alt[i].z) * k }); }
    nums.forEach((n, i) => { const a = am.st[i]; const p = project(V(a.x + a.dx + 0.35, 0.3, a.z + a.dz), s.camera); n.at(p.x, p.y, 0, 1).win(t, 30.6 + i * 0.05, i === 0 ? 33.6 : 1e9); });
    const pf = project(V(1.0, 1.9, -6), s.camera); lf.at(pf.x, pf.y, 0.5, 1).win(t, 28.6);
    const pa = project(V(-1.6, 2.0, 4.5), s.camera); la.at(pa.x, pa.y, 0, 1).win(t, 30.4);
  };
  return s;
}

// ---------- the October 2025 promotions: 11 move up, 7 are passed over ----------
export function skip({ hud, start }) {
  const s = base({ focus: [0.45, 0.16, 10], clear: 0xd2d2d0 });
  rig(s.scene, { pos: [-10, 20, 4], size: 26 });
  ground(s.scene, 0xd2d2d0);
  // full-member columns with 11 empty seats
  const cols = [];
  for (let c = 0; c < 4; c++) for (let r = 0; r < 22; r++) cols.push({ x: -5 + c * 1.25, z: -11 + r * 0.9, ry: Math.PI / 2 });
  const R = rng(12); const emptyIdx = cols.map((_, i) => i).sort(() => R() - 0.5).slice(0, 11).sort((a, b) => cols[a].z - cols[b].z);
  const fm = pawns(s.scene, cols, {});
  emptyIdx.forEach((i) => fm.set(i, { vis: 0 }));
  // alternates in vote order
  const q = []; for (let i = 0; i < 24; i++) q.push({ x: 0.3, z: -11 + i * 0.85, ry: Math.PI / 2 });
  const am = pawns(s.scene, q, { kind: 'standing', chairs: false, color: 0x6e6e6e });
  const skipped = new Set([1, 4, 5, 8, 11, 13, 16]);
  const promoted = []; for (let i = 0; i < 18; i++) if (!skipped.has(i)) promoted.push(i);
  const plen = tag(hud, ['FOURTH PLENUM  OCT 23rd, 2025']);
  const ctr = counter(hud, '递补 PROMOTED');
  const marks = [...skipped].map((i) => ({ i, g: tag(hud, [{ t: '?', cls: 'sm redfill' }]) }));
  s.update = (lt, t) => {
    aim(s.camera, [-1.6, 30 - lt * 0.4, 5], [-1.4, 0, -1.0], 0.0);
    promoted.forEach((qi, k) => {
      const target = fm.st[emptyIdx[k]]; const w = sr(t, 38.4 + k * 0.1, 39.2 + k * 0.1);
      am.set(qi, { dx: (target.x - q[qi].x) * w, dz: (target.z - q[qi].z) * w, vis: 1 - sr(t, 39.15 + k * 0.1, 39.3 + k * 0.1) });
      fm.set(emptyIdx[k], { vis: sr(t, 39.15 + k * 0.1, 39.3 + k * 0.1) });
    });
    for (const i of skipped) am.set(i, { color: t > 40.4 ? RED : null });
    plen.at(540, 240, 0.5, 0).win(t, 37.0);
    ctr.vis(t > 38.4).at(540, 330).val(t < 40.44 ? lerp(0, 11, sr(t, 38.4, 39.4, ease.out)) : 7).sub(t < 40.44 ? '递补 PROMOTED' : '跳过 PASSED OVER');
    for (const m of marks) { const a = q[m.i]; const p = project(V(a.x + 0.6, 1.6, a.z), s.camera); m.g.at(p.x, p.y, 0, 0.5).win(t, 40.6 + m.i * 0.03); }
  };
  return s;
}

// ---------- a formation of soldiers (several framings) ----------
export function formation({ hud, start, end, view = 'aerial', chips = [], counterAt }) {
  const s = base({ focus: view === 'low' ? [0.45, 0.06, 15] : [0.5, 0.13, 11], clear: 0xc9c9c7 });
  rig(s.scene, { pos: [-12, 18, 6], size: 40 });
  ground(s.scene, 0xc7c7c5);
  const items = []; const R = rng(5);
  for (const bx of [-9, 0, 9]) for (let r = 0; r < 22; r++) for (let c = 0; c < 12; c++) items.push({ x: bx + (c - 5.5) * 0.62, z: -20 + r * 0.8, ry: 0 });
  const sol = pawns(s.scene, items, { kind: 'standing', chairs: false, military: true, color: 0x3a3c3a });
  const g = chips.map((c) => ({ ...c, g: tag(hud, c.lines, { align: 'center' }) }));
  const phase = items.map(() => R());
  s.update = (lt, t) => {
    const march = view === 'march';
    if (view === 'aerial') aim(s.camera, [-14 + lt * 0.3, 26, 16], [0, 0, -4 + lt * 0.2], 0.35);
    else if (view === 'low') aim(s.camera, [-13, 5, 12 - lt * 0.3], [-1, 0.8, -8], 0.0);
    else aim(s.camera, [-10, 16, 10 - lt * 0.6], [0, 0, -6 - lt * 0.6], 0.3);
    if (march) for (let i = 0; i < items.length; i += 1) sol.set(i, { dz: -lt * 1.2, dy: Math.abs(Math.sin((lt * 3.2 + (i % 12 < 6 ? 0 : 0.5)) * Math.PI)) * 0.05 });
    for (const c of g) c.g.at(540, c.y, 0.5, 0).win(t, c.at, c.until || end);
  };
  return s;
}

// ---------- the red carpet: the investigator walks to the top ----------
export function carpet({ hud, start }) {
  const s = base({ focus: [0.42, 0.08, 14], clear: 0xd0d0ce });
  rig(s.scene, { pos: [-10, 16, 6], size: 40 });
  ground(s.scene, 0xd0d0ce);
  const rug = box(1.8, 0.04, 60, redMat()); rug.position.set(0, 0.02, 0); s.scene.add(rug);
  const stage = box(10, 1, 3, 0xeeeeec); stage.position.set(0, 0.5, -31); s.scene.add(stage);
  const banner = box(8, 1.2, 0.3, redMat()); banner.position.set(0, 1.7, -30); s.scene.add(banner);
  const items = [];
  for (const side of [-1, 1]) for (let r = 0; r < 44; r++) for (let c = 0; c < 6; c++) items.push({ x: side * (1.8 + c * 0.75), z: -28 + r * 1.2, ry: -side * Math.PI / 2 * 0.0 });
  pawns(s.scene, items, { kind: 'standing', chairs: false, military: true, color: 0x353535 });
  const walker = pawn({ military: true, color: 0x1e1e1e }); s.scene.add(walker);
  const lab = tag(hud, ['张升民 ZHANG SHENGMIN']);
  const lab2 = tag(hud, [{ t: '军委纪委书记 TOP INVESTIGATOR', cls: 'sm' }]);
  s.update = (lt, t) => {
    const z = 18 - lt * 2.2;
    walker.position.set(0, 0, z);
    walker.children[0].position.y = 0.63 + Math.abs(Math.sin(lt * 5)) * 0.03;
    aim(s.camera, [-0.7, 2.9, z + 6.0], [0.2, 0.7, z - 6], 0.0);
    const p = project(V(0, 2.1, z), s.camera);
    lab.at(p.x, p.y - 70, 0.5, 1).win(t, 72.1);
    lab2.at(p.x, p.y - 20, 0.5, 1).win(t, 73.3);
  };
  return s;
}

// ---------- the Politburo round table ----------
export function roundTable({ hud, start, end, view = 'ring' }) {
  const s = base({ focus: view === 'ring' ? [0.5, 0.18, 9] : [0.5, 0.08, 13], clear: 0xd4d4d2 });
  rig(s.scene, { pos: [-6, 16, 6] });
  ground(s.scene, 0xd4d4d2);
  const tbl = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.35, 64), mat(0xf4f4f2)); tbl.position.y = 0.95; tbl.castShadow = tbl.receiveShadow = true; s.scene.add(tbl);
  const items = []; const N = 22; const OFF = 13;
  for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; items.push({ x: Math.sin(a) * 4.9, z: Math.cos(a) * 4.9, ry: a + Math.PI }); }
  const civ = pawns(s.scene, items, { chairColor: 0x3a3a3a });
  const a = (OFF / N) * Math.PI * 2;
  civ.set(OFF, { vis: 0, chair: RED });
  const off = pawn({ military: true, standing: false, color: 0x2a2a2a }); off.position.set(Math.sin(a) * 4.9, 0, Math.cos(a) * 4.9); off.rotation.y = a + Math.PI; s.scene.add(off);
  const ttl = tag(hud, ['中央政治局 THE POLITBURO']);
  const only = tag(hud, ['张升民 THE ONLY OFFICER']);
  const ctr = counter(hud, '上一次 LAST TIME');
  s.update = (lt, t) => {
    if (view === 'ring') aim(s.camera, [0, 24 - lt * 0.4, 15], [0, 0, 0.8], 0.0);
    else if (view === 'officer') aim(s.camera, [Math.sin(a) * 12 - 3 + lt * 0.3, 4.2, Math.cos(a) * 12 + 1.5], [off.position.x, 1.0, off.position.z], 0.0);
    else aim(s.camera, [0, 22 + lt * 1.6, 12 + lt * 0.6], [0, 0, 0], 0.0);
    off.position.y = view === 'ring' ? 0 : 0;
    const p = project(V(off.position.x, 2.0, off.position.z), s.camera);
    if (view === 'ring') ttl.at(540, 280, 0.5, 0).win(t, start + 0.2);
    if (view === 'officer') only.at(p.x, p.y, 0.5, 1).win(t, start + 0.4);
    if (view === 'since') { ctr.vis(t > 104.1).at(540, 260).val(Math.round(lerp(2026, 1994, sr(t, 104.2, 105.5, ease.out)))).sub(t < 105.4 ? '' : '上一次 LAST TIME'); }
  };
  return s;
}

// ---------- seven chairs at a long table: five go empty ----------
export function seven({ hud, start }) {
  const s = base({ focus: [0.45, 0.09, 13], clear: 0xd6d6d4 });
  rig(s.scene, { pos: [-8, 14, 8] });
  ground(s.scene, 0xd6d6d4);
  const top = box(2.2, 0.9, 14, 0xf2f2f0); top.position.set(1.6, 0.45, -3); s.scene.add(top);
  const edge = box(0.35, 0.92, 22, redMat()); edge.position.set(-1.1, 0.46, 0); s.scene.add(edge);
  const wall = box(0.3, 3, 14, 0xefefed); wall.position.set(4, 1.5, -3); s.scene.add(wall);
  const items = []; for (let i = 0; i < 7; i++) items.push({ x: 1.6, z: -8.5 + i * 1.6, y: 0.9, ry: -Math.PI / 2 });
  const p7 = pawns(s.scene, items, { chairColor: 0x6a6a6a });
  const keep = new Set([0, 6]);
  const gone = [1, 2, 3, 4, 5];
  s.update = (lt, t) => {
    aim(s.camera, [-3.5 + lt * 0.1, 5.2, 7.5], [1.2, 0.8, -3.5], 0.08);
    gone.forEach((i, k) => p7.set(i, { vis: 1 - sr(t, 110.6 + k * 0.16, 110.9 + k * 0.16, ease.in) }));
  };
  return s;
}

// ---------- the officers who advise him; one chair left empty ----------
export function advisers({ hud, start }) {
  const s = base({ focus: [0.5, 0.08, 13], clear: 0xd2d2d0 });
  rig(s.scene, { pos: [-8, 14, 8] });
  ground(s.scene, 0xd2d2d0);
  const tb = box(2.6, 0.12, 16, 0xf4f4f2); tb.position.set(0, 1.0, -4); s.scene.add(tb);
  const leg = box(2.2, 0.95, 15.4, 0xe2e2e0); leg.position.set(0, 0.47, -4); s.scene.add(leg);
  const items = [];
  for (const side of [-1, 1]) for (let i = 0; i < 9; i++) items.push({ x: side * 1.9, z: -11 + i * 1.5, ry: side < 0 ? Math.PI / 2 : -Math.PI / 2 });
  const p = pawns(s.scene, items, { military: true, color: 0x333533 });
  const empty = 8; p.set(empty, { vis: 0, chair: RED });
  const head = pawn({ standing: false }); head.position.set(0, 0, -13.2); s.scene.add(head);
  const ch = box(0.6, 1.2, 0.1, 0xf2f2f0); ch.position.set(0, 0.9, -13.5); s.scene.add(ch);
  const lab = tag(hud, [{ t: '?', cls: 'redfill' }]);
  s.update = (lt, t) => {
    aim(s.camera, [5.5 - lt * 0.15, 4.2, 6.5 - lt * 0.4], [-0.6, 0.6, -7.5], -0.03);
    const q = project(V(items[empty].x, 1.7, items[empty].z), s.camera);
    lab.at(q.x, q.y, 0.5, 1).win(t, 135.6);
  };
  return s;
}

// ---------- a single figure, framed like a press portrait ----------
export function hero({ hud, start, end, military = true, chips = [], credit = '', seed = 1, color = 0x2e2e2e, podium = false }) {
  const s = base({ focus: [0.4, 0.08, 16], clear: 0x8e8e8c, fov: 26 });
  rig(s.scene, { pos: [-5, 8, 7], key: 2.8, amb: 0.8 });
  ground(s.scene, 0x9a9a98);
  const back = box(30, 12, 0.3, 0xa8a8a6); back.position.set(0, 6, -7); s.scene.add(back);
  const R = rng(seed);
  const crowdItems = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) crowdItems.push({ x: -6 + c * 1.3 + R() * 0.3, z: -3.5 - r * 1.2 });
  pawns(s.scene, crowdItems, { kind: 'standing', chairs: false, military, color: 0x5a5a5a });
  const fig = pawn({ military, color, standing: true }); fig.scale.setScalar(1.0); s.scene.add(fig);
  if (podium) { const pd = box(0.62, 0.95, 0.4, 0xe6e6e4); pd.position.set(0, 0.48, 0.42); s.scene.add(pd); const mic = box(0.04, 0.4, 0.04, 0x111111); mic.position.set(0.05, 1.08, 0.38); s.scene.add(mic); }
  const g = chips.map((c) => ({ ...c, g: tag(hud, c.lines, { align: 'center', gap: 6 }) }));
  s.credit = credit;
  s.update = (lt, t) => {
    const k = ramp(t, start, end);
    aim(s.camera, [0.5 - k * 0.3, 1.5, 4.6 - k * 0.6], [0, 1.05, 0], 0.0);
    fig.rotation.y = 0.12 - k * 0.1;
    for (const c of g) c.g.at(540, (c.y || 1120) + 40, 0.5, 0).win(t, c.at, c.until || end);
  };
  return s;
}
