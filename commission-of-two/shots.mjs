// Screenshots at given times: node commission-of-two/shots.mjs out_dir 1 7 16 ...   (needs the dev server on PORT, default 5180)
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [out, ...ts] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const W = +(process.env.W || 540), H = Math.round(W * 16 / 9);
const gl = process.env.GPU ? [] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const browser = await chromium.launch({ args: [...gl, '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await page.goto(`http://localhost:${process.env.PORT || 5180}/?render&w=${W}`);
await page.waitForFunction(() => window.__ready, null, { timeout: 180000 });
await page.evaluate(() => window.__ready);
for (const t of ts) {
  await page.evaluate((x) => window.__frame(x), +t);
  await page.screenshot({ path: `${out}/t${(+t).toFixed(2).padStart(7, "0")}.png`, clip: { x: 0, y: 0, width: W, height: H } });
}
await browser.close();
