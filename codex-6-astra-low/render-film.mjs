import { chromium } from "playwright";
import { createServer } from "vite";
import fs from "node:fs";
import { spawn } from "node:child_process";
const preview = process.argv.includes("--stills");
const output =
  process.argv.find((x) => x.endsWith(".mp4")) ||
  "renders/The-sound-of-somewhere.mp4";
const server = await createServer({
  server: { port: 5201, hmr: false, watch: null },
  logLevel: "error",
});
await server.listen();
const browser = await chromium.launch({
  headless: true,
  args: [
    "--enable-gpu",
    "--ignore-gpu-blocklist",
    "--use-angle=metal",
    "--enable-unsafe-swiftshader",
  ],
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
let errors = [];
page.on("pageerror", (e) => {
  errors.push(e.message);
  console.error(e.message);
});
await page.goto("http://localhost:5201/film.html?render");
await page.waitForFunction("window.ready===true", null, { timeout: 120000 });
const { duration, cuts } = await page.evaluate(() => window.film);
fs.mkdirSync("renders/qa", { recursive: true });
if (preview) {
  for (const [a, b, mode] of cuts) {
    const t = a + (b - a) * 0.55;
    const data = await page.evaluate((t) => window.renderFrame(t), t);
    fs.writeFileSync(
      `renders/qa/${String(Math.floor(a)).padStart(3, "0")}-${mode}.jpg`,
      Buffer.from(data, "base64"),
    );
  }
  console.log("Rendered", cuts.length, "chapter stills; errors:", errors);
} else {
  const fps = 30;
  const ff = spawn(
    "ffmpeg",
    [
      "-y",
      "-v",
      "error",
      "-f",
      "image2pipe",
      "-vcodec",
      "mjpeg",
      "-framerate",
      String(fps),
      "-i",
      "pipe:0",
      "-i",
      "public/film/audio.m4a",
      "-map",
      "0:v",
      "-map",
      "1:a",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "copy",
      "-t",
      String(duration),
      "-movflags",
      "+faststart",
      output,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const done = new Promise((res, rej) => {
    ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c}`))));
    ff.on("error", rej);
  });
  const started = Date.now();
  for (let f = 0; f < Math.ceil(duration * fps); f++) {
    const jpg = await page.evaluate((t) => window.renderFrame(t), f / fps);
    if (!ff.stdin.write(Buffer.from(jpg, "base64")))
      await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 300 === 0)
      console.log(
        `${f}/${Math.ceil(duration * fps)} frames, ${((Date.now() - started) / 1000).toFixed(0)}s elapsed`,
      );
  }
  ff.stdin.end();
  await done;
  console.log("Saved", output, "errors:", errors);
}
await browser.close();
await server.close();
if (errors.length) process.exitCode = 1;
