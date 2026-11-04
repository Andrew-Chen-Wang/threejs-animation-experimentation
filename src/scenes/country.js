import * as THREE from 'three';
import { makeStage } from '../lib/stage.js';
import { buildUSMap, toW, TARGET } from '../lib/usmap.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, svgEl } from '../lib/util.js';

export default function build({ hud }) {
  const { scene, camera } = makeStage({ bg: '#e4e2dc', fov: 30 });
  const map = buildUSMap(); scene.add(map.group);
  map.trackMat.uniforms.uAll.value = 0; map.planeMat.uniforms.uAlpha.value = 0;
  const D = map.data;
  const tw = toW(...TARGET); const target = new THREE.Vector3(tw[0], 0, tw[1]);
  const ink = new THREE.Color('#2a2622'), land = new THREE.Color('#d6d0c3'), red = new THREE.Color(P.red), c = new THREE.Color();
  const svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;inset:0;overflow:visible' }, hud);
  const rings = [0, 1, 2].map(() => svgEl('circle', { fill: 'none', stroke: P.red, 'stroke-width': 4 }, svg));
  const tag = el('div', 'lbl red', hud, '#1 &nbsp;·&nbsp; SAME SPOT'); tag.style.fontSize = '26px';
  const hdr = el('div', 'lbl', hud, 'SEARCHING THE LOWER 48'); place(hdr, 540, 330, 0.5, 0);
  return {
    scene, camera, caption: { y: 1390 },
    update(t) {
      const scan = ramp(t, 126.5, 128.1);
      D.dots.forEach((d, i) => {
        const xn = d.x / 975;
        const hit = Math.exp(-Math.pow((xn - lerp(-0.1, 1.1, scan)) / 0.05, 2));
        const sc = d.score; const shown = scan > xn ? 1 : 0;
        c.copy(land).lerp(ink, (0.15 + Math.pow(sc, 3) * 0.8) * shown + hit * 0.6);
        let s = 0.02 * (0.6 + shown * Math.pow(sc, 2) * 0.9 + hit * 0.6);
        const fade = ramp(t, 128.2, 128.8);
        if (d.isTarget) { c.lerp(red, ramp(t, 128.1, 128.4)); s = lerp(s, 0.07, ramp(t, 128.1, 128.5)); }
        else c.lerp(land, fade * 0.6);
        map.dots.set(i, s, c);
      });
      map.dots.commit();
      const z = sr(t, 126.4, 130, ease.sine);
      const look = new THREE.Vector3(0, 0, 0.3).lerp(target, sr(t, 128.4, 130.2, ease.inOut) * 0.5);
      const h = lerp(46, 30, sr(t, 128.4, 130.2, ease.inOut));
      camera.position.set(look.x, h, look.z + h * 0.2); camera.lookAt(look); camera.updateMatrixWorld();
      const p = project(target, camera);
      rings.forEach((r, k) => { const ph = ((((t - 128.2) * 0.8 + k / 3) % 1) + 1) % 1; r.setAttribute('cx', p.x); r.setAttribute('cy', p.y); r.setAttribute('r', 10 + ph * 90); r.style.opacity = t > 128.2 ? (1 - ph) : 0; });
      place(tag, p.x, p.y - 70, 0.5, 1); tag.style.opacity = ramp(t, 128.3, 128.7);
      hdr.style.opacity = ramp(t, 126.5, 126.9) * (1 - ramp(t, 128.2, 128.6));
    },
  };
}
