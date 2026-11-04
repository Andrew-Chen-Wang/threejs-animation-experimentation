// The paper layer: cards pinned to one big board that a 2D camera pans and zooms across, plus a few
// overlays fixed to the frame (tags, strips, poll). Elements declare their own timing in markup:
//   data-in="t"        fade + rise in at t        data-out="t"   fade out at t
//   data-strike="t"    draw a red strike at t     data-count="from,to,t0,t1[,prefix]"   count up
//   data-ring="t"      draw a red ellipse at t
import { clamp, lerp, ramp, sr, ease, el } from '../../src/lib/util.js';
import { T } from './times.js';
import { sketch } from './sketch.js';

const W = 620, H = 760; // loop card size, board px
const RX = 700, RY = 1020;
const ringPos = (i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [Math.cos(a) * RX, Math.sin(a) * RY]; };

const hdr = (n, title) => `<div class="c-hdr"><span class="c-num">${n}</span>${title}</div>`;
const foot = (txt) => `<div class="c-foot">${txt}</div>`;

function loopCards(img) {
  return [
    { id: 'hit', html: `${hdr(1, 'A hit')}
      <div class="thumb" style="height:430px"><img src="${img.iso}" alt=""><span class="rec">● REC</span></div>
      <div class="c-it" style="margin-top:22px">a unit's drone hits a target</div>
      ${foot('The strike, as the unit\'s own drone filmed it')}` },
    { id: 'videos', html: `${hdr(2, 'Two videos')}
      <div class="pair"><div class="thumb"><img src="${img.fpv}" alt=""></div><div class="thumb"><img src="${img.iso}" alt=""></div></div>
      <div class="pair lbls"><div class="mono-s" data-in="${T.c2}">The strike drone<br><b>uploaded</b></div><div class="mono-s" data-in="${T.c2b}">A second drone<br><b>uploaded</b></div></div>
      <div class="stamp-c" data-in="${T.confirm}" data-pop="1">Confirmed</div>
      ${foot('Uploaded to Delta, the army\'s system')}` },
    { id: 'points', html: `${hdr(3, 'Points')}
      <div class="mono-s center" style="margin-top:22px">Unit account</div>
      <div class="acct"><span class="acct-n" data-count="236,248,${T.c3},${T.c3 + 0.6}" data-count2="248,236,${T.buy},${T.buy + 0.5}" data-count3="236,296,${T.more + 0.4},${T.best - 0.6}"></span>
        <span class="plus" data-in="${T.c3}" data-out="${T.c3 + 1.6}">+12</span></div>
      <div class="c-it center">e-points</div>
      <div class="mono-s center" style="margin-top:8px">The unit's, not the soldier's</div>
      <div class="rule"></div>
      <div class="eq" data-in="${T.kill12}"><span>1 kill</span><span class="r">= 12 points</span></div>
      <div class="eq" data-in="${T.uah}"><span>12 points</span><span class="r">= 60,000 hryvnias</span></div>
      <div class="eq3" data-in="${T.fpv3}"><span class="c-it">about 3 FPV drones</span><div class="sk3">${sketch.fpv()}${sketch.fpv()}${sketch.fpv()}</div></div>
      ${foot('Fedorov, then minister, Nov 2025 · "about 3 FPVs" is our arithmetic')}` },
    { id: 'shop', html: `${hdr(4, 'The shop')}
      <div class="mk-bar"><span class="mk-logo">BRAVE1<br>MARKET</span><span class="mk-nav">Catalogue&nbsp; Makers&nbsp; Military</span>
        <span class="mk-bal">Unit balance<br><b><span data-count="248,248,0,1" data-count2="248,236,${T.buy},${T.buy + 0.5}" data-count3="236,296,${T.more + 0.4},${T.best - 0.6}"></span> PTS</b></span></div>
      <div class="mk-tabs"><span>UAV</span><span>UGV</span><span>EW</span><span>Parts</span><span>AI</span><span>Software</span></div>
      <div class="mk-title">Buy with e-points <span class="hl" data-in="${T.items}">1,100+ items</span></div>
      <div class="mk-grid">
        <div class="tile" data-in="${T.shopCard + 0.3}"><span class="tag-y">For e-points</span>${sketch.fpv()}<div class="tn">FPV drone</div><div class="tp">≈ 4 points <span class="qty">− 3 +</span><span class="buy" data-press="${T.buy}">Buy</span></div></div>
        <div class="tile" data-in="${T.shopCard + 0.5}"><span class="tag-y">For e-points</span>${sketch.fibre()}<div class="tn">Fibre-optic FPV</div><div class="tp">≈ 16 points</div></div>
        <div class="tile" data-in="${T.shopCard + 0.7}"><span class="tag-y">For e-points</span>${sketch.interceptor()}<div class="tn">Interceptor</div><div class="tp">≈ 20 points</div></div>
        <div class="tile" data-in="${T.robots}"><span class="tag-y">For e-points</span>${sketch.robot()}<div class="tn">Ground robot</div><div class="tp">&nbsp;</div></div>
      </div>
      <div class="cursor" data-cursor="1">${'<svg viewBox="0 0 24 30" width="34" height="42"><path d="M2 2 L2 24 L8 18 L12 28 L16 26 L12 17 L20 17 Z" fill="#fff" stroke="#111" stroke-width="2"/></svg>'}</div>
      ${foot('Point prices as reported in 2025; kinds of thing, not real listings')}` },
    { id: 'pays', html: `${hdr(5, 'The state pays')}
      <div class="ct-title">Contract <span class="mono-s">Via the procurement agency</span></div>
      <div class="ct-row" data-in="${T.contract + 0.2}"><span class="mono-s">Buyer</span>Defence Procurement Agency</div>
      <div class="ct-row" data-in="${T.contract + 0.4}"><span class="mono-s">Supplier</span>the maker</div>
      <div class="ct-row" data-in="${T.contract + 0.6}"><span class="mono-s">Item</span>3 × FPV drone, for e-points</div>
      <div class="ct-row" data-in="${T.contract + 0.8}"><span class="mono-s">Deliver to</span>the unit</div>
      <svg class="sig" viewBox="0 0 240 60" data-draw="${T.sign}"><path pathLength="1" d="M6 40 C 20 10, 30 50, 44 30 S 70 10, 80 36 S 104 50, 116 26 S 140 14, 150 38 S 180 44, 196 20 L 232 30" fill="none" stroke="#23201c" stroke-width="2.6"/></svg>
      <div class="dpa" data-in="${T.sign + 0.5}" data-pop="1">DPA</div>
      <div class="paid" data-in="${T.pay}"><span class="mono-s">Paid to the maker</span><b>60,000</b> <i>hryvnias</i><span class="tick">✓</span></div>
      ${foot('Who pays whom; an illustration of the flow')}` },
    { id: 'delivered', html: `${hdr(6, 'Delivered')}
      <div class="day"><span class="mono-s">Day</span> <b data-day="1">1</b></div>
      <div class="route"><span class="mono-s">Maker</span><span class="dash"></span><span class="mono-s">Unit</span><div class="pkg" data-pkg="1">${sketch.box()}</div></div>
      <div class="c-it center big" data-in="${T.week}">about a week</div>
      <div class="c-it center" data-in="${T.week + 0.4}">if it's in stock</div>
      <div class="old" data-in="${T.months}"><span class="mono-s">The old way</span><div class="old-line"></div><span class="c-it">months</span></div>
      ${foot('Straight from the maker to the unit')}` },
  ].map((c, i) => ({ ...c, x: ringPos(i)[0], y: ringPos(i)[1], w: W, h: H, show: T.loop + 0.15 + i * 0.12 }));
}

function soloCards() {
  return [
    { id: 'shelf', x: 0, y: 0, w: 760, h: 760, show: T.shop - 0.1, hide: T.loop + 0.7, html: `
      <div class="mk-bar"><span class="mk-logo">BRAVE1<br>MARKET</span><span class="mk-nav">Drones&nbsp; Robots&nbsp; Cameras</span><span class="mk-bal">Paid for in points</span></div>
      <div class="shelf">${[['fpv', '≈ 4 pts'], ['fibre', '≈ 16 pts'], ['interceptor', '≈ 20 pts'], ['robot', ''], ['fpv', '≈ 4 pts'], ['fibre', '≈ 16 pts']].map(([k, p], i) =>
        `<div class="sh-item" data-in="${T.shop + 0.15 * i}">${sketch[k]()}<span class="tag-y">${p || 'for e-points'}</span></div>`).join('')}</div>
      <div class="quote-strip" data-in="${T.amazon + 0.8}"><span class="c-it">“the Amazon for the military”</span><span class="mono-s">Mykhailo Fedorov, then digital minister</span></div>` },
    { id: 'best', x: 0, y: 0, w: W, h: H, show: T.best - 0.2, hide: T.patch + 0.6, html: `
      <div class="c-hdr"><span class="c-num">★</span>This year's best seller</div>
      <div class="best-sk">${sketch.interceptor()}</div>
      <div class="c-it center big" data-in="${T.hunts - 0.3}">an interceptor:</div>
      <div class="c-it center" data-in="${T.hunts}">a drone that hunts drones</div>
      ${foot('Brave1 Market, 2026')}` },
    { id: 'patch', x: 0, y: 2300, w: 760, h: 640, show: T.patch - 0.4, hide: T.maker + 0.3, html: `
      <div class="pn-top"><span class="mono-s">Ukraine · drone units</span><span class="mono-s red">Patch notes</span></div>
      <div class="pn-title">Points per target</div>
      <div class="mono-s">As reported at the time; the values are secret now</div>
      <div class="rule"></div>
      <div class="pn-row" data-in="${T.patch + 0.4}"><span class="mono-s">Spring 25</span><span class="pn-n">Tank</span><span class="pn-v"><s data-strike="${T.armour + 0.2}">40</s><span class="down" data-in="${T.armour + 0.4}">↓ marked down</span></span></div>
      <div class="pn-row" data-in="${T.soldier6}"><span class="mono-s">Mid-25</span><span class="pn-n">Soldier</span><span class="pn-v"><s data-strike="${T.then12}">6</s><b class="red" data-in="${T.then12 + 0.1}">12</b></span></div>
      <div class="pn-bar" data-in="${T.doubled}"><div class="bar"><i data-grow="${T.doubled + 0.2}"></i></div><span class="mono-s red">Kills ×2 in a month, the minister said</span></div>
      <div class="pn-row" data-in="${T.pilot}"><span class="mono-s">2025</span><span class="pn-n">Drone pilot</span><span class="pn-v"><b class="red">25</b></span></div>` },
    { id: 'maker', x: 0, y: 3300, w: 760, h: 820, show: T.maker - 0.4, hide: T.russia + 0.3, html: `
      <div class="pn-top"><span class="mono-s">Brave1 Market · a maker's page</span></div>
      <div class="mk-head"><div class="mk-sk">${sketch.bigFpv()}</div><div><div class="pn-title" style="font-size:44px">Its FPV drone</div><div class="c-it">fibre-optic, 10-inch</div><div class="mono-s">An example listing</div></div></div>
      <div class="rv"><span class="rv-t"><s data-strike="${T.reviews}">Reviews</s></span> <span class="stars" data-out="${T.reviews + 0.3}">★★★★★</span></div>
      <div class="rv-new" data-in="${T.reviews + 0.3}">Results from the front</div>
      ${['Hits', 'Points earned', 'Rank among similar drones', 'Targets: people, equipment', 'Distance from the front'].map((r, i) =>
        `<div class="rv-row${i === 2 ? ' rank' : ''}" data-in="${T.maker + 0.9 + i * 0.35}"><span>${r}</span><span class="rv-dots"></span></div>`).join('')}
      <div class="rank-ring" data-ring="${T.rank}"></div>
      ${foot('Seen only by the maker, updated daily')}
      <div class="invoice" data-in="${T.sept + 0.5}" data-pop="1">
        <div class="mono-s"><b>Invoice</b><br>For a points order</div>
        <div class="inv-row">Delivered <span>✓</span></div>
        <div class="inv-row">Paid <span>—</span><div class="inv-ring" data-ring="${T.unpaid + 0.6}"></div></div>
        <div class="c-it small" data-in="${T.promised}">makers said, Sept 2026;<br>the ministry promised to pay</div>
      </div>` },
    { id: 'rus', x: -245, y: 4400, w: 470, h: 600, show: T.russia, html: `
      <div class="mono-s">Russia</div><div class="pn-title">A tank</div><div class="mono-s">Paid to the soldiers,<br>split among the crew</div><div class="rule"></div>
      <div class="money" data-in="${T.rub}"><b>100,000</b><i>roubles</i></div>
      <div class="usd" data-in="${T.usd}">≈ $1,190</div>
      ${foot('Defence ministry, since 2022')}` },
    { id: 'ukr', x: 245, y: 4400, w: 470, h: 600, show: T.ukraine - 0.1, html: `
      <div class="mono-s">Ukraine</div><div class="pn-title">A tank</div><div class="mono-s">Paid to the soldiers,<br>split among the crew</div><div class="rule"></div>
      <div class="money" data-in="${T.uah49}"><b>48,720</b><i>hryvnias</i></div>
      <div class="usd" data-in="${T.usd + 0.15}">≈ $1,080</div>
      ${foot('Defence ministry, order 340')}` },
  ];
}

// 2D camera: board point (x, y) sits at frame (540, cy) at scale s. Each key eases in over `d` seconds.
const KEYS = [
  { t: 0, x: 0, y: 0, s: 1, cy: 780 },
  { t: T.loop, d: 1.2, x: 0, y: 0, s: 0.42, cy: 730 },
  { t: T.c1 - 0.15, d: 0.9, ...focus(0) },
  { t: T.c2 - 0.2, d: 0.8, ...focus(1) },
  { t: T.c3 - 0.25, d: 0.8, ...focus(2) },
  { t: T.life - 0.1, d: 1.2, ...focus(2, 0.9) },
  { t: T.kill - 0.2, d: 0.9, ...focus(2) },
  { t: T.shopCard - 0.3, d: 0.9, ...focus(3) },
  { t: T.contract - 0.3, d: 0.9, ...focus(4) },
  { t: T.ship - 0.25, d: 0.9, ...focus(5) },
  { t: T.more - 0.2, d: 1.4, x: 0, y: 0, s: 0.42, cy: 730 },
  { t: T.quote - 0.4, d: 1.0, x: 0, y: 0, s: 0.62, cy: 760 },
  { t: T.best - 0.4, d: 1.0, x: 0, y: 0, s: 1, cy: 780 },
  { t: T.patch - 0.4, d: 1.1, x: 0, y: 2300, s: 1.08, cy: 760 },
  { t: T.maker - 0.4, d: 1.1, x: 0, y: 3300, s: 1.0, cy: 760 },
  { t: T.russia - 0.3, d: 1.1, x: 0, y: 4400, s: 0.98, cy: 760 },
];
function focus(i, s = 1) { const [x, y] = ringPos(i); return { x, y, s, cy: 760 }; }

function camAt(t) {
  let cur = { ...KEYS[0] };
  for (let i = 1; i < KEYS.length; i++) {
    const k = KEYS[i]; if (t < k.t) break;
    const f = ease.inOut(clamp((t - k.t) / k.d));
    cur = { x: lerp(cur.x, k.x, f), y: lerp(cur.y, k.y, f), s: Math.exp(lerp(Math.log(cur.s), Math.log(k.s), f)), cy: lerp(cur.cy, k.cy, f) };
  }
  // a slow breathing drift so the board is never perfectly still
  cur.x += Math.sin(t * 0.31) * 6; cur.y += Math.cos(t * 0.27) * 5;
  return cur;
}

export function buildBoard(root, img) {
  const dim = el('div', 'dim', root);
  const board = el('div', 'board', root);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'ring'); svg.setAttribute('viewBox', '-1200 -1500 2400 3000');
  svg.innerHTML = `
    <ellipse cx="0" cy="0" rx="${RX}" ry="${RY}" fill="none" stroke="#c23a2c" stroke-width="5" opacity=".85"/>
    <g class="spin"><path d="M0 -330 A 330 330 0 1 1 -286 -165" fill="none" stroke="#c23a2c" stroke-width="18"/>
      <path d="M-322 -150 L-286 -165 L-262 -196 Z" fill="#c23a2c" stroke="#c23a2c" stroke-width="22" stroke-linejoin="round"/></g>
    <text class="ring-lbl a" x="0" y="14" text-anchor="middle">HOW THE POINTS WORK</text>
    <text class="ring-lbl b" x="0" y="14" text-anchor="middle">MORE HITS, MORE POINTS</text>`;
  board.appendChild(svg);
  const spin = svg.querySelector('.spin'), lblA = svg.querySelector('.ring-lbl.a'), lblB = svg.querySelector('.ring-lbl.b');

  const centre = el('div', 'centre', board, `
    <div class="cq" data-in="${T.quote}" data-out="${T.year - 0.1}"><div class="cq-q">“The more you destroy,<br>the more you <span class="red">receive.</span>”</div><div class="mono-s light" data-in="${T.head}">Brave1's head</div></div>
    <div class="cb" data-in="${T.year}" data-out="${T.best - 0.3}"><div class="cb-n" data-count="0,1000000000,${T.billion - 0.4},${T.billion + 0.9},$"></div><div class="c-it light">of orders in its first year</div><div class="mono-s light">Ukraine's defence ministry</div></div>`);

  const cards = [...loopCards(img), ...soloCards()].map((c) => {
    const e = el('div', 'pcard', board, c.html);
    e.style.left = (c.x - c.w / 2) + 'px'; e.style.top = (c.y - c.h / 2) + 'px'; e.style.width = c.w + 'px'; e.style.height = c.h + 'px';
    return { ...c, e };
  });
  const loopIds = new Set(['hit', 'videos', 'points', 'shop', 'pays', 'delivered']);

  // frame-fixed overlays
  const fixed = el('div', 'fixed', root, `
    <div class="tag t40" data-in="${T.tag40}" data-out="${T.brave}"><span class="hole"></span><b>40</b><i>points</i><span class="mono-s">Ukraine · spring 2025</span></div>
    <div class="tag t100" data-in="${T.tag100k}" data-out="${T.brave}"><span class="hole"></span><b>100,000</b><i>roubles</i><span class="mono-s">Russia · 2025</span></div>
    <div class="tag tb" data-in="${T.brave}" data-out="${T.shop + 0.2}"><span class="hole"></span><span class="mk-logo">BRAVE1<br>MARKET</span><span class="tb-r"><span class="mono-s">Credit for the unit</span><span class="mono-s red" data-in="${T.brave + 0.7}"><s data-strike="${T.brave + 0.9}">&nbsp;Not pay&nbsp;</s></span></span></div>
    <svg class="strings" viewBox="0 0 1080 1920"><path class="s1"/><path class="s2"/><path class="s3"/></svg>
    <div class="life" data-in="${T.life}" data-out="${T.kill - 0.1}"><div>How many points</div><div>is a <span class="red u">life?</span></div></div>
    <div class="strip s-cap" data-in="${T.captured}" data-out="${T.swap}"><span class="mono-s">Ukraine's list · 2025–26</span><span class="st-n">Captured, by drone</span><b class="red">120</b></div>
    <div class="strip s-res" data-in="${T.robotIn}" data-out="${T.swap}"><span class="st-n small">Own wounded rescued, by robot</span><b class="red small">up to 120</b></div>
    <div class="strip s-ten" data-in="${T.tenx}" data-out="${T.swap}"><span class="st-n">= 10 × a kill (12)</span></div>
    <div class="ex" data-in="${T.swap}" data-out="${T.poll}">
      <div class="pn-title">1,000 for 1,000</div><div class="mono-s">May 2025: the war's largest prisoner exchange</div>
      <div class="ex-row a">${Array.from({ length: 10 }, () => sketch.person()).join('')}</div>
      <div class="ex-mid"></div>
      <div class="ex-row b">${Array.from({ length: 10 }, () => sketch.person('#6d665a')).join('')}</div>
      <div class="mono-s right">Each figure: 100 people</div></div>
    <div class="poll" data-in="${T.poll}"><div class="pq">A price on every hit:</div>
      <div class="po" data-hl="${T.save}">Saves lives</div><div class="po" data-hl="${T.cheapen}">Cheapens them</div>
      <div class="pnote">There are no results. It's your call.</div></div>
    <div class="credit" data-in="${T.credit}"><span class="mono-s light">A Three.js recreation of a reel by</span><span class="cr-n">Belltake</span><span class="mono-s light">instagram.com/p/De1ywGthBlQ</span></div>
    <div class="fpv-hud">
      <span class="h tl">LQ <b data-lq>93</b></span><span class="h tr"><b data-v>22.4</b>V</span>
      <span class="h bl"><b data-kmh>123</b> KM/H</span><span class="h br">02:4<b data-sec>7</b></span>
      <div class="xhair"></div></div>
    <div class="iso-hud"><span class="h tr">● 00:01:0<b data-isec>2</b></span><span class="h bl" data-zoom>3.3×</span><div class="corner c1"></div><div class="corner c2"></div><div class="corner c3"></div><div class="corner c4"></div></div>
    <div class="ir-hud"><span class="h tl">IR · WHITE HOT</span><div class="corner c1"></div><div class="corner c2"></div><div class="corner c3"></div><div class="corner c4"></div></div>
    <div class="flash"></div><div class="black"></div>`);

  const q = (sel) => [...root.querySelectorAll(sel)];
  const ins = q('[data-in]'), strikes = q('[data-strike]'), counts = q('[data-count]'), rings = q('[data-ring]'), grows = q('[data-grow]');
  const draws = q('[data-draw]'), hls = q('[data-hl]'), presses = q('[data-press]');
  const black = fixed.querySelector('.black');
  const fpvHud = fixed.querySelector('.fpv-hud'), isoHud = fixed.querySelector('.iso-hud'), irHud = fixed.querySelector('.ir-hud'), flash = fixed.querySelector('.flash');
  const strs = ['.s1', '.s2', '.s3'].map((s) => fixed.querySelector(s));
  const tags = ['.t40', '.t100', '.tb'].map((s) => fixed.querySelector(s));
  const day = root.querySelector('[data-day]'), pkg = root.querySelector('[data-pkg]'), cursor = root.querySelector('[data-cursor]');
  const fmtN = (n, pre = '') => pre + Math.round(n).toLocaleString('en-US');

  function update(t, anchor) {
    // ----- timed elements
    for (const e of ins) {
      const a = +e.dataset.in, o = e.dataset.out ? +e.dataset.out : Infinity;
      const k = ease.out(ramp(t, a, a + 0.35)) * (o === Infinity ? 1 : 1 - ramp(t, o - 0.25, o));
      e.style.opacity = k.toFixed(3);
      const pop = e.dataset.pop ? `scale(${lerp(1.35, 1, ease.back(ramp(t, a, a + 0.3)))})` : '';
      e.style.transform = `translateY(${((1 - ease.out(ramp(t, a, a + 0.35))) * 14).toFixed(1)}px) ${pop}`;
      e.style.visibility = k <= 0.001 ? 'hidden' : 'visible';
    }
    for (const e of strikes) e.style.setProperty('--k', sr(t, +e.dataset.strike, +e.dataset.strike + 0.35, ease.out).toFixed(3));
    for (const e of rings) e.style.setProperty('--k', sr(t, +e.dataset.ring, +e.dataset.ring + 0.5, ease.out).toFixed(3));
    for (const e of grows) e.style.width = (50 + 50 * sr(t, +e.dataset.grow, +e.dataset.grow + 0.8)) + '%';
    for (const e of draws) { const k = sr(t, +e.dataset.draw, +e.dataset.draw + 0.7); e.querySelector('path').style.strokeDasharray = `${k} 1`; }
    for (const e of hls) e.classList.toggle('on', t >= +e.dataset.hl && t < +e.dataset.hl + (e.textContent.startsWith('Saves') ? 0.7 : 1.2));
    for (const e of presses) e.classList.toggle('on', t >= +e.dataset.press && t < +e.dataset.press + 0.35);
    for (const e of counts) {
      // up to three chained count ranges; the latest one that has started wins
      let v = null;
      for (const key of ['count', 'count2', 'count3']) {
        if (!e.dataset[key]) continue;
        const [f, to, a, b, pre] = e.dataset[key].split(',');
        if (v === null || t >= +a) v = fmtN(lerp(+f, +to, ease.out(ramp(t, +a, +b))), pre || '');
      }
      e.textContent = v;
    }
    // delivery: day counter + parcel along the route
    const dk = ramp(t, T.ship + 0.2, T.week + 0.3);
    day.textContent = Math.max(1, Math.round(1 + 6 * dk));
    pkg.style.left = (lerp(0, 100, ease.inOut(dk))) + '%';
    // shop cursor: glides to Buy, clicks
    const ck = sr(t, T.balance, T.buy);
    cursor.style.transform = `translate(${lerp(480, 238, ck)}px, ${lerp(650, 404, ck)}px) scale(${t >= T.buy && t < T.buy + 0.2 ? 0.88 : 1})`;
    cursor.style.opacity = ramp(t, T.shopCard + 0.5, T.balance) * (1 - ramp(t, T.items + 0.8, T.items + 1.2));

    // ----- board camera + visibility
    const showBoard = ramp(t, T.shop - 0.3, T.shop + 0.2) * (1 - ramp(t, T.list - 0.2, T.list + 0.4));
    board.style.opacity = showBoard * (1 - 0.88 * (ramp(t, T.life, T.life + 0.3) - ramp(t, T.kill - 0.4, T.kill)));
    board.style.visibility = showBoard > 0.001 ? 'visible' : 'hidden';
    dim.style.opacity = (0.5 * showBoard + 0.35 * ramp(t, T.life, T.life + 0.3) * (1 - ramp(t, T.kill - 0.4, T.kill))).toFixed(3);
    const c = camAt(t);
    board.style.transform = `translate(540px, ${c.cy}px) scale(${c.s}) translate(${-c.x}px, ${-c.y}px)`;
    const zoomedIn = ramp(c.s, 0.6, 0.9);
    for (const card of cards) {
      let a = ease.out(ramp(t, card.show, card.show + 0.5));
      if (card.hide) a *= 1 - ramp(t, card.hide - 0.4, card.hide);
      // ring cards hide while the centre solo cards sit on top of them
      if (loopIds.has(card.id)) a *= 1 - (ramp(t, T.best - 0.5, T.best) - 0);
      const d = Math.hypot(card.x - c.x, card.y - c.y);
      const focused = d < 200;
      card.e.style.opacity = a.toFixed(3);
      card.e.style.visibility = a > 0.001 ? 'visible' : 'hidden';
      const quiet = ramp(t, T.quote - 0.4, T.quote + 0.2) * (1 - ramp(t, T.best - 0.6, T.best - 0.2));
      const dimK = loopIds.has(card.id) ? Math.max(!focused ? 0.55 * zoomedIn : 0, 0.7 * quiet) : 0;
      card.e.style.filter = dimK > 0.001 ? `brightness(${(1 - dimK).toFixed(3)})` : '';
      card.e.classList.toggle('focus', loopIds.has(card.id) && focused && zoomedIn > 0.5);
      card.e.style.transform = `translateY(${((1 - a) * 30).toFixed(1)}px)`;
    }
    const ringA = ramp(t, T.loop, T.loop + 0.8) * (1 - ramp(t, T.best - 0.5, T.best));
    svg.style.opacity = ringA * (1 - 0.75 * zoomedIn);
    spin.setAttribute('transform', `rotate(${(t - T.loop) * 25 + Math.max(0, t - T.more) * 110})`);
    lblA.style.opacity = (1 - ramp(t, T.more, T.more + 0.4)) * (1 - zoomedIn); lblB.style.opacity = ramp(t, T.more, T.more + 0.4) * (1 - ramp(t, T.quote - 0.3, T.quote));
    centre.style.opacity = ringA;

    // ----- 3D-anchored price tags (strings run from each tag to the tank's turret)
    const tagAnch = [[250, 248], [790, 270], [540, 300]];
    tags.forEach((tg, i) => {
      const op = +tg.style.opacity || 0;
      const p = strs[i];
      if (op < 0.01 || !anchor) { p.style.opacity = 0; return; }
      const [hx, hy] = tagAnch[i];
      const sway = Math.sin(t * 1.3 + i) * 8;
      p.setAttribute('d', `M${hx} ${hy} Q ${(hx + anchor.x) / 2 + sway} ${Math.max(hy, anchor.y) + 60}, ${anchor.x} ${anchor.y}`);
      p.style.opacity = op;
    });

    // ----- HUDs
    const fpv = t < T.hit;
    fpvHud.style.display = fpv ? 'block' : 'none';
    if (fpv) {
      fpvHud.querySelector('[data-kmh]').textContent = Math.round(lerp(109, 131, t / T.hit));
      fpvHud.querySelector('[data-v]').textContent = (22.4 - t * 0.3).toFixed(1);
      fpvHud.querySelector('[data-lq]').textContent = Math.round(93 - t * 4 - (t > 2.3 ? 20 : 0));
      fpvHud.querySelector('[data-sec]').textContent = t < 1.5 ? 7 : 8;
    }
    isoHud.style.display = t >= T.hit && t < T.brave ? 'block' : 'none';
    isoHud.querySelector('[data-isec]').textContent = Math.floor(2 + (t - T.hit) * 0.5);
    isoHud.querySelector('[data-zoom]').textContent = (3.3 + Math.max(0, t - T.hit) * 0.12).toFixed(1) + '×';
    irHud.style.display = t >= T.irIn - 0.3 ? 'block' : 'none';
    irHud.style.opacity = ramp(t, T.irIn - 0.3, T.irIn + 0.4) * (1 - ramp(t, T.poll, T.poll + 0.5));
    flash.style.opacity = (Math.max(0, 1 - Math.abs(t - T.hit) / 0.12) * 0.9).toFixed(3);
    black.style.opacity = (ramp(t, T.list - 0.3, T.list + 0.2) * (1 - ramp(t, T.irIn - 0.2, T.irIn + 0.8))).toFixed(3);
  }
  return { update, cards };
}
