import * as T from './vendor/three.module.min.js';

export const standard = (color, metalness = 0, roughness = .45) =>
  new T.MeshStandardMaterial({ color, metalness, roughness });
export const glow = (color, intensity = 1) =>
  new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity });

export const materials = {
  green: standard(0x075043, .68, .24),
  frame: standard(0x142624, .62, .28),
  steel: standard(0x67746e, .76, .26),
  ceiling: standard(0x887053, .48, .35),
  base: standard(0x3a4540, .35),
  gold: glow(0xffae1d, 1.7),
  warm: glow(0xffe5aa, 2.2),
  cyan: glow(0x45d8b0, .9),
  red: glow(0xff2915, 2),
  rubber: standard(0x151716, .04, .78),
  tinted: standard(0x12332e, .65, .21),
  glass: new T.MeshPhysicalMaterial({ color: 0x94c8b3, transparent: true, opacity: .13, roughness: .14, metalness: .4, depthWrite: false, side: T.DoubleSide }),
};

const cube = new T.BoxGeometry();
export function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const part = new T.Mesh(geometry, material);
  part.position.set(x, y, z);
  parent.add(part);
  return part;
}
export function box(parent, material, x, y, z, w, h, d) {
  const part = mesh(parent, cube, material, x, y, z);
  part.scale.set(w, h, d);
  return part;
}
export function group(parent, x, y, z) {
  const part = new T.Group();
  part.position.set(x, y, z);
  parent.add(part);
  return part;
}
function rounded(w, h, r) {
  const s = new T.Shape();
  const x = w / 2, y = h / 2;
  s.moveTo(-x + r, -y);
  s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r);
  s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y);
  s.lineTo(-x + r, y); s.quadraticCurveTo(-x, y, -x, y - r);
  s.lineTo(-x, -y + r); s.quadraticCurveTo(-x, -y, -x + r, -y);
  return s;
}
export function shell(parent, material, x, y, z, w, h, d, r, horizontal = false) {
  const geo = new T.ExtrudeGeometry(rounded(w, h, r), { depth: d, bevelEnabled: false, curveSegments: 7 });
  geo.translate(0, 0, -d / 2);
  const part = mesh(parent, geo, material, x, y, z);
  if (horizontal) part.rotation.x = -Math.PI / 2;
  return part;
}
export function tube(parent, material, points, radius = .04, closed = false) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)), closed, 'centripetal');
  return mesh(parent, new T.TubeGeometry(curve, Math.max(18, points.length * 3), radius, 7, closed), material);
}
export function label(parent, text, x, y, z, width, height, color = '#ffe065') {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = '700 74px Roboto, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 64, 492);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  return mesh(parent, new T.PlaneGeometry(width, height), new T.MeshBasicMaterial({ map, transparent: true, depthWrite: false }), x, y, z);
}

export function canopy(scene, x, z, width, depth, height) {
  const roof = group(scene, x, 0, z);
  const m = materials;
  shell(roof, m.green, 0, height, 0, width, depth, .78, .8, true);
  shell(roof, m.gold, 0, height + .34, 0, width + .04, depth + .04, .045, .8, true);
  shell(roof, m.gold, 0, height - .34, 0, width + .06, depth + .06, .09, .8, true);
  shell(roof, m.ceiling, 0, height - .42, 0, width - .25, depth - .25, .1, .7, true);

  const boards = Math.floor(depth / .19);
  const slats = new T.InstancedMesh(cube, m.frame, boards);
  const matrix = new T.Matrix4();
  for (let i = 0; i < boards; i++) {
    matrix.makeScale(width - 1, .026, .035);
    matrix.setPosition(0, height - .482, (i - (boards - 1) / 2) * .19);
    slats.setMatrixAt(i, matrix);
  }
  roof.add(slats);
  const spotlight = new T.CylinderGeometry(.14, .14, .04, 20);
  for (const offset of [-.34, 0, .34]) {
    for (const dz of [-depth * .31, depth * .31]) {
      mesh(roof, spotlight, m.warm, width * offset, height - .51, dz);
    }
  }
  for (const dx of [-width * .34, width * .34]) {
    for (const dz of [-depth * .29, depth * .29]) {
      box(roof, m.frame, dx, height / 2, dz, .53, height, .55);
      box(roof, m.steel, dx, height / 2, dz + .29, .44, height, .035);
      box(roof, m.gold, dx + .2, height / 2, dz + .317, .034, height - .5, .02);
      box(roof, m.base, dx, .23, dz, .82, .42, .82);
    }
  }
  return roof;
}

export function dispenser(scene, x, z, electric = false) {
  const unit = group(scene, x, 0, z);
  const m = materials;
  unit.userData.zone = electric ? 4 : 2;
  shell(unit, m.base, 0, .13, 0, 3.3, 1.9, .24, .32, true);
  shell(unit, m.gold, 0, .1, 0, 3.34, 1.94, .032, .32, true);
  shell(unit, m.gold, 0, 1.46, 0, 1.02, 2.42, .69, .2);
  shell(unit, m.green, 0, 1.46, .018, .9, 2.31, .71, .16);
  box(unit, m.frame, 0, 1.59, .385, .62, .61, .04);
  box(unit, m.cyan, 0, 1.73, .413, .46, .15, .016);
  for (let i = 0; i < 3; i++) box(unit, m.steel, (i - 1) * .12, 1.49, .42, .065, .044, .02);
  if (electric) {
    label(unit, '⚡', 0, 2.22, .394, .9, .47);
  } else {
    tube(unit, m.gold, [[0, 2.48, .406], [-.14, 2.24, .406], [-.12, 2.11, .406],
      [0, 2.06, .406], [.12, 2.11, .406], [.14, 2.24, .406]], .024, true);
  }
  for (const side of [-1, 1]) {
    tube(unit, m.rubber, [[side * .46, 1.7, .08], [side * .76, 1.2, .18],
      [side * .7, .39, .35], [side * .5, .45, .54], [side * .51, 1.18, .38]], .034);
    const nozzle = box(unit, m.steel, side * .51, 1.23, .39, .12, .27, .12);
    nozzle.rotation.z = side * -.22;
  }
  for (const dx of [-1.3, 1.3]) {
    mesh(unit, new T.CylinderGeometry(.085, .1, .79, 12), m.steel, dx, .64, .55);
    box(unit, m.gold, dx, .84, .64, .14, .1, .02);
  }
  return unit;
}

export function market(scene) {
  const shop = group(scene, .5, 0, -8.9);
  shop.userData.zone = 3;
  const m = materials;
  shell(shop, m.green, 0, 4.58, 0, 15, 6.2, .7, .55, true);
  shell(shop, m.cyan, 0, 4.77, 0, 15.02, 6.22, .035, .55, true);
  box(shop, m.base, 0, .12, 0, 15.1, .22, 6.4);
  box(shop, m.frame, 0, 2.26, -3, 14.9, 4.35, .36);
  const interior = standard(0xc09b64, .13, .56);
  box(shop, interior, 0, .24, 0, 14.9, .08, 5.95);
  box(shop, m.ceiling, 0, 4.13, 0, 14.9, .1, 5.95);
  box(shop, m.gold, 0, 3.88, 3.15, 14.6, .055, .065);
  const collections = [0x883732, 0xe7b65e, 0x406b4e, 0xb4c3a4, 0x9b5230].map(c => standard(c, .12));
  for (const x of [-5.4, -2.7, 2.9, 5.6]) {
    for (const y of [.65, 1.15, 1.67, 2.22]) {
      box(shop, m.steel, x, y, -1.35, 1.8, .07, .6);
      for (let j = 0; j < 8; j++) {
        box(shop, collections[(j + Math.round(x + y) + 10) % collections.length], x - .76 + .21 * j,
          y + .12, -1.28, .135, .21 + .04 * (j % 3), .22);
      }
    }
    box(shop, m.frame, x - .93, 1.45, -1.59, .07, 2.32, .6);
    box(shop, m.frame, x + .93, 1.45, -1.59, .07, 2.32, .6);
    box(shop, m.warm, x, 4.04, -.4, 1.8, .045, .14);
    box(shop, interior, x, .66, 1.2, 1.5, .87, .65);
  }
  for (let i = -5; i <= 5; i++) {
    box(shop, m.frame, i * 1.47, 2.05, 3.08, .075, 3.7, .08);
    if (i < 5) box(shop, m.glass, (i + .5) * 1.47, 2.05, 3.08, 1.4, 3.67, .055);
  }
  for (const x of [-7.4, 7.4]) {
    box(shop, m.glass, x, 2.13, .05, .05, 3.93, 5.85);
    for (const z of [-1.45, 0, 1.45]) box(shop, m.frame, x, 2.16, z, .1, 4, .075);
  }
  for (const x of [-.12, .12]) box(shop, m.steel, x, 1.44, 3.15, .037, .48, .06);
  label(shop, 'Take&Go', 0, 4.47, 3.13, 4.25, .77);
  return shop;
}
