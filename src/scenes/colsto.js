import * as THREE from 'three';
import { buildDesk, canvasCard } from '../lib/desk.js';
import { P } from '../lib/palette.js';
import { sr, ramp, ease, el, place, project, lerp, rng, fmt } from '../lib/util.js';
import { mesh, lam } from '../lib/objects.js';

function specThumb(g, x, y, w, h, seed = 1) {
  const r = rng(seed); g.fillStyle = '#121110'; g.fillRect(x, y, w, h);
  for (let i = 0; i < 2600; i++) { const a = r(); g.fillStyle = `rgba(240,235,225,${Math.pow(a, 3) * 0.7})`; g.fillRect(x + r() * w, y + r() * h, 2, 2); }
  g.strokeStyle = 'rgba(245,240,230,0.9)'; g.lineWidth = 3;
  for (let k = 0; k < 3; k++) { g.beginPath(); for (let i = 0; i <= 60; i++) { const u = i / 60; const yy = y + h * (0.35 + k * 0.17) + Math.tanh((u - 0.5) * 7) * h * 0.08; i ? g.lineTo(x + u * w, yy) : g.moveTo(x + u * w, yy); } g.stroke(); }
}
export default function build({ hud }) {
  const { scene, camera } = buildDesk();
  const name = canvasCard(7, 3.6, 150, (g, W, H) => {
    specThumb(g, 40, 40, 330, H - 80, 3);
    g.fillStyle = P.ink; g.font = '700 110px "Old Standard TT"'; g.fillText('colsto', 420, 170);
    g.font = '600 34px "IBM Plex Mono"'; g.fillStyle = '#6d665a'; g.fillText('ON YOUTUBE', 424, 230);
    g.font = 'italic 400 40px "Old Standard TT"'; g.fillStyle = '#3a352e';
    ['"I discovered a sound that', 'leaks your exact location', '(and it\'s everywhere)"'].forEach((s, i) => g.fillText(s, 424, 330 + i * 50));
  });
  name.position.set(-1.6, 0, -2.6); name.rotation.y = 0.04; scene.add(name);
  const clip = canvasCard(3.6, 3.0, 150, (g, W, H) => {
    g.fillStyle = '#141311'; g.fillRect(24, 24, W - 48, H - 110);
    g.fillStyle = '#d9d3c7'; g.fillRect(24, 90, W - 48, H - 176);
    g.fillStyle = '#8f897e'; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(40 + i * 45, H - 130 - (i % 3) * 18, 34 + (i % 4) * 6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#efe9dd'; g.font = '500 20px "IBM Plex Mono"'; g.fillText('CAM 01', 40, 60); g.fillStyle = '#e0402e'; g.fillText('● REC', W - 130, 60);
    g.fillStyle = '#4a453d'; g.font = '600 24px "IBM Plex Mono"'; g.fillText('REAL CLIP', 30, H - 40);
  });
  clip.position.set(3.4, 0, 0.9); clip.rotation.y = -0.12; scene.add(clip);
  const sheets = [];
  for (let s = 0; s < 6; s++) {
    const sh = canvasCard(4.2, 5.6, 110, (g, W, H) => {
      const r = rng(s + 30);
      if (s === 5) { g.fillStyle = P.ink; g.font = '600 40px "IBM Plex Mono"'; g.fillText('5,000+ LINES', 40, 80); g.font = '500 24px "IBM Plex Mono"'; g.fillStyle = '#6d665a'; g.fillText('MONTHS OF WORK', 40, 118); }
      let y = s === 5 ? 170 : 50;
      g.font = '500 17px "IBM Plex Mono"';
      const toks = ['def', 'for', 'return', 'doppler(', 'np.', 'adsb', 'heard_line', 'c_sound', 'delay', 'score', 'grid[', 'fit('];
      while (y < H - 40) { const ind = Math.floor(r() * 3) * 26; let x = 40 + ind; const n = 2 + Math.floor(r() * 5);
        for (let k = 0; k < n && x < W - 60; k++) { const w = 30 + r() * 110; if (r() < 0.25) { g.fillStyle = '#4a453d'; g.fillText(toks[Math.floor(r() * toks.length)], x, y); x += 130; } else { g.fillStyle = r() < 0.15 ? 'rgba(194,58,44,.55)' : 'rgba(80,72,60,.35)'; g.fillRect(x, y - 12, w, 12); x += w + 14; } }
        y += 30; }
    });
    sh.position.set(-0.4 + s * 0.08, s * 0.035, 5.8 - s * 0.05); sh.rotation.y = (s - 3) * 0.035; scene.add(sh); sheets.push(sh);
  }
  const big = el('div', 'big-num', hud, ''); big.style.fontSize = '76px'; big.style.color = P.ink;
  const stamp = el('div', 'stamp', hud, 'NOT RELEASED'); stamp.style.fontSize = '48px';
  return {
    scene, camera, caption: { y: 1430 },
    update(t) {
      const d1 = ease.out(ramp(t, 158.9, 159.7)); name.position.y = (1 - d1) * 4; name.rotation.z = (1 - d1) * 0.2;
      const d2 = ease.out(ramp(t, 161.3, 162.1)); clip.position.y = (1 - d2) * 4; clip.visible = d2 > 0;
      sheets.forEach((sh, i) => { const d = ease.out(ramp(t, 164.8 + i * 0.12, 165.4 + i * 0.12)); sh.position.y = i * 0.035 + (1 - d) * 5; sh.visible = d > 0; });
      const pan = sr(t, 164.4, 165.8, ease.inOut);
      const look = new THREE.Vector3(lerp(-0.6, -0.2, pan), 0, lerp(-1.0, 4.6, pan));
      camera.position.set(look.x + Math.sin(t * 0.2) * 0.4, lerp(17, 14, pan), look.z + 6.5); camera.lookAt(look); camera.updateMatrixWorld();
      const p = project(new THREE.Vector3(-0.2, 0.3, 2.3), camera);
      big.textContent = fmt(5000 * sr(t, 165.6, 167.4, ease.out)) + ' LINES';
      place(big, 540, 250, 0.5, 0); big.style.opacity = ramp(t, 165.6, 165.9);
      const st = ramp(t, 168.45, 168.65);
      const sp = project(new THREE.Vector3(0.3, 0.3, 5.6), camera);
      place(stamp, sp.x, sp.y, 0.5, 0.5, `rotate(-10deg) scale(${lerp(2.4, 1, ease.out(st))})`); stamp.style.opacity = st;
    },
  };
}
