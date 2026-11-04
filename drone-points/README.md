# How Many Points Is a Life?

A vertical (9:16), 118-second Three.js recreation of [this reel by Belltake](https://www.instagram.com/p/De1ywGthBlQ/),
about Ukraine's e-points system: drone units earn points for confirmed hits and spend them in the Brave1 Market.

The narration, beat order and visual grammar follow the reference. That grammar is a dark field, cream paper cards, an IBM Plex Mono
label voice, bold Old Standard TT captions with one red word, and red reserved for "look here". The
geometry, cards and motion are rebuilt from scratch here: a procedural tank, smoke, drones and a thermal
figure in WebGL, with the paper layer in DOM/SVG.

- Live: `/drone-points/` on the repository's GitHub Pages site
- Video: [`renders/points-per-life-540p.mp4`](renders/points-per-life-540p.mp4) (540×960, 30 fps, with the reel's narration)

## Run

```bash
npm install            # at the repository root
npm run dev:points     # http://localhost:5174/  (?t=60 starts at 60 s)
npm run build:points   # -> drone-points/dist/
```

Render an MP4 (with the dev server running):

```bash
PORT=5174 node scripts/render.mjs drone-points/renders/out.mp4 --w 1080 --fps 30 --audio drone-points/public/audio/narration.m4a
```

Review screenshots: `PORT=5174 node scripts/shots.mjs <dir> 2.9 17.8 31.8 …`, then `scripts/sheet.sh <dir> sheet.jpg`.

## How it's built

| Piece | File |
|---|---|
| Beat times (from Whisper word timestamps in `transcript.json`) | `src/times.js` |
| 3D world: FPV approach, isometric tank + smoke, thermal surrender scene, rescue robot | `src/world.js` |
| Paper board with a 2D pan/zoom camera, the six-card loop, patch notes, maker's page, price cards, frame overlays (tags, strips, poll, HUDs) | `src/board.js` |
| Line-art sketches (FPV, fibre-optic, interceptor, ground robot) | `src/sketch.js` |
| Captions | `src/captions.js` |
| Playback, render hooks (`?render`, `window.__frame(t)`), card thumbnails snapshotted from the 3D world | `src/main.js` |

Card elements set their own timing in the markup (`data-in`, `data-out`, `data-strike`, `data-count`,
`data-ring`), so every frame is a pure function of narration time and offline renders are frame-accurate.

| Time (s) | Beat |
|---|---|
| 0–2.7 | FPV strike drone dives on a tank (HUD: link quality, voltage, speed) |
| 2.7–8.4 | Isometric hit; price tags hang from the turret: 40 points vs 100,000 roubles |
| 8.4–17 | "Credit for the unit, not pay"; the Brave1 Market shelf; "the Amazon for the military" |
| 17–26 | The loop: hit → two videos → points (236 → 248) |
| 26–36 | "How many points is a life?"; 1 kill = 12 points = 60,000 hryvnias ≈ 3 FPVs |
| 36–53 | Shop (buy 3 FPVs), contract + payment, delivery in about a week |
| 53–65 | The loop speeds up; the Brave1 head's quote; $1B of orders in year one; the interceptor best seller |
| 66–77 | Points per target as patch notes: soldier 6 → 12, drone pilot 25, armour marked down |
| 77–89 | Maker's page: reviews replaced by results from the front; the unpaid invoice |
| 89–98 | A tank: 100,000 roubles vs 48,720 hryvnias, both ≈ $1,100 |
| 98–113 | Thermal: a man surrenders to a drone; 120 points for a capture, up to 120 for a robot rescue, 10 × a kill; 1,000 for 1,000 |
| 113–118 | The closing question as a poll, then a credit card |

Figures on screen are the reel's own (its sources are listed in the post's caption); the shop prices, contract, and maker's
page are illustrations of the flow, not real listings.

## Attribution

The narration audio (`public/audio/narration.m4a`) is the original reel's soundtrack, kept here for the
experiment's player, the same way as the Codex experiment. All credit for the script and research goes to Belltake.
