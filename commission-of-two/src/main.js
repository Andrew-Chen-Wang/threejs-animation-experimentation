import * as THREE from 'three';
import { Post } from './post.js';
import { Captions, END_TIME } from './captions.js';
import { SHOTS } from './timeline.js';
import { clamp, el } from './kit.js';

const params = new URLSearchParams(location.search);
const RENDER = params.has('render');
if (RENDER) document.body.classList.add('render');

const stage = document.getElementById('stage');
const frame = document.getElementById('frame');
const hudRoot = document.getElementById('hud');
const creditEl = document.getElementById('credit');
const canvas = document.getElementById('gl');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: RENDER });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

const captions = new Captions(document.getElementById('word'));
let shots = [];
function build() {
  shots = SHOTS.map((def) => {
    const hud = el('div', 'scene-hud', hudRoot); hud.style.display = 'none';
    const inst = def.build({ hud, start: def.start, end: def.end, ...(def.opts || {}) });
    return Object.assign(inst, { hud, start: def.start, end: def.end, name: def.name });
  });
}
function shotAt(t) { for (let i = shots.length - 1; i >= 0; i--) if (t >= shots[i].start) return shots[i]; return shots[0]; }

let shown = null;
function renderAt(t) {
  const s = shotAt(t);
  if (shown !== s) { if (shown) shown.hud.style.display = 'none'; s.hud.style.display = 'block'; shown = s; }
  s.update(t - s.start, t);
  const since = t - s.start;
  const cut = s.start > 0 && since < 0.22 && !s.softCut ? (1 - since / 0.22) : 0;
  post.render(s, Math.floor(t * 24) % 997, cut);
  const credit = s.credit || '';
  if (creditEl.textContent !== credit) creditEl.textContent = credit;
  captions.update(t);
}

// ---------- playback ----------
const audio = new Audio(); audio.preload = 'auto';
let hasAudio = false, playing = false, clockT = +(params.get('t') || 0), lastNow = 0;
const playBtn = document.getElementById('play'), scrub = document.getElementById('scrub'), clockEl = document.getElementById('clock');
scrub.max = END_TIME;
async function probeAudio() {
  for (const src of ['audio/narration.m4a', 'audio/narration.mp3']) {
    try { const r = await fetch(src, { method: 'HEAD' }); if (r.ok && !(r.headers.get('content-type') || '').includes('text/html')) { audio.src = src; hasAudio = true; return; } } catch (e) { /* none */ }
  }
}
const curTime = () => (hasAudio && playing ? audio.currentTime : clockT);
function setTime(t) { clockT = clamp(t, 0, END_TIME); if (hasAudio) audio.currentTime = clockT; }
function play() { playing = true; playBtn.textContent = 'Pause'; lastNow = performance.now(); if (hasAudio) { audio.currentTime = clockT; audio.play().catch(() => {}); } }
function pause() { clockT = curTime(); playing = false; playBtn.textContent = 'Play'; if (hasAudio) audio.pause(); }
playBtn.onclick = () => (playing ? pause() : play());
scrub.oninput = () => setTime(+scrub.value);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
  if (e.code === 'ArrowRight') setTime(curTime() + (e.shiftKey ? 10 : 2));
  if (e.code === 'ArrowLeft') setTime(curTime() - (e.shiftKey ? 10 : 2));
});
audio.addEventListener('ended', pause);
const fileIn = document.getElementById('audio-file');
fileIn.addEventListener('change', () => {
  const f = fileIn.files && fileIn.files[0]; if (!f) return;
  const was = playing; if (playing) pause();
  audio.src = URL.createObjectURL(f); hasAudio = true; audio.currentTime = clockT;
  document.getElementById('gate-note').textContent = `Narration loaded: ${f.name}`;
  if (was) play();
});
function loop(now) {
  if (playing && !hasAudio) { clockT += (now - lastNow) / 1000; if (clockT >= END_TIME) { clockT = END_TIME; pause(); } }
  lastNow = now;
  const t = curTime(); if (playing) clockT = t;
  scrub.value = t;
  clockEl.textContent = `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
  renderAt(t);
  requestAnimationFrame(loop);
}

const ready = (async () => {
  await Promise.all(["25px 'Silkscreen'", "700 25px 'Silkscreen'", "800 48px 'Inter'", "500 33px 'Inter'", "700 30px 'Noto Serif SC'", "500 30px 'Noto Serif SC'", "700 30px 'Noto Sans SC'"]
    .map((f) => document.fonts.load(f, '中国ABC').catch(() => {})));
  await document.fonts.ready;
  build();
  for (const s of shots) { s.update(0.01, s.start + 0.01); renderer.compile(s.scene, s.camera); }
  if (!RENDER) await probeAudio();
})();

if (RENDER) {
  window.__ready = ready.then(() => { renderAt(0); return true; });
  window.__frame = (t) => { renderAt(t); return true; };
  window.__duration = END_TIME;
} else {
  ready.then(() => {
    const gate = document.getElementById('gate');
    document.getElementById('gate-note').textContent = hasAudio ? 'Narration loaded. Space = play/pause, ←/→ = seek.'
      : 'Plays silently with captions. Load the short\'s audio (or video) file to hear the narration in sync.';
    document.getElementById('gate-play').onclick = () => { gate.style.display = 'none'; play(); };
    if (params.has('t')) setTime(clockT);
    requestAnimationFrame(loop);
  });
}
