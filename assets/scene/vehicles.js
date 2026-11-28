import * as T from './vendor/three.module.min.js';
import { box, group, materials as m, mesh, shell, standard, tube } from './model.js';

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

let shadowMaterial;
const shadowGeometry = new T.PlaneGeometry(2.9, 5.6);
function contactShadow(car) {
  if (!shadowMaterial) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 13, 32, 32, 32);
    gradient.addColorStop(0, '#041311a8');
    gradient.addColorStop(1, '#04131100');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    shadowMaterial = new T.MeshBasicMaterial({ map: new T.CanvasTexture(canvas), transparent: true, depthWrite: false });
  }
  const shadow = mesh(car, shadowGeometry, shadowMaterial, 0, .029, 0);
  shadow.rotation.x = -Math.PI / 2;
  return shadow;
}

export function vehicle(scene, x, z, color, ev = false, van = false) {
  const car = group(scene, x, 0, z);
  contactShadow(car);
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
  if (van) {
    shell(car, paint, 0, 1.48, .28, 1.92, 1.18, 3.63, .19);
    shell(car, glass, 0, 1.58, -1.55, 1.63, .49, .03, .12);
    shell(car, glass, 0, 1.57, 2.11, 1.61, .54, .03, .1);
    for (const side of [-1, 1]) {
      for (const z of [-.88, .12, 1.34]) box(car, glass, side * .968, 1.61, z, .032, .45, .79);
    }
  } else {
    loft(car, glass, [[-1.36, .87, 1.05, 1.07], [-.61, .76, 1.12, 1.55],
      [-.2, .75, 1.12, 1.63], [.45, .75, 1.12, 1.62], [1.04, .83, 1.08, 1.29],
      [1.55, .87, 1.06, 1.08]]);
    loft(car, paint, [[-.63, .59, 1.48, 1.56], [-.17, .62, 1.56, 1.64], [.43, .61, 1.55, 1.63], [.77, .56, 1.39, 1.47]]);
  }
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
  car.userData.vehicleKind = van ? 'minivan' : 'car';
  return car;
}

export function motorcycle(scene, color, jacket) {
  const bike = group(scene, 0, 0, 0);
  contactShadow(bike).scale.set(.39, .51, 1);
  const paint = standard(color, .47, .34);
  const wheels = [];
  for (const z of [-.91, .91]) {
    const wheel = group(bike, 0, .32, z);
    wheels.push(wheel);
    mesh(wheel, new T.CylinderGeometry(.32, .32, .17, 18), m.rubber).rotation.z = Math.PI / 2;
    mesh(wheel, new T.CylinderGeometry(.22, .22, .19, 14), m.steel).rotation.z = Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const spoke = box(wheel, m.frame, 0, 0, 0, .205, .32, .036);
      spoke.rotation.x = i * Math.PI / 3;
    }
  }
  box(bike, m.frame, 0, .53, .16, .4, .35, .58);
  shell(bike, paint, 0, .92, -.32, .49, .43, .64, .14);
  shell(bike, m.rubber, 0, .91, .39, .45, .14, .75, .06);
  shell(bike, paint, 0, .77, .88, .41, .25, .32, .095);
  box(bike, m.red, 0, .84, 1.054, .24, .085, .045);
  box(bike, m.warm, 0, .99, -.95, .29, .14, .075);
  box(bike, m.steel, 0, 1.14, -.62, .72, .035, .036);

  for (const side of [-1, 1]) {
    tube(bike, m.steel, [[side * .115, .32, -.91], [side * .126, .7, -.77], [side * .145, 1.08, -.57]], .037);
    tube(bike, m.frame, [[side * .11, .35, .9], [side * .21, .49, .27], [side * .115, .73, -.44]], .041);
    box(bike, m.steel, side * .25, .43, .43, .09, .09, .74);
  }

  const rider = group(bike, 0, 0, 0);
  const cloth = standard(jacket);
  const torso = box(rider, cloth, 0, 1.19, .17, .43, .48, .3);
  torso.rotation.x = .34;
  mesh(rider, new T.IcosahedronGeometry(.17, 1), m.frame, 0, 1.54, .035);
  box(rider, m.tinted, 0, 1.54, -.097, .245, .1, .061);
  for (const side of [-1, 1]) {
    tube(rider, cloth, [[side * .18, 1.34, .1], [side * .23, 1.17, -.24], [side * .31, 1.14, -.61]], .059);
    tube(rider, m.frame, [[side * .13, .92, .32], [side * .28, .68, .03], [side * .27, .45, .24]], .071);
  }
  bike.userData.wheels = wheels;
  bike.userData.wheelRadius = .32;
  bike.userData.rider = rider;
  bike.userData.vehicleKind = 'motorcycle';
  return bike;
}
