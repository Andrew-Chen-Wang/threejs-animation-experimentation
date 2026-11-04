// A paper photo of "the clip" (the CCTV frame) for HUD use.
import { ASSETS } from './assets.js';
import { el } from './util.js';
export function polaroid(parent, { w = 400, caption = 'THE CLIP' } = {}) {
  const card = el('div', '', parent);
  Object.assign(card.style, { position: 'absolute', width: w + 'px', padding: '12px 12px 0', background: '#f8f5ee', borderRadius: '3px',
    boxShadow: '0 2px 0 rgba(0,0,0,.05), 0 18px 40px rgba(40,30,20,.28)' });
  const img = el('img', '', card); Object.assign(img.style, { display: 'block', width: '100%', height: Math.round((w - 24) * 448 / 540) + 'px', background: '#2a2724', objectFit: 'cover' });
  const cap = el('div', '', card, caption); Object.assign(cap.style, { fontFamily: 'IBM Plex Mono', fontWeight: 600, fontSize: '16px', letterSpacing: '3px', color: '#4a453d', padding: '12px 2px 14px' });
  const mark = el('div', '', card); Object.assign(mark.style, { position: 'absolute', left: '12px', top: '12px', width: '62%', height: Math.round((w - 24) * 34 / 540) + 'px', border: '4px solid #c23a2c', borderRadius: '3px', opacity: 0 });
  return { card, img, cap, mark, sync() { if (ASSETS.clip && img.src !== ASSETS.clip) img.src = ASSETS.clip; } };
}
