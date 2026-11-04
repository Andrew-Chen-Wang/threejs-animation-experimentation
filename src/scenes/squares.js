import * as THREE from 'three';
import { makeStage } from '../lib/stage.js';
import { buildUSMap, toW, TARGET, S as AS } from '../lib/usmap.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, fmt } from '../lib/util.js';

// world units = kilometres. One square = 0.1 km.
const frag = /* glsl */`
precision highp float;
varying vec2 vW;
uniform float uPx;   // km per pixel
uniform vec3 uPaper, uInk, uA, uB;
float hash(vec2 p){ p = fract(p*vec2(233.34, 851.73)); p += dot(p, p+23.45); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float grid(vec2 w, float s, float widthPx){
  vec2 g = abs(fract(w / s + 0.5) - 0.5) * s / uPx;
  float d = min(g.x, g.y);
  return 1.0 - smoothstep(widthPx - 0.5, widthPx + 0.5, d);
}
void main(){
  vec2 w = vW;
  // field patches (quarter-mile-ish) that fade as they get too small to see
  vec2 cell = floor(w / 0.4);
  float h = hash(cell);
  float detail = 1.0 - smoothstep(0.004, 0.02, uPx);
  vec3 col = mix(uPaper, mix(uA, uB, h), detail * 0.9);
  float furrow = abs(fract(dot(w, h > 0.5 ? vec2(1.0, 0.0) : vec2(0.0, 1.0)) / 0.025) - 0.5);
  col = mix(col, col * 0.93, detail * (1.0 - smoothstep(0.0, 0.08, furrow)) * step(0.3, h));
  // multi-scale grid: 100 m, 1 km, 10 km, 100 km
  float a = 0.0;
  for (int i = 0; i < 4; i++) {
    float s = 0.1 * pow(10.0, float(i));
    float spacingPx = s / uPx;
    float vis = smoothstep(3.0, 14.0, spacingPx) * (1.0 - smoothstep(600.0, 2400.0, spacingPx));
    a = max(a, grid(w, s, 0.6 + float(i) * 0.25) * vis * (0.35 + 0.1 * float(i)));
  }
  col = mix(col, uInk, a);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

export default function build({ hud }) {
  const { scene, camera } = makeStage({ bg: P.paper, fov: 30 });
  const gm = new THREE.ShaderMaterial({
    uniforms: { uPx: { value: 0.001 }, uPaper: { value: new THREE.Color(P.paper) }, uInk: { value: new THREE.Color('#3a352e') }, uA: { value: new THREE.Color('#e3dccb') }, uB: { value: new THREE.Color('#d2c9b4') } },
    vertexShader: 'varying vec2 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: frag,
  });
  const g = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), gm); g.rotation.x = -Math.PI / 2; scene.add(g);
  // the US, scaled to km, target at origin
  const map = buildUSMap(); map.dots.mesh.visible = false; map.tracks.visible = false; map.planes.visible = false;
  const kmPerUnit = 4.73 / AS;
  const [tx, tz] = toW(...TARGET);
  map.group.scale.setScalar(kmPerUnit); map.group.position.set(-tx * kmPerUnit, 0.5, -tz * kmPerUnit);
  scene.add(map.group);
  const landMat = map.land.material, shMat = map.shadow.material;
  // the square
  const sq = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.red), transparent: true, opacity: 0.25, depthWrite: false }));
  sq.rotation.x = -Math.PI / 2; sq.position.y = 0.002; scene.add(sq);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.1, 0.1)), new THREE.LineBasicMaterial({ color: new THREE.Color(P.red) }));
  edge.rotation.x = -Math.PI / 2; edge.position.y = 0.003; scene.add(edge);
  // a football pitch for scale (105 m x 68 m)
  const fp = []; const hx = 0.0475, hz = 0.031;
  const seg = (a, b, c, d) => fp.push(a, 0.004, b, c, 0.004, d);
  seg(-hx, -hz, hx, -hz); seg(hx, -hz, hx, hz); seg(hx, hz, -hx, hz); seg(-hx, hz, -hx, -hz); seg(0, -hz, 0, hz);
  for (let i = 0; i < 32; i++) { const a0 = i / 32 * Math.PI * 2, a1 = (i + 1) / 32 * Math.PI * 2; seg(Math.cos(a0) * 0.009, Math.sin(a0) * 0.009, Math.cos(a1) * 0.009, Math.sin(a1) * 0.009); }
  seg(-hx, -0.02, -hx + 0.0165, -0.02); seg(-hx + 0.0165, -0.02, -hx + 0.0165, 0.02); seg(-hx + 0.0165, 0.02, -hx, 0.02);
  seg(hx, -0.02, hx - 0.0165, -0.02); seg(hx - 0.0165, -0.02, hx - 0.0165, 0.02); seg(hx - 0.0165, 0.02, hx, 0.02);
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
  const pitch = new THREE.LineSegments(fg, new THREE.LineBasicMaterial({ color: new THREE.Color('#23201c'), transparent: true })); scene.add(pitch);
  const pitchL = el('div', 'lbl', hud, '≈ ONE FOOTBALL FIELD'); pitchL.style.fontSize = '22px';
  const dot = el('div', '', hud); Object.assign(dot.style, { position: 'absolute', width: '22px', height: '22px', borderRadius: '50%', background: P.red, boxShadow: '0 0 0 6px rgba(194,58,44,.25)' });
  const big = el('div', 'big-num', hud, ''); big.style.fontSize = '88px';
  const unit = el('div', 'lbl', hud, 'SQUARES, 100 M WIDE'); unit.style.fontSize = '22px';
  const dim = el('div', 'lbl red', hud, '100 M'); dim.style.fontSize = '24px';
  return {
    scene, camera, caption: { y: 1390 },
    update(t) {
      const out = sr(t, 132.7, 135.2, ease.expoInOut), back = sr(t, 135.6, 137.6, ease.expoInOut);
      const z = out * (1 - back);
      const viewH = Math.exp(lerp(Math.log(0.42), Math.log(5200), z)) * lerp(1.15, 1, sr(t, 130, 132.7));   // km of visible height
      const h = viewH / (2 * Math.tan(THREE.MathUtils.degToRad(15)));
      camera.near = h * 0.05; camera.far = h * 4; camera.updateProjectionMatrix();
      camera.position.set(0, h, h * 0.08); camera.lookAt(0, 0, -viewH * 0.07); camera.updateMatrixWorld();
      gm.uniforms.uPx.value = viewH / 1920;
      const usA = ramp(z, 0.55, 0.85);
      landMat.opacity = usA; shMat.opacity = usA; map.group.visible = usA > 0.001;
      const px = 0.1 / (viewH / 1920);
      const p = project(new THREE.Vector3(0, 0, 0), camera);
      place(dot, p.x, p.y, 0.5, 0.5, `scale(${px < 14 ? 1 : 0})`);
      const visKm2 = viewH * viewH * 9 / 16;
      const n = Math.min(765000000, Math.max(1, visKm2 / 0.01));
      big.textContent = fmt(t > 135.4 ? 765000000 : n);
      place(big, 540, 300, 0.5, 0); big.style.opacity = ramp(t, 132.8, 133.2) * (1 - ramp(t, 136.6, 137.0));
      place(unit, 540, 410, 0.5, 0); unit.style.opacity = big.style.opacity;
      const q = project(new THREE.Vector3(0.05, 0, -0.05), camera);
      place(dim, q.x + 16, q.y, 0, 0.5); dim.style.opacity = ramp(t, 130.6, 131.0) * (1 - ramp(t, 132.6, 132.9)) + ramp(t, 137.3, 137.7);
      sq.material.opacity = 0.25 + 0.2 * Math.sin(t * 5) * ramp(t, 136.5, 137);
      const pa = ramp(t, 131.2, 131.6) * (1 - ramp(t, 132.6, 132.9)); pitch.material.opacity = pa;
      const pq = project(new THREE.Vector3(0, 0, 0.05), camera); place(pitchL, pq.x, pq.y + 24, 0.5, 0); pitchL.style.opacity = pa;
    },
  };
}
