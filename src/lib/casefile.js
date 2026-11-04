// The "case file": a persistent strip at the bottom of the frame that keeps the viewer oriented.
// It answers three questions at every moment: which chapter are we in, what evidence do we have,
// and how many places are still possible.
import { P } from './palette.js';
import { el, svgEl, ramp, ease, lerp, clamp, fmt, place } from './util.js';

const CHAPTERS = [
  [9.2, 'THE CASE'], [17.5, '1 · THE CLUE'], [36.4, '2 · READING THE LINE'], [53.0, '3 · THE SEARCH'],
  [92.3, '4 · THE PROOF'], [120.8, '5 · A HARDER TEST'], [130.0, 'FOUND'],
];
const CHIPS = [
  { t: 13.6, label: 'DATE ONLY' }, { t: 26.4, label: 'PROPELLER', p: 'p1' }, { t: 65.2, label: 'NO JETS' },
  { t: 82.2, label: '15 MIN SILENCE' }, { t: 94.0, label: 'LINE SHAPE' }, { t: 106.0, label: 'SOUND DELAY' },
];
// candidate count keyframes: [t0, t1, from, to]
const COUNT = [[9.2, 9.2, 765e6, 765e6], [75.4, 77.4, 765e6, 70000], [89.4, 90.6, 70000, 15000], [116.4, 117.6, 15000, 1],
  [120.9, 120.9, 1, 765e6], [127.0, 128.4, 765e6, 1]];
function countAt(t) {
  let v = 765e6;
  for (const [a, b, from, to] of COUNT) {
    if (t < a) break;
    const k = b > a ? ease.inOut(clamp((t - a) / (b - a))) : 1;
    v = Math.exp(lerp(Math.log(from), Math.log(to), k));
  }
  return Math.round(v);
}
const sCurve = (cx, w, y0, y1, n = 40) => { let d = ''; for (let i = 0; i <= n; i++) { const u = i / n; const x = cx - w / 2 + u * w; const y = y0 + (y1 - y0) * (0.5 + 0.5 * Math.tanh((u - 0.5) * 6)); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } return d; };

export class CaseFile {
  constructor(root) {
    const c = this.el = el('div', 'casefile', root);
    Object.assign(c.style, { position: 'absolute', left: '40px', top: '1608px', width: '1000px', height: '200px', background: '#f6f2ea', borderRadius: '10px',
      boxShadow: '0 1px 0 rgba(0,0,0,.05), 0 14px 34px rgba(40,30,20,.20)', fontFamily: 'IBM Plex Mono', color: P.ink, overflow: 'hidden' });
    this.chap = el('div', '', c); Object.assign(this.chap.style, { position: 'absolute', left: '26px', top: '16px', fontSize: '20px', fontWeight: 600, letterSpacing: '3px' });
    this.chips = el('div', '', c); Object.assign(this.chips.style, { position: 'absolute', right: '22px', top: '14px', display: 'flex', gap: '8px' });
    this.chipEls = CHIPS.map((ch) => { const e = el('span', '', this.chips, ch.label); Object.assign(e.style, { fontSize: '16px', fontWeight: 600, letterSpacing: '2px', padding: '3px 10px', border: '2px solid ' + P.ink, borderRadius: '999px', display: 'none' }); return e; });
    const W = 640, H = 124;
    this.svg = svgEl('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: 'position:absolute;left:24px;top:56px;overflow:visible' }, c);
    svgEl('rect', { x: 0, y: 0, width: W, height: H, rx: 8, fill: '#141311' }, this.svg);
    svgEl('text', { x: 12, y: 18, fill: '#8f887b', 'font-size': 12, 'font-weight': 600, 'letter-spacing': 2, 'font-family': 'IBM Plex Mono' }, this.svg).textContent = 'THE CLIP · PITCH ↑ TIME →';
    const g = (o = {}) => svgEl('g', o, this.svg);
    this.g1 = g(); svgEl('path', { d: sCurve(110, 120, 42, 78), stroke: P.p1Glow, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, this.g1);
    this.l1 = svgEl('text', { x: 110, y: 106, 'text-anchor': 'middle', fill: P.p1Glow, 'font-size': 16, 'font-weight': 600, 'letter-spacing': 1, 'font-family': 'IBM Plex Mono' }, this.g1);
    this.g2 = g(); svgEl('path', { d: sCurve(530, 120, 36, 84), stroke: P.p2Glow, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, this.g2);
    this.l2 = svgEl('text', { x: 530, y: 106, 'text-anchor': 'middle', fill: P.p2Glow, 'font-size': 16, 'font-weight': 600, 'letter-spacing': 1, 'font-family': 'IBM Plex Mono' }, this.g2);
    this.gGap = g();
    svgEl('path', { d: 'M190 60 L450 60', stroke: '#8f887b', 'stroke-width': 2, 'stroke-dasharray': '4 6' }, this.gGap);
    this.gapT = svgEl('text', { x: 320, y: 52, 'text-anchor': 'middle', fill: '#d8d1c3', 'font-size': 16, 'font-weight': 600, 'letter-spacing': 2, 'font-family': 'IBM Plex Mono' }, this.gGap);
    this.silence = svgEl('rect', { x: 196, y: 30, width: 248, height: 60, rx: 4, fill: 'none', stroke: P.red, 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }, this.gGap);
    this.gH = g(); svgEl('path', { d: sCurve(320, 110, 50, 74), stroke: '#cfc8bb', 'stroke-width': 3, fill: 'none', opacity: 0.8 }, this.gH);
    this.hT = svgEl('text', { x: 320, y: 106, 'text-anchor': 'middle', fill: '#d8d1c3', 'font-size': 16, 'font-weight': 600, 'letter-spacing': 1, 'font-family': 'IBM Plex Mono' }, this.gH);
    this.hT.textContent = 'ONE FAINT PLANE · 19:30:03 UTC';
    this.cl = el('div', '', c, 'STILL POSSIBLE'); Object.assign(this.cl.style, { position: 'absolute', left: '692px', top: '62px', fontSize: '16px', fontWeight: 600, letterSpacing: '3px', color: '#6d665a' });
    this.num = el('div', '', c); Object.assign(this.num.style, { position: 'absolute', left: '690px', top: '84px', fontSize: '46px', fontWeight: 600, letterSpacing: '1px', fontVariantNumeric: 'tabular-nums' });
    this.unit = el('div', '', c, '100 M SQUARES'); Object.assign(this.unit.style, { position: 'absolute', left: '692px', top: '142px', fontSize: '14px', fontWeight: 600, letterSpacing: '3px', color: '#6d665a' });
    this.lastCount = null; this.flash = -10;
  }
  update(t) {
    const vis = ramp(t, 9.2, 9.7) * (1 - ramp(t, 143.2, 143.6));
    this.el.style.display = vis > 0 ? 'block' : 'none';
    if (!vis) return;
    this.el.style.opacity = vis.toFixed(3);
    this.el.style.transform = `translateY(${(1 - ease.out(ramp(t, 9.2, 9.8))) * 60}px)`;
    let ch = CHAPTERS[0][1]; for (const [a, n] of CHAPTERS) if (t >= a) ch = n;
    this.chap.textContent = ch;
    const harder = t >= 120.8 && t < 130.0;
    // chips (reset for the harder test, which has its own evidence)
    const live = CHIPS.map((c, i) => i).filter((i) => t >= CHIPS[i].t && !harder).slice(-3);
    CHIPS.forEach((c, i) => {
      const e = this.chipEls[i]; const on = live.includes(i);
      e.style.display = on ? 'inline-block' : 'none';
      const fresh = on && t - c.t < 1.2;
      e.style.borderColor = fresh ? P.red : P.ink; e.style.color = fresh ? P.red : P.ink;
    });
    // evidence strip
    this.g1.style.opacity = harder ? 0 : ramp(t, 26.4, 27.0);
    this.g2.style.opacity = harder ? 0 : ramp(t, 32.1, 32.7);
    this.gGap.style.opacity = harder ? 0 : ramp(t, 31.2, 31.8);
    this.gH.style.opacity = harder ? ramp(t, 122.3, 122.9) : 0;
    this.l1.textContent = t > 50.4 ? '≈105 KT · 900 M' : 'PLANE 1';
    this.l2.textContent = t > 51.6 ? '≈120 KT · 400 M' : 'PLANE 2';
    this.gapT.textContent = t > 82.2 ? '15 MIN · NO PLANE' : '920 S LATER';
    this.silence.style.opacity = t > 82.2 ? 1 : 0;
    // candidate count, with a red flash when it changes
    const n = countAt(t);
    if (this.lastCount !== null && n !== this.lastCount) this.flash = t;
    this.lastCount = n;
    this.num.textContent = fmt(n);
    const hot = n === 1 || t - this.flash < 0.5;
    this.num.style.color = hot ? P.red : P.ink;
    this.unit.textContent = n === 1 ? '100 M SQUARE' : '100 M SQUARES';
  }
}
