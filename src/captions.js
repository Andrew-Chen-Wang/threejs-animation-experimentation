// Caption chunks timed to the narration (word timings from Whisper, see data/transcript.json).
// *word* marks the accent word, drawn in red.
export const CAPTIONS = [
  [2.18, "A plane you can't even\nsee or *hear*"],
  [4.24, "can give away\nyour exact *location.*"],
  [7.32, "It's already\nbeen *done.*"],
  [9.12, "This security camera\ncould have been anywhere\nin *America.*"],
  [12.82, "With nothing\nbut the *date,*"],
  [14.22, "it was found down to\nthe exact *pole* it hangs on."],
  [17.50, "Here's *how.*"],
  [18.86, "*Listen.*"],
  [19.52, "Can you hear\na *plane?*"],
  [22.62, "Now draw the sound\nas a *picture.*"],
  [24.82, "Zoom into\nthe *low notes.*"],
  [26.36, "*There.*"],
  [26.56, "A *propeller* plane.\nToo quiet to hear."],
  [30.70, "*920 seconds* later,"],
  [32.06, "a second,\n*louder* one."],
  [34.16, "You already know\nthis *shape.*"],
  [36.72, "Coming at you, a sound\ngets squeezed *higher.*"],
  [39.98, "Going away,\nit stretches *lower.*"],
  [42.80, "The *faster* it goes,\nthe bigger the drop."],
  [45.30, "The *closer* it passes,\nthe sharper the drop."],
  [48.74, "So the line gives\nthe plane's *speed,*"],
  [50.46, "and how *close*\nit came."],
  [53.10, "But *which* plane?"],
  [53.82, "Planes over America\n*broadcast* where they are,"],
  [57.20, "every *second.*"],
  [58.34, "Airliners, and over\n*100,000* private planes."],
  [61.88, "It's all *recorded,*"],
  [62.96, "so you download\nthat whole *day.*"],
  [64.82, "The sound is\na *propeller,*"],
  [66.32, "so out go\nthe *jets.*"],
  [68.10, "Then you ask every\n*spot* in the country:"],
  [70.64, "would you hear\na plane like that?"],
  [72.28, "And 920 seconds later,\nthe *other* one?"],
  [75.38, "For this clip, about\n*70,000* spots said yes,"],
  [78.74, "mostly around\n*airports.*"],
  [80.36, "But this clip has\n15 minutes of *nothing*\nbetween the two planes."],
  [85.34, "And *silence*\nis a clue too."],
  [87.46, "Every spot that would have\nheard a third plane: *gone.*"],
  [90.58, "*15,000* left."],
  [92.48, "One thing was left:\nthe *shape* of the line."],
  [95.38, "Real planes *turn,*\nclimb and change speed."],
  [98.42, "Every *wobble*\nbends the line."],
  [100.60, "So for every spot, you\nwork out the *exact* line\nit would have heard."],
  [104.40, "There's a *trap.*"],
  [105.72, "Sound is *slow.*"],
  [106.38, "By the time you hear a plane,\nit's already somewhere *else.*"],
  [110.38, "Miss that, and\nthe search *fails.*"],
  [113.24, "Then you lay every\npredicted line\nover the *real* ones."],
  [116.42, "One spot matched\nboth planes *perfectly.*"],
  [118.94, "Second place\nwasn't *close.*"],
  [120.86, "Then a *harder* test:"],
  [122.28, "one minute of audio,\none *faint* plane,"],
  [124.72, "and the *time*\nit was recorded."],
  [126.62, "The whole\ncountry again."],
  [128.26, "The *same* spot\ncame first."],
  [130.18, "That's one square,\n*100 meters* wide."],
  [132.92, "America has more than\n*750 million* of them."],
  [135.60, "The sound picked\nthe *right* one."],
  [138.50, "Street View\ndid the rest."],
  [140.16, "The same *trees,*"],
  [141.38, "and on a pole,\nthe *camera.*"],
  [143.80, "So how do\nyou *hide* it?"],
  [145.48, "Cut the\n*low notes?*"],
  [146.94, "Save it\nas an *MP3?*"],
  [148.54, "Turn it up, and\nthe line comes *back.*"],
  [151.32, "*Talk* over it?"],
  [152.28, "There's been a plane\nunder my *voice*"],
  [153.74, "for the last\n*twenty seconds.*"],
  [156.48, "It even comes through\na *phone call.*"],
  [159.06, "A YouTuber called *colsto*\nbuilt all of this,"],
  [161.36, "and demonstrated it\non a real security\ncamera clip."],
  [164.92, "It took him *months*\nand 5,000 lines of code."],
  [168.40, "He hasn't\n*shared* it."],
  [170.50, "Next time a small\nplane flies over,"],
  [172.90, "you might be the *only* place\non earth hearing it."],
  [175.68, "Exactly\nlike *that.*"],
];
export const END_TIME = 178.8;

import { clamp, ease } from './lib/util.js';

export class Captions {
  constructor(root) {
    this.root = root;
    this.items = CAPTIONS.map(([t, text], i) => {
      const next = CAPTIONS[i + 1] ? CAPTIONS[i + 1][0] : END_TIME - 1.2;
      return { t, end: Math.min(next, t + 6.5), text, el: null, words: [] };
    });
  }
  build(it) {
    const e = document.createElement('div');
    e.className = 'cap';
    const lines = it.text.split('\n');
    lines.forEach((line, li) => {
      const parts = line.split(/(\*[^*]+\*)/).filter(Boolean);
      parts.forEach((p) => {
        const em = p.startsWith('*');
        const raw = em ? p.slice(1, -1) : p;
        raw.split(/(\s+)/).filter((s) => s.length).forEach((tok) => {
          if (/^\s+$/.test(tok)) { e.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = 'w' + (em ? ' em' : '');
          s.textContent = tok;
          e.appendChild(s); it.words.push(s);
        });
      });
      if (li < lines.length - 1) e.appendChild(document.createElement('br'));
    });
    it.el = e; this.root.appendChild(e);
  }
  update(t, opts = {}) {
    const y = opts.y ?? 1330, dark = !!opts.dark;
    for (const it of this.items) {
      const vis = t >= it.t - 0.05 && t < it.end;
      if (!vis) { if (it.el) { it.el.remove(); it.el = null; it.words = []; } continue; }
      if (!it.el) this.build(it);
      const inT = clamp((t - it.t) / 0.28), outT = clamp((it.end - t) / 0.14);
      const a = Math.min(ease.out(inT), outT);
      it.el.classList.toggle('dark', dark);
      it.el.style.opacity = a.toFixed(3);
      it.el.style.top = y + 'px';
      it.el.style.transform = `translateY(${(1 - ease.out(inT)) * 16 - 50}%)`;
      it.words.forEach((w, i) => {
        const k = clamp((t - it.t - i * 0.035) / 0.22);
        w.style.opacity = ease.out(k).toFixed(3);
        w.style.filter = k < 1 ? `blur(${((1 - k) * 6).toFixed(2)}px)` : '';
      });
    }
  }
}
