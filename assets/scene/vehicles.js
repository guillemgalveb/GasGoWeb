import * as T from './vendor/three.module.min.js';
import { box, group, materials as m, mesh, shell, standard } from './model.js';

function loft(parent, material, rings) {
  const vertices = [], indices = [];
  for (const [z, width, base, top] of rings) {
    vertices.push(-width * .88, base, z, -width, base + .18, z,
      -width * .96, top - .07, z, -width * .79, top, z,
      width * .79, top, z, width * .96, top - .07, z,
      width, base + .18, z, width * .88, base, z);
  }
  for (let j = 0; j < rings.length - 1; j++) {
    for (let k = 0; k < 8; k++) {
      const a = 8 * j + k, b = 8 * j + (k + 1) % 8;
      indices.push(a, b, a + 8, b, b + 8, a + 8);
    }
  }
  for (let k = 1; k < 7; k++) {
    const end = vertices.length / 3 - 8;
    indices.push(0, k + 1, k, end, end + k, end + k + 1);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mesh(parent, geometry, material);
}

export function vehicle(scene, x, z, color, ev = false) {
  const car = group(scene, x, 0, z);
  car.rotation.y = ev ? -.62 : -.9;
  const paint = new T.MeshPhysicalMaterial({ color, metalness: .63, roughness: .22, clearcoat: 1, clearcoatRoughness: .16, side: T.DoubleSide });
  const glass = m.tinted.clone();
  glass.side = T.DoubleSide;
  const body = loft(car, paint, [
    [-2.38, .81, .45, .83], [-2.21, .99, .39, 1], [-1.58, 1.02, .39, 1.1],
    [-.83, .97, .39, 1.13], [.35, .96, .39, 1.13], [1.32, 1.02, .38, 1.09],
    [2.11, .98, .39, 1.03], [2.34, .84, .49, .91],
  ]);
  body.userData.zone = ev ? 4 : 1;
  loft(car, glass, [[-1.36, .87, 1.05, 1.07], [-.61, .76, 1.12, 1.55],
    [-.2, .75, 1.12, 1.63], [.45, .75, 1.12, 1.62], [1.04, .83, 1.08, 1.29],
    [1.55, .87, 1.06, 1.08]]);
  loft(car, paint, [[-.63, .59, 1.48, 1.56], [-.17, .62, 1.56, 1.64], [.43, .61, 1.55, 1.63], [.77, .56, 1.39, 1.47]]);
  shell(car, m.frame, 0, .61, 2.27, 1.78, .26, .16, .11);
  shell(car, m.frame, 0, .59, -2.28, 1.78, .27, .16, .1);
  box(car, m.red, 0, .94, 2.29, 1.6, .038, .025);
  box(car, m.steel, 0, .72, 2.36, .4, .11, .019);
  const tyre = new T.CylinderGeometry(.4, .4, .25, 26);
  const hub = new T.CylinderGeometry(.27, .27, .037, 24);
  const wheels = [];
  for (const side of [-1, 1]) {
    box(car, m.red, side * .69, .92, 2.32, .43, .075, .045);
    box(car, m.warm, side * .67, .84, -2.31, .43, .07, .036);
    box(car, paint, side * 1.03, 1.18, -.56, .26, .12, .23);
    for (const z of [-1.47, 1.48]) {
      const wheel = group(car, side * .96, .42, z);
      wheels.push(wheel);
      mesh(wheel, tyre, m.rubber).rotation.z = Math.PI / 2;
      mesh(wheel, hub, m.frame, side * .135).rotation.z = Math.PI / 2;
      for (let i = 0; i < 7; i++) {
        const angle = i * Math.PI * 2 / 7;
        const spoke = box(wheel, m.steel, side * .16, Math.cos(angle) * .12,
          Math.sin(angle) * .12, .024, .25, .026);
        spoke.rotation.x = angle;
      }
    }
  }
  car.userData.wheels = wheels;
  return car;
}
