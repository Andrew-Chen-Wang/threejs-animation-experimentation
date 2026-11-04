// The scenes. Each beat owns a Three.js scene on the shared dark paper stage, and update(t)
// poses everything from absolute time t (seconds into the narration).
import * as THREE from 'three';
import { C, FONT, cutout, rectShape, polyShape, slip, label, drawnCard, at, mat } from './paper.js';
import { person, baby, gradCap, heart, house, temple, banknote, bundle, pedestal, ruler, redLine, podium, desk, crib, packet, babyToken, add } from './figures.js';
import { show, ramp, sr, ease, easeInOut, easeOut, lerp, clamp } from './util.js';

// ---------- shared stage ----------
function stage() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#121212');
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), mat(C.wall)); wall.position.set(0, 12, -0.6); wall.receiveShadow = true; scene.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), mat(C.floor)); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 19.4); floor.receiveShadow = true; scene.add(floor);
  scene.add(new THREE.HemisphereLight('#ffffff', '#4a4a4a', 1.5));
  const spot = new THREE.SpotLight('#fff6ea', 2000, 70, 0.6, 0.9, 2);
  spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.radius = 6; spot.shadow.blurSamples = 16; spot.shadow.bias = -0.0004; spot.shadow.normalBias = 0.02;
  spot.shadow.camera.near = 4; spot.shadow.camera.far = 50; scene.add(spot, spot.target);
  const camera = new THREE.PerspectiveCamera(30, 9 / 16, 0.1, 120);
  const people = [];
  const S = {
    scene, camera, people,
    add(obj, x = 0, y = 0, z = 0) { at(obj, x, y, z); scene.add(obj); return obj; },
    person(o, x, y, z, st) { const p = person(o); at(p, x, y, z); scene.add(p); people.push([p, st]); return p; },
    // camera looks straight at the wall; small hand-held drift keeps every frame alive
    cam(t, x, y, D) {
      const dx = Math.sin(t * 0.23) * 0.035 + Math.sin(t * 0.61) * 0.012, dy = Math.sin(t * 0.19 + 1) * 0.03;
      camera.position.set(x + dx, y + dy, D); camera.lookAt(x + dx * 0.6, y + dy * 0.6, 0);
      camera.rotation.z = Math.sin(t * 0.17) * 0.004;
      spot.position.set(x - 1.8, y + 5.0, 14); spot.target.position.set(x, y - 0.4, 0);
    },
    tick(t) { for (const [p, st] of people) if (p.visible) p.userData.update(t, typeof st === 'function' ? st(t) : st || {}); },
  };
  return S;
}

// A horizontal bar (dark track + fill growing from the left)
function bar(w, color) {
  const g = new THREE.Group();
  add(g, cutout(rectShape(w, 0.13, w / 2, 0), '#3b3a39'), -w / 2, 0, 0);
  const fill = new THREE.Group(); add(g, fill, -w / 2, 0, 0.03);
  add(fill, cutout(rectShape(w, 0.13, w / 2, 0), color), 0, 0, 0);
  g.userData.set = (k) => { fill.scale.x = Math.max(0.001, k); fill.visible = k > 0.002; };
  return g;
}
const rateK = 2.6; // world units per 1.0 children-per-woman

// ---------- 1. the floor, broken; Japan for scale (0 – 24.75) ----------
function rates() {
  const S = stage();
  const th = S.add(pedestal(2.0, rateK, 1.2, 'THAILAND'), 0.3, 0, 0.2);
  const line = S.add(redLine(40), 0, rateK + 0.035, 0.25);
  const ticks = []; for (let i = 0; i <= 14; i++) ticks.push({ y: i * 0.1 * rateK, major: i % 5 === 0, text: i === 10 ? '1.0' : i === 0 ? '0' : '' });
  const rul = S.add(ruler(3.9, ticks), -1.95, 0, 0.0);
  const woman = S.person({ kind: 'woman', h: 1.5, top: C.white, bottom: C.ink, seed: 1 }, 0, 0, 0.45, { arms: [0.05, 0.22] });
  const kid = S.person({ kind: 'child', h: 0.8, top: C.g2, bottom: C.g4, seed: 2 }, 0, 0, 0.45, { arms: [-0.3, 0.05] });
  const nat = S.add(slip([{ t: 'National priority', size: 0.21 }, { t: 'TARGET · 2027', size: 0.1, font: FONT.mono, weight: 500, color: C.g2 }], { seed: 4 }), 0.3, 6.15, 0.3);
  const floorTag = S.add(slip([{ t: 'THE FLOOR', size: 0.13, font: FONT.mono, weight: 600 }, { t: '1 child per woman', size: 0.1, font: FONT.mono, weight: 500, color: C.g3 }], { bg: '#d6d2ca', seed: 9 }), -1.3, rateK + 0.62, 0.6);
  const news = S.add(slip([{ t: 'อัตราเจริญพันธุ์ ระดับ 1.00 เป็นครั้งแรก', font: FONT.thai, size: 0.17, weight: 600, mark: ['1.00'] }, { t: 'fertility rate hits 1.00, a first', size: 0.1, font: FONT.mono, weight: 500, color: C.g2 }], { seed: 5 }), 0.3, 6.15, 0.3);
  const y24 = S.add(slip([{ t: '2024', size: 0.17, font: FONT.mono, weight: 600 }], { seed: 6 }), 0.3, 0, 0.86);
  const y25 = S.add(slip([{ t: '2025', size: 0.17, font: FONT.mono, weight: 600 }], { seed: 7 }), 0.3, 0, 0.86);
  const below = S.add(slip([{ t: 'BELOW 1', size: 0.14, font: FONT.mono, weight: 600, color: '#f3ece9' }], { bg: C.red, torn: false, edge: C.red }), 1.55, 0, 0.9);
  const jp = S.add(pedestal(1.9, 1.14 * rateK, 1.2, 'JAPAN'), 1.3, 0, 0.2);
  const jpm = S.person({ kind: 'man', h: 1.6, top: C.g1, bottom: C.g4, seed: 3 }, 0, 0, 0.45, {});
  const jpw = S.person({ kind: 'woman', h: 1.5, top: C.g3, bottom: C.ink, seed: 4 }, 0, 0, 0.45, {});
  const jpk = S.person({ kind: 'child', h: 0.75, top: C.white, bottom: C.g3, seed: 5 }, 0, 0, 0.45, {});
  const jpTag = S.add(slip([{ t: '1.14', size: 0.2, font: FONT.mono, weight: 600 }], { seed: 8 }), 0, 0, 0.86);
  const jpNews = S.add(slip([{ t: 'the poster country for low birth rates', size: 0.12, font: FONT.mono, weight: 500 }], { seed: 12 }), 1.3, 0, 0.5);
  return { S, update(t) {
    const pull = easeInOut(ramp(t, 19.6, 20.9));
    const v = lerp(1.0, 0.93, easeInOut(ramp(t, 15.8, 17.0)));
    th.userData.setH(v * rateK);
    th.position.x = lerp(0.3, -1.15, pull);
    rul.position.x = lerp(-1.95, -2.55, pull);
    const top = v * rateK;
    at(woman, th.position.x - 0.25, top, 0.45); at(kid, th.position.x + 0.3, top, 0.45);
    show(woman, t, 0.0, Infinity, 'pop'); show(kid, t, 0.0, Infinity, 'pop');
    show(nat, t, 0.4, 11.0); show(floorTag, t, 8.8, 13.4, 'pop');
    nat.position.x = 0.3;
    show(news, t, 13.5, 19.5); news.userData.boxes[0].visible = t > 14.3;
    y24.position.set(th.position.x, top - 0.72, 0.86); y25.position.copy(y24.position);
    y24.userData.base = null; y25.userData.base = null;
    show(y24, t, 14.25, 16.35, 'pop'); show(y25, t, 16.5, Infinity, 'pop');
    below.position.set(th.position.x + 0.62, top - 0.22, 0.9); below.userData.base = null; below.rotation.z = -0.08;
    show(below, t, 16.9, 19.6, 'pop');
    show(jp, t, 19.9, Infinity, 'right', 0.8);
    const jt = jp.position.y + 1.14 * rateK;
    at(jpm, jp.position.x - 0.45, jt, 0.45); at(jpw, jp.position.x + 0.05, jt, 0.45); at(jpk, jp.position.x + 0.5, jt, 0.45);
    [jpm, jpw, jpk].forEach((p, i) => { p.userData.base = null; show(p, t, 20.3 + i * 0.12, Infinity, 'drop', 0.45); });
    jpTag.position.set(jp.position.x, jt - 0.72, 0.86); jpTag.userData.base = null; show(jpTag, t, 23.7, Infinity, 'pop');
    jpNews.position.set(1.3, 6.6, 0.4); jpNews.userData.base = null; show(jpNews, t, 20.5, Infinity, 'drop');
    line.scale.y = 1 + Math.max(0, Math.sin((t - 11) * 6)) * 0.5 * (ramp(t, 11, 11.1) - ramp(t, 12.6, 12.8));
    S.cam(t, lerp(0.15, 0.05, pull), lerp(3.35, 4.15, pull), lerp(lerp(14.2, 13.2, ramp(t, 0, 19.6)), 19.2, pull));
  } };
}

// ---------- 2. births: 417,000 vs 1.2 million (24.75 – 33.75) ----------
function births() {
  const S = stage();
  const mk = (n, x) => Array.from({ length: n }, (_, i) => S.add(babyToken(), x + (i % 2 ? 0.35 : -0.35), 0.22 + Math.floor(i / 2) * 0.43, 0.35 + (i % 2) * 0.01));
  const now = mk(6, 1.05), then = mk(18, -1.05);
  const nowL = S.add(slip([{ t: '417,000', size: 0.22, font: FONT.mono, weight: 600 }, { t: 'BIRTHS LAST YEAR', size: 0.09, font: FONT.mono, weight: 500, color: C.g2 }], { seed: 21 }), 1.05, 1.82, 0.4);
  const thenL = S.add(slip([{ t: '1.2 million', size: 0.22, font: FONT.mono, weight: 600 }, { t: 'BIRTHS IN 1971', size: 0.09, font: FONT.mono, weight: 500, color: C.g2 }], { seed: 22 }), -1.05, 4.6, 0.4);
  const third = S.add(new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.035, 0.05), mat(C.red, { bumpScale: 0 })), 0, 2.78, 0.45);
  const thirdL = S.add(slip([{ t: '× ⅓', size: 0.2, font: FONT.mono, weight: 600, color: '#f3ece9' }], { bg: C.red, torn: false, edge: C.red }), -1.95, 2.78, 0.5);
  const key = S.add(slip([{ t: '1 card ≈ 67,000 births', size: 0.1, font: FONT.mono, weight: 500, color: C.g2 }], { seed: 23 }), 1.05, 6.1, 0.3);
  return { S, update(t) {
    now.forEach((m, i) => show(m, t, 25.1 + i * 0.12, Infinity, 'drop', 0.4));
    show(nowL, t, 26.4, Infinity, 'pop'); show(key, t, 26.8, 30.4, 'pop');
    then.forEach((m, i) => {
      const fallT = i >= 6 ? 31.0 + (17 - i) * 0.19 : Infinity;
      show(m, t, 28.75 + i * 0.05, Infinity, 'drop', 0.35);
      if (t > fallT) { // the decline: cards slide off the stack one by one
        const f = t - fallT; m.position.x += (i % 2 ? 1 : -1) * f * 0.9 - 0.4 * f; m.position.y -= 3.2 * f * f + f * 0.4; m.rotation.z += (i % 2 ? -1 : 1) * f * 2.4;
        m.visible = m.position.y > -1.2;
      }
    });
    const topThen = 0.22 + 8 * 0.43 + 0.45, topLeft = t > 31 ? lerp(topThen, 0.22 + 2 * 0.43 + 0.45, easeInOut(ramp(t, 31.0, 33.4))) : topThen;
    thenL.userData.base = null; thenL.position.set(-1.05, topLeft + 0.32, 0.4); show(thenL, t, 29.0, Infinity, 'pop');
    third.scale.x = Math.max(0.001, easeOut(ramp(t, 29.9, 30.5))); third.visible = t > 29.9 && t < 33.3;
    show(thirdL, t, 30.2, 33.2, 'pop');
    S.cam(t, 0, 3.15, lerp(15.6, 15.0, ramp(t, 24.75, 33.75)));
  } };
}

// ---------- 3. 2017: "Have children for the nation" (33.75 – 44.5) ----------
function campaign() {
  const S = stage();
  const yr = S.add(label('2017', { size: 0.62 }), 0, 6.75, 0.1);
  const poster = S.add(drawnCard(3.5, 2.05, (x, W, H) => {
    x.fillStyle = '#f0ede6'; x.fillRect(0, 0, W, H);
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5a5957'); g.addColorStop(1, '#2e2d2c');
    x.fillStyle = g; x.fillRect(W * 0.035, H * 0.06, W * 0.93, H * 0.88);
    x.fillStyle = '#e4e1da'; x.fillRect(W * 0.1, H * 0.12, W * 0.8, H * 0.26);
    x.fillStyle = '#2a2a2a'; x.textAlign = 'center'; x.font = `700 ${H * 0.1}px "${FONT.thai}"`; x.fillText('มีลูกเพื่อชาติ', W / 2, H * 0.24);
    x.font = `600 ${H * 0.06}px "${FONT.sans}"`; x.fillText('HAVE CHILDREN FOR THE NATION', W / 2, H * 0.33);
    for (let i = 0; i < 7; i++) { // a row of officials in front of the banner
      const cx = W * (0.14 + i * 0.12), c = i % 2 ? '#1f1f1f' : '#3d3c3b';
      x.fillStyle = c; x.fillRect(cx - W * 0.045, H * 0.6, W * 0.09, H * 0.34);
      x.fillStyle = '#d6d3cc'; x.beginPath(); x.arc(cx, H * 0.53, H * 0.065, 0, 6.3); x.fill();
      x.fillStyle = '#151515'; x.beginPath(); x.arc(cx, H * 0.5, H * 0.066, Math.PI, 0); x.fill();
      x.fillStyle = '#f0ede6'; x.beginPath(); x.moveTo(cx - W * 0.012, H * 0.6); x.lineTo(cx + W * 0.012, H * 0.6); x.lineTo(cx, H * 0.7); x.fill();
    }
  }), 0, 4.75, 0.2);
  const pHeart = S.add(heart(0.62), 0.05, 4.2, 0.35);
  const man = S.person({ kind: 'man', h: 2.2, top: C.white, bottom: C.g4, tie: true, seed: 11 }, -1.3, 0, 0.5, {});
  let hold = 0, give = 0;
  const woman = S.person({ kind: 'woman', h: 2.05, top: C.g2, bottom: C.ink, seed: 12 }, 0, 0, 0.5, () => ({ arms: [lerp(0.05, 0.55, hold), lerp(-0.05, -0.55, hold)] }));
  const off = S.person({ kind: 'man', h: 2.2, top: C.g4, sleeve: C.g4, bottom: C.ink, suit: true, glasses: true, smile: true, seed: 13 }, 1.3, 0, 0.5, () => ({ arms: [lerp(-0.05, -1.05, give), 0.05] }));
  const wHeart = S.add(heart(0.42), 0, 0.98, 0.78);
  const pack = S.add(packet(), 0.3, 1.3, 0.78);
  const clip1 = S.add(slip([{ t: 'Folic acid 5 mg          จำนวน', size: 0.2, weight: 700, align: 'left' }, { t: 'ข้อบ่งใช้  วิตามินบำรุงเลือด', font: FONT.thai, size: 0.18, weight: 500, align: 'left' }], { seed: 31, rot: -0.025 }), -0.25, 6.45, 0.25);
  const clip2 = S.add(slip([{ t: 'Ferrous fumarate 200 mg     จำนวน 30 เม็ด', size: 0.13, weight: 700, align: 'left' }, { t: 'ข้อบ่งใช้  ธาตุเหล็กบำรุงเลือด', font: FONT.thai, size: 0.12, weight: 500, align: 'left' }], { seed: 32, rot: 0.02, bg: '#cfccc5' }), 0.45, 5.55, 0.2);
  const head = S.add(slip([{ t: 'ปั๊มลูกเพื่อชาติ คนไทยได้อะไร? นอกจากวิตามิน', font: FONT.thai, size: 0.165, weight: 700, align: 'left' }, { t: '18.02.17 | 12:43 น.', font: FONT.thai, size: 0.11, weight: 400, color: C.g2, align: 'left' }], { seed: 33 }), 0, 4.75, 0.35);
  const gloss = S.add(slip([{ t: '"Have children for the nation:', size: 0.135, weight: 500 }, { t: 'what do Thais get, besides vitamins?"', size: 0.135, weight: 500 }], { seed: 34, bg: '#d4d0c8' }), 0, 3.85, 0.4);
  return { S, update(t) {
    show(yr, t, 33.75, 38.4, 'fade'); show(poster, t, 34.6, 38.5); show(pHeart, t, 36.0, 37.0, 'pop');
    [man, woman, off].forEach((p, i) => show(p, t, 33.8 + i * 0.1, Infinity, 'pop'));
    hold = sr(t, 36.9, 37.3) * (1 - sr(t, 38.1, 38.4)) + sr(t, 38.9, 39.2);
    give = sr(t, 38.2, 38.6) * (1 - sr(t, 39.0, 39.5));
    show(wHeart, t, 37.05, 38.2, 'pop');
    const pk = easeInOut(ramp(t, 38.5, 39.05)); pack.userData.base = null; pack.position.set(lerp(0.32, 0.0, pk), lerp(1.3, 1.02, pk), 0.78);
    show(pack, t, 38.25, Infinity, 'pop', 0.25);
    show(clip1, t, 38.75, Infinity); show(clip2, t, 39.5, Infinity); show(head, t, 40.75, Infinity); show(gloss, t, 42.5, Infinity, 'pop');
    S.cam(t, 0, 3.3, lerp(15.2, 14.6, ramp(t, 33.75, 44.5)));
  } };
}

// ---------- 4. 600 baht a month, low-income only (44.5 – 50.75) ----------
function payment() {
  const S = stage();
  const mom = S.person({ kind: 'woman', h: 2.3, top: C.g3, bottom: C.ink, seed: 21 }, -0.85, 0, 0.5, { arms: [0.95, 0.35] });
  const b = S.add(baby(0.8), -0.66, 1.36, 0.75); b.rotation.z = 0.2;
  const notes = Array.from({ length: 6 }, (_, i) => { const n = S.add(banknote('100', { w: 1.15 }), 1.0 + (i - 2.5) * 0.08, 2.2 + i * 0.035, 0.4 + i * 0.015); n.rotation.z = -0.28 + i * 0.11; return n; });
  const amt = S.add(slip([{ t: '600 baht a month', size: 0.17, font: FONT.mono, weight: 600 }], { seed: 41 }), 1.0, 3.35, 0.45);
  const usd = S.add(slip([{ t: '≈ $18', size: 0.36, font: FONT.mono, weight: 600 }], { seed: 42 }), 1.0, 4.2, 0.45);
  const only = S.add(slip([{ t: 'LOW-INCOME FAMILIES ONLY', size: 0.11, font: FONT.mono, weight: 600, color: '#f3ece9' }], { bg: '#3d3c3b', edge: '#555', torn: false }), 1.0, 1.25, 0.6);
  return { S, update(t) {
    show(mom, t, 44.5, Infinity, 'pop'); show(b, t, 44.6, Infinity, 'pop');
    b.rotation.z = 0.2 + Math.sin(t * 2.2) * 0.04;
    notes.forEach((n, i) => show(n, t, 46.3 + i * 0.1, Infinity, 'drop', 0.45));
    show(amt, t, 47.0, Infinity, 'pop'); show(usd, t, 47.75, Infinity, 'pop'); show(only, t, 49.2, Infinity, 'pop');
    S.cam(t, 0, 2.65, lerp(13.6, 13.0, ramp(t, 44.5, 50.75)));
  } };
}

// ---------- 5. what young people want: NIDA 2023 (50.75 – 70.75) ----------
function survey() {
  const S = stage();
  const kinds = [['man', C.white, C.g4, false], ['woman', C.g2, C.ink, false], ['man', C.g4, C.ink, true], ['woman', C.white, C.g3, true], ['man', C.g1, C.g4, false], ['woman', C.g3, C.ink, false]];
  const row = kinds.map(([k, top, bot, gl], i) => S.person({ kind: k, h: 1.25, top, bottom: bot, glasses: gl, seed: 30 + i }, -1.8 + i * 0.72, 0, 0.55, {}));
  const ask = S.add(slip([{ t: 'มีลูก ยังจำเป็นอยู่ไหม?', font: FONT.thai, size: 0.15, weight: 600 }, { t: 'Is having kids still necessary?', size: 0.13, weight: 500 }], { seed: 51 }), 0.2, 2.75, 0.5);
  const yr = S.add(label('2023', { size: 0.62 }), 0, 6.8, 0.1);
  const nida = S.add(slip([{ t: 'NIDA POLL', size: 0.3, font: FONT.mono, weight: 600 }, { t: 'graduate school, Bangkok', size: 0.12, weight: 500, color: C.g2 }], { seed: 52 }), 0, 5.2, 0.3);
  const ages = S.add(slip([{ t: 'AGED 18–40', size: 0.12, font: FONT.mono, weight: 600 }], { seed: 53 }), 0, 1.85, 0.6);
  const opt = (pct, text, red) => ({ pct: S.add(label(pct, { size: 0.62, color: red ? C.red : C.paper }), 0, 6.8, 0.1), text: S.add(slip([{ t: text, size: 0.13, weight: 500 }], { seed: pct.length * 7 + text.length }), 0, 6.05, 0.3), bar: S.add(bar(3.4, red ? C.red : C.paper), 0, 3.35, 0.3) });
  const o1 = opt('65%', 'free education through university'), o2 = opt('64%', 'support payments until a child turns 15'), o3 = opt('22%', 'a big cash reward for having a baby', true);
  // 65%: school → university
  const sch = S.add(house(1.0), -1.35, 3.75, 0.2), uni = S.add(temple(1.3, 6), 1.2, 3.75, 0.2);
  const path = S.add(cutout(rectShape(1.5, 0.06, 0, 0), C.g2), -0.15, 3.78, 0.25);
  const grad = S.person({ kind: 'child', h: 0.55, top: C.white, bottom: C.g3, seed: 41 }, 0, 3.82, 0.35, () => ({ walk: 1 }));
  // 64%: walking a child along 0 → 15
  const tl = new THREE.Group(); S.add(tl, 0, 3.9, 0.2);
  add(tl, cutout(rectShape(3.3, 0.07, 0, 0), C.g2), 0, 0, 0);
  const tickN = [0, 3, 6, 9, 12, 15], tickX = (a) => -1.55 + (a / 15) * 3.1;
  tickN.forEach((a) => { add(tl, cutout(rectShape(0.025, 0.16, 0, -0.08), C.g1), tickX(a), 0, 0.02); if (a % 5 === 0) { const l = label(String(a), { size: 0.13, color: C.g1 }); l.castShadow = false; add(tl, l, tickX(a), -0.3, 0.02); } });
  const pays = tickN.map((a) => S.add(banknote('', { w: 0.28 }), tickX(a), 4.95, 0.3));
  const par = S.person({ kind: 'man', h: 0.95, top: C.g1, bottom: C.g4, seed: 42 }, 0, 3.94, 0.4, () => ({ walk: walkK, arms: [0.05, 0.3] }));
  const kid = S.person({ kind: 'child', h: 0.7, top: C.white, bottom: C.g3, seed: 43 }, 0, 3.94, 0.42, () => ({ walk: walkK, arms: [-0.35, 0.05] }));
  let walkK = 0;
  // 22%: a pile of cash
  const cash = new THREE.Group(); S.add(cash, 0, 3.75, 0.3);
  for (let i = 0; i < 6; i++) add(cash, bundle(1.4, 0.2, 0.7, '#a9a7a2'), (i % 2) * 0.04 - 0.02, 0.1 + i * 0.205, 0);
  const setOpt = (o, t, a, b, va, fill) => { const s = show(o.pct, t, va, b, 'fade'); show(o.text, t, a, b, 'pop'); show(o.bar, t, a, b, 'fade'); o.bar.userData.set(fill * easeOut(ramp(t, va, va + 0.9))); return s; };
  return { S, update(t) {
    row.forEach((p, i) => show(p, t, 50.75 + i * 0.07, Infinity, 'pop'));
    show(ask, t, 51.9, 53.35, 'pop'); show(yr, t, 53.5, 56.85, 'fade'); show(nida, t, 54.4, 56.85); show(ages, t, 58.0, 66.0, 'pop');
    setOpt(o1, t, 57.0, 62.1, 57.0, 0.65); setOpt(o2, t, 62.25, 65.95, 62.25, 0.64); setOpt(o3, t, 66.0, Infinity, 69.1, 0.22);
    show(sch, t, 57.1, 62.1, 'pop'); show(uni, t, 57.25, 62.1, 'pop'); show(path, t, 57.4, 62.1, 'fade');
    grad.userData.base = null; grad.position.x = lerp(-0.85, 0.5, ramp(t, 59.4, 61.6)); show(grad, t, 59.3, 61.8, 'pop', 0.25);
    walkK = t > 63.2 && t < 65.6 ? 1 : 0;
    const wx = lerp(tickX(0), tickX(15), ramp(t, 63.2, 65.6));
    show(tl, t, 62.3, 65.95, 'fade');
    par.userData.base = null; par.position.x = wx - 0.25; show(par, t, 62.5, 65.95, 'pop');
    kid.userData.base = null; kid.position.x = wx + 0.13; show(kid, t, 62.55, 65.95, 'pop');
    if (kid.visible) kid.scale.setScalar(lerp(0.6, 1.25, ramp(t, 63.2, 65.6)) * kid.scale.x);
    pays.forEach((p, i) => show(p, t, lerp(63.2, 65.6, tickN[i] / 15), 65.95, 'drop', 0.35));
    show(cash, t, 66.6, Infinity, 'drop', 0.5);
    S.cam(t, 0, 3.35, lerp(15.4, 14.6, ramp(t, 50.75, 70.75)));
  } };
}

// ---------- 6. 1.6 million baht to raise one graduate (70.75 – 84) ----------
function cost() {
  const S = stage();
  const N = 22, bh = 0.165, sx = -0.3;
  const stack = Array.from({ length: N }, (_, i) => S.add(bundle(1.45, bh * 0.97, 0.8, i % 2 ? '#8f8d89' : '#9b9995'), sx + Math.sin(i * 2.3) * 0.03, bh / 2 + i * bh, 0.3));
  const ticks = []; for (let a = 0; a <= N; a++) ticks.push({ y: a * bh + bh, major: a % 6 === 0 || a === N, text: a % 6 === 0 || a === N ? String(a) : '' });
  const rul = S.add(ruler(N * bh + 0.4, ticks, { size: 0.11 }), -1.75, 0, 0.05);
  const ageL = S.add(label('AGE', { size: 0.12, color: C.g1 }), -1.55, N * bh + 0.65, 0.1);
  const mom = S.person({ kind: 'woman', h: 1.45, top: C.white, bottom: C.ink, seed: 61 }, sx - 0.4, 0, 0.45, { arms: [0.05, 0.25] });
  const kid = S.person({ kind: 'child', h: 0.95, top: C.g2, bottom: C.g4, seed: 62 }, sx + 0.25, 0, 0.45, { arms: [-0.25, 0.05] });
  const grad = S.person({ kind: 'man', h: 1.45, top: C.g4, sleeve: C.g4, bottom: C.ink, seed: 63 }, sx + 0.3, 0, 0.45, { arms: [-0.2, 0.05] });
  const cap = gradCap(grad.userData.R); grad.userData.head.add(at(cap, 0, grad.userData.R * 0.85, 0.08)); cap.rotation.z = -0.12;
  const baht = S.add(slip([{ t: '1.6 million baht', size: 0.2, font: FONT.mono, weight: 600 }], { seed: 71 }), sx, 2.95, 0.75);
  const usd = S.add(slip([{ t: '$46,000', size: 0.24, font: FONT.mono, weight: 600 }], { seed: 72 }), sx, 2.35, 0.75);
  const bot = S.add(slip([{ t: 'Bank of Thailand estimate', size: 0.13, weight: 600 }, { t: 'TO A PUBLIC UNIVERSITY DEGREE', size: 0.09, font: FONT.mono, weight: 500, color: C.g2 }], { seed: 73 }), 0.75, 7.55, 0.3);
  const H6 = N * bh * 0.94, yb = H6 / 6;
  const inc = Array.from({ length: 6 }, (_, i) => { const g = new THREE.Group(); add(g, bundle(0.72, yb * 0.95, 0.6, '#d9d6cf')); const l = label('1 YR', { size: 0.1, color: '#3a3938' }); l.castShadow = false; add(g, l, 0, 0, 0.31); return S.add(g, 1.55, yb / 2 + i * yb, 0.3); });
  const earner = S.person({ kind: 'man', h: 1.45, top: C.g1, bottom: C.g4, seed: 64 }, 2.2, 0, 0.5, {});
  const incL = S.add(slip([{ t: '6 years of', size: 0.13, weight: 600 }, { t: 'average income', size: 0.13, weight: 600 }], { seed: 74 }), 1.55, H6 + 0.5, 0.4);
  return { S, update(t) {
    const age = N * easeInOut(ramp(t, 71.3, 75.7)), n = Math.min(N, Math.ceil(age));
    stack.forEach((b, i) => { b.visible = i < n; if (b.visible) { const f = clamp(age - i); b.position.y = bh / 2 + i * bh + (1 - easeOut(f)) * 0.5; } });
    const top = Math.max(0, age) * bh;
    show(rul, t, 70.8, Infinity, 'fade'); show(ageL, t, 71.2, Infinity, 'fade');
    mom.userData.base = kid.userData.base = grad.userData.base = null;
    mom.position.y = kid.position.y = grad.position.y = top;
    show(mom, t, 70.75, Infinity, 'pop');
    const kidS = lerp(0.42, 1.0, clamp(age / 15)); show(kid, t, 70.85, 74.25, 'pop', 0.3); if (kid.visible) kid.scale.multiplyScalar(kidS);
    show(grad, t, 74.3, Infinity, 'pop', 0.35);
    show(baht, t, 76.0, Infinity, 'pop'); show(usd, t, 77.25, Infinity, 'pop'); show(bot, t, 79.9);
    inc.forEach((b, i) => show(b, t, 81.1 + i * 0.13, Infinity, 'drop', 0.4)); show(earner, t, 81.0, Infinity, 'pop'); show(incL, t, 82.5, Infinity, 'pop');
    S.cam(t, 0.3, lerp(3.0, 4.0, easeInOut(ramp(t, 71.3, 75.7))), lerp(15.0, 17.2, easeInOut(ramp(t, 71.3, 75.7))));
  } };
}

// ---------- 7. September: 3,000 baht for every child under six (84 – 94.1) ----------
function seminar() {
  const S = stage();
  const sep = S.add(slip([{ t: 'September', size: 0.24, font: FONT.mono, weight: 600 }], { seed: 81 }), 0, 6.75, 0.3);
  const parl = S.add(temple(2.7, 8), 0, 2.25, 0.15);
  const parlL = S.add(slip([{ t: 'National seminar, Parliament', size: 0.14, weight: 600 }], { seed: 82 }), 0, 1.75, 0.45);
  let raise = 0;
  const off = S.person({ kind: 'man', h: 2.25, top: C.white, bottom: C.ink, glasses: true, tie: true, tieC: C.g4, seed: 83 }, 0.3, 0, 0.3, () => ({ arms: [0.05, lerp(0.05, 2.3, raise)] }));
  const pod = S.add(podium(1.45, 1.45), 0.3, 0, 0.75);
  const offL = S.add(slip([{ t: 'Top civil servant', size: 0.14, weight: 600 }, { t: 'MINISTRY OF PUBLIC HEALTH', size: 0.09, font: FONT.mono, weight: 500, color: C.g2 }], { seed: 84 }), -1.15, 3.2, 0.5);
  const old = S.add(banknote('600', { w: 0.62 }), -1.55, 4.4, 0.3);
  const oldL = S.add(slip([{ t: 'now $18', size: 0.12, font: FONT.mono, weight: 600 }], { seed: 85 }), -1.55, 3.75, 0.35);
  const arrow = S.add(cutout(polyShape([[-0.25, -0.05], [0.12, -0.05], [0.12, -0.14], [0.3, 0], [0.12, 0.14], [0.12, 0.05], [-0.25, 0.05]]), C.g1), -0.92, 4.4, 0.3);
  const reds = Array.from({ length: 5 }, (_, i) => { const n = S.add(banknote('600', { w: 0.62, bg: '#b9473f', ink: '#f4e7e4' }), -0.2 + i * 0.46, 4.4 + (i % 2) * 0.06, 0.3 + i * 0.02); n.rotation.z = (i - 2) * 0.05; return n; });
  const newL = S.add(slip([{ t: '3,000 baht', size: 0.24, font: FONT.mono, weight: 600 }], { seed: 86 }), 0.72, 5.3, 0.35);
  const usd = S.add(label('$91', { size: 0.7 }), 0.72, 6.35, 0.15);
  const month = S.add(slip([{ t: 'A MONTH', size: 0.12, font: FONT.mono, weight: 600 }], { seed: 87 }), 0.72, 3.7, 0.4);
  const kids = Array.from({ length: 6 }, (_, a) => S.person({ kind: a % 2 ? 'girl' : 'child', h: 0.5 + a * 0.1, top: [C.white, C.g1, C.g2][a % 3], bottom: C.g4, seed: 90 + a }, -1.8 + a * 0.72, 0, 0.5, {}));
  const ageT = kids.map((k, a) => S.add(label(String(a), { size: 0.13, color: C.g1 }), -1.8 + a * 0.72, -0.15, 0.9));
  const under = S.add(slip([{ t: 'EVERY CHILD UNDER SIX', size: 0.13, font: FONT.mono, weight: 600 }], { seed: 88 }), 0, 2.25, 0.5);
  return { S, update(t) {
    show(sep, t, 84.0, 89.1); show(parl, t, 84.7, 86.9, 'rise', 0.6); show(parlL, t, 85.9, 86.9, 'pop');
    raise = sr(t, 88.7, 89.0);
    show(off, t, 87.0, 89.15, 'rise'); show(pod, t, 87.0, 89.15, 'rise'); show(offL, t, 87.3, 89.15, 'pop');
    show(old, t, 89.3, Infinity, 'pop'); show(oldL, t, 89.5, Infinity, 'pop'); show(arrow, t, 89.8, Infinity, 'fade');
    reds.forEach((n, i) => show(n, t, 90.0 + i * 0.09, Infinity, 'drop', 0.4));
    show(newL, t, 90.1, Infinity, 'pop'); show(usd, t, 91.0, Infinity, 'fade'); show(month, t, 92.0, Infinity, 'pop');
    kids.forEach((k, i) => show(k, t, 92.75 + i * 0.1, Infinity, 'drop', 0.4)); ageT.forEach((k, i) => show(k, t, 92.85 + i * 0.1, Infinity, 'fade'));
    show(under, t, 93.7, Infinity, 'pop');
    S.cam(t, 0, 3.35, lerp(15.2, 14.8, ramp(t, 84, 94.1)));
  } };
}

// ---------- 8. "Every birth matters…" (94.1 – 100) ----------
function minister() {
  const S = stage();
  const m = S.person({ kind: 'man', h: 2.25, top: C.white, bottom: C.ink, glasses: true, tie: true, tieC: C.g3, seed: 101 }, 0.35, 0, 0.3, (t) => ({ arms: [0.05, 0.6 + Math.sin(t * 2.6) * 0.25 * ramp(t, 94.2, 94.6)] }));
  const pod = S.add(podium(1.45, 1.45), 0.35, 0, 0.75);
  const q = S.add(slip([
    { t: '"Every birth matters.', size: 0.24, weight: 700, mark: ['Every birth matters'] },
    { t: 'The fewer the births,', size: 0.24, weight: 700, mark: ['The fewer the births'] },
    { t: 'the higher their quality must be."', size: 0.24, weight: 700, mark: ['their quality'] },
  ], { seed: 102, gap: 0.08, padY: 0.16 }), 0, 5.35, 0.3);
  const who = S.add(slip([{ t: 'Health minister', size: 0.15, weight: 600 }, { t: 'AT THE SEMINAR', size: 0.09, font: FONT.mono, weight: 500, color: C.g2 }], { seed: 103 }), -1.15, 3.15, 0.5);
  return { S, update(t) {
    show(m, t, 94.1, Infinity, 'rise'); show(pod, t, 94.1, Infinity, 'rise'); show(q, t, 94.2, Infinity);
    const bx = q.userData.boxes; bx[0].visible = t > 94.6; bx[1].visible = t > 95.6; bx[2].visible = t > 97.0;
    show(who, t, 98.0, Infinity, 'pop');
    S.cam(t, 0, 3.3, lerp(14.4, 13.8, ramp(t, 94.1, 100)));
  } };
}

// ---------- 9. "We must not make families choose…" (100 – 110.25) ----------
function researcher() {
  const S = stage();
  let look = 0;
  const w = S.person({ kind: 'woman', h: 2.2, top: C.g4, sleeve: C.g4, bottom: C.ink, pants: true, seed: 111 }, 0, 0, 0.55, () => ({ look }));
  const n1 = S.add(slip([{ t: 'Monsikarn Kanchanajittra', size: 0.18, weight: 700 }], { seed: 112 }), 0, 3.75, 0.4);
  const n2 = S.add(slip([{ t: 'POPULATION RESEARCHER', size: 0.11, font: FONT.mono, weight: 600 }], { seed: 113 }), -0.4, 3.25, 0.42);
  const n3 = S.add(slip([{ t: 'Mahidol University', size: 0.14, weight: 600 }], { seed: 114 }), 0.5, 2.8, 0.44);
  const fork = new THREE.Group(); S.add(fork, 0, 0, -0.1);
  add(fork, cutout(rectShape(0.5, 2.9, 0, 1.45), C.g3), 0, 0, 0);
  for (const s of [-1, 1]) { const br = cutout(rectShape(0.5, 2.2, 0, 1.1), C.g3); br.rotation.z = -s * 0.62; add(fork, br, 0, 2.75, 0.01); }
  const dk = S.add(desk(), -1.35, 4.45, 0.25), cr = S.add(crib(), 1.35, 4.45, 0.25);
  const dL = S.add(slip([{ t: 'A GOOD ECONOMY', size: 0.11, font: FONT.mono, weight: 600 }], { seed: 115 }), -1.35, 4.2, 0.45);
  const cL = S.add(slip([{ t: 'A GOOD FAMILY', size: 0.11, font: FONT.mono, weight: 600 }], { seed: 116 }), 1.35, 4.2, 0.45);
  const q = S.add(slip([
    { t: '"We must not make families choose', size: 0.165, weight: 700, mark: ['choose'] },
    { t: 'between a good economy and a good family."', size: 0.165, weight: 700, mark: ['good economy', 'good family'] },
  ], { seed: 117 }), 0, 6.55, 0.3);
  return { S, update(t) {
    show(w, t, 100.0, Infinity, 'pop');
    show(n1, t, 100.1, 106.3, 'pop'); show(n2, t, 101.75, 106.3, 'pop'); show(n3, t, 103.5, 106.3, 'pop');
    show(fork, t, 106.4, Infinity, 'rise', 0.7); show(q, t, 106.5, Infinity);
    const bx = q.userData.boxes; bx[0].visible = t > 107.8; bx[1].visible = t > 108.8; bx[2].visible = t > 109.8;
    show(dk, t, 108.75, Infinity, 'pop'); show(dL, t, 108.9, Infinity, 'pop'); show(cr, t, 109.75, Infinity, 'pop'); show(cL, t, 109.9, Infinity, 'pop');
    look = t < 108.7 ? 0 : t < 109.7 ? -1 : 1;
    S.cam(t, 0, 3.45, lerp(15.4, 14.9, ramp(t, 100, 110.25)));
  } };
}

// ---------- 10. six years of income vs $18 a month (110.25 – 115.25) ----------
function scale() {
  const S = stage();
  const half = 1.45, py = 3.6;
  S.add(cutout(rectShape(0.12, py, 0, py / 2), C.g2), 0, 0, 0.2);
  S.add(cutout(polyShape([[-0.6, 0], [0.6, 0], [0.3, 0.18], [-0.3, 0.18]]), C.g3), 0, 0, 0.25);
  const beam = new THREE.Group(); S.add(beam, 0, py, 0.35);
  add(beam, cutout(rectShape(half * 2 + 0.1, 0.09, 0, 0), C.white), 0, 0, 0);
  add(beam, cutout(polyShape([[-0.14, -0.12], [0.14, -0.12], [0, 0.16]]), C.g1), 0, 0, 0.03);
  const pan = () => { const g = new THREE.Group(); add(g, cutout(rectShape(0.018, 1.1, 0, -0.55), C.g1), -0.4, 0, 0); add(g, cutout(rectShape(0.018, 1.1, 0, -0.55), C.g1), 0.4, 0, 0);
    const s = new THREE.Shape(); s.moveTo(-0.52, 0); s.lineTo(0.52, 0); s.quadraticCurveTo(0.45, -0.22, 0, -0.22); s.quadraticCurveTo(-0.45, -0.22, -0.52, 0);
    add(g, cutout(s, C.white), 0, -1.1, 0.02); S.scene.add(g); return g; };
  const pl = pan(), pr = pan();
  const yb = 0.17;
  const blocks = Array.from({ length: 6 }, (_, i) => { const g = new THREE.Group(); add(g, bundle(0.66, yb * 0.95, 0.5, '#d9d6cf')); const l = label('1 YR', { size: 0.09, color: '#3a3938' }); l.castShadow = false; add(g, l, 0, 0, 0.26); pl.add(at(g, 0, -1.1 + yb / 2 + i * yb, 0.1)); return g; });
  const note = banknote('$18', { w: 0.42, unit: 'A MONTH' }); pr.add(at(note, 0, -0.98, 0.1)); note.rotation.z = 0.08;
  const lL = S.add(slip([{ t: '6+ YEARS', size: 0.18, font: FONT.mono, weight: 600 }, { t: 'of average income', size: 0.12, weight: 500 }], { seed: 121 }), -half, 0.9, 0.5);
  const lR = S.add(slip([{ t: '$18 A MONTH', size: 0.15, font: FONT.mono, weight: 600 }, { t: 'from the government', size: 0.11, weight: 500 }], { seed: 122 }), half, 0, 0.5);
  const top = S.add(slip([{ t: 'To raise one child in Thailand', size: 0.15, weight: 600 }], { seed: 123 }), 0, 6.55, 0.3);
  return { S, update(t) {
    blocks.forEach((b, i) => show(b, t, 110.8 + i * 0.13, Infinity, 'drop', 0.35));
    const loaded = clamp((t - 110.8) / 0.8);
    const wob = t > 114.05 ? Math.sin((t - 114.05) * 9) * 0.035 * Math.exp(-(t - 114.05) * 2.5) : 0;
    const th = 0.36 * easeOut(clamp(loaded)) - wob;
    beam.rotation.z = th;
    pl.position.set(-half * Math.cos(th), py - half * Math.sin(th), 0.4); pr.position.set(half * Math.cos(th), py + half * Math.sin(th), 0.4);
    show(note, t, 113.9, Infinity, 'drop', 0.35);
    lL.userData.base = null; lL.position.set(-half, 0.6, 0.6); show(lL, t, 111.4, Infinity, 'pop');
    lR.userData.base = null; lR.position.set(half, pr.position.y + 0.55, 0.6); show(lR, t, 114.2, Infinity, 'pop');
    show(top, t, 110.3, Infinity);
    S.cam(t, 0, 3.4, lerp(15.6, 15.0, ramp(t, 110.25, 115.25)));
  } };
}

// ---------- 11. fewer children; the floor already broken (115.25 – end) ----------
function ending() {
  const S = stage();
  const v = 0.93;
  const th = S.add(pedestal(1.75, v * rateK, 1.2, 'THAILAND'), -1.3, 0, 0.2);
  S.add(redLine(40), 0, rateK + 0.035, 0.25);
  const ticks = []; for (let i = 0; i <= 14; i++) ticks.push({ y: i * 0.1 * rateK, major: i % 5 === 0, text: i === 10 ? '1.0' : i === 0 ? '0' : '' });
  S.add(ruler(3.9, ticks), -2.6, 0, 0);
  const top = v * rateK;
  S.person({ kind: 'woman', h: 1.5, top: C.white, bottom: C.ink, seed: 131 }, -1.55, top, 0.45, { arms: [0.05, 0.22] });
  S.person({ kind: 'child', h: 0.8, top: C.g2, bottom: C.g4, seed: 132 }, -1.0, top, 0.45, { arms: [-0.3, 0.05] });
  S.add(slip([{ t: '2025', size: 0.17, font: FONT.mono, weight: 600 }], { seed: 6 }), -1.3, top - 0.72, 0.86);
  const walkers = [['man', C.white, C.g4], ['woman', C.g3, C.ink], ['man', C.g4, C.ink], ['woman', C.g1, C.g4], ['man', C.g2, C.ink]];
  let wk = 1;
  const ws = walkers.map(([k, top2, bot], i) => S.person({ kind: k, h: 1.45, top: top2, bottom: bot, glasses: i === 2, seed: 140 + i }, 0, 0, 0.5 + (i % 2) * 0.15, () => ({ walk: wk })));
  const nat = S.add(slip([{ t: 'National priority', size: 0.21 }, { t: 'TARGET · 2027', size: 0.1, font: FONT.mono, weight: 500, color: C.g2 }], { seed: 4 }), -1.3, 5.75, 0.3);
  const stamp = S.add(slip([{ t: 'ALREADY BELOW 1', size: 0.2, font: FONT.mono, weight: 700, color: '#f6efec' }], { bg: C.red, torn: false, edge: C.red, padX: 0.2, padY: 0.12 }), -1.0, 4.75, 0.6);
  stamp.rotation.z = -0.09;
  return { S, update(t) {
    wk = t < 116.9 ? 1 : 0;
    ws.forEach((p, i) => { const x0 = 0.25 + i * 0.6; p.position.x = x0 + 3.2 * (1 - easeOut(ramp(t, 115.25 + i * 0.12, 116.9))); });
    show(nat, t, 118.6, Infinity); show(stamp, t, 121.5, Infinity, 'pop', 0.4);
    const push = easeInOut(ramp(t, 118.25, 119.8));
    S.cam(t, lerp(0.05, -1.1, push), lerp(4.1, 3.4, push), lerp(19.2, 13.8, push) - ramp(t, 119.8, 123.6) * 0.5);
  } };
}

export const BEATS = [
  [0, rates], [24.75, births], [33.75, campaign], [44.5, payment], [50.75, survey], [70.75, cost],
  [84.0, seminar], [94.1, minister], [100.0, researcher], [110.25, scale], [115.25, ending],
];
