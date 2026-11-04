import * as THREE from 'three';
import { makeStage } from '../lib/stage.js';
import { buildUSMap, toW, TARGET } from '../lib/usmap.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, hash1 } from '../lib/util.js';

export default function build({ hud }) {
  const { scene, camera } = makeStage({ bg: '#e4e2dc', fov: 30 });
  const map = buildUSMap();
  scene.add(map.group);
  const D = map.data;
  const tw = toW(...TARGET); const target = new THREE.Vector3(tw[0], 0, tw[1]);
  const hdr = el('div', 'lbl', hud, '08 SEP 2026'); hdr.style.fontSize = '30px';
  const sub = el('div', 'lbl', hud, 'CONTIGUOUS UNITED STATES');
  place(hdr, 540, 470, 0.5, 0); place(sub, 540, 515, 0.5, 0);
  const ring = el('div', '', hud); Object.assign(ring.style, { position: 'absolute', width: '90px', height: '90px', border: '4px solid ' + P.red, borderRadius: '50%' });
  const red = new THREE.Color(P.red), ink = new THREE.Color('#2a2622'), land = new THREE.Color('#d8d2c5');
  const c = new THREE.Color();
  return {
    scene, camera, caption: { y: 1390 },
    update(t) {
      // dots: faint grid, random candidates blink ("anywhere")
      const dive = sr(t, 13.9, 14.95, ease.in);
      D.dots.forEach((d, i) => {
        const appear = ramp(t, 9.0 + (d.x / 975) * 1.2, 9.4 + (d.x / 975) * 1.2);
        const ph = hash1(i * 3.7);
        const blink = t > 10.0 && t < 13.9 ? Math.max(0, Math.sin((t * 1.3 + ph * 20)) - 0.985) * 60 : 0;
        let s = 0.018 * appear * (1 + blink * 0.6);
        c.copy(land).lerp(ink, 0.55 + 0.45 * Math.min(1, blink)); if (blink > 0.2) c.copy(red);
        if (d.isTarget) { const k = sr(t, 13.2, 13.9); s = lerp(s, 0.05, k); c.lerp(red, k); }
        else if (dive > 0) c.lerp(land, dive);
        map.dots.set(i, s, c);
      });
      map.dots.commit();
      map.trackMat.uniforms.uAll.value = 0; map.planeMat.uniforms.uAlpha.value = 0;
      const z = sr(t, 9.0, 13.6, ease.sine);
      const h = lerp(52, 46, z);
      const look = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0.3), target, sr(t, 13.4, 14.95, ease.inOut));
      const hh = lerp(h, 1.4, dive);
      camera.position.set(look.x, hh, look.z + hh * 0.18);
      camera.lookAt(look); camera.rotation.z = lerp(0, 0.25, dive);
      camera.updateMatrixWorld();
      hdr.style.opacity = ramp(t, 9.3, 9.8) * (1 - dive);
      hdr.style.color = t > 13.5 ? P.red : P.ink;
      hdr.style.transform += ` scale(${1 + sr(t, 13.5, 13.9) * 0.25 - sr(t, 13.9, 14.3) * 0.25})`;
      sub.style.opacity = ramp(t, 9.5, 10.0) * (1 - dive);
      const p = project(target, camera);
      place(ring, p.x, p.y, 0.5, 0.5, `scale(${lerp(3, 1, sr(t, 14.2, 14.7))})`);
      ring.style.opacity = ramp(t, 14.2, 14.5) * (1 - ramp(t, 14.7, 14.95));
    },
  };
}
