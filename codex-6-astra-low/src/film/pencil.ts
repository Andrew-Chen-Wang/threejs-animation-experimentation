import * as T from "three";
import {
  C,
  World,
  plane,
  solid,
  box,
  line,
  random,
  ease,
  clamp,
} from "./world";
import { SOUND_SPEED } from "./physics";
const INK = "#49463c",
  BLUE = "#336b82";
const vertex = `varying vec3 wp;varying vec3 wn;void main(){vec4 p=modelMatrix*vec4(position,1.);wp=p.xyz;wn=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*p;}`;
/** Hatching is attached to the surfaces, so it follows camera motion without crawling. */
function graphite(color: T.Color) {
  return new T.ShaderMaterial({
    uniforms: { base: { value: color } },
    vertexShader: vertex,
    fragmentShader: `varying vec3 wp;varying vec3 wn;uniform vec3 base;
float stripe(float q,float width){float d=abs(fract(q)-.5);float aa=max(fwidth(q)*.55,.025);return 1.-smoothstep(width,width+aa,d);}
void main(){vec3 n=normalize(wn);float shade=1.-max(0.,dot(n,normalize(vec3(-.6,1.,.5))));shade=floor(shade*5.)/5.;vec3 an=abs(n);vec2 uv=an.y>max(an.x,an.z)?wp.xz:(an.x>an.z?wp.zy:wp.xy);float a=stripe((uv.x+uv.y*.74)*10.,.025);float b=stripe((uv.x-uv.y*.68)*13.,.02);float hatch=a*smoothstep(.05,.85,shade)*.33+b*smoothstep(.6,1.,shade)*.18;float grain=fract(sin(dot(floor(uv*85.),vec2(12.9898,78.233)))*43758.5453);vec3 col=base*(1.-shade*.17);col=mix(col,vec3(.20,.19,.16),hatch);col*=.98+grain*.04;gl_FragColor=vec4(col,1.);
#include <colorspace_fragment>
}`,
  });
}
export class PencilWorld {
  scene: T.Scene;
  camera: T.PerspectiveCamera;
  r: T.WebGLRenderer;
  land: T.Group;
  aircraft: T.Group;
  aircraft2 = plane();
  micMarkers: T.Group[] = [];
  routes = new T.Group();
  country = new T.Group();
  props = new T.Group();
  waveRings: T.Mesh[] = [];
  color: T.WebGLRenderTarget;
  normals: T.WebGLRenderTarget;
  normalMat = new T.MeshNormalMaterial();
  quadScene = new T.Scene();
  quadCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  finish: T.ShaderMaterial;
  pen: T.Group;
  phone: T.Group;
  paper: T.Group;
  cell = new T.Group();
  trails: T.Line[] = [];
  positions = [
    new T.Vector3(-9, 0, 6),
    new T.Vector3(0, 0, 0),
    new T.Vector3(11, 0, 7),
  ];
  constructor(
    public world: World,
    usa: any,
  ) {
    this.scene = world.scene;
    this.camera = world.camera;
    this.r = world.renderer;
    this.land = world.rural.group;
    this.aircraft = world.aircraft;
    world.rural.pole.position.set(0, 0, 0);
    this.scene.fog = null;
    this.scene.add(this.aircraft2, this.routes, this.country, this.props);
    this.color = new T.WebGLRenderTarget(1080, 1920, { samples: 4 });
    this.normals = new T.WebGLRenderTarget(1080, 1920);
    this.normals.depthTexture = new T.DepthTexture(
      1080,
      1920,
      T.UnsignedIntType,
    );
    this.finish = new T.ShaderMaterial({
      uniforms: {
        colorTex: { value: this.color.texture },
        normalTex: { value: this.normals.texture },
        depthTex: { value: this.normals.depthTexture },
        pixel: { value: new T.Vector2(1 / 1080, 1 / 1920) },
      },
      vertexShader:
        "varying vec2 uvv;void main(){uvv=uv;gl_Position=vec4(position.xy,0.,1.);}",
      fragmentShader: `varying vec2 uvv;uniform sampler2D colorTex,normalTex,depthTex;uniform vec2 pixel;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec3 col=texture2D(colorTex,uvv).rgb;vec3 n=texture2D(normalTex,uvv).rgb;float z=texture2D(depthTex,uvv).x;float edge=0.;for(int i=0;i<4;i++){float a=float(i)*1.570796;vec2 u=uvv+vec2(cos(a),sin(a))*pixel*1.45;vec3 nn=texture2D(normalTex,u).rgb;float zz=texture2D(depthTex,u).x;float dn=length(n-nn);float dz=abs(z-zz)/max(.0003,1.-z);edge=max(edge,max(smoothstep(.18,.45,dn),smoothstep(.018,.07,dz)));}float g=hash(floor(gl_FragCoord.xy));edge*=.55+.3*g;col=mix(col,vec3(.24,.225,.19),edge);float fibers=sin(gl_FragCoord.y*2.7+sin(gl_FragCoord.x*.07))*sin(gl_FragCoord.x*.61);col*=.98+.02*g+.006*fibers;gl_FragColor=vec4(col,1.);
#include <colorspace_fragment>
}`,
    });
    this.quadScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), this.finish));
    // Small town and utility infrastructure give the flight a tangible setting.
    for (let i = 0; i < 9; i++) {
      const x = -14 + (i % 3) * 4.5,
        z = -10 - Math.floor(i / 3) * 5;
      const house = new T.Group();
      house.position.set(x, 0, z);
      this.land.add(house);
      box(house, 0, 0.9, 0, 2.7, 1.8, 3.2, C.light);
      const roof = solid(new T.ConeGeometry(2.3, 1.25, 4), "#bbb6a0");
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 2.42;
      house.add(roof);
      box(house, 0, 0.7, 1.62, 0.55, 1.4, 0.04, INK);
      for (const xx of [-0.85, 0.85])
        box(house, xx, 1.05, 1.64, 0.43, 0.52, 0.04, "#aaa792");
      box(house, 0.7, 2.7, -0.6, 0.3, 1.1, 0.3, C.paper);
    }
    for (let i = 0; i < 10; i++) {
      const z = -27 + i * 6;
      box(this.land, -3, 2.8, z, 0.12, 5.6, 0.12, INK);
      box(this.land, -3, 5.2, z, 1.5, 0.12, 0.12, INK);
      if (i < 9)
        for (const x of [-3.6, -2.4]) {
          const p: number[][] = [];
          for (let j = 0; j <= 16; j++) {
            const u = j / 16;
            p.push([x, 5.2 - Math.sin(u * Math.PI) * 0.35, z + u * 6]);
          }
          line(this.land, p, INK, 0.6);
        }
    }
    // Pencilled low hills beyond the foreground fields, with contour lines.
    const rr = random(763);
    for (let i = 0; i < 8; i++) {
      const hill = solid(new T.IcosahedronGeometry(8 + rr() * 5, 1), "#d7d2be");
      hill.scale.set(1, 0.22, 0.8);
      hill.position.set(-40 + i * 12, -0.2, -44 - rr() * 10);
      this.land.add(hill);
    }
    for (let i = 0; i < 3; i++) {
      const pin = new T.Group();
      pin.position.copy(this.positions[i]);
      this.land.add(pin);
      const ring = new T.Mesh(
        new T.RingGeometry(1.2, 1.28, 64),
        new T.MeshBasicMaterial({
          color: i === 1 ? C.red : BLUE,
          side: T.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.12;
      pin.add(ring);
      line(
        pin,
        [
          [0, 0.15, 0],
          [0, 5, 0],
        ],
        BLUE,
        0.8,
      );
      const tip = solid(new T.SphereGeometry(0.3, 12, 8), BLUE);
      tip.position.y = 5;
      pin.add(tip);
      this.micMarkers.push(pin);
    }
    for (let i = 0; i < 30; i++) {
      const q = new T.Mesh(
        new T.RingGeometry(0.993, 1, 128),
        new T.MeshBasicMaterial({
          color: C.red,
          side: T.DoubleSide,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        }),
      );
      this.scene.add(q);
      this.waveRings.push(q);
    }
    // Raised map: a physical sheet of topography rather than a full-screen chart.
    for (const poly of usa)
      for (const ring of poly) {
        if (
          !ring.some(
            ([x, y]: number[]) => x > -126 && x < -65 && y > 25 && y < 50,
          )
        )
          continue;
        const shape = new T.Shape();
        ring.forEach(([x, y]: number[], i: number) => {
          const a = (x + 96) * 0.55,
            b = (y - 37) * 0.7;
          i ? shape.lineTo(a, b) : shape.moveTo(a, b);
        });
        shape.closePath();
        const g = new T.ExtrudeGeometry(shape, {
          depth: 0.45,
          bevelEnabled: false,
        });
        g.rotateX(-Math.PI / 2);
        this.country.add(solid(g, "#d5d0b9"));
      }
    box(this.country, 0, -0.65, 0, 38, 0.25, 23, C.light);
    for (let i = -18; i <= 18; i++)
      line(
        this.country,
        [
          [i, -0.48, -11],
          [i, -0.48, 11],
        ],
        "#918b79",
        0.2,
      );
    for (let i = -11; i <= 11; i++)
      line(
        this.country,
        [
          [-18, -0.48, i],
          [18, -0.48, i],
        ],
        "#918b79",
        0.2,
      );
    const rr2 = random(90);
    for (let i = 0; i < 48; i++) {
      const x = -14 + rr2() * 27,
        z = -6 + rr2() * 11;
      const h = 0.2 + rr2() * 1.4;
      box(this.country, x, h / 2, z, 0.1, h, 0.1, BLUE);
    }
    this.pen = new T.Group();
    const pencil = solid(new T.CylinderGeometry(0.13, 0.13, 8, 6), "#555044");
    pencil.rotation.z = Math.PI / 2;
    this.pen.add(pencil);
    const point = solid(new T.ConeGeometry(0.13, 0.8, 6), "#b9a98a");
    point.rotation.z = -Math.PI / 2;
    point.position.x = 4.4;
    this.pen.add(point);
    this.props.add(this.pen);
    this.paper = new T.Group();
    box(this.paper, 0, 0, 0, 12, 0.08, 8, C.light);
    for (let i = 0; i < 11; i++)
      line(
        this.paper,
        [
          [-5, 0.06, -3 + i * 0.57],
          [5, 0.06, -3 + i * 0.57],
        ],
        "#aaa28c",
        0.22,
      );
    this.props.add(this.paper);
    this.phone = new T.Group();
    box(this.phone, 0, 0.2, 0, 4, 0.4, 7.8, INK);
    box(this.phone, 0, 0.43, 0, 3.6, 0.04, 7.3, C.light);
    box(this.phone, 0, 0.47, -3.15, 0.8, 0.03, 0.12, INK);
    this.props.add(this.phone);
    for (let i = 0; i < 14; i++) {
      const points: number[][] = [];
      const x0 = -14 + (i % 4) * 5,
        z0 = -5 + (i % 3) * 3,
        x1 = 9 + (i % 3) * 2,
        z1 = 3 - (i % 4) * 2;
      for (let j = 0; j <= 80; j++) {
        const f = j / 80;
        points.push([
          x0 + (x1 - x0) * f,
          0.6 + Math.sin(f * Math.PI) * (2 + (i % 3)),
          z0 + (z1 - z0) * f,
        ]);
      }
      const route = line(this.country, points, i % 4 === 0 ? BLUE : INK, 0.3);
      this.trails.push(route);
    }
    this.country.add(this.cell);
    box(this.cell, 0, 0.95, 0, 1.6, 0.04, 1.6, C.red);
    for (let i = -5; i <= 5; i++) {
      line(
        this.cell,
        [
          [-5.6, 0.9, i * 1.6 + 0.8],
          [5.6, 0.9, i * 1.6 + 0.8],
        ],
        INK,
        0.45,
      );
      line(
        this.cell,
        [
          [i * 1.6 + 0.8, 0.9, -5.6],
          [i * 1.6 + 0.8, 0.9, 5.6],
        ],
        INK,
        0.45,
      );
    }
    this.convert(this.scene);
  }
  convert(root: T.Object3D) {
    const cache = new Map<number, T.Material>();
    root.traverse((o: any) => {
      if (
        o.isMesh &&
        o.material?.isMeshBasicMaterial &&
        !o.material.transparent
      ) {
        const old = o.material as T.MeshBasicMaterial;
        const key = old.color.getHex();
        if (!cache.has(key)) cache.set(key, graphite(old.color.clone()));
        o.material = cache.get(key);
      } else if (o.isLineSegments) {
        o.visible = false;
      }
    });
  }
  project(v: T.Vector3): [number, number] {
    const p = v.clone().project(this.camera);
    return [(p.x * 0.5 + 0.5) * 1080, (-p.y * 0.5 + 0.5) * 1920];
  }
  render(t: number, mode: string, u: number) {
    const map =
      ["traffic", "locate"].includes(mode) || (mode === "search" && t >= 74.68);
    const desk = [
      "spectrum",
      "pair",
      "filter",
      "phone",
      "credits",
      "retest",
    ].includes(mode);
    this.land.visible = !map && !desk;
    this.country.visible = map;
    this.cell.visible = mode === "locate";
    this.trails.forEach((r, i) => {
      r.visible = mode !== "locate";
      r.geometry.setDrawRange(0, Math.floor(81 * clamp(u * 1.15 - i * 0.018)));
    });
    this.props.visible = desk;
    this.routes.visible = true;
    this.world.rings.forEach((r) => (r.visible = false));
    this.world.grid.visible = mode === "locate";
    this.micMarkers.forEach(
      (p) =>
        (p.visible = ["search", "silence", "flight", "match"].includes(mode)),
    );
    this.aircraft.visible = !desk && !["camera", "reveal"].includes(mode);
    this.aircraft2.visible =
      ["pair", "search", "silence"].includes(mode) && !desk;
    const a = this.aircraft;
    a.position.set(-12 + u * 24, 8.5, 0);
    a.rotation.set(0, -Math.PI / 2, 0.04 * Math.sin(t));
    a.userData.prop.rotation.z = t * 37;
    this.aircraft2.position.set(14 - u * 25, 11, -7);
    this.aircraft2.rotation.y = Math.PI / 2;
    this.aircraft2.userData.prop.rotation.z = t * 41;
    const pos = new T.Vector3(),
      target = new T.Vector3();
    this.camera.fov = 36;
    this.camera.aspect = 9 / 16;
    if (map) {
      this.country.rotation.y = -0.12 + u * 0.12;
      pos.set(12 - 3 * u, 64 - 6 * u, 72 - 5 * u);
      target.set(0, -3, 0);
      a.position.set(-12 + u * 24, 5, -2);
      a.scale.setScalar(0.7);
      if (mode === "locate") {
        pos.set(24 - 18 * ease(u), 56 - 41 * ease(u), 65 - 46 * ease(u));
        target.set(1, 0, 0);
      }
    } else if (desk) {
      pos.set(10 - 3 * u, 20 - 3 * u, 21);
      target.set(0, 0, 0);
      this.pen.position.set(6 + Math.sin(t * 0.6), 0.5, -2 + Math.cos(t * 0.6));
      this.pen.rotation.y = -0.55 + u * 0.12;
      this.paper.position.set(-2, 0, 0);
      this.paper.rotation.y = -0.12;
      this.phone.visible = mode === "phone";
      this.phone.position.set(0, 0.3, -0.6);
      this.phone.scale.setScalar(1.5);
      this.phone.rotation.y = -0.16;
      this.paper.visible = mode !== "phone";
    } else if (mode === "camera" || mode === "reveal") {
      pos.set(10 - 3 * u, 8.5, 17 - 3 * u);
      target.set(0, 3.6, 0);
    } else if (mode === "doppler") {
      const now = (t - 39.74) * 5.5 + 400 / SOUND_SPEED;
      a.position.set((60 * now) / 100, 8.6, 0);
      pos.set(18, 17, 31);
      target.set(0, 4, 0);
    } else if (mode === "delay") {
      pos.set(17 - u * 3, 17, 30);
      target.set(0, 5, 0);
      a.position.set(-7 + u * 19, 9, 0);
    } else if (mode === "flight") {
      a.position.set(
        -9 + u * 18,
        8 + Math.sin(u * 3),
        -3 + Math.sin(u * 3) * 3,
      );
      a.rotation.z = 0.16 * Math.sin(u * 4);
      pos.set(a.position.x + 11, 13, 24);
      target.copy(a.position);
      target.y = 4.5;
    } else if (["search", "silence", "match"].includes(mode)) {
      pos.set(23 - u * 5, 24 - u * 3, 36);
      target.set(0, 2.5, 2);
    } else {
      pos.set(20 - 5 * u, 15 - 2 * u, 33 - 4 * u);
      target.set(0, 3.5, 0);
    }
    if (mode === "doppler" && t >= 42.44) {
      this.aircraft2.visible = true;
      this.aircraft2.rotation.y = -Math.PI / 2;
      const q = t < 45 ? clamp((t - 42.44) / 2.56) : clamp((t - 45) / 3.44);
      if (t < 45) {
        a.position.set(-10.2 + 20.4 * q, 8.6, 0);
        this.aircraft2.position.set(-3.6 + 7.2 * q, 8.6, 0);
      } else {
        a.position.set(-10 + 20 * q, 8.6, 0);
        this.aircraft2.position.set(
          -10 + 20 * q,
          8.6,
          -Math.sqrt(950 * 950 - 400 * 400) / 100,
        );
      }
    }
    if (!map) a.scale.setScalar(1.05);
    this.camera.position.copy(pos);
    this.camera.lookAt(target);
    this.camera.updateProjectionMatrix();
    // Actual spherical wavefront cross sections: fixed emission centers, expanding radii.
    const doppler = mode === "doppler",
      sim = doppler ? (t - 39.74) * 5.5 + 400 / SOUND_SPEED : t;
    const speed = doppler ? 0.6 : 1.7,
      first = Math.floor(sim / 1.35) * 1.35;
    this.waveRings.forEach((r, i) => {
      const idx = Math.floor(i / 3),
        axis = i % 3,
        emit = first - idx * 1.35,
        age = sim - emit,
        radius = age * (doppler ? 3.43 : 2.5);
      r.visible =
        !(mode === "doppler" && t >= 42.44) &&
        !desk &&
        !map &&
        ["opening", "doppler", "delay", "flight", "ending"].includes(mode) &&
        radius > 0.1 &&
        radius < 29;
      r.position.set(
        doppler ? speed * emit : a.position.x - age * speed,
        8.6,
        0,
      );
      r.rotation.set(
        axis === 0 ? Math.PI / 2 : 0,
        axis === 1 ? Math.PI / 2 : 0,
        0,
      );
      r.scale.setScalar(Math.max(0.01, radius));
      (r.material as T.MeshBasicMaterial).opacity =
        (1 - radius / 30) * (axis === 0 ? 0.38 : 0.17);
    });
    // Three candidate listening paths rise through the same world.
    while (this.routes.children.length) {
      const o = this.routes.children.pop() as any;
      o.geometry?.dispose();
      o.material?.dispose();
    }
    if (["search", "silence", "flight", "match"].includes(mode))
      this.positions.forEach((p, i) => {
        const pts: number[][] = [];
        for (let j = 0; j <= 50; j++) {
          const f = j / 50;
          pts.push([
            a.position.x * (1 - f) + p.x * f,
            a.position.y * (1 - f) + 0.2 * f + Math.sin(f * Math.PI) * 2,
            a.position.z * (1 - f) + p.z * f,
          ]);
        }
        line(this.routes, pts, i === 1 ? C.red : BLUE, 0.6);
      });
    this.scene.background = new T.Color(C.paper);
    this.r.setRenderTarget(this.color);
    this.r.render(this.scene, this.camera);
    const hidden: T.Object3D[] = [];
    this.scene.traverse((o: any) => {
      if (
        o.visible &&
        (o.isLine || o.isSprite || (o.isMesh && o.material?.transparent))
      ) {
        hidden.push(o);
        o.visible = false;
      }
    });
    this.scene.overrideMaterial = this.normalMat;
    this.scene.background = new T.Color("#8080ff");
    this.r.setRenderTarget(this.normals);
    this.r.render(this.scene, this.camera);
    this.scene.overrideMaterial = null;
    hidden.forEach((o) => (o.visible = true));
    this.scene.background = new T.Color(C.paper);
    this.r.setRenderTarget(null);
    this.r.render(this.quadScene, this.quadCamera);
    return this.r.domElement;
  }
}
