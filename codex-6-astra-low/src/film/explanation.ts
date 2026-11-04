import { PencilWorld } from "./pencil";
import { composePencil } from "./pencil-composition";
import { C, World, ease, clamp, random } from "./world";
import { DopplerDemo } from "./demo";
import { heardPitch, emissionTime, SOUND_SPEED } from "./physics";
const BLUE = "#336b82",
  MUTE = "#999c8e",
  RED = C.red;
type Point = [number, number];
type Curve = {
  color: string;
  fn: (u: number) => number;
  dashed?: boolean;
  label?: string;
};
export class Explanation {
  demo = new DopplerDemo();
  pencil: PencilWorld;
  mapPath = new Path2D();
  dots: Point[] = [];
  time = 0;
  progress = 0;
  mode = "";
  // All motion is a pure function of film time, including arbitrary seeking.
  phase(start: number, end: number) {
    return clamp((this.time - start) / (end - start));
  }
  sweep(x: number, y: number, w: number, h: number, u: number, color = BLUE) {
    const c = this.c;
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    const head = x + w * clamp(u);
    const shade = c.createLinearGradient(head - 65, 0, head, 0);
    shade.addColorStop(0, "#336b8200");
    shade.addColorStop(1, "#336b8228");
    c.fillStyle = shade;
    c.fillRect(head - 65, y, 65, h);
    this.line(
      [
        [head, y],
        [head, y + h],
      ],
      color,
      2,
      false,
      0.6,
    );
    c.restore();
  }
  travel(a: Point, b: Point, u: number, color = BLUE) {
    this.line([a, b], color, 2, false, 0.2);
    const p: Point = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    this.line([a, p], color, 3);
    this.dot(...p, 6, color);
  }
  constructor(
    public c: CanvasRenderingContext2D,
    public world: World,
    usa: any,
  ) {
    this.pencil = new PencilWorld(world, usa);
    const project = (x: number, y: number): Point => [
      90 + ((x + 125) / 59) * 900,
      560 + ((49.5 - y) / 25) * 560,
    ];
    for (const poly of usa)
      for (const ring of poly) {
        if (
          !ring.some(
            ([x, y]: number[]) => x > -126 && x < -65 && y > 25 && y < 50,
          )
        )
          continue;
        ring.forEach(([x, y]: number[], i: number) => {
          const p = project(x, y);
          i ? this.mapPath.lineTo(...p) : this.mapPath.moveTo(...p);
        });
        this.mapPath.closePath();
      }
    const r = random(215);
    for (let i = 0; i < 2500; i++) {
      const p: Point = [90 + r() * 900, 560 + r() * 560];
      if (c.isPointInPath(this.mapPath, ...p)) this.dots.push(p);
    }
  }
  text(
    s: string,
    x: number,
    y: number,
    size = 32,
    color = C.ink,
    font = "Old",
    align: CanvasTextAlign = "left",
  ) {
    const c = this.c;
    c.font = `${size}px ${font}`;
    c.fillStyle = color;
    c.textAlign = align;
    c.fillText(s, x, y);
  }
  line(p: Point[], color = C.ink, w = 2, dash = false, alpha = 1) {
    const c = this.c;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = w;
    c.globalAlpha *= alpha;
    if (dash) c.setLineDash([12, 9]);
    c.beginPath();
    p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.restore();
  }
  rect(x: number, y: number, w: number, h: number, color = C.light) {
    this.c.fillStyle = color;
    this.c.fillRect(x, y, w, h);
  }
  dot(x: number, y: number, r = 7, color = RED, fill = true) {
    const c = this.c;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    if (fill) {
      c.fillStyle = color;
      c.fill();
    } else {
      c.lineWidth = 3;
      c.strokeStyle = color;
      c.stroke();
    }
  }
  arrow(a: Point, b: Point, color = C.ink) {
    this.line([a, b], color, 3);
    const d = Math.atan2(b[1] - a[1], b[0] - a[0]);
    this.line(
      [
        [b[0] - 14 * Math.cos(d - 0.45), b[1] - 14 * Math.sin(d - 0.45)],
        b,
        [b[0] - 14 * Math.cos(d + 0.45), b[1] - 14 * Math.sin(d + 0.45)],
      ],
      color,
      3,
    );
  }
  cross(x: number, y: number, size = 13, color = MUTE) {
    this.line(
      [
        [x - size, y - size],
        [x + size, y + size],
      ],
      color,
      4,
    );
    this.line(
      [
        [x + size, y - size],
        [x - size, y + size],
      ],
      color,
      4,
    );
  }
  tag(s: string, x: number, y: number, color = BLUE) {
    this.dot(x, y, 25, color);
    this.text(s, x, y + 11, 30, C.light, "Oswald", "center");
  }
  title(title: string, sub: string) {
    this.rect(0, 0, 1080, 273, C.paper);
    this.text(title, 65, 155, title.length > 30 ? 53 : 64);
    this.text(sub, 65, 215, 28, C.ink, "Georgia");
    this.line(
      [
        [65, 255],
        [1015, 255],
      ],
      MUTE,
      1,
    );
  }
  note(s: string, y = 1435) {
    this.text(s, 540, y, 25, MUTE, "Georgia", "center");
  }
  plane(x: number, y: number, angle = 0, color = C.ink, scale = 1) {
    const c = this.c;
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.scale(scale, scale);
    c.fillStyle = C.light;
    c.strokeStyle = color;
    c.lineWidth = 3;
    const p = [
      [-36, 8],
      [-36, 0],
      [-6, -13],
      [-5, -36],
      [0, -44],
      [5, -36],
      [6, -13],
      [36, 0],
      [36, 8],
      [5, 3],
      [4, 27],
      [14, 32],
      [14, 37],
      [-14, 37],
      [-14, 32],
      [-4, 27],
      [-5, 3],
    ];
    c.beginPath();
    p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }
  microphone(x: number, y: number, color = RED) {
    this.rect(x - 10, y - 18, 20, 36, color);
    this.line(
      [
        [x - 18, y],
        [x - 18, y + 16],
        [x, y + 29],
        [x + 18, y + 16],
        [x + 18, y],
      ],
      color,
      3,
    );
    this.line(
      [
        [x, y + 29],
        [x, y + 44],
      ],
      color,
      3,
    );
    this.line(
      [
        [x - 14, y + 44],
        [x + 14, y + 44],
      ],
      color,
      3,
    );
  }
  legend(y = 318) {
    this.line(
      [
        [75, y - 9],
        [125, y - 9],
      ],
      RED,
      4,
    );
    this.text("Recorded sound", 138, y, 25, RED, "Georgia");
    this.line(
      [
        [565, y - 9],
        [615, y - 9],
      ],
      BLUE,
      4,
      true,
    );
    this.text("Predicted at a location", 628, y, 25, BLUE, "Georgia");
  }
  curve(
    x: number,
    y: number,
    w: number,
    h: number,
    curves: Curve[],
    cursor?: number,
    reveal = 1,
  ) {
    const left = x + 68,
      right = x + w - 22,
      top = y + 32,
      bottom = y + h - 48;
    this.rect(x, y, w, h);
    this.line(
      [
        [left, top],
        [left, bottom],
        [right, bottom],
      ],
      MUTE,
      1.5,
    );
    this.text("Higher", x + 8, top + 5, 21, MUTE, "Georgia");
    this.text("pitch", x + 8, top + 32, 21, MUTE, "Georgia");
    this.text("Lower", x + 8, bottom - 8, 21, MUTE, "Georgia");
    this.text("Time", right, bottom + 31, 23, MUTE, "Georgia", "right");
    for (const f of [0.25, 0.5, 0.75])
      this.line(
        [
          [left, top + (bottom - top) * f],
          [right, top + (bottom - top) * f],
        ],
        MUTE,
        1,
        false,
        0.16,
      );
    const explicit = cursor !== undefined || reveal < 1;
    const read = explicit ? (cursor ?? reveal) : 0.025 + 0.95 * this.progress;
    this.c.save();
    this.c.beginPath();
    this.c.rect(left - 5, top - 10, right - left + 10, bottom - top + 20);
    this.c.clip();
    for (const item of curves) {
      const full: Point[] = [],
        ink: Point[] = [];
      for (let i = 0; i <= 240; i++) {
        const u = i / 240;
        const p: Point = [
          left + u * (right - left),
          top + (1 - item.fn(u)) * (bottom - top),
        ];
        full.push(p);
        if (u <= Math.min(read, reveal)) ink.push(p);
      }
      this.line(full, item.color, 2, item.dashed, 0.16);
      this.line(ink, item.color, 3.7, item.dashed);
    }
    this.c.restore();
    if (!explicit) {
      cursor = read;
      this.sweep(left, top, right - left, bottom - top, read, curves[0].color);
    }
    if (cursor !== undefined) {
      const u = clamp(cursor);
      this.line(
        [
          [left + u * (right - left), top],
          [left + u * (right - left), bottom],
        ],
        MUTE,
        1,
        true,
      );
      for (const it of curves)
        this.dot(
          left + u * (right - left),
          top + (1 - it.fn(u)) * (bottom - top),
          7,
          it.color,
        );
    }
  }
  pitch(speed = 60, distance = 400, shift = 0) {
    return (u: number) =>
      (heardPitch(-22 + 44 * u + shift, speed, distance) - 120) / 130;
  }
  event(x: number, y: number, color: string, label?: string) {
    const pts: Point[] = [];
    for (let i = -25; i <= 25; i++) {
      const u = i / 25;
      pts.push([x + i, y - Math.sin(i * 0.8) * Math.exp(-u * u * 4) * 24]);
    }
    this.line(pts, color, 3);
    if (label) this.text(label, x, y - 42, 24, color, "Georgia", "center");
  }
  timeline(
    y: number,
    label: string,
    color: string,
    events: number[],
    extra?: number,
    emphasis = 0,
  ) {
    this.rect(65, y - 67, 950, 155);
    this.text(label, 90, y - 18, 28, color);
    this.line(
      [
        [310, y],
        [970, y],
      ],
      MUTE,
      1.5,
    );
    const scan = 310 + 660 * this.progress;
    this.c.save();
    this.c.globalAlpha = 0.42;
    events.forEach((x, i) => this.event(x, y, color, i === 0 ? "1" : "2"));
    if (extra !== undefined) {
      this.event(extra, y, color, "3");
      if (emphasis > 0) {
        this.c.save();
        this.c.globalAlpha = emphasis;
        this.dot(extra, y, 49, RED, false);
        this.c.restore();
      }
    }
    this.c.restore();
    this.sweep(310, y - 47, 660, 90, this.progress, color);
    this.c.save();
    this.c.beginPath();
    this.c.rect(305, y - 65, Math.max(0, scan - 305), 110);
    this.c.clip();
    events.forEach((x, i) => this.event(x, y, color, i === 0 ? "1" : "2"));
    if (extra !== undefined) this.event(extra, y, color, "3");
    this.c.restore();
    if (extra !== undefined && emphasis > 0) this.dot(extra, y, 49, RED, false);
  }
  overview(t: number, mode: string, u: number) {
    if (mode === "opening" || mode === "camera") {
      this.title(
        mode === "opening"
          ? "A sound can reveal a place."
          : "The microphone is the mystery.",
        mode === "opening"
          ? "The clue is how a passing aircraft sounds."
          : "We know the date. We do not know where the camera is.",
      );
      this.c.drawImage(this.world.render(t, mode, u), 0, 270, 1080, 1130);
      const fade = this.c.createLinearGradient(0, 1000, 0, 1400);
      fade.addColorStop(0, "#e8e5d600");
      fade.addColorStop(1, C.paper);
      this.c.fillStyle = fade;
      this.c.fillRect(0, 1000, 1080, 400);
      this.rect(75, 345, 390, 130);
      this.microphone(120, 393);
      this.text("Unknown location", 158, 414, 31);
      this.text("Recording + date", 158, 449, 24, RED, "Georgia");
      this.rect(70, 1080, 940, 310);
      this.text("Which place would hear this?", 105, 1130, 38);
      for (let i = 0; i < 3; i++) {
        this.tag(["P", "Q", "R"][i], 220 + i * 320, 1265);
        this.text("?", 220 + i * 320, 1340, 50, BLUE, "Old", "center");
      }
      this.note("Reconstructed setting; the real camera site is not shown.");
    }
  }
  signal(t: number) {
    const pair = t >= 30.36;
    this.title(
      pair
        ? "Keep two clues from the recording."
        : "Turn sound into a visible trace.",
      pair
        ? "Their spacing matters as much as their shape."
        : "Across = time. Up = pitch. A bright line = a persistent tone.",
    );
    if (t < 22.32) {
      this.microphone(540, 560);
      this.text("Listen to the recording", 540, 715, 46, RED, "Old", "center");
      const p: Point[] = [];
      for (let i = 0; i < 260; i++) {
        const a =
          Math.sin(i * 0.32 + t * 5) *
          Math.sin(i * 0.09 + t) *
          Math.exp(-Math.pow((i - 130) / 160, 4));
        p.push([100 + i * 3.4, 960 + a * 105]);
      }
      this.line(p, RED, 3);
      this.text(
        "A sound can be too faint to notice.",
        540,
        1210,
        36,
        C.ink,
        "Old",
        "center",
      );
      return;
    }
    if (!pair) {
      this.rect(90, 350, 900, 610, "#2d342e");
      const r = random(184);
      for (let i = 0; i < 2200; i++) {
        this.c.globalAlpha = 0.08 + r() * 0.15;
        this.rect(
          95 + ((((r() * 890 - (t - 22.32) * 27) % 890) + 890) % 890),
          355 + r() * 595,
          2,
          5,
          "#f3efde",
        );
      }
      this.c.globalAlpha = 1;
      this.text("Higher pitch", 110, 390, 25, C.light, "Georgia");
      this.text("Lower pitch", 110, 910, 25, C.light, "Georgia");
      this.arrow([130, 880], [130, 450], C.light);
      this.arrow([160, 932], [935, 932], C.light);
      this.text("Time", 930, 900, 25, C.light, "Georgia", "right");
      const low = t >= 24.44;
      const points: Point[] = [];
      for (let i = 0; i < 200; i++) {
        const u = i / 199;
        points.push([170 + u * 750, 740 + Math.atan((u - 0.5) * 10) * 50]);
      }
      for (let j = 0; j < 3; j++)
        this.line(
          points.map(([x, y]) => [x, y - j * 90]),
          j === 0 && low ? RED : "#d7d5bd",
          j === 0 && low ? 5 : 2,
          false,
          j === 0 ? 1 : 0.25,
        );
      const read = this.phase(22.32, 30.36);
      this.sweep(165, 430, 775, 430, read, RED);
      this.line(
        points.slice(0, Math.max(2, Math.floor(read * points.length))),
        low ? RED : C.light,
        5,
      );
      if (low) {
        this.line(
          [
            [155, 650],
            [950, 650],
            [950, 850],
            [155, 850],
            [155, 650],
          ],
          RED,
          3,
        );
        this.arrow([540, 980], [540, 1050], RED);
        this.text("Isolate the low band", 540, 1030, 31, RED, "Old", "center");
        this.curve(
          90,
          1080,
          900,
          300,
          [{ color: RED, fn: this.pitch() }],
          undefined,
          ease((t - 25) / 2),
        );
      }
      this.note(
        "Schematic spectrogram: the flyby trace is exaggerated to explain it.",
      );
    } else {
      this.curve(85, 355, 910, 310, [{ color: RED, fn: this.pitch() }]);
      this.text("Plane 1", 540, 711, 34, RED, "Old", "center");
      this.curve(85, 820, 910, 310, [{ color: RED, fn: this.pitch(80, 250) }]);
      this.text("Plane 2", 540, 1175, 34, RED, "Old", "center");
      this.line(
        [
          [200, 1280],
          [880, 1280],
        ],
        RED,
        3,
      );
      this.dot(200, 1280);
      this.dot(880, 1280);
      this.travel([200, 1280], [880, 1280], this.progress, RED);
      this.text(
        "920 seconds between them",
        540,
        1355,
        43,
        RED,
        "Old",
        "center",
      );
    }
  }
  doppler(t: number) {
    if (t < 42.44) {
      this.title(
        "Watch the waves reach one listener.",
        "Closer wave arrivals mean a higher pitch.",
      );
      const now = (t - 39.74) * 5.5 + 400 / SOUND_SPEED;
      this.c.drawImage(
        this.demo.render(this.world.renderer, now),
        70,
        360,
        940,
        718,
      );
      this.text(
        "Aircraft moves this way",
        540,
        335,
        28,
        C.ink,
        "Georgia",
        "center",
      );
      this.arrow([370, 359], [710, 359]);
      this.text("Fixed microphone", 540, 940, 30, RED, "Old", "center");
      this.arrow([540, 965], [540, 995], RED);
      this.text(
        t < 39.74
          ? "Approaching: arrivals bunch together"
          : "Receding: arrivals spread apart",
        540,
        1030,
        36,
        RED,
        "Old",
        "center",
      );
      this.curve(
        70,
        1100,
        940,
        330,
        [{ color: RED, fn: this.pitch() }],
        (now + 22) / 44,
        clamp((now + 22) / 44),
      );
      this.note("Wave spacing and pitch use the same motion model.", 1480);
    } else this.comparison(t < 45 ? "speed" : "distance", t);
  }
  comparison(kind: string, t: number) {
    const speed = kind === "speed";
    this.title(
      speed
        ? "Change speed. Keep distance fixed."
        : "Change distance. Keep speed fixed.",
      speed
        ? "A faster flyby produces a larger pitch change."
        : "A closer flyby makes a sharper turn in the pitch trace.",
    );
    const phase = clamp((t - (speed ? 42.44 : 45)) / (speed ? 2.56 : 3.44));
    const rows = [
      {
        y: 370,
        label: speed ? "Slower" : "Farther",
        color: MUTE,
        v: speed ? 30 : 60,
        d: speed ? 400 : 950,
      },
      {
        y: 920,
        label: speed ? "Faster" : "Closer",
        color: RED,
        v: speed ? 85 : 60,
        d: speed ? 400 : 180,
      },
    ];
    for (const [i, row] of rows.entries()) {
      this.text(row.label, 90, row.y, 37, row.color);
      this.line(
        [
          [150, row.y + 80],
          [950, row.y + 80],
        ],
        MUTE,
        2,
        true,
      );
      const x = speed ? 180 + (phase * 720 * row.v) / 85 : 180 + phase * 720;
      this.plane(x, row.y + 80, Math.PI / 2, row.color, 0.7);
      const gap = speed ? 95 : row.d / 9;
      this.microphone(540, row.y + 80 + gap, row.color);
      this.line(
        [
          [540, row.y + 80],
          [540, row.y + 80 + gap],
        ],
        row.color,
        2,
        true,
      );
      this.text(
        speed ? "same distance" : i ? "near" : "far",
        590,
        row.y + 110 + gap * 0.5,
        26,
        row.color,
        "Georgia",
      );
      this.curve(70, row.y + 235, 940, 220, [
        { color: row.color, fn: this.pitch(row.v, row.d) },
      ]);
    }
    this.note(
      speed
        ? "Compare the height of the drops."
        : "Compare how abruptly the traces turn.",
      1465,
    );
  }
  measures(t: number) {
    this.title(
      "The curve constrains the flyby.",
      "Use both the size of the drop and the sharpness of its turn.",
    );
    this.curve(70, 400, 940, 530, [{ color: RED, fn: this.pitch() }]);
    this.arrow([860, 530], [860, 815], BLUE);
    this.text("Size of drop", 785, 1010, 34, BLUE, "Old", "center");
    this.text(
      "helps constrain speed",
      785,
      1055,
      26,
      C.ink,
      "Georgia",
      "center",
    );
    this.arrow([540, 1020], [540, 687], BLUE);
    this.text("Shape of turn", 310, 1160, 34, BLUE, "Old", "center");
    this.text(
      "helps constrain distance",
      310,
      1205,
      26,
      C.ink,
      "Georgia",
      "center",
    );
    this.text(
      "But many places can fit a simple flyby.",
      540,
      1355,
      36,
      RED,
      "Old",
      "center",
    );
    this.note(
      "A schematic point-source model; real flight geometry also matters.",
    );
  }
  tracks(t: number) {
    this.title(
      "Flight tracks supply the predictions.",
      "The date selects the flights. Their positions change with time.",
    );
    this.c.save();
    this.c.beginPath();
    this.c.rect(60, 510, 960, 650);
    this.c.clip();
    this.c.fillStyle = C.land;
    this.c.fill(this.mapPath);
    this.c.strokeStyle = MUTE;
    this.c.stroke(this.mapPath);
    this.c.restore();
    const route: Point[] = [
      [220, 920],
      [350, 780],
      [520, 720],
      [710, 690],
      [875, 585],
    ];
    this.line(route, BLUE, 4);
    route.forEach((p, i) => {
      this.dot(...p, 7, BLUE);
      this.text(`${i * 10} s`, p[0] + 12, p[1] - 17, 23, BLUE, "Georgia");
    });
    const u = this.phase(54.24, 64.72),
      q = u * 4,
      i = Math.min(3, Math.floor(q)),
      f = q - i;
    this.plane(
      route[i][0] * (1 - f) + route[i + 1][0] * f,
      route[i][1] * (1 - f) + route[i + 1][1] * f,
      Math.atan2(route[i + 1][1] - route[i][1], route[i + 1][0] - route[i][0]) +
        Math.PI / 2,
      BLUE,
      0.75,
    );
    this.rect(80, 350, 920, 120);
    this.text(
      "Position + time + aircraft type",
      540,
      425,
      43,
      BLUE,
      "Old",
      "center",
    );
    this.arrow([540, 1170], [540, 1240], BLUE);
    this.text(
      "Ask what each possible location would hear.",
      540,
      1310,
      36,
      C.ink,
      "Old",
      "center",
    );
    this.note("Illustrated track; not recovered ADS-B data.");
  }
  search(t: number) {
    this.title(
      "Test places against the recording.",
      "Each candidate location predicts its own sequence of sounds.",
    );
    this.legend();
    if (t < 67.9) {
      this.text(
        "The recording contains a propeller plane.",
        540,
        510,
        40,
        RED,
        "Old",
        "center",
      );
      this.plane(310, 790, Math.PI / 2, BLUE, 2);
      this.plane(770 + this.phase(66.3, 67.9) * 180, 790, Math.PI / 2, MUTE, 2);
      this.line(
        [
          [398 - 40 * Math.sin(t * 16), 790 - 40 * Math.cos(t * 16)],
          [398 + 40 * Math.sin(t * 16), 790 + 40 * Math.cos(t * 16)],
        ],
        BLUE,
        5,
      );
      this.dot(770 + this.phase(66.3, 67.9) * 180, 750, 12, MUTE);
      this.dot(770 + this.phase(66.3, 67.9) * 180, 830, 12, MUTE);
      this.text("Propeller flights", 310, 1000, 36, BLUE, "Old", "center");
      this.text("Jet flights", 770, 1000, 36, MUTE, "Old", "center");
      if (t >= 66.3) this.cross(770, 790, 100);
      this.text(
        "Keep the relevant aircraft type.",
        540,
        1270,
        38,
        C.ink,
        "Old",
        "center",
      );
      this.note("Schematic aircraft selection.");
      return;
    }
    if (t >= 74.68) {
      this.title(
        "Many places still pass this test.",
        "Both flybys, with the right gap, leave a large candidate set.",
      );
      this.c.save();
      this.c.fillStyle = C.land;
      this.c.fill(this.mapPath);
      this.c.strokeStyle = MUTE;
      this.c.stroke(this.mapPath);
      this.dots.forEach((p, i) => {
        if (i % 2 === 0) {
          const scanned = (90 + 900 * this.phase(74.68, 80.3) - p[0]) / 30;
          this.c.globalAlpha = 0.15 + 0.85 * ease(scanned);
          this.dot(...p, 1.5 + 2 * ease(scanned), BLUE);
        }
      });
      this.c.restore();
      this.sweep(90, 560, 900, 560, this.phase(74.68, 80.3));
      this.text("70,000", 540, 440, 100, BLUE, "Oswald", "center");
      this.text(
        "candidate locations in the narrated case",
        540,
        495,
        29,
        C.ink,
        "Georgia",
        "center",
      );
      this.timeline(1260, "Recorded", RED, [390, 910]);
      this.text("1", 390, 1390, 27, RED, "Oswald", "center");
      this.text("920 seconds", 650, 1390, 32, RED, "Old", "center");
      this.text("2", 910, 1390, 27, RED, "Oswald", "center");
      return;
    }
    this.timeline(465, "Recorded", RED, [390, 910]);
    this.text("920 seconds", 650, 565, 30, RED, "Old", "center");
    ["P", "Q", "R"].forEach((id, i) => {
      const y = 730 + i * 240;
      this.timeline(y, `Place ${id}`, BLUE, [390, i === 2 ? 750 : 910]);
      this.tag(id, 130, y + 63);
      const reject = i === 2 && t > 72.6;
      this.text(
        reject ? "Wrong gap" : t > 71 ? "Right gap" : "Prediction",
        970,
        y + 69,
        27,
        reject ? MUTE : BLUE,
        "Georgia",
        "right",
      );
      if (reject) {
        this.dot(750, y, 44, RED, false);
        this.cross(130, y + 63, 16, C.light);
      }
    });
    this.note("Three example places make the comparison visible.");
  }
  silence(t: number) {
    this.title(
      "A third plane would give a place away.",
      "The real recording is quiet between planes 1 and 2.",
    );
    this.legend();
    this.timeline(460, "Recorded", RED, [390, 910]);
    this.rect(440, 425, 420, 70, "#e3dfca");
    this.text("No third flyby", 650, 469, 33, RED, "Old", "center");
    const reveal = ease((t - 84.8) / 1.5);
    this.timeline(
      800,
      "Place P",
      BLUE,
      [390, 910],
      t >= 84.8 ? 640 : undefined,
      reveal,
    );
    this.tag("P", 130, 885);
    if (t >= 84.8)
      this.text(
        "Predicts an extra plane here",
        690,
        930,
        30,
        BLUE,
        "Old",
        "center",
      );
    if (t >= 87.22) {
      this.cross(130, 885, 17, C.light);
      this.text("Reject P", 970, 880, 32, MUTE, "Old", "right");
      this.arrow([640, 745], [640, 550], RED);
    }
    this.timeline(1135, "Place Q", BLUE, [390, 910]);
    this.tag("Q", 130, 1220);
    this.text(
      "Predicts the quiet interval",
      970,
      1220,
      28,
      BLUE,
      "Georgia",
      "right",
    );
    this.text(
      t >= 90.38
        ? "15,000 candidates remain"
        : "Keep places that also explain the silence.",
      540,
      1375,
      t >= 90.38 ? 54 : 36,
      t >= 90.38 ? BLUE : C.ink,
      "Old",
      "center",
    );
    this.note("Illustrative candidates; counts are from the narration.", 1445);
  }
  signatures(t: number) {
    this.title(
      "Same flight. Different listening places.",
      "Compare two survivors: Q and S hear different versions of the flight.",
    );
    const route: Point[] = [];
    for (let i = 0; i <= 100; i++) {
      const u = i / 100;
      route.push([110 + u * 860, 440 + 90 * Math.sin(u * 4)]);
    }
    this.line(route, BLUE, 3);
    const p = this.phase(92.26, 104.14),
      idx = Math.min(99, Math.floor(p * 100));
    this.plane(
      ...route[idx],
      Math.atan2(
        route[idx + 1][1] - route[idx][1],
        route[idx + 1][0] - route[idx][0],
      ) +
        Math.PI / 2,
      BLUE,
      0.75,
    );
    const positions: Point[] = [
      [330, 650],
      [770, 760],
    ];
    positions.forEach((pt, i) => {
      this.tag(i ? "S" : "Q", ...pt);
      this.line([route[idx], pt], BLUE, 1, true, 0.5);
      this.travel(route[idx], pt, (t * 0.7 + i * 0.3) % 1, BLUE);
    });
    this.text(
      "Closer to this part of the flight",
      330,
      700,
      25,
      BLUE,
      "Georgia",
      "center",
    );
    this.text("Farther from it", 770, 815, 25, BLUE, "Georgia", "center");
    this.text("Predicted at Q", 90, 904, 30, BLUE);
    this.curve(70, 940, 940, 210, [
      { color: BLUE, fn: this.pitch(60, 200), dashed: true },
    ]);
    this.text("Predicted at S", 90, 1210, 30, BLUE);
    this.curve(70, 1240, 940, 210, [
      { color: BLUE, fn: this.pitch(60, 850, 3), dashed: true },
    ]);
    this.note(
      "The sketch isolates distance and timing; real tracks also turn and climb.",
      1490,
    );
  }
  delay(t: number) {
    this.title(
      "The sound arrives after the plane moves.",
      "Compare the recording with where the sound was emitted.",
    );
    const u = clamp((t - 104.14) / 6.1);
    const source: Point = [220, 590],
      mic: Point = [540, 1000],
      r = Math.hypot(mic[0] - source[0], mic[1] - source[1]);
    this.line(
      [
        [160, 590],
        [950, 590],
      ],
      MUTE,
      2,
      true,
    );
    this.c.save();
    this.c.beginPath();
    this.c.rect(65, 330, 950, 850);
    this.c.clip();
    this.dot(...source, Math.max(2, r * u), RED, false);
    for (let i = 1; i <= 3; i++) {
      const age = (t - 104.14 - i * 1.15) / 6.1;
      if (age > 0) {
        this.c.save();
        this.c.globalAlpha = 0.26;
        this.dot(...source, r * age, RED, false);
        this.c.restore();
      }
    }
    this.c.restore();
    this.plane(...source, Math.PI / 2, MUTE, 0.8);
    this.plane(220 + 640 * u, 590, Math.PI / 2, C.ink, 0.8);
    this.microphone(...mic);
    this.dot(...source, 6, RED);
    this.line([source, mic], RED, 2, true);
    this.text("Sound emitted here", 220, 470, 30, RED, "Old", "center");
    this.text(
      "Plane now",
      Math.min(860, 300 + 640 * u),
      690,
      31,
      C.ink,
      "Old",
      "center",
    );
    this.text(
      u < 1 ? "Sound is travelling…" : "That earlier sound arrives now",
      540,
      1110,
      35,
      RED,
      "Old",
      "center",
    );
    this.rect(75, 1210, 930, 200);
    this.text(
      "Emission time + travel time = arrival time",
      540,
      1285,
      36,
      BLUE,
      "Old",
      "center",
    );
    this.text(
      "Use arrival time to line up the predicted recording.",
      540,
      1350,
      27,
      C.ink,
      "Georgia",
      "center",
    );
    this.note("Motion and travel time exaggerated for visibility.");
  }
  matching(t: number, retest = false) {
    this.title(
      retest
        ? "Try a different recording."
        : "Make one location explain both traces.",
      retest
        ? "Keep place Q fixed and test an independent one-minute clip."
        : "The same candidate must match plane 1 and plane 2.",
    );
    this.legend();
    const good = retest || t >= 116.12;
    const f1 = this.pitch(),
      f2 = this.pitch(80, 250);
    this.text(
      retest ? "New recording · one faint plane" : "Plane 1",
      90,
      410,
      35,
      RED,
    );
    this.curve(70, 440, 940, 340, [
      { color: RED, fn: f1 },
      { color: BLUE, fn: good ? f1 : this.pitch(60, 850, 3), dashed: true },
    ]);
    if (!retest) {
      this.text("Plane 2", 90, 870, 35, RED);
      this.curve(70, 900, 940, 340, [
        { color: RED, fn: f2 },
        { color: BLUE, fn: good ? f2 : this.pitch(70, 700, -4), dashed: true },
      ]);
    } else {
      this.rect(100, 900, 880, 290);
      this.text(
        "Keep the chosen place fixed.",
        540,
        990,
        38,
        C.ink,
        "Old",
        "center",
      );
      this.text("Change the recording.", 540, 1060, 38, RED, "Old", "center");
      this.text(
        "Does the prediction still fit?",
        540,
        1130,
        38,
        BLUE,
        "Old",
        "center",
      );
    }
    this.tag(good ? "Q" : "S", 160, 1330);
    this.text(
      good
        ? retest && t < 128.04
          ? "Test Q against the new recording."
          : "Q matches the recorded trace" + (retest ? " again." : "s.")
        : "Survivor S misses the detailed shape.",
      220,
      1340,
      36,
      good ? BLUE : MUTE,
    );
    this.note(
      "Illustrated curve comparison, not an independently reproduced fit.",
    );
  }
  locate(t: number) {
    this.title(
      "The audio selects a small area.",
      "Zoom from the whole country into the one surviving search cell.",
    );
    this.text(
      "More than 750 million possible cells",
      540,
      360,
      38,
      C.ink,
      "Old",
      "center",
    );
    const u = this.phase(129.86, 138.02),
      zoom = Math.exp(ease(u) * 4.65),
      cx = 540,
      cy = 850;
    const c = this.c;
    c.save();
    c.beginPath();
    c.rect(70, 440, 940, 760);
    c.clip();
    c.translate(cx, cy);
    c.scale(zoom, zoom);
    c.translate(-540, -850);
    c.fillStyle = C.land;
    c.fill(this.mapPath);
    c.strokeStyle = MUTE;
    c.lineWidth = 2 / zoom;
    c.stroke(this.mapPath);
    const cell = 3.2,
      baseX = 540,
      baseY = 850;
    c.globalAlpha = ease((u - 0.25) / 0.4);
    for (let i = -180; i <= 180; i++) {
      this.line(
        [
          [baseX + (i + 0.5) * cell, 250],
          [baseX + (i + 0.5) * cell, 1450],
        ],
        MUTE,
        1 / zoom,
      );
      this.line(
        [
          [0, baseY + (i + 0.5) * cell],
          [1080, baseY + (i + 0.5) * cell],
        ],
        MUTE,
        1 / zoom,
      );
    }
    c.globalAlpha = 1;
    this.rect(baseX - cell / 2, baseY - cell / 2, cell, cell, RED);
    c.restore();
    this.dot(cx, cy, Math.max(8, cell * zoom * 0.58), RED, false);
    this.text(
      u < 0.55 ? "Narrow the search area" : "Inspect the selected cell",
      540,
      1280,
      43,
      RED,
      "Old",
      "center",
    );
    this.text(
      u < 0.55 ? "Country → region → cell" : "One cell is 100 m × 100 m",
      540,
      1350,
      33,
      C.ink,
      "Georgia",
      "center",
    );
    this.note(
      "Illustrated zoom; the exact pole is established by the landmark check.",
      1450,
    );
  }
  reveal(t: number, u: number) {
    this.title(
      "Then match the visible landmarks.",
      "Audio narrows the area. Street imagery identifies the pole.",
    );
    const source = this.world.render(t, "reveal", 0.15 + 0.7 * u);
    this.c.drawImage(source, 60, 340, 960, 930);
    this.rect(75, 350, 930, 110);
    this.text(
      "Illustrated location check",
      540,
      420,
      40,
      C.ink,
      "Old",
      "center",
    );
    const labels = ["Same road", "Same tree line", "Camera on the pole"];
    labels.forEach((s, i) => {
      const active = t > 139.5 + i * 0.9;
      this.text(
        (active ? "✓  " : "") + s,
        110,
        1180 + i * 75,
        37,
        active ? BLUE : MUTE,
      );
    });
    this.note(
      "Schematic landmarks; these are not Street View photographs.",
      1460,
    );
  }
  robustness(t: number, phone = false) {
    this.title(
      phone
        ? "Speech can cover a surviving pattern."
        : "Harder to hear can still be measurable.",
      phone
        ? "The extra sound obscures the trace; it need not erase it."
        : "Follow the same pitch pattern through a schematic before / after.",
    );
    const f = this.pitch();
    this.text("Original trace", 90, 365, 34, RED);
    this.curve(70, 400, 940, 330, [{ color: RED, fn: f }]);
    const label = phone
      ? t < 156.16
        ? "Added voice"
        : "Phone transmission"
      : t < 146.74
        ? "Low frequencies reduced"
        : t < 148.54
          ? "MP3 compression"
          : "Gain increased";
    this.text(label, 90, 825, 36, BLUE);
    this.curve(70, 860, 940, 410, [
      { color: t < 148.54 && !phone ? "#c3a49a" : RED, fn: f },
    ]);
    if (phone) {
      const r = random(882);
      for (let j = 0; j < 12; j++) {
        const pts: Point[] = [];
        for (let i = 0; i < 90; i++)
          pts.push([
            140 + i * 9.5,
            930 + j * 19 + Math.sin(i * 0.8 + j * 2 - t * 3.2) * r() * 23,
          ]);
        this.line(pts, MUTE, 1.3, false, 0.3);
      }
    }
    this.text(
      t >= 148.54 || phone
        ? "The recognisable curve remains."
        : "Fainter does not necessarily mean gone.",
      540,
      1370,
      37,
      RED,
      "Old",
      "center",
    );
    this.note(
      "Schematic comparison; no filtering or phone experiment was performed.",
    );
  }
  credits(t: number) {
    this.title(
      "An investigation by ColstO.",
      "As described and credited in the original narration.",
    );
    this.text("Months of work", 100, 470, 62);
    this.text("5,000 lines of code", 100, 570, 62);
    this.line(
      [
        [100, 650],
        [980, 650],
      ],
      MUTE,
      1,
    );
    this.text("The reasoning, in four steps", 100, 750, 42);
    [
      "Extract a trace from the recording",
      "Predict sound at possible places",
      "Reject places that contradict the evidence",
      "Check the best match against landmarks",
    ].forEach((s, i) => {
      this.tag(String(i + 1), 130, 865 + i * 130);
      this.text(s, 190, 875 + i * 130, 32, i === 2 ? RED : C.ink);
    });
    const flow = this.phase(158.76, 170.1) * 4;
    for (let i = 0; i < 3; i++)
      this.travel(
        [130, 895 + i * 130],
        [130, 965 + i * 130],
        clamp(flow - i),
        BLUE,
      );
    const row = Math.min(3, Math.floor(flow));
    const y = 865 + row * 130;
    this.dot(130, y, 32, BLUE, false);
    const points: Point[] = [];
    const drawn = clamp(flow - row);
    for (let i = 0; i <= drawn * 90; i++)
      points.push([190 + i * 8.3, y + 45 + Math.sin(i * 0.14) * 8]);
    this.line(points, row === 2 ? RED : BLUE, 2.5);
    this.note("Original audio retained. Visual explanation redesigned.");
  }
  ending(t: number, u: number) {
    this.title(
      "A recording is a point of view.",
      "A moving aircraft sounds different from different places.",
    );
    this.c.drawImage(this.world.render(t, "ending", u), 0, 300, 1080, 950);
    this.rect(70, 1130, 940, 300);
    this.text("Recording", 130, 1210, 36, RED);
    this.arrow([335, 1198], [410, 1198]);
    this.text("Compare", 440, 1210, 36, BLUE);
    this.arrow([625, 1198], [710, 1198]);
    this.text("Place", 760, 1210, 36);
    this.text(
      "The location is in the differences.",
      540,
      1350,
      43,
      C.ink,
      "Old",
      "center",
    );
  }
  draw(t: number, mode: string, u: number) {
    composePencil(this, this.pencil, t, mode, u);
  }
}
