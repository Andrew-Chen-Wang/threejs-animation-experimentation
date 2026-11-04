import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/ibm-plex-mono/700.css';
import '@fontsource/noto-sans-thai/400.css';
import '@fontsource/noto-sans-thai/500.css';
import '@fontsource/noto-sans-thai/600.css';
import '@fontsource/noto-sans-thai/700.css';
import './style.css';
import * as THREE from 'three';
import { BEATS } from './beats.js';
import { CAPTIONS, DURATION } from './captions.js';

const params = new URLSearchParams(location.search);
const RENDER = params.has('render');
if (RENDER) document.body.classList.add('render');

// ---------- fonts first: every printed texture is drawn once, at build time ----------
const faces = ['500 40px Inter', '600 40px Inter', '700 40px Inter', '500 40px "IBM Plex Mono"', '600 40px "IBM Plex Mono"', '700 40px "IBM Plex Mono"',
  '400 40px "Noto Sans Thai"', '500 40px "Noto Sans Thai"', '600 40px "Noto Sans Thai"', '700 40px "Noto Sans Thai"'];
await Promise.all(faces.map((f) => document.fonts.load(f, 'Aa1 ไทย')));

// ---------- renderer + post pass (grain, vignette, slight lens fringe) ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: RENDER });
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
const post = new THREE.ShaderMaterial({
  uniforms: { tex: { value: rt.texture }, time: { value: 0 }, res: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `
    uniform sampler2D tex; uniform float time; uniform vec2 res; varying vec2 vUv;
    vec3 aces(vec3 x){ x *= 0.6; return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main(){
      vec2 d = vUv - 0.5; float r2 = dot(d * vec2(0.5625, 1.0), d * vec2(0.5625, 1.0)) * 3.2;
      vec2 off = d * 0.002;
      vec3 col = vec3(texture2D(tex, vUv + off).r, texture2D(tex, vUv).g, texture2D(tex, vUv - off).b);
      col = aces(col * 1.3);
      col *= mix(1.0, 0.38, smoothstep(0.08, 0.95, r2));
      float g = hash(floor(vUv * res / 1.5) + fract(time * 24.0) * 91.7) - 0.5;
      col += g * 0.03;
      col *= 0.985 + 0.015 * sin(time * 43.0);
      gl_FragColor = linearToOutputTexel(vec4(col, 1.0));
    }`,
  toneMapped: false, depthTest: false, depthWrite: false,
});
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post); const postScene = new THREE.Scene(); postScene.add(quad);
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// ---------- beats ----------
const beats = BEATS.map(([t0, build], i) => ({ t0, t1: BEATS[i + 1]?.[0] ?? Infinity, ...build() }));
const beatAt = (t) => beats.find((b) => t >= b.t0 && t < b.t1) ?? beats[beats.length - 1];

// ---------- layout: a 9:16 frame fitted to the window ----------
const stageEl = document.getElementById('stage'), frameEl = document.getElementById('frame'), capEl = document.getElementById('captions');
let W = 0, H = 0;
function layout() {
  if (RENDER) { W = +(params.get('w') || 1080); H = Math.round(W * 16 / 9); }
  else { const ctl = 52, avail = Math.max(200, innerHeight - ctl - 24); H = Math.min(avail, (innerWidth - 32) * 16 / 9); W = Math.round(H * 9 / 16); H = Math.round(W * 16 / 9); }
  stageEl.style.width = W + 'px'; stageEl.style.height = H + 'px';
  frameEl.style.transform = `scale(${W / 1080})`;
  const dpr = RENDER ? 1 : Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
  rt.setSize(Math.round(W * dpr), Math.round(H * dpr)); post.uniforms.res.value.set(W * dpr, H * dpr);
  for (const b of beats) { b.S.camera.aspect = W / H; b.S.camera.updateProjectionMatrix(); }
}
layout(); addEventListener('resize', layout);

// ---------- captions ----------
let capIdx = -2;
function captions(t) {
  let i = -1; for (let k = 0; k < CAPTIONS.length && CAPTIONS[k][0] <= t; k++) i = k;
  const on = i >= 0 && t < Math.min(CAPTIONS[i + 1]?.[0] ?? Infinity, CAPTIONS[i][0] + 1.4);
  const idx = on ? i : -1;
  if (idx !== capIdx) { capIdx = idx; capEl.innerHTML = idx < 0 ? '' : `<div class="cap">${CAPTIONS[idx][1].replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`; }
}

// ---------- draw one frame at time t ----------
function frame(t) {
  const b = beatAt(t);
  b.update(t); b.S.tick(t);
  renderer.setRenderTarget(rt); renderer.render(b.S.scene, b.S.camera);
  renderer.setRenderTarget(null); post.uniforms.time.value = t; renderer.render(postScene, postCam);
  captions(t);
}

// ---------- playback ----------
const playBtn = document.getElementById('play'), scrub = document.getElementById('scrub'), clock = document.getElementById('clock'), gate = document.getElementById('gate');
scrub.max = DURATION;
let t = Math.min(DURATION, +(params.get('t') || 0)), playing = false, last = 0;
// Narration from the original short. When it is playing it is the clock; past its end (or if it
// fails to load or play) the animation runs on its own clock, so captions and scenes always continue.
const audio = new Audio('./narration.mp3'); audio.preload = 'auto';
let audioOK = false; audio.addEventListener('canplay', () => (audioOK = true), { once: true }); audio.addEventListener('error', () => (audioOK = false));
const muteBtn = document.getElementById('mute');
const setMuted = (m) => { audio.muted = m; muteBtn.textContent = m ? 'Sound off' : 'Sound on'; };
muteBtn.onclick = () => setMuted(!audio.muted);
const syncAudio = () => {
  if (!audioOK) return;
  if (playing && t < audio.duration) { if (Math.abs(audio.currentTime - t) > 0.15) audio.currentTime = t; if (audio.paused) audio.play().catch(() => (audioOK = false)); }
  else if (!audio.paused) audio.pause();
};
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
function setPlaying(p) { playing = p; playBtn.textContent = p ? 'Pause' : 'Play'; last = performance.now(); if (p && t >= DURATION) t = 0; syncAudio(); }
const seek = (nt) => { t = Math.max(0, Math.min(DURATION, nt)); if (audioOK && t < audio.duration) audio.currentTime = t; syncAudio(); };
playBtn.onclick = () => setPlaying(!playing);
document.getElementById('gate-play').onclick = () => { gate.style.display = 'none'; setPlaying(true); };
scrub.oninput = () => seek(+scrub.value);
addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); gate.style.display = 'none'; setPlaying(!playing); }
  if (e.code === 'KeyM') setMuted(!audio.muted);
  if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') seek(t + (e.code === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 10 : 2));
});
function loop(now) {
  if (playing) {
    if (audioOK && !audio.paused && !audio.ended) t = audio.currentTime;
    else t += Math.min(0.1, (now - last) / 1000);
    if (t >= DURATION) { t = DURATION; setPlaying(false); }
  }
  last = now;
  frame(t); scrub.value = t; clock.textContent = fmt(t);
  requestAnimationFrame(loop);
}

if (RENDER) {
  window.__duration = DURATION;
  window.__frame = (tt) => { frame(tt); };
  frame(0); window.__ready = true;
} else {
  // compile every scene up front so the first cut into each beat does not stall
  for (const b of beats) { b.update(b.t0 + 0.01); b.S.tick(b.t0); renderer.compile(b.S.scene, b.S.camera); }
  requestAnimationFrame(loop);
}
