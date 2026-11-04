// Usage: node scripts/shots.mjs <outdir> t1 t2 ...   (needs `npx vite` running on :5173)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [out, ...times] = process.argv.slice(2);
const w = +(process.env.W || 540);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: w, height: Math.round(w * 16 / 9) } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await page.goto(`http://localhost:${process.env.PORT || 5173}/?render&w=${w}`);
await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
await page.evaluate(() => window.__ready);
for (const t of times) {
  await page.evaluate((t) => window.__frame(+t), t);
  await page.screenshot({ path: `${out}/s_${t}.png`, clip: { x: 0, y: 0, width: w, height: Math.round(w * 16 / 9) } });
}
console.log(errs.slice(0, 20).join('\n'));
await browser.close();
