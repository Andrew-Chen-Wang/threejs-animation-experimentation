// The one 3D world the whole piece lives in: a dark field, a road, a tank that gets hit and keeps
// smoking, the drone that hit it, and (for the last act) a man surrendering to a drone, seen in
// thermal. Everything is a pure function of narration time t; there are no deltas.
import * as THREE from 'three';
import { clamp, lerp, ramp, sr, ease, rng } from '../../src/lib/util.js';
import { T } from './times.js';

export const COL = {
  bg: '#161412', fpvFog: '#3a3732', line: '#3a3631', streak: '#4d473f',
  hull: '#2c2925', edge: '#9a9284', smokeL: '#a9a296', smokeM: '#736d64', smokeD: '#4a4540',
  fire: '#d9542c', fire2: '#f29a45', drone: '#ebe5d8', ir: '#0e0e0d', irHot: '#f1ece0',
};

function edged(geo, fill, edge = COL.edge, edgeOpacity = 0.75) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: fill }));
  m.castShadow = true;
  g.add(m);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), new THREE.LineBasicMaterial({ color: edge, transparent: true, opacity: edgeOpacity }));
  g.add(e);
  return g;
}

function makeTank() {
  const tank = new THREE.Group();
  const add = (geo, x, y, z, ry = 0) => { const o = edged(geo, COL.hull); o.position.set(x, y, z); o.rotation.y = ry; tank.add(o); return o; };
  add(new THREE.BoxGeometry(6.2, 1.0, 3.0), 0, 1.15, 0);
  const glacis = add(new THREE.BoxGeometry(1.4, 0.7, 3.0), 3.2, 1.0, 0); glacis.rotation.z = 0.55;
  for (const z of [-1.75, 1.75]) {
    add(new THREE.BoxGeometry(6.8, 0.9, 0.75), 0, 0.5, z);
    for (let i = 0; i < 6; i++) {
      const w = edged(new THREE.CylinderGeometry(0.36, 0.36, 0.8, 14), COL.hull, COL.edge, 0.45);
      w.rotation.x = Math.PI / 2; w.position.set(-2.6 + i * 1.04, 0.42, z); tank.add(w);
    }
  }
  const turret = new THREE.Group(); turret.position.set(-0.4, 1.95, 0); tank.add(turret);
  const tg = edged(new THREE.CylinderGeometry(1.15, 1.45, 0.75, 8), COL.hull); turret.add(tg);
  const hatch = edged(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 10), COL.hull); hatch.position.set(-0.3, 0.45, 0.4); turret.add(hatch);
  const barrel = edged(new THREE.CylinderGeometry(0.11, 0.14, 4.6, 8), COL.hull);
  barrel.rotation.z = Math.PI / 2 - 0.06; barrel.position.set(3.3, 0.12, 0); turret.add(barrel);
  tank.userData.turret = turret;
  return tank;
}

export function makeDrone(color = COL.drone) {
  const d = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.32), mat); d.add(body);
  const bat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.18), new THREE.MeshLambertMaterial({ color: '#6b655c' })); bat.position.y = 0.14; d.add(bat);
  const rotors = [];
  for (const a of [0.785, 2.356, 3.927, 5.498]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.07), mat);
    arm.position.set(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3); arm.rotation.y = -a; d.add(arm);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.26, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    disc.rotation.x = -Math.PI / 2; disc.position.set(Math.cos(a) * 0.58, 0.06, Math.sin(a) * 0.58); d.add(disc); rotors.push(disc);
  }
  d.userData.rotors = rotors;
  return d;
}

function makePerson(color) {
  const p = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.55 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.62, 4, 10), m); torso.position.y = 1.25; p.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), m); head.position.y = 1.86; p.add(head);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.72, 4, 8), m); leg.position.set(0, 0.48, s * 0.13); p.add(leg);
    const arm = new THREE.Group(); arm.position.set(0, 1.58, s * 0.3); p.add(arm);
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.56, 4, 8), m); a.position.y = 0.34; arm.add(a);
    arm.rotation.x = -s * 0.32; p.userData['arm' + s] = arm;
  }
  return p;
}

function makeRobot(color) {
  const r = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.35 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 1.1), m); deck.position.y = 0.45; r.add(deck);
  const stretcher = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.7), new THREE.MeshLambertMaterial({ color: '#8d877c' })); stretcher.position.y = 0.68; r.add(stretcher);
  for (const x of [-0.55, 0, 0.55]) for (const z of [-0.62, 0.62]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 14), m); w.rotation.x = Math.PI / 2; w.position.set(x, 0.24, z); r.add(w);
  }
  return r;
}

/** the smoke cloud: puffs that bloom at the hit, then hang around and slowly rise */
function makeSmoke(seed = 7) {
  const g = new THREE.Group(); const R = rng(seed); const puffs = [];
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const mats = [COL.smokeL, COL.smokeL, COL.smokeM, COL.smokeD].map((c) => new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
  for (let i = 0; i < 46; i++) {
    const m = new THREE.Mesh(geo, mats[Math.floor(R() * mats.length)]);
    const a = R() * Math.PI * 2, r = Math.pow(R(), 0.7) * 2.0;
    puffs.push({ m, x: Math.cos(a) * r - 0.4, z: Math.sin(a) * r, y: 1.4 + R() * 2.4, s: 0.35 + R() * 0.55, d: R() * 0.5, rise: 0.05 + R() * 0.12, ph: R() * 6 });
    g.add(m);
  }
  const fireMats = [COL.fire, COL.fire2].map((c) => new THREE.MeshBasicMaterial({ color: c }));
  const fires = [];
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(geo, fireMats[i % 2]);
    const a = R() * Math.PI * 2, r = R() * 1.3;
    fires.push({ m, x: Math.cos(a) * r - 0.3, z: Math.sin(a) * r, y: 2.0 + R() * 1.4, s: 0.3 + R() * 0.45, ph: R() * 6 }); g.add(m);
  }
  g.userData.update = (t) => {
    const k = t - T.hit;
    for (const p of puffs) {
      const grow = ease.out(clamp((k - p.d) / 1.1));
      const sc = k < p.d ? 0.0001 : p.s * grow * (1 + 0.06 * Math.sin(t * 0.7 + p.ph));
      p.m.scale.setScalar(Math.max(sc, 0.0001));
      p.m.position.set(p.x * (0.6 + 0.4 * grow), p.y + Math.min(Math.max(0, k) * p.rise, 2.5), p.z);
      p.m.rotation.set(p.ph + t * 0.05, p.ph * 2 + t * 0.04, 0);
    }
    for (const f of fires) {
      const burst = k < 0 ? 0 : ease.out(clamp(k / 0.25)) * (1 - 0.72 * ease.inOut(clamp((k - 0.3) / 1.5)));
      const flick = 0.85 + 0.15 * Math.sin(t * 9 + f.ph);
      f.m.scale.setScalar(Math.max(f.s * burst * flick, 0.0001));
      f.m.position.set(f.x, f.y + Math.max(0, k) * 0.02, f.z);
    }
  };
  return g;
}

function makeGround(seed = 3) {
  const g = new THREE.Group(); const R = rng(seed);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshLambertMaterial({ color: '#1b1916' }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(800, 6), new THREE.MeshLambertMaterial({ color: '#25221e' }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 0); g.add(road);
  // long faint drawn lines on two diagonals + short streaks: the "pencil hatch" of the reference look
  const pts = []; const pts2 = [];
  for (let i = -60; i <= 60; i++) {
    const o = i * 4.2 + (R() - 0.5) * 1.5;
    pts.push(-300, 0.02, o - 150, 300, 0.02, o + 150);
  }
  for (let i = 0; i < 1400; i++) {
    const x = (R() - 0.5) * 400, z = (R() - 0.5) * 400, l = 1 + R() * 6;
    pts2.push(x, 0.03, z, x + l * 0.9, 0.03, z + l * 0.45);
  }
  const mk = (arr, color, op) => {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: op }));
  };
  g.add(mk(pts, COL.line, 0.55)); g.add(mk(pts2, COL.streak, 0.7));
  // a tree line (thin trunks) and far smoke columns, for the FPV approach
  const trunkMat = new THREE.MeshLambertMaterial({ color: '#0e0d0c' });
  for (let i = 0; i < 90; i++) {
    const h = 3 + R() * 6; const tr = new THREE.Mesh(new THREE.BoxGeometry(0.18, h, 0.18), trunkMat);
    tr.position.set(-140 + i * 2.2 + R() * 1.5, h / 2, -16 - R() * 4); g.add(tr);
  }
  return g;
}

function farPlume(x, z, seed) {
  const g = new THREE.Group(); const R = rng(seed);
  const m = new THREE.MeshLambertMaterial({ color: '#6a655d', transparent: true, opacity: 0.55 });
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 + i * 0.5, 1), m);
    s.position.set(x + i * 1.2 + R(), 2 + i * 3.2, z + R()); g.add(s);
  }
  return g;
}

export function buildWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COL.bg);
  scene.fog = new THREE.Fog(COL.bg, 40, 160);
  const camera = new THREE.PerspectiveCamera(32, 9 / 16, 0.1, 900);

  const hemi = new THREE.HemisphereLight('#d8d0c0', '#1a1714', 1.4); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#f3e9d6', 1.6); sun.position.set(-20, 30, 14); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15 }); scene.add(sun);

  const ground = makeGround(); scene.add(ground);
  const plumes = new THREE.Group(); plumes.add(farPlume(60, -110, 2), farPlume(-40, -150, 5), farPlume(130, -90, 9)); scene.add(plumes);
  const tank = makeTank(); scene.add(tank);
  const smoke = makeSmoke(); scene.add(smoke);
  const strike = makeDrone(); strike.scale.setScalar(1.4); scene.add(strike);

  // the thermal stage, far from the tank so the two never share a frame
  const ir = new THREE.Group(); ir.position.set(0, 0, 400); scene.add(ir);
  const irGround = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshBasicMaterial({ color: '#111110' }));
  irGround.rotation.x = -Math.PI / 2; irGround.position.y = 0.05; ir.add(irGround);
  { const R = rng(11); const arr = [];
    for (let i = 0; i < 600; i++) { const x = (R() - 0.5) * 120, z = (R() - 0.5) * 120, l = 2 + R() * 9; arr.push(x, 0.08, z, x + l, 0.08, z + l * 0.5); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    ir.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#33322f', transparent: true, opacity: 0.8 }))); }
  const man = makePerson('#d9d2c2'); ir.add(man);
  const hover = makeDrone('#d9d2c2'); hover.scale.setScalar(1.1); ir.add(hover);
  const robot = makeRobot('#bfb8aa'); ir.add(robot);

  const lookAt = new THREE.Vector3();
  function update(t) {
    smoke.userData.update(t);
    const fpv = t < T.hit;
    const irMode = t >= T.irIn;
    plumes.visible = fpv;
    scene.fog.color.set(fpv ? COL.fpvFog : irMode ? COL.ir : COL.bg);
    scene.background.set(fpv ? COL.fpvFog : irMode ? COL.ir : COL.bg);
    scene.fog.near = fpv ? 20 : 40; scene.fog.far = fpv ? 210 : 160;
    tank.visible = !irMode; smoke.visible = !irMode;
    hemi.intensity = irMode ? 0.6 : 1.4;

    // the strike drone: flies in along the road with the FPV camera, gone once it hits
    const fk = ramp(t, 0, T.hit);
    strike.visible = false;
    for (const r of strike.userData.rotors) r.rotation.z = t * 40;

    if (fpv) {
      // FPV approach: fast, low, slightly shaky, accelerating into the turret
      const k = ease.in(fk) * 0.75 + fk * 0.25;
      const shake = (s) => Math.sin(t * 23 + s) * 0.08 + Math.sin(t * 41 + s * 2) * 0.05;
      camera.fov = 58;
      camera.position.set(lerp(-95, -3.2, k), lerp(16, 3.4, k) + shake(1), lerp(8, 0.6, k) + shake(2));
      lookAt.set(lerp(20, 0, ease.out(fk)), lerp(-3, 1.6, fk), 0);
      camera.lookAt(lookAt);
      camera.rotateZ(Math.sin(t * 2.1) * 0.05 + shake(3) * 0.2);
    } else if (!irMode) {
      // isometric-ish orbit around the smoking tank; pulls back slowly across the whole piece
      camera.fov = 30;
      const k = t - T.hit;
      const az = -0.62 + k * 0.012 + Math.sin(k * 0.13) * 0.08;
      const dist = lerp(30, 44, ease.out(clamp(k / 8))) + Math.sin(k * 0.21) * 1.5;
      const el = 0.6;
      lookAt.set(0, lerp(3.2, 4.5, ease.out(clamp(k / 6))), 0);
      camera.position.set(Math.cos(az) * Math.cos(el) * dist, lookAt.y + Math.sin(el) * dist, Math.sin(az) * Math.cos(el) * dist + 2);
      camera.lookAt(lookAt);
    } else {
      // thermal: high, looking down on a man with his hands up and the drone that found him
      camera.fov = 34;
      const k = t - T.irIn;
      camera.position.set(ir.position.x + 5 + k * 0.05, 27 - k * 0.15, ir.position.z + 21 - k * 0.15);
      lookAt.set(ir.position.x, 3.4, ir.position.z + 0.4);
      camera.lookAt(lookAt);
      const raise = sr(t, T.irIn + 1.2, T.irIn + 2.0, ease.out);
      man.position.set(0, 0, 2.6);
      man.rotation.y = -0.5;
      man.userData['arm-1'].rotation.x = lerp(1.0, 0.32, raise) + Math.sin(t * 1.7) * 0.03;
      man.userData.arm1.rotation.x = lerp(-1.0, -0.32, raise) - Math.sin(t * 1.9) * 0.03;
      hover.position.set(Math.sin(t * 0.7) * 0.35, 4.6 + Math.sin(t * 1.3) * 0.12, -1.5 + Math.cos(t * 0.6) * 0.3);
      hover.rotation.y = 0.6;
      for (const r of hover.userData.rotors) r.rotation.z = t * 40;
      // the evacuation robot rolls in for "rescuing your own wounded by robot"
      const rk = sr(t, T.robotIn, T.robotIn + 2.4, ease.out);
      robot.visible = t > T.robotIn - 0.1 && t < T.swap;
      robot.position.set(lerp(-13, -2.4, rk), 0, lerp(-3, 2.2, rk)); robot.rotation.y = -0.45;
    }
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }
  return { scene, camera, update, tank };
}
