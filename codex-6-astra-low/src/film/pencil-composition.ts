import { Explanation } from "./explanation";
import { PencilWorld } from "./pencil";
import { C, clamp, ease } from "./world";
import { SOUND_SPEED } from "./physics";
const BLUE = "#336b82",
  RED = C.red;
/** Full-frame 3D is the visual setting; small paper insets carry exact comparisons. */
export function composePencil(
  e: Explanation,
  p: PencilWorld,
  t: number,
  mode: string,
  u: number,
) {
  const c = e.c;
  e.time = t;
  e.progress = u;
  e.mode = mode;
  c.drawImage(p.render(t, mode, u), 0, 0, 1080, 1920);
  // Quiet typography zones, with the scene visible continuously between them.
  const top = c.createLinearGradient(0, 0, 0, 520);
  top.addColorStop(0, C.paper);
  top.addColorStop(0.36, "#e8e5d6ee");
  top.addColorStop(1, "#e8e5d600");
  c.fillStyle = top;
  c.fillRect(0, 0, 1080, 520);
  const bottom = c.createLinearGradient(0, 1370, 0, 1710);
  bottom.addColorStop(0, "#e8e5d600");
  bottom.addColorStop(1, C.paper);
  c.fillStyle = bottom;
  c.fillRect(0, 1370, 1080, 550);
  const heading = (title: string, sub = "") => {
    e.text(title, 70, 170, title.length > 30 ? 50 : 59);
    if (sub) e.text(sub, 72, 222, 27, C.ink, "Georgia");
  };
  const slip = (y: number, h: number) => {
    c.save();
    c.shadowColor = "#322e2426";
    c.shadowBlur = 18;
    c.shadowOffsetY = 9;
    e.rect(70, y, 940, h, "#f2efdf");
    c.restore();
    e.line(
      [
        [70, y],
        [1010, y],
        [1010, y + h],
        [70, y + h],
        [70, y],
      ],
      "#928a76",
      1.3,
    );
  };
  const label = (s: string, x: number, y: number, color = C.ink) => {
    c.font = "29px Old";
    const w = c.measureText(s).width;
    x = Math.max(w / 2 + 35, Math.min(1045 - w / 2, x));
    y = Math.max(330, Math.min(1040, y));
    e.rect(x - w / 2 - 13, y - 30, w + 26, 42, "#eeeadae8");
    e.text(s, x, y, 29, color, "Old", "center");
  };
  const candidates = () => {
    p.positions.forEach((v, i) => {
      const pos = p.project(v.clone().setY(5.3));
      const x = Math.max(90, Math.min(990, pos[0])),
        y = Math.max(350, Math.min(990, pos[1]));
      e.tag(
        ["P", "Q", mode === "match" || mode === "flight" ? "S" : "R"][i],
        x,
        y,
        i === 1 ? RED : BLUE,
      );
      if (
        (mode === "silence" && i === 0 && t >= 87.22) ||
        (mode === "match" && i === 0)
      )
        e.cross(x, y, 16, C.light);
    });
  };
  const smallGraph = (
    y: number,
    h: number,
    curves: any[],
    title: string,
    progress?: number,
  ) => {
    slip(y, h + 65);
    e.text(title, 100, y + 40, 28, C.ink, "Old");
    e.curve(85, y + 55, 910, h, curves, progress);
  };
  if (mode === "opening" || mode === "camera") {
    heading(
      mode === "opening"
        ? "A place, hidden in a sound."
        : "Somewhere in America.",
      mode === "opening"
        ? "A passing aircraft leaves a distinctive trace."
        : "A recording and a date. An unknown camera location.",
    );
    if (mode === "camera") {
      const v = p.project(p.world.rural.pole.position.clone().setY(4.6));
      e.dot(v[0], v[1], 42, RED, false);
      label("The camera", Math.min(900, v[0] + 130), v[1] - 90, RED);
    }
    smallGraph(
      1170,
      225,
      [{ color: RED, fn: e.pitch() }],
      "The sound recorded at one place",
    );
  } else if (mode === "doppler") {
    heading(
      t < 42.44
        ? "One aircraft. One listener."
        : t < 45
          ? "Faster flight, a larger drop."
          : "A closer pass, a sharper turn.",
      t < 42.44
        ? "Watch the wavefronts arrive at the camera."
        : "Change one property while holding the other fixed.",
    );
    const v = p.project(p.world.rural.pole.position.clone().setY(4.6));
    label("Fixed listener", v[0], v[1] + 55, RED);
    if (t >= 42.44) {
      const a = p.project(p.aircraft.position),
        b = p.project(p.aircraft2.position);
      label(t < 45 ? "Faster" : "Closer", a[0], a[1] - 90, RED);
      label(t < 45 ? "Slower" : "Farther", b[0], b[1] + 75, BLUE);
    }
    const now = (t - 39.74) * 5.5 + 400 / SOUND_SPEED;
    if (t < 42.44)
      smallGraph(
        1120,
        290,
        [{ color: RED, fn: e.pitch() }],
        t < 39.74 ? "Approaching · higher pitch" : "Receding · lower pitch",
        clamp((now + 22) / 44),
      );
    else
      smallGraph(
        1120,
        290,
        [
          {
            color: "#9a9588",
            fn: t < 45 ? e.pitch(30, 400) : e.pitch(60, 950),
            dashed: true,
          },
          { color: RED, fn: t < 45 ? e.pitch(85, 400) : e.pitch(60, 180) },
        ],
        t < 45 ? "Same distance: slow / fast" : "Same speed: far / near",
      );
  } else if (mode === "measure") {
    heading(
      "A flyby draws its own signature.",
      "The size of the drop and the shape of the turn constrain the flight.",
    );
    smallGraph(
      1080,
      340,
      [{ color: RED, fn: e.pitch() }],
      "What the listener hears",
    );
    e.text("Drop → speed", 130, 1470, 29, RED);
    e.text("Turn → distance", 700, 1470, 29, RED);
  } else if (mode === "spectrum" || mode === "pair") {
    heading(
      mode === "pair" ? "Two flybys. One recording." : "Look inside the sound.",
      mode === "pair"
        ? "The two events are separated by 920 seconds."
        : "Sound becomes a picture of pitch over time.",
    );
    slip(500, 580);
    e.rect(95, 570, 890, 440, "#34362e");
    const r = (x: number, y: number) =>
      Math.sin(x * 14.78 + y * 19.12) * 0.5 + 0.5;
    for (let i = 0; i < 600; i++) {
      c.globalAlpha = 0.08 + r(i, 4) * 0.13;
      e.rect(
        100 + ((((i * 13.71 - t * 17) % 880) + 880) % 880),
        580 + r(i, 8) * 410,
        2,
        9,
        "#eeebd8",
      );
    }
    c.globalAlpha = 1;
    e.text("Low-frequency sound", 110, 542, 28, C.ink);
    for (let j = 0; j < 3; j++) {
      const pts: [number, number][] = [];
      for (let i = 0; i < 170; i++) {
        const q = i / 169;
        pts.push([
          125 + q * 820,
          790 + j * 65 + Math.atan((q - 0.5) * 10) * 40,
        ]);
      }
      e.line(
        pts,
        j === 0 ? RED : "#d4d0ba",
        j === 0 ? 4 : 1.5,
        false,
        j === 0 ? 1 : 0.45,
      );
    }
    e.sweep(115, 580, 855, 420, u, RED);
    e.text("Pitch", 110, 1040, 24, C.ink, "Georgia");
    e.text("Time", 960, 1040, 24, C.ink, "Georgia", "right");
    smallGraph(
      1170,
      210,
      [{ color: RED, fn: e.pitch() }],
      mode === "pair"
        ? "Plane 1 → 920 seconds → Plane 2"
        : "Isolate the low-pitch trace",
    );
    e.note("Schematic signal; the source soundtrack is retained.", 1470);
  } else if (mode === "traffic") {
    heading(
      "A day of flight tracks.",
      "Position, time and aircraft type give us the ingredients.",
    );
    smallGraph(
      1170,
      225,
      [{ color: BLUE, fn: e.pitch(), dashed: true }],
      "Predict what a possible location would hear",
    );
    label("Illustrated position samples", 540, 1010, BLUE);
  } else if (mode === "search" || mode === "silence") {
    heading(
      mode === "silence"
        ? "Silence rules places out."
        : "Where could the camera be?",
      mode === "silence"
        ? "A candidate must explain the quiet interval too."
        : "Try each location against the same recorded events.",
    );
    candidates();
    if (mode === "search" && t >= 74.68) {
      e.text("70,000 candidates", 540, 435, 67, BLUE, "Oswald", "center");
      e.note("Illustrated search · count from the narration", 1470);
    }
    slip(1030, 420);
    const row = (
      y: number,
      name: string,
      color: string,
      third = false,
      second = 910,
    ) => {
      e.text(name, 100, y - 14, 28, color);
      e.line(
        [
          [320, y],
          [970, y],
        ],
        "#aaa18c",
        1,
      );
      e.event(390, y, color, "1");
      e.event(second, y, color, "2");
      if (third) {
        e.event(640, y, color, "3");
        e.dot(640, y, 35, RED, false);
      }
      e.sweep(320, y - 35, 650, 65, u, color);
    };
    if (mode === "search" && t < 74.68) {
      row(1100, "Recorded", RED);
      row(1200, "Place P", BLUE);
      row(1300, "Place Q", BLUE);
      row(1400, "Place R", BLUE, false, 750);
      if (t >= 72.6) {
        e.dot(750, 1400, 34, RED, false);
        e.text("Wrong gap", 200, 1435, 25, RED, "Old", "center");
      }
    } else {
      row(1130, "Recorded", RED);
      row(1250, "Place P", BLUE, mode === "silence" && t >= 84.8);
      row(1370, "Place Q", BLUE);
    }
    if (mode === "silence" && t >= 87.22) {
      e.arrow([640, 1205], [640, 1165], RED);
      e.text("Extra plane: reject P", 540, 1510, 32, RED, "Old", "center");
    } else
      e.text(
        "920 seconds between planes 1 and 2",
        540,
        1510,
        30,
        RED,
        "Old",
        "center",
      );
  } else if (mode === "retest") {
    heading(
      "Test the same place again.",
      "One minute. One faint aircraft. Candidate Q stays fixed.",
    );
    smallGraph(
      1110,
      320,
      [
        { color: RED, fn: e.pitch() },
        { color: BLUE, fn: e.pitch(), dashed: true },
      ],
      "New recording / prediction at Q",
    );
    e.note(
      t < 128.04
        ? "Compare this independent recording."
        : "The same candidate fits again.",
      1510,
    );
  } else if (mode === "flight" || mode === "match") {
    heading(
      mode === "flight"
        ? "The place changes the sound."
        : "Make one place match both.",
      mode === "flight"
        ? "Different listeners hear different versions of the same flight."
        : "Solid red: recorded. Dashed blue: predicted.",
    );
    candidates();
    const good = t >= 116.12;
    slip(1020, 455);
    e.text(
      mode === "flight" ? "Predicted at Q and another location" : "Plane 1",
      100,
      1060,
      28,
    );
    e.curve(85, 1070, 910, 180, [
      { color: RED, fn: e.pitch() },
      {
        color: BLUE,
        fn:
          mode === "flight"
            ? e.pitch(60, 850, 3)
            : good
              ? e.pitch()
              : e.pitch(60, 850, 3),
        dashed: true,
      },
    ]);
    e.text("Plane 2", 100, 1290, 28);
    e.curve(85, 1300, 910, 160, [
      { color: RED, fn: e.pitch(80, 250) },
      {
        color: BLUE,
        fn: good ? e.pitch(80, 250) : e.pitch(70, 700, -4),
        dashed: true,
      },
    ]);
    e.note(
      good
        ? "Candidate Q explains the traces."
        : "Compare each trace at the same candidate location.",
      1515,
    );
  } else if (mode === "delay") {
    heading(
      "Sound is still travelling.",
      "The aircraft moves on before its earlier sound reaches the camera.",
    );
    const emission = p.project(p.aircraft.position.clone().setX(-7));
    label("Earlier emission point", emission[0], emission[1] - 80, RED);
    smallGraph(
      1170,
      220,
      [{ color: RED, fn: e.pitch() }],
      "Emission time + travel time = arrival time",
    );
  } else if (mode === "locate") {
    heading(
      "One small place in a country.",
      "The audio narrows the search. Landmarks identify the pole.",
    );
    slip(1190, 230);
    e.text("100 m × 100 m", 540, 1295, 72, RED, "Oswald", "center");
    e.text(
      "One cell among more than 750 million",
      540,
      1360,
      30,
      C.ink,
      "Georgia",
      "center",
    );
  } else if (mode === "reveal") {
    heading(
      "Follow the landmarks to the pole.",
      "The audio result and the visual check complete the search.",
    );
    const pos = p.project(p.world.rural.pole.position.clone().setY(4.6));
    e.dot(...pos, 48, RED, false);
    label("Camera", pos[0] + 110, pos[1] - 70, RED);
    slip(1240, 180);
    e.text(
      "Same road. Same trees. The camera.",
      540,
      1340,
      43,
      C.ink,
      "Old",
      "center",
    );
  } else if (mode === "filter" || mode === "phone") {
    heading(
      mode === "phone"
        ? "A voice can cover the trace."
        : "Can the trace survive processing?",
      mode === "phone"
        ? "The pattern can remain beneath another sound."
        : "Compare the pattern before and after.",
    );
    smallGraph(500, 250, [{ color: RED, fn: e.pitch() }], "Original signal");
    smallGraph(
      1100,
      290,
      [{ color: t < 148.54 ? "#ab8d7e" : RED, fn: e.pitch() }],
      mode === "phone"
        ? t < 156.16
          ? "Speech over the recording"
          : "Through a phone call"
        : t < 146.74
          ? "Low notes reduced"
          : t < 148.54
            ? "MP3 compression"
            : "Gain increased",
    );
    e.note(
      "Schematic comparison; processing experiments are not reproduced.",
      1490,
    );
  } else if (mode === "credits") {
    heading(
      "Months of listening.",
      "Investigation credited to ColstO in the original narration.",
    );
    slip(1040, 380);
    e.text("5,000 lines of code", 540, 1140, 60, C.ink, "Old", "center");
    const words = ["Record", "Predict", "Compare", "Locate"];
    words.forEach((s, i) => {
      e.text(s, 160 + i * 250, 1280, 31, i < 3 ? BLUE : RED, "Old", "center");
      if (i < 3)
        e.travel(
          [220 + i * 250, 1330],
          [330 + i * 250, 1330],
          clamp(u * 4 - i),
          BLUE,
        );
    });
  } else {
    heading(
      "Every place hears a different sky.",
      "The recording preserves that particular point of view.",
    );
    smallGraph(
      1170,
      225,
      [{ color: RED, fn: e.pitch() }],
      "A flight. A listener. A distinctive sound.",
    );
  }
}
