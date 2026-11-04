// Line-art sketches for the paper cards (inline SVG strings). Ink on paper, no fills but paper.
const S = (w, h, body) => `<svg class="sk" viewBox="0 0 ${w} ${h}" width="100%" height="100%" fill="none" stroke="#23201c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

function quad(cx, cy, r, extra = '') {
  // an isometric quadcopter: X frame, four rotor ellipses, a body block
  let s = '';
  const arms = [[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]];
  for (const [dx, dy] of arms) {
    const x = cx + dx * r, y = cy + dy * r;
    s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;
    s += `<ellipse cx="${x}" cy="${y - 6}" rx="${r * 0.55}" ry="${r * 0.16}" fill="#f4f0e7"/>`;
    s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 6}"/>`;
  }
  s += `<path d="M${cx - r * 0.42} ${cy - 4} l${r * 0.42} ${-r * 0.2} l${r * 0.42} ${r * 0.2} l${-r * 0.42} ${r * 0.2} z" fill="#f4f0e7"/>`;
  s += `<path d="M${cx - r * 0.42} ${cy - 4} v10 l${r * 0.42} ${r * 0.2} l${r * 0.42} ${-r * 0.2} v-10"/>`;
  return s + extra;
}

export const sketch = {
  fpv: () => S(200, 120, quad(100, 64, 62)),
  fibre: () => S(200, 120, quad(100, 64, 62, `<ellipse cx="100" cy="42" rx="20" ry="7" fill="#f4f0e7"/><path d="M80 42 v-16 M120 42 v-16"/><ellipse cx="100" cy="26" rx="20" ry="7" fill="#f4f0e7"/><path d="M100 26 C 130 0, 170 10, 196 4" stroke-width="1.3" stroke-dasharray="3 4"/>`)),
  interceptor: () => S(200, 120, `<path d="M40 60 L150 44 Q182 52 150 70 L40 60 z" fill="#f4f0e7"/><path d="M60 58 l-14 -26 l22 2 l16 22 M60 62 l-14 26 l22 -2 l16 -22"/><path d="M150 44 v-12 M150 70 v12"/><ellipse cx="150" cy="30" rx="26" ry="6" fill="#f4f0e7"/><ellipse cx="150" cy="84" rx="26" ry="6" fill="#f4f0e7"/><circle cx="168" cy="57" r="4"/>`),
  robot: () => S(200, 120, `<path d="M40 50 l70 -18 l60 16 l-70 20 z" fill="#f4f0e7"/><path d="M40 50 v22 l60 18 v-22 M100 68 l70 -20 v22 l-70 20"/>${[0, 1, 2].map((i) => `<ellipse cx="${56 + i * 18}" cy="${82 + i * 5}" rx="10" ry="12" fill="#f4f0e7"/><ellipse cx="${116 + i * 18}" cy="${86 - i * 5}" rx="10" ry="12" fill="#f4f0e7"/>`).join('')}<path d="M100 40 v-18 l14 -4"/>`),
  box: () => S(60, 50, `<path d="M6 16 l24 -10 l24 10 l-24 10 z" fill="#f4f0e7"/><path d="M6 16 v20 l24 10 v-20 M30 46 l24 -10 v-20"/><path d="M18 11 l24 10" stroke-width="1.6"/>`),
  bigFpv: () => S(300, 170, quad(150, 96, 92, `<path d="M118 70 l64 0 l0 -22 l-64 0 z" fill="#f4f0e7"/><path d="M118 48 l10 -8 l64 0 l-10 8 M192 40 v22 l-10 8"/><circle cx="214" cy="104" r="7"/>`)),
  person: (c = '#23201c') => `<svg viewBox="0 0 30 64" width="30" height="64"><g fill="${c}"><circle cx="15" cy="7" r="6"/><path d="M8 15 h14 l3 22 h-5 l-1 -12 l-1 37 h-5 l-1 -22 l-1 22 h-5 l-1 -37 l-1 12 h-5 z"/></g></svg>`,
};
