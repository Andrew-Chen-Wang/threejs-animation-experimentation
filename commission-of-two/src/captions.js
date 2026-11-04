import WORDS from './words.json';

export const END_TIME = 139.85;
// two-word chunks; a chunk breaks after sentence punctuation or a pause
const chunks = [];
for (let i = 0; i < WORDS.length;) {
  const [t, w] = WORDS[i];
  const parts = [w]; let j = i + 1;
  const breaks = (s) => /[.,!?;:]$/.test(s);
  if (!breaks(w) && j < WORDS.length && WORDS[j][0] - t < 0.55) { parts.push(WORDS[j][1]); j++; }
  chunks.push({ t, text: parts.join(' ').replace(/[,.;:]$/, '') });
  i = j;
}
chunks.forEach((c, k) => { const n = chunks[k + 1]; c.end = n ? Math.min(n.t, c.t + 1.4) : c.t + 1.2; });

export class Captions {
  constructor(node) { this.node = node; this.cur = null; }
  update(t) {
    let c = null;
    let lo = 0, hi = chunks.length - 1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (chunks[m].t <= t) { c = chunks[m]; lo = m + 1; } else hi = m - 1; }
    const show = c && t < c.end ? c.text : '';
    if (show !== this.cur) { this.node.textContent = show; this.cur = show; }
  }
}
