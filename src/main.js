import * as THREE from 'three';
import { Post } from './lib/post.js';
import { Captions, END_TIME } from './captions.js';
import { SCENES } from './timeline.js';
import { clamp, el, ease } from './lib/util.js';

const params = new URLSearchParams(location.search);
const RENDER = params.has('render');
if (RENDER) document.body.classList.add('render');

const stage = document.getElementById('stage');
const frame = document.getElementById('frame');
const hudRoot = document.getElementById('hud');
const canvas = document.getElementById('gl');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: RENDER });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0xebe5d8, 1);
const post = new Post(renderer);

function resize() {
  let cssW, cssH;
  if (RENDER) { cssW = +(params.get('w') || 1080); cssH = Math.round(cssW * 16 / 9); }
  else {
    const availH = window.innerHeight - 64, availW = window.innerWidth - 32;
    cssH = Math.min(availH, availW * 16 / 9); cssW = cssH * 9 / 16;
  }
  stage.style.width = cssW + 'px'; stage.style.height = cssH + 'px';
  frame.style.transform = `scale(${cssW / 1080})`;
  const dpr = RENDER ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  const pw = Math.round(cssW * dpr), ph = Math.round(cssH * dpr);
  renderer.setPixelRatio(1); renderer.setSize(pw, ph, false);
  post.setSize(pw, ph);
}
window.addEventListener('resize', resize); resize();

const ctx = { renderer, hudRoot };
const captions = new Captions(document.getElementById('captions'));

let scenes = [];
function buildScenes() { scenes = SCENES.map((def, i) => {
  const hud = el('div', 'scene-hud', hudRoot);
  const inst = def.build({ ...ctx, hud, start: def.start, end: def.end });
  inst.hud = hud; inst.start = def.start; inst.end = def.end; inst.name = def.name;
  inst.trans = def.trans || { dur: 0.6, type: 'dissolve' };
  return inst;
}); }

/** scene weights at time t: returns [primary, secondary|null, mix, type] */
function activeAt(t) {
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i], n = scenes[i + 1];
    if (n) {
      const d = n.trans.dur, a = n.start - d / 2, b = n.start + d / 2;
      if (t >= a && t < b && d > 0) return [s, n, ease.inOut(clamp((t - a) / d)), n.trans.type];
    }
    if (t < s.end || !n) {
      if (t >= s.start || i === 0) return [s, null, 0, null];
    }
  }
  return [scenes[scenes.length - 1], null, 0, null];
}

let shown = new Set();
function renderAt(t) {
  const [a, b, mix] = activeAt(t);
  const type = b ? b.trans.type : null;
  const now = new Set([a, b].filter(Boolean));
  for (const s of shown) if (!now.has(s)) s.hud.style.display = 'none';
  for (const s of now) s.hud.style.display = 'block';
  shown = now;
  a.update(t);
  if (b) b.update(t);
  a.hud.style.opacity = b ? (1 - mix).toFixed(3) : '1';
  if (b) b.hud.style.opacity = mix.toFixed(3);
  post.render(a, b, mix, type, Math.floor(t * 24) % 1000);
  const capScene = b && mix > 0.5 ? b : a;
  captions.update(t, capScene.caption || {});
}

// ---------- playback ----------
const audio = new Audio();
audio.preload = 'auto';
let hasAudio = false;
let playing = false, clockT = +(params.get('t') || 0), lastNow = 0;
const playBtn = document.getElementById('play'), scrub = document.getElementById('scrub'), clockEl = document.getElementById('clock');
scrub.max = END_TIME;

async function probeAudio() {
  for (const src of ['/audio/narration.m4a', '/audio/narration.mp3', '/audio/narration.wav']) {
    try { const r = await fetch(src, { method: 'HEAD' }); if (r.ok && !(r.headers.get('content-type') || '').includes('text/html')) { audio.src = src; hasAudio = true; return; } } catch (e) { /* ignore */ }
  }
}
function curTime() { return hasAudio && playing ? audio.currentTime : clockT; }
function setTime(t) { clockT = clamp(t, 0, END_TIME); if (hasAudio) audio.currentTime = clockT; }
function play() {
  playing = true; playBtn.textContent = 'Pause'; lastNow = performance.now();
  if (hasAudio) { audio.currentTime = clockT; audio.play().catch(() => {}); }
}
function pause() { clockT = curTime(); playing = false; playBtn.textContent = 'Play'; if (hasAudio) audio.pause(); }
playBtn.onclick = () => (playing ? pause() : play());
scrub.oninput = () => { setTime(+scrub.value); };
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
  if (e.code === 'ArrowRight') setTime(curTime() + (e.shiftKey ? 10 : 2));
  if (e.code === 'ArrowLeft') setTime(curTime() - (e.shiftKey ? 10 : 2));
});
audio.addEventListener('ended', () => { pause(); });
const fileIn = document.getElementById('audio-file');
const noteEl = () => document.getElementById('gate-note');
fileIn.addEventListener('change', () => {
  const f = fileIn.files && fileIn.files[0]; if (!f) return;
  const wasPlaying = playing; if (playing) pause();
  audio.src = URL.createObjectURL(f); hasAudio = true;
  audio.currentTime = clockT;
  if (noteEl()) noteEl().textContent = `Narration loaded: ${f.name}`;
  if (wasPlaying) play();
});

function loop(now) {
  if (playing && !hasAudio) { clockT += (now - lastNow) / 1000; if (clockT >= END_TIME) { clockT = END_TIME; pause(); } }
  lastNow = now;
  const t = curTime();
  if (playing) clockT = t;
  scrub.value = t;
  clockEl.textContent = `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
  renderAt(t);
  requestAnimationFrame(loop);
}

const ready = (async () => {
  await Promise.all(["700 40px 'Old Standard TT'", "italic 400 40px 'Old Standard TT'", "500 20px 'IBM Plex Mono'", "600 20px 'IBM Plex Mono'"].map((f) => document.fonts.load(f).catch(() => {})));
  await document.fonts.ready;
  buildScenes();
  // compile all shaders up-front so playback doesn't hitch
  for (const s of scenes) { s.update(s.start + 0.01); renderer.compile(s.scene, s.camera); }
  if (!RENDER) await probeAudio();
})();

if (RENDER) {
  window.__ready = ready.then(() => { renderAt(0); return true; });
  window.__frame = (t) => { renderAt(t); return true; };
  window.__duration = END_TIME;
} else {
  ready.then(() => {
    const gate = document.getElementById('gate');
    document.getElementById('gate-note').innerHTML = hasAudio ? 'Narration loaded. Space = play/pause, ←/→ = seek.'
      : 'Plays silently with captions. Load the reel\'s audio (or video) file above to hear the narration in sync.';
    document.getElementById('gate-play').onclick = () => { gate.style.display = 'none'; play(); };
    if (params.has('t')) setTime(clockT);
    requestAnimationFrame(loop);
  });
}
