import * as THREE from 'three';

// Tilt-shift blur (sharp band at uFocus.x, half-width uFocus.y), monochrome grade that keeps red,
// a faint halftone screen, grain, and torn-band glitch on cuts. The rounded CRT frame is a CSS overlay.
const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const frag = `
precision highp float;
uniform sampler2D tA; uniform float uSeed; uniform vec2 uRes; uniform float uCut; uniform vec3 uFocus; uniform float uDim;
varying vec2 vUv;
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
vec3 tap(vec2 uv){ return texture2D(tA, clamp(uv, vec2(0.001), vec2(0.999))).rgb; }
void main(){
  vec2 uv = vUv;
  float k = uRes.x / 1080.0;
  if (uCut > 0.0) {
    float band = floor(uv.y * 30.0 + uSeed * 7.0);
    if (hash(vec2(band, uSeed)) > 0.6) uv.x += (hash(vec2(band, uSeed + 3.0)) - 0.5) * 0.14 * uCut;
  }
  float d = abs(uv.y - uFocus.x);
  float rad = 2.2 * uFocus.z * smoothstep(uFocus.y, uFocus.y + 0.32, d) * k;
  vec3 c = tap(uv);
  if (rad > 0.5) {
    vec3 acc = c; float wsum = 1.0;
    float ang = hash(uv * uRes) * 6.2831;
    for (int i = 1; i <= 24; i++) {
      float fi = float(i);
      float rr = sqrt(fi / 24.0) * rad;
      float a = ang + fi * 2.39996;
      acc += tap(uv + vec2(cos(a), sin(a)) * rr / uRes); wsum += 1.0;
    }
    c = acc / wsum;
  }
  if (uCut > 0.0) { c.r = mix(c.r, tap(uv + vec2(0.01*uCut, 0.0)).r, 0.8); c.b = mix(c.b, tap(uv - vec2(0.01*uCut, 0.0)).b, 0.8); }
  float L = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float redness = c.r - max(c.g, c.b);
  float keep = smoothstep(0.05, 0.18, redness);
  float g = pow(clamp(L, 0.0, 1.0), 1.0/2.2);
  g = mix(0.06, 0.93, g); // milky blacks, soft whites
  // fine halftone
  vec2 px = vUv * uRes / k;
  mat2 R = mat2(0.7071, -0.7071, 0.7071, 0.7071);
  vec2 f = fract(R * px / 3.6) - 0.5;
  float rdot = sqrt(clamp(1.0 - g, 0.0, 1.0)) * 0.6;
  float ht = smoothstep(rdot - 0.15, rdot + 0.15, length(f));
  float mono = mix(g, g * (0.8 + 0.25 * ht), 0.6);
  vec3 grey = vec3(mono) * vec3(1.0, 0.99, 0.975);
  vec3 redc = vec3(0.86, 0.27, 0.19) * (0.62 + 0.5 * g);
  vec3 col = mix(grey, redc, keep);
  col += (hash(vUv * uRes + uSeed * 13.1) - 0.5) * 0.06;
  col *= uDim;
  col += vec3(uCut * 0.1);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

export class Post {
  constructor(renderer) {
    this.renderer = renderer;
    this.rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4, colorSpace: THREE.LinearSRGBColorSpace });
    this.mat = new THREE.ShaderMaterial({
      uniforms: { tA: { value: null }, uSeed: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uCut: { value: 0 },
        uFocus: { value: new THREE.Vector3(0.5, 0.15, 10) }, uDim: { value: 1 } },
      vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false,
    });
    this.scene = new THREE.Scene(); this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat));
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  setSize(w, h) { this.rt.setSize(w, h); this.mat.uniforms.uRes.value.set(w, h); }
  render(s, seed, cut) {
    const r = this.renderer;
    r.setRenderTarget(this.rt); r.setClearColor(s.clear ?? 0xdcdcda, 1); r.clear(); r.render(s.scene, s.camera);
    r.setRenderTarget(null);
    const u = this.mat.uniforms;
    u.tA.value = this.rt.texture; u.uSeed.value = seed; u.uCut.value = cut;
    const f = s.focus || [0.5, 0.18, 9]; u.uFocus.value.set(f[0], f[1], f[2]); u.uDim.value = s.dim ?? 1;
    r.render(this.scene, this.cam);
  }
}
