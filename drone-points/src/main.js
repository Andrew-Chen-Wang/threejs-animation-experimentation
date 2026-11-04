import * as THREE from 'three';
import { buildWorld } from './world.js';
import { buildBoard } from './board.js';
import { Captions, END_TIME } from './captions.js';
import { clamp, project } from '../../src/lib/util.js';
import './style.css';

const params = new URLSearchParams(location.search);
const RENDER = params.has('render');
if (RENDER) document.body.classList.add('render');

const stage = document.getElementById('stage');
const frame = document.getElementById('frame');
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
  renderer.setPixelRatio(1); renderer.setSize(Math.round(cssW * dpr), Math.round(cssH * dpr), false);
}
window.addEventListener('resize', resize); resize();

const world = buildWorld();
let board = null;
const captions = new Captions(document.getElementById('captions'));
const turretTop = new THREE.Vector3();

/** render the world at time t from its own camera into a JPEG, for the "video" thumbnails on cards */
function snapshot(t, w, h) {
  world.update(t);
  const cam = world.camera.clone(); cam.aspect = w / h; cam.updateProjectionMatrix();
  const rt = new THREE.WebGLRenderTarget(w, h, { colorSpace: THREE.SRGBColorSpace, samples: 4 });
  renderer.setRenderTarget(rt); renderer.render(world.scene, cam); renderer.setRenderTarget(null);
  const px = new Uint8Array(w * h * 4); renderer.readRenderTargetPixels(rt, 0, 0, w, h, px); rt.dispose();
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) img.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
  g.putImageData(img, 0, 0);
  return cv.toDataURL('image/jpeg', 0.88);
}

function renderAt(t) {
  world.update(t);
  renderer.render(world.scene, world.camera);
  world.tank.userData.turret.getWorldPosition(turretTop); turretTop.y += 0.5;
  board.update(t, project(turretTop, world.camera));
  captions.update(t);
}

// ---------- playback ----------
const audio = new Audio(); audio.preload = 'auto';
let hasAudio = false, playing = false, clockT = +(params.get('t') || 0), lastNow = 0;
const playBtn = document.getElementById('play'), scrub = document.getElementById('scrub'), clockEl = document.getElementById('clock');
scrub.max = END_TIME;
async function probeAudio() {
  try { const r = await fetch('audio/narration.m4a', { method: 'HEAD' }); if (r.ok && !(r.headers.get('content-type') || '').includes('text/html')) { audio.src = 'audio/narration.m4a'; hasAudio = true; } } catch (e) { /* silent mode */ }
}
const curTime = () => (hasAudio && playing ? audio.currentTime : clockT);
function setTime(t) { clockT = clamp(t, 0, END_TIME); if (hasAudio) audio.currentTime = clockT; }
function play() {
  if (clockT >= END_TIME - 0.05) setTime(0);
  playing = true; playBtn.textContent = 'Pause'; lastNow = performance.now();
  if (hasAudio) { audio.currentTime = clockT; audio.play().catch(() => {}); }
}
function pause() { clockT = curTime(); playing = false; playBtn.textContent = 'Play'; if (hasAudio) audio.pause(); }
playBtn.onclick = () => (playing ? pause() : play());
scrub.oninput = () => setTime(+scrub.value);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
  if (e.code === 'ArrowRight') setTime(curTime() + (e.shiftKey ? 10 : 2));
  if (e.code === 'ArrowLeft') setTime(curTime() - (e.shiftKey ? 10 : 2));
});
audio.addEventListener('ended', pause);

function loop(now) {
  if (playing && !hasAudio) { clockT += (now - lastNow) / 1000; if (clockT >= END_TIME) { clockT = END_TIME; pause(); } }
  lastNow = now;
  const t = curTime(); if (playing) clockT = t;
  if (playing && t >= END_TIME) pause();
  scrub.value = t;
  clockEl.textContent = `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
  renderAt(Math.min(t, END_TIME));
  requestAnimationFrame(loop);
}

const ready = (async () => {
  await Promise.all(["700 40px 'Old Standard TT'", "italic 400 40px 'Old Standard TT'", "500 20px 'IBM Plex Mono'"].map((f) => document.fonts.load(f).catch(() => {})));
  await document.fonts.ready;
  const img = { fpv: snapshot(1.9, 360, 480), iso: snapshot(7.5, 480, 420) };
  board = buildBoard(frame, img);
  renderer.compile(world.scene, world.camera);
  if (!RENDER) await probeAudio();
})();

if (RENDER) {
  window.__ready = ready.then(() => { renderAt(0); return true; });
  window.__frame = (t) => { renderAt(t); return true; };
  window.__duration = END_TIME;
} else {
  ready.then(() => {
    const gate = document.getElementById('gate');
    document.getElementById('gate-note').textContent = hasAudio ? 'Narration loaded. Space = play/pause, ←/→ = seek.' : 'No narration file found: plays silently with captions.';
    document.getElementById('gate-play').onclick = () => { gate.style.display = 'none'; play(); };
    if (params.has('t')) setTime(clockT);
    requestAnimationFrame(loop);
  });
}
