import * as THREE from 'three';

const vert = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const frag = /* glsl */`
precision highp float;
uniform sampler2D tA; uniform sampler2D tB;
uniform float uMix; uniform float uSeed; uniform vec2 uRes; uniform float uType; uniform float uGrain;
varying vec2 vUv;
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*vnoise(p); p*=2.03; a*=.5; } return s; }
void main(){
  vec2 uv = vUv;
  vec3 col;
  if (uMix <= 0.0) col = texture2D(tA, uv).rgb;
  else if (uMix >= 1.0) col = texture2D(tB, uv).rgb;
  else {
    if (uType < 0.5) {
      // ink-bleed dissolve
      float n = fbm(uv*vec2(5.0, 8.9) + 3.1) * 0.75 + fbm(uv*40.0)*0.25;
      float soft = 0.12;
      float e = uMix*(1.0+soft) - soft;
      float m = smoothstep(e, e+soft, n);
      vec2 za = (uv-.5)*(1.0 - uMix*0.03)+.5; vec2 zb = (uv-.5)*(1.0 + (1.0-uMix)*0.03)+.5;
      col = mix(texture2D(tB, zb).rgb, texture2D(tA, za).rgb, m);
    } else {
      // vertical paper slide
      float e = uMix;
      vec2 ua = uv + vec2(0.0, e); vec2 ub = uv - vec2(0.0, 1.0 - e);
      col = uv.y < 1.0 - e ? texture2D(tA, ua).rgb : texture2D(tB, ub).rgb;
      float edge = abs(uv.y - (1.0 - e));
      col *= 1.0 - 0.18*exp(-edge*60.0);
    }
  }
  // paper fibres (static) + film grain (per-frame)
  vec2 px = uv * uRes;
  float fib = fbm(px/vec2(260.0, 90.0)) - 0.5;
  float speck = fbm(px/6.0) - 0.5;
  col *= 1.0 + fib*0.05 + speck*0.035;
  float g = hash(px + uSeed*17.13) - 0.5;
  col += g * uGrain;
  // soft vignette
  vec2 q = (uv - 0.5) * vec2(1.0, 1.25);
  col *= mix(1.0, 0.9, smoothstep(0.35, 0.95, length(q)));
  gl_FragColor = vec4(max(col, 0.0), 1.0);
  #include <colorspace_fragment>
}`;

export class Post {
  constructor(renderer) {
    this.renderer = renderer;
    const opts = { type: THREE.HalfFloatType, samples: 4, colorSpace: THREE.LinearSRGBColorSpace };
    this.rtA = new THREE.WebGLRenderTarget(4, 4, opts);
    this.rtB = new THREE.WebGLRenderTarget(4, 4, opts);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { tA: { value: null }, tB: { value: null }, uMix: { value: 0 }, uSeed: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uType: { value: 0 }, uGrain: { value: 0.028 } },
      vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat);
    this.scene = new THREE.Scene(); this.scene.add(this.quad);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  setSize(w, h) { this.rtA.setSize(w, h); this.rtB.setSize(w, h); this.mat.uniforms.uRes.value.set(w, h); }
  render(a, b, mix, type, seed) {
    const r = this.renderer;
    r.setRenderTarget(this.rtA); r.clear(); r.render(a.scene, a.camera);
    if (b) { r.setRenderTarget(this.rtB); r.clear(); r.render(b.scene, b.camera); }
    r.setRenderTarget(null);
    const u = this.mat.uniforms;
    u.tA.value = this.rtA.texture; u.tB.value = b ? this.rtB.texture : this.rtA.texture;
    u.uMix.value = b ? mix : 0; u.uType.value = type === 'slide' ? 1 : 0; u.uSeed.value = seed;
    r.render(this.scene, this.cam);
  }
}
