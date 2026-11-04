import { World, C, ease, random } from "./world";
import { Explanation } from "./explanation";
const W = 1080,
  H = 1920,
  DURATION = 178.833333;
const canvas = document.querySelector<HTMLCanvasElement>("#film")!;
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext("2d")!;
const world = new World();
const [transcript, usa] = await Promise.all(
  ["captions", "usa"].map((s) =>
    fetch(`${import.meta.env.BASE_URL}film/${s}.json`).then((r) => r.json()),
  ),
);
const explanation = new Explanation(ctx, world, usa);
await Promise.all([
  document.fonts.load("80px Old"),
  document.fonts.load("80px Oswald"),
]);
const cuts = [
  [0, 8.74, "opening", "A trace in the sky", ""],
  [
    8.74,
    18.46,
    "camera",
    "Somewhere in America",
    "The search begins with a recording",
  ],
  [
    18.46,
    30.36,
    "spectrum",
    "Listen closer",
    "An aircraft hidden in the low frequencies",
  ],
  [30.36, 33.8, "pair", "Two passing aircraft", "920 seconds apart"],
  [33.8, 48.44, "doppler", "The shape of a flyby", "Motion leaves a signature"],
  [
    48.44,
    54.24,
    "measure",
    "Two clues in one curve",
    "Speed / closest approach",
  ],
  [
    54.24,
    64.72,
    "traffic",
    "A day above America",
    "Aircraft broadcast their position",
  ],
  [
    64.72,
    80.3,
    "search",
    "Which place heard both?",
    "A country becomes a field of candidates",
  ],
  [80.3, 92.26, "silence", "The missing third plane", "Silence is evidence"],
  [
    92.26,
    104.14,
    "flight",
    "Every turn leaves a trace",
    "Predict the sound at each location",
  ],
  [104.14, 112.88, "delay", "Sound takes time", "Where it was / where it is"],
  [
    112.88,
    120.1,
    "match",
    "One matching signature",
    "Two aircraft. One place.",
  ],
  [120.1, 129.86, "retest", "A harder test", "One minute. One faint aircraft."],
  [129.86, 138.02, "locate", "One square in a country", "100 metres wide"],
  [
    138.02,
    143.38,
    "reveal",
    "From a sound to a pole",
    "The final visual confirmation",
  ],
  [
    143.38,
    151.12,
    "filter",
    "Can you erase the trace?",
    "Filtering / compression / amplification",
  ],
  [
    151.12,
    158.76,
    "phone",
    "Still in the signal",
    "Under a voice. Through a phone call.",
  ],
  [158.76, 170.1, "credits", "Months of listening", "Research by ColstO"],
  [
    170.1,
    DURATION,
    "ending",
    "The sound of somewhere",
    "A unique perspective on the sky",
  ],
] as [number, number, string, string, string][];
const noise = document.createElement("canvas");
noise.width = 360;
noise.height = 640;
const nx = noise.getContext("2d")!,
  nd = nx.createImageData(360, 640),
  rng = random(829);
for (let i = 0; i < nd.data.length; i += 4) {
  nd.data[i] = nd.data[i + 1] = nd.data[i + 2] = 55;
  nd.data[i + 3] = rng() * 20;
}
nx.putImageData(nd, 0, 0);
function text(
  s: string,
  x: number,
  y: number,
  size = 32,
  color = C.ink,
  font = "Oswald",
  align: CanvasTextAlign = "left",
) {
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}
function stroke(points: number[][], color = C.ink, width = 2, alpha = 1) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.restore();
}
function rect(x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function subtitles(t: number) {
  const seg = transcript.segments.find(
    (s: any) => s.start <= t && s.end + 0.12 >= t,
  );
  if (!seg) return;
  const words = seg.text.split(/\s+/);
  ctx.font = "46px Old";
  let lines: string[] = [],
    s = "";
  for (const w of words) {
    if (ctx.measureText(s + " " + w).width > 850) {
      lines.push(s);
      s = w;
    } else s += (s ? " " : "") + w;
  }
  if (s) lines.push(s);
  const top = 1590;
  const grad = ctx.createLinearGradient(0, top - 90, 0, 1830);
  grad.addColorStop(0, "#e8e5d600");
  grad.addColorStop(0.4, "#e8e5d6f5");
  grad.addColorStop(1, C.paper);
  ctx.fillStyle = grad;
  ctx.fillRect(0, top - 90, W, 410);
  lines.forEach((l, i) =>
    text(l, 540, top + i * 58, 46, C.ink, "Old", "center"),
  );
}
function render(t: number) {
  t = Math.max(0, Math.min(t, DURATION - 0.001));
  const index = cuts.findIndex((c) => t >= c[0] && t < c[1]);
  const [start, end, mode, title, sub] = cuts[index];
  const u = (t - start) / (end - start),
    local = t - start;
  rect(0, 0, W, H, C.paper);
  explanation.draw(t, mode, u);
  const bottom = ctx.createLinearGradient(0, 1600, 0, 1780);
  bottom.addColorStop(0, "#e8e5d600");
  bottom.addColorStop(1, C.paper);
  ctx.fillStyle = bottom;
  ctx.fillRect(0, 1600, W, 320);
  subtitles(t);
  ctx.globalAlpha = 0.5;
  ctx.drawImage(noise, 0, 0, W, H);
  ctx.globalAlpha = 1;
  stroke(
    [
      [66, 1790],
      [1014, 1790],
    ],
    C.ink,
    1,
    0.25,
  );
  text("THE SOUND OF SOMEWHERE", 66, 1845, 20, C.muted, "monospace");
  text(
    "An illustrated reconstruction",
    1014,
    1845,
    20,
    C.muted,
    "Georgia",
    "right",
  );
  rect(66, 1870, 948, 2, "#c8c9b6");
  rect(66, 1870, (948 * t) / DURATION, 3, C.red);
  // Short paper dissolves between chapters, preserving the legibility of each new composition.
  const fade = 1 - ease(local / 0.25);
  if (index > 0 && fade > 0) {
    ctx.globalAlpha = fade;
    rect(0, 0, W, H, C.paper);
    ctx.globalAlpha = 1;
  }
  if (t > 177.5) {
    ctx.globalAlpha = ease((t - 177.5) / 1.333);
    rect(0, 0, W, H, C.paper);
    ctx.globalAlpha = 1;
    text("The sound of somewhere.", 540, 910, 62, C.ink, "Old", "center");
  }
}
const audio = document.querySelector<HTMLAudioElement>("#audio")!,
  play = document.querySelector<HTMLButtonElement>("#play")!,
  seek = document.querySelector<HTMLInputElement>("#seek")!,
  time = document.querySelector("#time")!;
const chapter = document.querySelector<HTMLSelectElement>("#chapter");
if (chapter) {
  for (const [start, , mode, title] of cuts) {
    const option = document.createElement("option");
    option.value = String(start);
    option.textContent = title;
    chapter.append(option);
  }
  chapter.onchange = () => {
    audio.currentTime = Number(chapter.value) + 0.3;
    render(audio.currentTime);
  };
}
function clock(t: number) {
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
}
async function toggle() {
  if (audio.paused) {
    if (audio.currentTime >= DURATION - 0.1) audio.currentTime = 0;
    try {
      await audio.play();
    } catch {
      play.textContent = "Try play again";
    }
  } else audio.pause();
}
audio.addEventListener("seeked", () => {
  seek.value = String(audio.currentTime);
  time.textContent = `${clock(audio.currentTime)} / 2:59`;
  render(audio.currentTime);
});
play.onclick = toggle;
audio.onplay = () => (play.textContent = "Pause");
audio.onpause = () => (play.textContent = "Play film");
seek.oninput = () => {
  audio.currentTime = +seek.value;
  render(audio.currentTime);
};
document.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.code === "Space") {
    e.preventDefault();
    toggle();
  }
  if (e.code === "ArrowRight")
    audio.currentTime = Math.min(DURATION, audio.currentTime + 5);
  if (e.code === "ArrowLeft")
    audio.currentTime = Math.max(0, audio.currentTime - 5);
});
let last = -1;
function tick() {
  if (!audio.paused && audio.currentTime !== last) {
    last = audio.currentTime;
    render(last);
    seek.value = String(last);
    time.textContent = `${clock(last)} / 2:59`;
  }
  requestAnimationFrame(tick);
}
(window as any).renderFrame = (t: number, quality = 0.93) => {
  render(t);
  return canvas.toDataURL("image/jpeg", quality).split(",")[1];
};
(window as any).film = { duration: DURATION, cuts };
render(0);
(window as any).ready = true;
if (!new URLSearchParams(location.search).has("render")) tick();
