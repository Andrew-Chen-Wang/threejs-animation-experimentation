import { el, svgEl, pathD, place } from './util.js';
/** paper card with an SVG plot area. Coordinates in frame px. */
export class ChartCard {
  constructor(parent, { x, y, w, h, title = 'WHAT YOU HEAR', right = 'PITCH ↑ &nbsp; TIME →', pad = [70, 40, 50, 40] } = {}) {
    this.w = w; this.h = h; this.pad = pad;
    this.el = el('div', 'card', parent);
    Object.assign(this.el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    this.hdr = el('div', 'hdr', this.el, `<span>${title}</span><span>${right}</span>`);
    this.svg = svgEl('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}` }, this.el);
    this.paths = {};
    this.texts = {};
  }
  /** plot rect */
  get rect() { const [t, r, b, l] = this.pad; return { x0: l, x1: this.w - r, y0: t, y1: this.h - b }; }
  path(id, attrs = {}) {
    if (!this.paths[id]) this.paths[id] = svgEl('path', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs }, this.svg);
    return this.paths[id];
  }
  setPath(id, pts, attrs = {}) { const p = this.path(id, attrs); p.setAttribute('d', pts.length > 1 ? pathD(pts) : ''); for (const k in attrs) p.setAttribute(k, attrs[k]); return p; }
  text(id, str, x, y, attrs = {}) {
    if (!this.texts[id]) this.texts[id] = svgEl('text', { 'font-family': 'IBM Plex Mono', 'font-size': 16, 'font-weight': 600, 'letter-spacing': 2, fill: '#4a453d', ...attrs }, this.svg);
    const t = this.texts[id]; t.textContent = str; t.setAttribute('x', x); t.setAttribute('y', y);
    for (const k in attrs) t.setAttribute(k, attrs[k]);
    return t;
  }
  /** map data -> svg points given domain */
  map(data, xd, yd, fx = (d) => d[0], fy = (d) => d[1]) {
    const R = this.rect;
    return data.map((d) => [R.x0 + (fx(d) - xd[0]) / (xd[1] - xd[0]) * (R.x1 - R.x0), R.y1 - (fy(d) - yd[0]) / (yd[1] - yd[0]) * (R.y1 - R.y0)]);
  }
  set opacity(a) { this.el.style.opacity = a; }
  transform(str) { this.el.style.transform = str; }
}
