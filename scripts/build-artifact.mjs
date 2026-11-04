// Packages the Vite build into a self-contained folder for publishing as a claude.ai artifact
// (or any static host): out/artifact/{index.html, app.js, audio/narration.mp3}.
// Usage: npm run build && node scripts/build-artifact.mjs [--no-audio]
// The narration is only included if public/audio/narration.* exists and --no-audio is not given.
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { execFileSync } from 'child_process';

const OUT = 'out/artifact';
const noAudio = process.argv.includes('--no-audio');
const html = readFileSync('dist/index.html', 'utf8');
const css = readFileSync('dist/index.css', 'utf8');
const body = html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script[^>]*><\/script>/g, '');

// Artifact pages are wrapped in their own <html>/<head>, so emit content only.
const page = `<title>The Sound That Finds You</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=block" rel="stylesheet" />
<style>
${css}
html, body { height: 100%; background: #1a1916; color: #ebe5d8; }
</style>
${body}
<script type="module" src="app.js"></script>
`;
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/index.html`, page);
copyFileSync('dist/app.js', `${OUT}/app.js`);

// Artifacts serve .mp3 but not .m4a, so convert.
const src = ['public/audio/narration.mp3', 'public/audio/narration.m4a', 'public/audio/narration.wav'].find(existsSync);
if (src && !noAudio) {
  mkdirSync(`${OUT}/audio`, { recursive: true });
  if (src.endsWith('.mp3')) copyFileSync(src, `${OUT}/audio/narration.mp3`);
  else execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-c:a', 'libmp3lame', '-b:a', '160k', `${OUT}/audio/narration.mp3`]);
  console.log(`${OUT}: index.html, app.js, audio/narration.mp3`);
} else {
  console.log(`${OUT}: index.html, app.js (no narration; the page offers a file picker)`);
}
