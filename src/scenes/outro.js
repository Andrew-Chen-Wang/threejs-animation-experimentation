import * as THREE from 'three';
import { feature } from 'topojson-client';
import { geoEquirectangular, geoPath, geoGraticule10 } from 'd3-geo';
import land110 from 'world-atlas/land-110m.json';
import { makeStage } from '../lib/stage.js';
import { addLights, treeLine, cloud, ground, plane, fieldTexture } from '../lib/objects.js';
import { heardCurve } from '../lib/doppler.js';
import { TARGET_LL } from '../lib/usmap.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, svgEl, pathD } from '../lib/util.js';

/** open sky over the tree line, a small plane passes and its pitch line is drawn in red */
function skyBuilder(t0, t1, { endCard = false } = {}) {
  return ({ hud }) => {
    const { scene, camera } = makeStage({ bg: '#e9e6de', fov: 50, fog: [30, 120, '#e9e6de'] });
    addLights(scene, { size: 30, dir: [-6, 18, 10] });
    const tex = fieldTexture({ rows: 70, tufts: 0, line: 'rgba(120,108,90,0.22)' }); tex.rotation = Math.PI / 2; tex.center.set(0.5, 0.5);
    scene.add(ground(300, { repeat: 22, tex }));
    treeLine(scene, { seeds: 1, count: 15, x0: -17, x1: 17, z: -14, jitter: 3, h: [3.4, 5.0] });
    treeLine(scene, { seeds: 8, count: 11, x0: -26, x1: 26, z: -24, jitter: 3, h: [4, 5.5] });
    const clouds = [[-8, 18, -45, 9], [9, 23, -55, 12], [-13, 27, -60, 8], [14, 15, -40, 7]].map(([x, y, z, w], i) => { const c = cloud(31 + i, w); c.position.set(x, y, z); scene.add(c); return c; });
    const pl = plane({ scale: 1.0 }); scene.add(pl);
    const path = (te, out = new THREE.Vector3()) => out.set(-13 + (te - t0) * 6.5, 14 - (te - t0) * 0.3, -18 + (te - t0) * 1.2);
    const L = new THREE.Vector3(0, 1.7, 16);
    const curve = heardCurve(path, L, 30, 1, t0 - 2, t1 + 2, 300);
    const svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;inset:0;overflow:visible' }, hud);
    const red = svgEl('path', { fill: 'none', stroke: P.red, 'stroke-width': 7, 'stroke-linecap': 'round' }, svg);
    const end = endCard ? el('div', '', hud) : null;
    if (end) {
      Object.assign(end.style, { position: 'absolute', left: '0', right: '0', top: '1420px', textAlign: 'center' });
      end.innerHTML = `<div style="font:700 74px/1.05 'Old Standard TT';color:#23201c">The Sound<br/>That <span style="color:#c23a2c">Finds</span> You</div>
        <div class="mono" style="margin-top:28px;font-size:19px;color:#6d665a;letter-spacing:3px">METHOD BY COLSTO &nbsp;·&nbsp; YOUTUBE</div>`;
    }
    return {
      scene, camera, caption: { y: 1330 },
      update(t) {
        path(t, pl.position); pl.rotation.set(0.0, -0.16, Math.sin(t) * 0.04); pl.userData.spin(t);
        clouds.forEach((c, i) => { c.position.x += 0; });
        const k = sr(t, t0, t1, ease.sine);
        camera.position.set(0, 1.7, 16); camera.lookAt(lerp(-1, 1.5, k), 3.0, 0); camera.updateMatrixWorld();
        // pitch line painted across the sky: x follows the plane on screen, height = heard pitch
        const pts = [];
        for (const d of curve) { if (d.tr > t) break; const p = project(path(d.te), camera); pts.push([p.x, 640 - (d.f - 1) * 1400]); }
        red.setAttribute('d', pts.length > 1 ? pathD(pts) : '');
        red.style.opacity = 1 - (endCard ? ramp(t, 177.0, 177.6) * 0.7 : 0);
        if (end) end.style.opacity = ramp(t, 177.2, 177.9);
      },
    };
  };
}

export const sky = skyBuilder(170.2, 172.9);
export const finale = skyBuilder(175.3, 178.8, { endCard: true });

export function globe({ hud }) {
  const { scene, camera } = makeStage({ bg: '#e4e2dc', fov: 30 });
  addLights(scene, { shadow: false, dir: [-8, 6, 10] });
  const W = 4096, H = 2048;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
  const path = geoPath(proj, g);
  g.fillStyle = '#efeae0'; g.fillRect(0, 0, W, H);
  g.beginPath(); path(geoGraticule10()); g.strokeStyle = 'rgba(120,108,90,0.25)'; g.lineWidth = 2; g.stroke();
  const landF = feature(land110, land110.objects.land);
  g.beginPath(); path(landF); g.fillStyle = '#c9c1b0'; g.fill(); g.strokeStyle = '#4a453d'; g.lineWidth = 3; g.stroke();
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const R = 5;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshLambertMaterial({ map: tex }));
  scene.add(earth);
  const halo = new THREE.Mesh(new THREE.RingGeometry(R * 1.0, R * 1.012, 128), new THREE.MeshBasicMaterial({ color: new THREE.Color('#4a453d') }));
  scene.add(halo);
  const ll = (lat, lon, r = R) => { const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)); };
  const tp = ll(TARGET_LL[1], TARGET_LL[0], R * 1.002);
  const svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;inset:0;overflow:visible' }, hud);
  const dot = svgEl('circle', { r: 11, fill: P.red }, svg);
  const rings = [0, 1, 2].map(() => svgEl('circle', { fill: 'none', stroke: P.red, 'stroke-width': 3.5 }, svg));
  const lbl = el('div', 'lbl red', hud, 'HEARING IT'); lbl.style.fontSize = '22px';
  return {
    scene, camera, caption: { y: 1390 },
    update(t) {
      const k = sr(t, 172.6, 175.6, ease.out);
      // face the target, slowly turning
      const n = tp.clone().normalize();
      earth.rotation.y = lerp(0.35, 0, k);
      const tw = tp.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), earth.rotation.y).normalize();
      const dist = lerp(9, 24, k);
      const side = new THREE.Vector3(0, 1, 0).cross(tw).normalize();
      camera.position.copy(tw.clone().multiplyScalar(dist)).add(new THREE.Vector3(0, -2.2 * k, 0)).add(side.multiplyScalar(0));
      camera.lookAt(tw.clone().multiplyScalar(R * (1 - k))); camera.updateMatrixWorld();
      halo.position.set(0, 0, 0); halo.lookAt(camera.position);
      const p = project(tw.clone().multiplyScalar(R * 1.002), camera);
      dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
      rings.forEach((r, i) => { const ph = ((t * 0.7) + i / 3) % 1; r.setAttribute('cx', p.x); r.setAttribute('cy', p.y); r.setAttribute('r', 12 + ph * 110); r.style.opacity = 1 - ph; });
      place(lbl, p.x + 30, p.y - 30, 0, 1); lbl.style.opacity = ramp(t, 173.6, 174.0);
    },
  };
}
