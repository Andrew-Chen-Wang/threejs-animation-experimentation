import * as THREE from 'three';
import { base, aim } from './base.js';
import { tag, counter, docTexture, bustURL, el, sr, ramp, lerp, ease, clamp } from '../kit.js';

/** a dark sheet of printed Chinese text, drifting under the camera */
function sheet(s, { seed = 1, dark = true } = {}) {
  const tex = docTexture({ seed, dark });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(11, 19.3), new THREE.MeshBasicMaterial({ map: tex }));
  s.scene.add(m);
  return m;
}

/**
 * Document shot. items: [{lines:[...], y, at, until, align}] using absolute times;
 * counters: [{at, val, sub, y}]
 */
export function doc({ hud, start, end, seed = 1, items = [], counters = [], credit = '', dim = 1 }) {
  const s = base({ clear: 0x1e1e1e, focus: [0.5, 0.12, 6] });
  sheet(s, { seed });
  s.dim = dim;
  s.credit = credit;
  const g = items.map((it) => ({ ...it, g: tag(hud, it.lines, { align: it.align || 'center', gap: it.gap ?? 10 }) }));
  const cs = counters.map((c) => ({ ...c, g: counter(hud, c.sub) }));
  s.update = (lt, t) => {
    const k = ramp(t, start, end);
    aim(s.camera, [0.3 - k * 0.5, 1.0 - k * 1.2, 17 - k * 1.0], [0.3 - k * 0.5, 0.9 - k * 1.2, 0], 0.0);
    for (const it of g) it.g.at(it.x ?? 540, it.y, it.align === 'left' ? 0 : 0.5, 0).win(t, it.at, it.until || end);
    for (const c of cs) c.g.vis(t >= c.at).at(540, c.y).val(c.val);
  };
  return s;
}

/** the seven 2022-era passed-over alternates, two of them later expelled */
export function passed({ hud, start, end }) {
  const s = doc({ hud, start, end, seed: 7, dim: 0.55, items: [{ lines: [{ t: '跳过 PASSED OVER  OCT 2025', cls: 'rule' }], y: 300, at: start + 0.1 }] });
  const rows = [['王立岩', 'ROCKET FORCE'], ['王抗平', 'LOGISTICS FORCE'], ['王嘉毅', 'EDUCATION MINISTRY'], ['方永祥', 'CMC GENERAL OFFICE'],
    ['方红卫', "XI'AN PARTY CHIEF"], ['石玉钢', 'YUNNAN CPPCC'], ['石正露', 'NORTHERN ARMY']];
  const expelled = new Set([3, 4]);
  const R = rows.map(([cn, en], i) => {
    const row = el('div', 'row7', hud);
    row.innerHTML = `<div class="chip doc lg" style="font-size:52px;padding:4px 10px">${cn}</div><div class="r7en">${en}</div><div class="r7q">?</div>`;
    return { row, en: row.children[1], q: row.children[2], i };
  });
  const up = s.update;
  s.update = (lt, t) => {
    up(lt, t);
    for (const r of R) {
      const vis = ramp(t, start + 0.25 + r.i * 0.1, start + 0.5 + r.i * 0.1);
      r.row.style.transform = `translate(150px, ${420 + r.i * 118}px)`;
      r.row.style.opacity = vis;
      const x = expelled.has(r.i) && t > 44.5;
      r.en.className = 'r7en' + (x ? ' xp' : '');
      r.en.innerHTML = x ? '<span class="cn">开除党籍</span> EXPELLED' : rows[r.i][1];
      r.q.style.visibility = x ? 'hidden' : 'visible';
    }
  };
  return s;
}

function card(hud, { label, military = false, seed = 1, vacant = false, cap }) {
  const c = el('div', 'card' + (vacant ? ' vacant' : ''), hud);
  const ph = el('div', 'ph', c, vacant ? 'VACANT' : '');
  if (!vacant) ph.style.backgroundImage = `url(${bustURL({ military, seed, cap })})`;
  const x = el('div', 'x', ph);
  const lb = el('div', 'lb', c, label.replace(/([一-鿿]+)/g, '<span class="cn">$1</span>'));
  return { c, ph, lb, x, at(px, py, sc = 1) { c.style.transform = `translate(${px}px, ${py}px) translate(-50%, 0) scale(${sc})`; return this; },
    op(o) { c.style.opacity = o; return this; }, cross(on) { x.style.display = on ? 'block' : 'none'; ph.style.filter = on ? 'brightness(.45)' : ''; return this; },
    label(s) { lb.innerHTML = s.replace(/([一-鿿]+)/g, '<span class="cn">$1</span>'); return this; } };
}

/** CMC org chart. phase: 'arrive' | 'objected' | 'filled' */
export function org({ hud, start, end, phase = 'arrive' }) {
  const s = doc({ hud, start, end, seed: 11, dim: 0.35, credit: 'ILLUSTRATIVE PORTRAITS',
    items: [{ lines: [{ t: '中央军事委员会 THE CMC', cls: 'rule' }], y: 270, at: start }] });
  const xi = card(hud, { label: '主席 XI JINPING', seed: 3 });
  const zyx = card(hud, { label: '副主席 张又侠', military: true, seed: 5 });
  const vac = card(hud, { label: '副主席 空缺', vacant: true });
  const zsm = card(hud, { label: '张升民', military: true, seed: 8 });
  const line = el('div', 'dots', hud);
  const obj = tag(hud, [{ t: '反对 OBJECTED', cls: 'redfill' }]);
  const date = tag(hud, ['OCT 23rd, 2025']);
  const up = s.update;
  s.update = (lt, t) => {
    up(lt, t);
    xi.at(540, 380).op(ramp(t, start, start + 0.3));
    zyx.at(310, 720).op(ramp(t, start + 0.1, start + 0.4));
    let sx = 260, sy = 1100;
    if (phase === 'arrive') { const k = sr(t, 64.3, 65.6); sx = lerp(260, 750, k * 0.85); sy = lerp(1080, 1000, k); vac.at(750, 720).op(1); }
    if (phase === 'objected') { sx = 680; sy = 1000; vac.at(750, 720).op(1); }
    if (phase === 'filled') { const k = sr(t, start + 0.2, start + 1.0); sx = lerp(680, 750, k); sy = lerp(1000, 720, k); vac.op(1 - k).at(750, 720); }
    zsm.at(sx, sy).op(ramp(t, start + 0.2, start + 0.5)).label(phase === 'filled' && t > start + 0.9 ? '副主席 张升民' : '张升民');
    line.style.display = 'none';
    line.style.transform = `translate(${sx}px, ${sy}px)`; line.style.height = Math.max(0, sy - 900) + 'px';
    line.style.width = '0px';
    obj.at(330, 980, 0.5, 0).win(t, phase === 'objected' ? 68.9 : 1e9);
    if (phase === 'objected') zyx.ph.style.outline = t > 68.9 ? '4px solid #d8402e' : '';
    date.at(540, 1040, 0.5, 0).win(t, phase === 'filled' ? start + 1.0 : 1e9);
  };
  return s;
}

/** the seven-member commission of 2022, then the two who are left */
export function cmc({ hud, start, end, after = false }) {
  const s = doc({ hud, start, end, seed: 13, dim: 0.3, credit: 'ILLUSTRATIVE PORTRAITS',
    items: [{ lines: [{ t: after ? '中央军委 THE CMC, 2026' : '中央军委 THE CMC, 2022', cls: 'rule' }], y: 250, at: start }] });
  const ppl = [['习近平', false, 3], ['张又侠', true, 5], ['何卫东', true, 21], ['李尚福', true, 22], ['刘振立', true, 23], ['苗华', true, 24], ['张升民', true, 8]];
  const purged = new Set([1, 2, 3, 4, 5]);
  const cards = ppl.map(([n, m, sd], i) => ({ i, c: card(hud, { label: n, military: m, seed: sd }) }));
  const ctr = counter(hud, '');
  const up = s.update;
  s.update = (lt, t) => {
    up(lt, t);
    cards.forEach(({ i, c }) => {
      const row = i < 4 ? 0 : 1; const col = row === 0 ? i : i - 4;
      const x = row === 0 ? 180 + col * 240 : 300 + col * 240; const y = 360 + row * 330;
      if (!after) c.at(x, y, 0.92).op(ramp(t, start + 0.1 + i * 0.12, start + 0.35 + i * 0.12)).cross(false);
      else {
        const k = sr(t, start + 0.5, start + 1.3);
        const out = purged.has(i);
        c.cross(out && t > start + 0.2);
        if (out) c.at(x, y, 0.92).op(1 - 0.75 * k);
        else { const tx = i === 0 ? 380 : 700; c.at(lerp(x, tx, k), lerp(y, 980, k), lerp(0.92, 1.25, k)).op(1); }
      }
    });
    if (!after) ctr.vis(t > 109.0).at(540, 1000).val(7);
    else ctr.vis(t > start + 1.2).at(540, 1250).val(2).sub('');
  };
  return s;
}

/** four terms */
export function terms({ hud, start, end }) {
  const s = doc({ hud, start, end, seed: 17, dim: 0.35, items: [{ lines: [{ t: '总书记 GENERAL SECRETARY', cls: 'rule' }], y: 760, at: start + 0.1 }] });
  const yrs = ['2012', '2017', '2022', '2027'], ord = ['1ST', '2ND', '3RD', '4TH'];
  const boxes = yrs.map((y, i) => { const b = el('div', 'term', hud, `<div class="ty">${y}</div><div class="to">${ord[i]}</div>`); return b; });
  const up = s.update;
  s.update = (lt, t) => {
    up(lt, t);
    boxes.forEach((b, i) => {
      const at = i < 3 ? start + 0.3 + i * 0.15 : 131.2;
      b.style.opacity = ramp(t, at, at + 0.25);
      b.style.transform = `translate(${210 + i * 220}px, 880px) translate(-50%, 0)`;
      b.classList.toggle('next', i === 3);
    });
  };
  return s;
}
