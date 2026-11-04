// Caption chunks timed to the narration's word timestamps (../transcript.json). *word* = accent word.
import { clamp, ease } from '../../src/lib/util.js';
import { T } from './times.js';

export const CAPTIONS = [
  [2.76, 'This tank was\nworth *forty* points.'],
  [5.16, 'Or a hundred\nthousand *roubles.*'],
  [6.62, 'Depends whose\n*drone* got it.'],
  [8.46, "Ukraine's points\naren't *pay.*"],
  [9.98, "They're credit\nfor the *unit,*"],
  [11.32, 'in a shop\nbuilt for the *war:*'],
  [13.0, '*Brave1* Market.'],
  [14.2, 'The minister called it\nthe *Amazon* for the military.'],
  [16.94, 'It works as a *loop.*'],
  [18.32, 'A drone *hits*\na target.'],
  [19.82, 'The unit *uploads*\nthe video.'],
  [21.68, 'Two videos must\n*confirm* the hit.'],
  [23.98, "*Points* land in\nthe unit's account."],
  [28.54, 'In late 2025,\na kill was *twelve:*'],
  [32.46, '*sixty thousand*\nhryvnias,'],
  [34.3, 'about three\n*FPV drones.*'],
  [36.58, 'Someone in the\nunit *logs in,*'],
  [38.1, 'sees the *balance,*\nand shops:'],
  [40.42, 'over a *thousand* items,'],
  [41.88, 'from FPVs\nto *robots.*'],
  [43.8, "The ministry's agency\n*signs* the contract"],
  [45.9, 'and *pays*\nthe maker.'],
  [47.4, 'The maker ships\nstraight to the *unit:*'],
  [49.38, "about a *week,*\nif it's in stock."],
  [51.24, 'It used to\ntake *months.*'],
  [52.8, 'The new drones\nearn *more* points.'],
  [55.04, '“The more you destroy,\nthe more you *receive,*”'],
  [57.8, "says Brave1's *head.*"],
  [59.18, 'Its first year:'],
  [60.46, 'a *billion dollars*\nof orders.'],
  [62.5, "This year's\n*best seller*"],
  [63.5, 'is a drone that\n*hunts* drones.'],
  [65.88, 'And the prices change\nlike *patch notes.*'],
  [68.28, 'A soldier went\nup to *six* points.'],
  [70.2, 'Kills *doubled*\nwithin a month,'],
  [71.4, 'the minister said.'],
  [72.48, 'Then *twelve.*'],
  [73.6, 'A drone pilot:\n*twenty-five.*'],
  [75.94, 'Armour was\n*marked down.*'],
  [77.48, 'Makers see how their\ndrone *scores* at the front,'],
  [79.7, 'and its *rank.*'],
  [81.32, 'The reviews are\nwritten in *combat.*'],
  [82.76, 'In September,\nmakers said'],
  [84.44, "they weren't being\n*paid* for points orders."],
  [86.78, 'The ministry\n*promised* to pay.'],
  [88.98, 'Russia pays its\nsoldiers for *hits:*'],
  [91.2, 'a hundred thousand\nroubles a *tank.*'],
  [93.02, 'So does *Ukraine:*'],
  [94.14, 'about forty-nine\nthousand *hryvnias.*'],
  [96.04, 'Both just over\na *thousand dollars.*'],
  [98.78, "But on Ukraine's list,"],
  [100.3, 'a *life* could be worth\nmore than a death.'],
  [102.8, 'A hundred and\ntwenty *points*'],
  [103.74, 'for *capturing* a\nsoldier by drone.'],
  [105.9, 'Up to the same for\n*rescuing* your own\nwounded by robot.'],
  [108.62, '*Ten times* a kill.'],
  [110.9, 'Prisoners can be\n*swapped* for your own.'],
  [113.0, 'So does putting\na *price* on a hit'],
  [114.18, '*save* lives,'],
  [114.88, 'or *cheapen* them?'],
];
export const END_TIME = T.end;
const GAPS = new Set([23.98, 96.04, 114.88]); // chunks followed by a held beat: end early

/** caption y (frame px) per stretch of the piece */
export function captionY(t) {
  if (t < T.hit) return 1460;
  if (t < T.shop) return 1570;
  if (t >= T.loop && t < T.c1 - 0.2) return 1480;
  if (t >= T.more && t < T.best - 0.4) return 1480;
  if (t >= T.irIn - 1.6) return 1560;
  return 1300;
}

export class Captions {
  constructor(root) {
    this.root = root;
    this.items = CAPTIONS.map(([t, text], i) => {
      const next = CAPTIONS[i + 1] ? CAPTIONS[i + 1][0] : END_TIME - 1.9;
      return { t, end: Math.min(next, t + (GAPS.has(t) ? 2.2 : 6)), text, el: null, words: [] };
    });
  }
  build(it) {
    const e = document.createElement('div');
    e.className = 'cap';
    it.text.split('\n').forEach((line, li, lines) => {
      line.split(/(\*[^*]+\*)/).filter(Boolean).forEach((p) => {
        const em = p.startsWith('*');
        (em ? p.slice(1, -1) : p).split(/(\s+)/).filter((s) => s.length).forEach((tok) => {
          if (/^\s+$/.test(tok)) { e.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = 'w' + (em ? ' em' : ''); s.textContent = tok;
          e.appendChild(s); it.words.push(s);
        });
      });
      if (li < lines.length - 1) e.appendChild(document.createElement('br'));
    });
    it.el = e; this.root.appendChild(e);
  }
  update(t) {
    const y = captionY(t);
    for (const it of this.items) {
      const vis = t >= it.t - 0.05 && t < it.end;
      if (!vis) { if (it.el) { it.el.remove(); it.el = null; it.words = []; } continue; }
      if (!it.el) this.build(it);
      const inT = clamp((t - it.t) / 0.25), outT = clamp((it.end - t) / 0.12);
      it.el.style.opacity = Math.min(ease.out(inT), outT).toFixed(3);
      it.el.style.top = y + 'px';
      it.el.style.transform = `translateY(${(1 - ease.out(inT)) * 14 - 50}%)`;
      it.words.forEach((w, i) => { const k = clamp((t - it.t - i * 0.03) / 0.2); w.style.opacity = ease.out(k).toFixed(3); });
    }
  }
}
