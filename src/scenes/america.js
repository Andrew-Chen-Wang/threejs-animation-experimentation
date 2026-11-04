// HOOK, part 2: the clip is pinned to an exact spot (the answer first), then we pull back to
// "it could have been anywhere" and dive back down.
import * as THREE from 'three';
import { makeStage } from '../lib/stage.js';
import { buildUSMap, toW, TARGET } from '../lib/usmap.js';
import { polaroid } from '../lib/polaroid.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, svgEl } from '../lib/util.js';

export default function build({ hud }) {
  const { scene, camera } = makeStage({ bg: '#e4e2dc', fov: 30 });
  const map = buildUSMap(); scene.add(map.group);
  map.trackMat.uniforms.uAll.value = 0; map.planeMat.uniforms.uAlpha.value = 0;
  const D = map.data;
  const tw = toW(...TARGET); const target = new THREE.Vector3(tw[0], 0, tw[1]);
  const svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;inset:0;overflow:visible' }, hud);
  const string = svgEl('line', { stroke: P.ink, 'stroke-width': 2.5 }, svg);
  const pinG = svgEl('g', {}, svg);
  svgEl('path', { d: 'M0 0 C -6 -14 -22 -26 -22 -42 A 22 22 0 1 1 22 -42 C 22 -26 6 -14 0 0 Z', fill: P.red, stroke: '#7a2018', 'stroke-width': 2 }, pinG);
  svgEl('circle', { cx: 0, cy: -42, r: 8, fill: '#f6efe4' }, pinG);
  const ring = svgEl('circle', { r: 46, fill: 'none', stroke: P.red, 'stroke-width': 5 }, svg);
  const pol = polaroid(hud, { w: 420, caption: 'THE CLIP' });
  const coord = el('div', 'lbl', hud, '38.47° N &nbsp;·&nbsp; 96.92° W'); coord.style.fontSize = '22px';
  const stamp = el('div', 'stamp', hud, 'FOUND'); stamp.style.fontSize = '44px';
  const where = el('div', 'big-num', hud, 'WHERE?'); where.style.fontSize = '64px'; where.style.color = P.ink;
  const dateL = el('div', 'lbl red', hud, 'ALL WE KNOW: THE DATE'); dateL.style.fontSize = '22px';
  const land = new THREE.Color('#d8d2c5'), ink = new THREE.Color('#2a2622'), red = new THREE.Color(P.red), c = new THREE.Color();
  return {
    scene, camera, caption: { y: 1400 },
    update(t) {
      pol.sync();
      // camera: close on the answer -> whole country -> dive back
      const out = sr(t, 8.6, 10.4, ease.inOut), dive = sr(t, 13.9, 14.95, ease.in);
      const h0 = lerp(9, 50, out);
      const look = target.clone().lerp(new THREE.Vector3(0, 0, 0.9), out).lerp(target, sr(t, 13.4, 14.95, ease.inOut));
      const h = lerp(h0, 1.4, dive);
      camera.position.set(look.x, h, look.z + h * 0.16); camera.lookAt(look); camera.updateMatrixWorld();
      // dots: every possible spot, shown once we ask "where?"
      D.dots.forEach((d, i) => {
        const a = ramp(t, 9.6 + (d.x / 975) * 1.0, 10.0 + (d.x / 975) * 1.0);
        let s = 0.017 * a; c.copy(land).lerp(ink, 0.5);
        if (d.isTarget) { const k = ramp(t, 13.6, 14.1); s = lerp(s, 0.06, k); c.lerp(red, k); }
        else c.lerp(land, dive);
        map.dots.set(i, s, c);
      });
      map.dots.commit();
      // pin + polaroid (answer first)
      const p = project(target, camera);
      const pinA = ease.back(ramp(t, 5.4, 5.9)) * (1 - ramp(t, 8.6, 9.0));
      pinG.setAttribute('transform', `translate(${p.x},${p.y}) scale(${Math.max(0.001, pinA) * 1.3})`);
      ring.setAttribute('cx', p.x); ring.setAttribute('cy', p.y); ring.setAttribute('r', lerp(260, 46, sr(t, 4.6, 5.7)));
      ring.style.opacity = ramp(t, 4.6, 4.9) * (1 - ramp(t, 8.6, 9.0)) + ramp(t, 14.1, 14.3) * (1 - ramp(t, 14.7, 14.95));
      // polaroid: beside the pin, then up top as "the question"
      const px = lerp(150, 330, out), py = lerp(330, 240, out);
      const rot = lerp(-5, 3, out);
      place(pol.card, px, py, 0, 0, `rotate(${rot}deg) scale(${lerp(0.8, 1, ease.out(ramp(t, 4.6, 5.2)))})`);
      pol.card.style.opacity = ramp(t, 4.6, 5.0) * (1 - ramp(t, 13.8, 14.3));
      string.setAttribute('x1', px + 210); string.setAttribute('y1', py + 380); string.setAttribute('x2', p.x); string.setAttribute('y2', p.y - 60);
      string.style.opacity = pinA;
      place(coord, p.x, p.y + 20, 0.5, 0); coord.style.opacity = ramp(t, 5.9, 6.3) * (1 - ramp(t, 8.6, 9.0));
      const st = ramp(t, 7.4, 7.6);
      place(stamp, px + 300, py + 70, 0.5, 0.5, `rotate(-12deg) scale(${lerp(2, 1, ease.out(st))})`); stamp.style.opacity = st * (1 - ramp(t, 8.6, 9.0));
      place(where, 540, 760, 0.5, 0.5); where.style.opacity = ramp(t, 10.6, 11.0) * (1 - ramp(t, 12.6, 12.9));
      pol.mark.style.opacity = ramp(t, 13.4, 13.7) * (1 - ramp(t, 13.8, 14.3));
      place(dateL, 540, 820, 0.5, 0.5); dateL.style.opacity = ramp(t, 13.5, 13.8) * (1 - ramp(t, 14.0, 14.3));
    },
  };
}
