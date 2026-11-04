import * as T from "three";
export const C = {
  paper: "#e8e5d6",
  ink: "#383b32",
  muted: "#929381",
  red: "#ae4032",
  light: "#f7f4e8",
  land: "#d4d3bf",
};
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const ease = (v: number) => {
  v = clamp(v);
  return v * v * (3 - 2 * v);
};
export function random(seed: number) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}
const mats = new Map<string, T.MeshBasicMaterial>();
export function mat(c: string) {
  if (!mats.has(c))
    mats.set(
      c,
      new T.MeshBasicMaterial({
        color: c,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    );
  return mats.get(c)!;
}
export function solid(g: T.BufferGeometry, color = C.paper, outline = true) {
  const o = new T.Group();
  o.add(new T.Mesh(g, mat(color)));
  if (outline) {
    const l = new T.LineSegments(
      new T.EdgesGeometry(g, 26),
      new T.LineBasicMaterial({
        color: C.ink,
        transparent: true,
        opacity: 0.75,
      }),
    );
    o.add(l);
  }
  return o;
}
export function box(
  p: T.Object3D,
  x: number,
  y: number,
  z: number,
  a: number,
  b: number,
  c: number,
  color = C.paper,
) {
  const o = solid(new T.BoxGeometry(a, b, c), color);
  o.position.set(x, y, z);
  p.add(o);
  return o;
}
export function line(
  p: T.Object3D,
  pts: number[][],
  color = C.ink,
  opacity = 1,
) {
  const g = new T.BufferGeometry().setFromPoints(
    pts.map((v) => new T.Vector3(...(v as [number, number, number]))),
  );
  const o = new T.Line(
    g,
    new T.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
  );
  p.add(o);
  return o;
}
export function plane() {
  const p = new T.Group();
  const profile = [
    [-1.65, 0.08],
    [-1.4, 0.26],
    [-0.8, 0.34],
    [0.25, 0.29],
    [1.15, 0.13],
    [1.55, 0.04],
  ];
  const verts: number[] = [],
    ids: number[] = [];
  for (const [z, r] of profile)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      verts.push(Math.cos(a) * r, Math.sin(a) * r, z);
    }
  for (let j = 0; j < profile.length - 1; j++)
    for (let i = 0; i < 12; i++) {
      const a = j * 12 + i,
        b = j * 12 + ((i + 1) % 12);
      ids.push(a, b, a + 12, b, b + 12, a + 12);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
  geo.setIndex(ids);
  geo.computeVertexNormals();
  p.add(solid(geo, C.light));
  function wing(points: number[][], y: number, depth: number) {
    const shape = new T.Shape();
    points.forEach(([x, z], i) =>
      i ? shape.lineTo(x, z) : shape.moveTo(x, z),
    );
    shape.closePath();
    const g = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    const o = solid(g, C.light);
    o.position.y = y;
    p.add(o);
    return o;
  }
  wing(
    [
      [-2.6, 0.15],
      [-2.55, -0.25],
      [-0.4, -0.62],
      [0.4, -0.62],
      [2.55, -0.25],
      [2.6, 0.15],
      [0.4, 0.12],
      [-0.4, 0.12],
    ],
    0.23,
    0.08,
  );
  wing(
    [
      [-1, 1.3],
      [-0.95, 0.95],
      [0, 0.8],
      [0.95, 0.95],
      [1, 1.3],
    ],
    0.18,
    0.06,
  );
  const tail = new T.Shape();
  tail.moveTo(0.85, 0.1);
  tail.lineTo(1.15, 0.85);
  tail.lineTo(1.48, 0.85);
  tail.lineTo(1.5, 0.08);
  const tg = new T.ExtrudeGeometry(tail, { depth: 0.055, bevelEnabled: false });
  tg.rotateY(-Math.PI / 2);
  const fin = solid(tg, C.light);
  p.add(fin);
  const glass = box(p, 0, 0.27, -0.48, 0.48, 0.25, 0.62, C.ink);
  glass.rotation.x = 0.2;
  for (const x of [-1, 1]) {
    line(
      p,
      [
        [x * 1.7, 0.18, 0],
        [x * 0.25, -0.27, 0.12],
      ],
      C.ink,
    );
    line(
      p,
      [
        [x * 0.32, 0.06, -0.6],
        [x * 0.58, -0.58, -0.6],
      ],
      C.ink,
    );
    const wheel = solid(new T.CylinderGeometry(0.17, 0.17, 0.13, 12), C.ink);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x * 0.58, -0.58, -0.6);
    p.add(wheel);
    line(
      p,
      [
        [x * 0.5, 0.24, -0.6],
        [x * 2.5, 0.24, -0.25],
      ],
      C.muted,
    );
  }
  const prop = box(p, 0, 0, -1.72, 0.08, 1.5, 0.045, C.ink);
  const hub = solid(new T.SphereGeometry(0.15, 12, 6), C.red);
  hub.position.z = -1.72;
  p.add(hub);
  p.userData.prop = prop;
  for (let z = -0.1; z < 1.2; z += 0.3) {
    const q = solid(
      new T.TorusGeometry(0.27 - (z + 0.1) * 0.17, 0.006, 3, 12),
      C.muted,
      false,
    );
    q.position.z = z;
    p.add(q);
  }
  return p;
}
function tree(
  p: T.Object3D,
  x: number,
  z: number,
  size: number,
  r: () => number,
) {
  const g = new T.Group();
  g.position.set(x, 0, z);
  p.add(g);
  box(g, 0, size * 0.6, 0, 0.13, size * 1.2, 0.13, C.ink);
  for (let i = 0; i < 3; i++) {
    const o = solid(
      new T.IcosahedronGeometry(size * (0.57 + r() * 0.16), 1),
      i === 0 ? "#939b80" : "#b7bda1",
    );
    o.position.set(
      (r() - 0.5) * size * 0.6,
      size * (1.2 + i * 0.22),
      (r() - 0.5) * size * 0.5,
    );
    g.add(o);
  }
}
export function landscape() {
  const g = new T.Group(),
    r = random(48);
  box(g, 0, -0.3, 0, 65, 0.5, 65, C.land);
  for (let i = 0; i < 30; i++) {
    const x = (i % 6) * 10 - 25,
      z = Math.floor(i / 6) * 12 - 26;
    box(
      g,
      x,
      -0.035,
      z,
      9.7,
      0.025,
      11.7,
      ["#dedcca", "#d3d3be", "#e6e2ce", "#c4c7b1"][i % 4],
    );
    for (let j = 0; j < 12; j++)
      line(
        g,
        [
          [x - 4.6, 0.005, z - 5.3 + j * 0.85],
          [x + 4.6, 0.005, z - 5.3 + j * 0.85],
        ],
        "#aaaF99",
        0.25,
      );
  }
  box(g, 0, 0.025, 0, 2.5, 0.04, 65, "#c1c2b0");
  for (const x of [-1.12, 1.12])
    line(
      g,
      [
        [x, 0.06, -32],
        [x, 0.06, 32],
      ],
      C.light,
    );
  for (let z = -30; z < 32; z += 3) box(g, 0, 0.06, z, 0.05, 0.02, 1, C.light);
  for (let i = 0; i < 70; i++) {
    const x = (r() - 0.5) * 58,
      z = (r() - 0.5) * 58;
    if (Math.abs(x) > 3) tree(g, x, z, 0.65 + r() * 0.85, r);
  }
  const barn = new T.Group();
  barn.position.set(9, 0, -5);
  g.add(barn);
  box(barn, 0, 1.1, 0, 4, 2.2, 5, C.light);
  const roof = solid(new T.ConeGeometry(3.6, 1.4, 4), C.muted);
  roof.rotation.y = Math.PI / 4;
  roof.scale.z = 1.2;
  roof.position.y = 2.9;
  barn.add(roof);
  box(barn, 0, 0.8, 2.52, 1.4, 1.6, 0.05, C.ink);
  for (let i = 0; i < 14; i++) {
    const z = i * 2 - 13;
    box(g, 3, 0.45, z, 0.09, 0.9, 0.09, C.ink);
  }
  line(
    g,
    [
      [3, 0.35, -13],
      [3, 0.35, 13],
    ],
    C.ink,
  );
  line(
    g,
    [
      [3, 0.7, -13],
      [3, 0.7, 13],
    ],
    C.ink,
  );
  const pole = new T.Group();
  pole.position.set(3, 0, 2);
  g.add(pole);
  box(pole, 0, 2.4, 0, 0.17, 4.8, 0.17, C.ink);
  box(pole, -0.45, 4.6, 0, 1, 0.1, 0.1);
  const cam = box(pole, -0.85, 4.6, -0.08, 0.42, 0.3, 0.65, C.light);
  cam.rotation.x = 0.2;
  box(cam, 0, 0, -0.34, 0.25, 0.18, 0.04, C.ink);
  return { group: g, pole };
}
export class World {
  renderer: T.WebGLRenderer;
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(37, 9 / 16, 0.1, 500);
  rural = landscape();
  aircraft = plane();
  rings: T.Mesh[] = [];
  grid = new T.Group();
  constructor() {
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(1080, 1920);
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(C.paper);
    this.scene.fog = new T.Fog(C.paper, 65, 150);
    this.scene.add(this.rural.group, this.aircraft, this.grid);
    for (let i = 0; i < 12; i++) {
      const m = new T.Mesh(
        new T.RingGeometry(0.985, 1, 128),
        new T.MeshBasicMaterial({
          color: C.red,
          transparent: true,
          opacity: 0.3,
          side: T.DoubleSide,
          depthWrite: false,
        }),
      );
      m.rotation.x = -Math.PI / 2;
      this.scene.add(m);
      this.rings.push(m);
    }
    for (let i = -12; i <= 12; i++) {
      line(
        this.grid,
        [
          [-18, 0.12, i * 1.5],
          [18, 0.12, i * 1.5],
        ],
        C.red,
        0.22,
      );
      line(
        this.grid,
        [
          [i * 1.5, 0.12, -18],
          [i * 1.5, 0.12, 18],
        ],
        C.red,
        0.22,
      );
    }
  }
  render(t: number, mode: string, u: number) {
    this.rural.group.visible = true;
    this.grid.visible = mode === "locate";
    this.aircraft.visible = !["camera", "reveal"].includes(mode);
    const a = this.aircraft;
    a.position.set(-10 + u * 20, 9, -4);
    a.rotation.set(0, -Math.PI / 2, 0.04 * Math.sin(t * 0.5));
    (a.userData.prop as T.Object3D).rotation.z = t * 42;
    let pos = new T.Vector3(),
      target = new T.Vector3(0, 2, 0);
    if (mode === "opening") {
      pos.set(25 - 8 * u, 24 - 8 * u, 32 - 3 * u);
      target.set(0, 3, 0);
    } else if (mode === "camera" || mode === "reveal") {
      pos.set(9 - 3 * u, 7 + u, 13 - 4 * u);
      target.set(2.4, 3, 1.5);
    } else if (mode === "doppler") {
      pos.set(17, 12, 24);
      a.position.set(-17 + u * 34, 7, 0);
      target.set(0, 4, 0);
    } else if (mode === "flight") {
      pos.set(a.position.x + 8, 13, 15);
      target.copy(a.position);
      target.y = 6;
      a.position.z = -4 + Math.sin(t * 0.3) * 3;
      a.position.y = 9 + Math.sin(t * 0.4);
      a.rotation.y = -Math.PI / 2 - Math.cos(t * 0.3) * 0.18;
      a.rotation.z = 0.14 * Math.sin(t * 0.3);
    } else if (mode === "delay") {
      pos.set(22, 29, 27);
      a.position.set(-15 + u * 30, 8, 0);
      target.set(0, 2, 0);
    } else if (mode === "locate") {
      pos.set(4 + u * 3, 33 - 20 * u, 25 - 12 * u);
      target.set(2, 0, 1);
    } else {
      pos.set(27 * Math.cos(0.4 + u * 0.25), 20, 30);
      target.set(0, 3, 0);
    }
    this.camera.position.copy(pos);
    this.camera.lookAt(target);
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i],
        age = (t * 0.6 + i / 12) % 1;
      ring.visible = [
        "opening",
        "doppler",
        "flight",
        "delay",
        "ending",
      ].includes(mode);
      ring.scale.setScalar(0.3 + age * 24);
      ring.position.set(
        a.position.x - age * 11,
        0.15 + i * 0.002,
        a.position.z,
      );
      (ring.material as T.MeshBasicMaterial).opacity = (1 - age) * 0.34;
    }
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement;
  }
}
