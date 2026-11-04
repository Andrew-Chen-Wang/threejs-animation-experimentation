// Offline render to MP4: drives the page frame-by-frame in headless Chromium and pipes PNGs into ffmpeg.
// Usage:  npx vite --port 5173 &   (options: --w, --fps, --from, --to, --crf)
//         node scripts/render.mjs [out.mp4] [--w 1080] [--fps 30] [--from 0] [--to 178.8] [--audio <file>|none]
// Set GPU=1 to use the machine's GPU instead of SwiftShader.
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = args[0] && !args[0].startsWith('--') ? args[0] : 'out/render.mp4';
const W = +opt('w', 1080), FPS = +opt('fps', 30), FROM = +opt('from', 0), CRF = opt('crf', '17');
const H = Math.round(W * 16 / 9);
mkdirSync(dirname(out), { recursive: true });

const gl = process.env.GPU ? [] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const browser = await chromium.launch({ args: [...gl, '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
await page.goto(`http://localhost:${process.env.PORT || 5173}/?render&w=${W}`);
await page.waitForFunction(() => window.__ready, null, { timeout: 180000 });
await page.evaluate(() => window.__ready);
const TO = +opt('to', await page.evaluate(() => window.__duration));

const audioOpt = opt('audio', '');
const audio = audioOpt === 'none' ? undefined : audioOpt ? audioOpt : ['public/audio/narration.m4a', 'public/audio/narration.mp3', 'public/audio/narration.wav'].find(existsSync);
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  ...(audio ? ['-ss', String(FROM), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '160k', '-shortest'] : []),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', CRF, '-preset', 'slow', '-movflags', '+faststart', out],
  { stdio: ['pipe', 'inherit', 'inherit'] });

const n = Math.ceil((TO - FROM) * FPS); const t0 = Date.now();
for (let i = 0; i < n; i++) {
  await page.evaluate((t) => window.__frame(t), FROM + i / FPS);
  const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 30 === 0) process.stdout.write(`\rframe ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s elapsed`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
console.log(`\nwrote ${out}${audio ? ' (with narration)' : ' (silent — run npm run fetch-audio for sound)'}`);
