import * as T from "three";
import { C, plane, box, line, solid } from "./world";
import { SOUND_SPEED } from "./physics";
/** Fixed overhead scene. A wave stays centered at the location where it was emitted. */
export class DopplerDemo {
  scene = new T.Scene();
  camera = new T.OrthographicCamera(-17, 17, 13, -13, 0.1, 100);
  aircraft = plane();
  listener = new T.Group();
  rings: T.Mesh[] = [];
  constructor() {
    this.scene.background = new T.Color(C.paper);
    this.camera.position.set(0, 50, 0);
    this.camera.up.set(0, 0, -1);
    this.camera.lookAt(0, 0, 0);
    this.aircraft.scale.setScalar(1.45);
    this.aircraft.rotation.y = -Math.PI / 2;
    this.scene.add(this.aircraft, this.listener);
    this.listener.scale.setScalar(1.5);
    const head = solid(new T.CapsuleGeometry(0.35, 0.6, 4, 8), C.red);
    head.position.y = 0.5;
    this.listener.add(head);
    box(this.listener, 0, 0, 0, 0.13, 0.3, 1.3, C.ink);
    box(this.listener, 0, 0, 0.7, 1.1, 0.15, 0.12, C.ink);
    line(
      this.scene,
      [
        [-16, 0, 0],
        [16, 0, 0],
      ],
      C.muted,
      0.5,
    );
    for (let i = 0; i < 18; i++) {
      const m = new T.Mesh(
        new T.RingGeometry(0.992, 1, 180),
        new T.MeshBasicMaterial({
          color: C.red,
          side: T.DoubleSide,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
        }),
      );
      m.rotation.x = -Math.PI / 2;
      this.scene.add(m);
      this.rings.push(m);
    }
  }
  render(renderer: T.WebGLRenderer, time: number, speed = 60, distance = 400) {
    this.aircraft.position.set((speed * time) / 100, 1, 0);
    this.aircraft.userData.prop.rotation.z = time * 25;
    this.listener.position.set(0, 0.4, distance / 100);
    const first = Math.floor(time / 1.4) * 1.4;
    this.rings.forEach((m, i) => {
      const emitted = first - i * 1.4,
        age = time - emitted,
        radius = (age * SOUND_SPEED) / 100;
      m.visible = radius > 0 && radius < 45;
      m.position.set((speed * emitted) / 100, 0.05, 0);
      m.scale.setScalar(Math.max(0.001, radius));
      (m.material as T.MeshBasicMaterial).opacity =
        0.65 * Math.max(0, 1 - radius / 50);
    });
    renderer.render(this.scene, this.camera);
    return renderer.domElement;
  }
}
