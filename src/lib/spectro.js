import * as THREE from 'three';

const frag = /* glsl */`
precision highp float;
uniform vec4 uWin;          // t0, t1, f0, f1
uniform float uBand, uBandLo, uBandHi, uNoise, uGain, uReveal, uLowCut, uMp3, uVoice, uRW, uHarm, uBins, uContrast, uDim;
uniform vec4 uL[3]; uniform vec3 uLA; uniform vec3 uLWob; uniform vec3 uLC[3];
uniform vec4 uR[8]; uniform float uRA[8]; uniform float uRWob[8];
uniform vec3 uDark, uLight, uRed;
varying vec2 vUv;
float hash(vec2 p){ p = fract(p*vec2(233.34, 851.73)); p += dot(p, p+23.45); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float lineF(vec4 L, float wob, float t){
  return L.w - L.z * tanh(clamp((t - L.x) / L.y, -9.0, 9.0)) + wob * (0.6*sin(t*0.83 + L.x) + 0.4*sin(t*2.1 + 1.3*L.w));
}
void main(){
  float t = mix(uWin.x, uWin.y, vUv.x);
  float f = mix(uWin.z, uWin.w, vUv.y);
  float spanT = uWin.y - uWin.x, spanF = uWin.w - uWin.z;
  vec2 bin = floor(vec2(t * uBins / spanT, f * uBins * 1.6 / spanF));
  float n = hash(bin);
  float gust = 0.3 + 0.7 * smoothstep(0.15, 0.85, vnoise(vec2(t * 0.45, 7.0)));
  float lowBoost = 0.55 + 0.9 * exp(-max(f, 0.0) / 1800.0);
  float I = pow(n, 2.4) * uNoise * gust * lowBoost;
  float bw = max(1.1, spanF * 0.0065);
  vec3 lineAcc = vec3(0.0); float lineI = 0.0;
  for (int i = 0; i < 3; i++) {
    float a = uLA[i]; if (a <= 0.0) continue;
    float fl = lineF(uL[i], uLWob[i], t);
    float env = exp(-pow((t - uL[i].x) / (uL[i].y * 4.0), 2.0));
    float d = (f - fl) / bw;
    float li = exp(-d*d) * (0.65 + 0.7*n);
    float d2 = (f - 2.0*fl) / (bw*1.3);
    li += uHarm * 0.55 * exp(-d2*d2) * (0.6 + 0.8*n);
    float d3 = (f - 3.0*fl) / (bw*1.5);
    li += uHarm * 0.3 * exp(-d3*d3) * (0.6 + 0.8*n);
    li *= a * env;
    lineAcc += uLC[i] * li; lineI += li;
  }
  if (uVoice > 0.0) {
    float p = 118.0 + 22.0*sin(t*2.3) + 11.0*sin(t*5.7+1.0) + 8.0*vnoise(vec2(t*3.0, 1.0));
    float syl = smoothstep(0.38, 0.62, vnoise(vec2(t*4.2, 3.0))) * smoothstep(0.2, 0.5, vnoise(vec2(t*0.9, 9.0)));
    float h = f / p; float dh = abs(fract(h + 0.5) - 0.5) * p;
    float form = 0.25 + exp(-pow((f-550.0)/380.0, 2.0)) + 0.7*exp(-pow((f-1600.0)/700.0, 2.0)) + 0.35*exp(-pow((f-2700.0)/600.0, 2.0));
    float fric = smoothstep(0.7, 0.9, vnoise(vec2(t*6.0, 5.0))) * smoothstep(2500.0, 5000.0, f) * n * 1.4;
    I += uVoice * (syl * exp(-dh*dh/(p*0.06)) * form * exp(-f/5200.0) * 2.4 + fric);
  }
  float att = mix(0.04, 1.0, smoothstep(uLowCut*0.9, uLowCut*1.1, f)) * (1.0 - uBand * (1.0 - smoothstep(uBandLo*0.95, uBandLo*1.05, f) * (1.0 - smoothstep(uBandHi*0.95, uBandHi*1.05, f))) * 0.96);
  I *= att; lineI *= att; lineAcc *= att;
  if (uMp3 > 0.0) {
    vec2 blk = floor(bin / vec2(3.0, 2.0));
    float q = floor(I * 5.0 + hash(blk)*0.6) / 5.0;
    I = mix(I, q * step(0.12, q) + hash(blk + 3.1)*0.05, uMp3);
  }
  I *= uGain; lineI *= uGain; lineAcc *= uGain;
  float c = 1.0 - exp(-I * uContrast);
  vec3 col = mix(uDark, uLight, c);
  if (lineI > 0.0001) col = mix(col, lineAcc / lineI, 1.0 - exp(-lineI * uContrast));
  for (int i = 0; i < 8; i++) {
    float a = uRA[i]; if (a <= 0.0) continue;
    float g = f - lineF(uR[i], uRWob[i], t);
    float px = abs(g) / max(length(vec2(dFdx(g), dFdy(g))), 1e-5);
    col = mix(col, uRed, a * (1.0 - smoothstep(uRW - 1.0, uRW + 1.0, px)));
  }
  if (vUv.x > uReveal) col = uDark;
  col *= uDim;
  gl_FragColor = vec4(col, 1.0);
}`;

export function spectroMaterial(opts = {}) {
  const v4 = () => new THREE.Vector4(0, 1, 0, 100);
  return new THREE.ShaderMaterial({
    uniforms: {
      uWin: { value: new THREE.Vector4(0, 30, 0, 8000) },
      uNoise: { value: 0.5 }, uGain: { value: 1 }, uReveal: { value: 1 }, uLowCut: { value: 0 }, uMp3: { value: 0 }, uVoice: { value: 0 },
      uRW: { value: 2.2 }, uHarm: { value: 1 }, uBins: { value: 110 }, uContrast: { value: 2.2 }, uDim: { value: 1 },
      uL: { value: [v4(), v4(), v4()] }, uLC: { value: [new THREE.Color('#f2ede3'), new THREE.Color('#f2ede3'), new THREE.Color('#f2ede3')] }, uBand: { value: 0 }, uBandLo: { value: 300 }, uBandHi: { value: 3400 }, uLA: { value: new THREE.Vector3() }, uLWob: { value: new THREE.Vector3() },
      uR: { value: Array.from({ length: 8 }, v4) }, uRA: { value: new Array(8).fill(0) }, uRWob: { value: new Array(8).fill(0) },
      uDark: { value: new THREE.Color('#0f0e0d') }, uLight: { value: new THREE.Color('#f2ede3') }, uRed: { value: new THREE.Color('#e04a36') },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: frag,
    ...opts,
  });
}

/** JS mirror of the shader's line function */
export function lineF(L, wob, t) {
  return L[3] - L[2] * Math.tanh((t - L[0]) / L[1]) + wob * (0.6 * Math.sin(t * 0.83 + L[0]) + 0.4 * Math.sin(t * 2.1 + 1.3 * L[3]));
}

/** spectrogram panel mesh of size w x h with helpers to map (t,f) -> world */
export function spectroPanel(w, h, opts) {
  const mat = spectroMaterial(opts);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  const u = mat.uniforms;
  m.userData = {
    u, w, h,
    setWin(t0, t1, f0, f1) { u.uWin.value.set(t0, t1, f0, f1); },
    setLine(i, L, amp, wob = 0, color) { u.uL.value[i].set(...L); u.uLA.value.setComponent(i, amp); u.uLWob.value.setComponent(i, wob); if (color) u.uLC.value[i].set(color); },
    setRed(i, L, a, wob = 0) { u.uR.value[i].set(...L); u.uRA.value[i] = a; u.uRWob.value[i] = wob; },
    toLocal(t, f) { const W = u.uWin.value; return new THREE.Vector3(((t - W.x) / (W.y - W.x) - 0.5) * w, ((f - W.z) / (W.w - W.z) - 0.5) * h, 0); },
    toWorld(t, f) { return m.localToWorld(this.toLocal(t, f)); },
  };
  return m;
}
