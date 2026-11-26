import * as T from './vendor/three.module.min.js';
import { box, group, materials as m, mesh, standard, tube } from './model.js';
import { vehicle } from './vehicles.js';
import { fuelBays, fuelX } from './layout.js';

const path = points => new T.CatmullRomCurve3(points.map(([x, z, y = 0]) => new T.Vector3(x, y, z)));
const clamp = T.MathUtils.clamp;
const ease = (from, to, time) => T.MathUtils.smoothstep(time, from, to);
const point = new T.Vector3();
const direction = new T.Vector3();

function drive(car, route, progress, reverse = false) {
  route.getPointAt(progress, car.position);
  route.getTangentAt(progress, direction);
  const sign = reverse ? 1 : -1;
  car.rotation.y = Math.atan2(sign * direction.x, sign * direction.z);
  const spin = route.getLength() * progress / .4 * sign;
  for (const wheel of car.userData.wheels) wheel.rotation.x = spin;
}

function person(parent, jacket) {
  const actor = group(parent, 0, 0, 0);
  const cloth = standard(jacket);
  const trousers = standard(0x273639);
  const skin = standard(0xc79871);
  const hair = standard(0x302827);
  const body = group(actor, 0, .9, 0);
  const torso = mesh(body, new T.CylinderGeometry(.22, .16, .48, 6), cloth, 0, .27, 0);
  torso.scale.z = .65;
  mesh(body, new T.IcosahedronGeometry(.135, 1), skin, 0, .66, 0);
  mesh(body, new T.SphereGeometry(.138, 7, 3, 0, Math.PI * 2, 0, 1.25), hair, 0, .69, 0);

  const legs = [], arms = [];
  for (const side of [-1, 1]) {
    const leg = group(actor, side * .093, .92, 0);
    box(leg, trousers, 0, -.38, 0, .135, .72, .14);
    box(leg, m.rubber, 0, -.82, -.065, .15, .14, .26);
    legs.push(leg);
    const arm = group(body, side * .245, .46, 0);
    box(arm, cloth, 0, -.21, 0, .11, .4, .11);
    box(arm, skin, 0, -.425, 0, .10, .13, .11);
    arms.push(arm);
  }
  const bag = box(arms[1], m.warm, 0, -.55, -.04, .2, .25, .14);
  bag.visible = false;
  return { actor, arms, legs, bag };
}

function walk(person, route, t, forward, elapsed, moving = true) {
  route.getPointAt(t, point);
  route.getTangentAt(t, direction);
  const sign = forward ? -1 : 1;
  person.actor.position.copy(point);
  person.actor.rotation.y = Math.atan2(sign * direction.x, sign * direction.z);
  const stride = moving ? Math.sin(elapsed * 10) : 0;
  person.actor.position.y += Math.abs(stride) * .045;
  for (const [index, leg] of person.legs.entries()) {
    const swing = stride * (index === 0 ? .48 : -.48);
    leg.rotation.x = swing;
    person.arms[index].rotation.x = -swing * .73;
  }
}

export function stationActivity(scene, market) {
  const actors = group(scene, 0, 0, 0);
  actors.userData.ignorePick = true;
  const fuel = vehicle(actors, 0, 0, 0x66736b);
  const visitor = vehicle(actors, 0, 0, 0x7799a3);
  const driver = person(actors, 0xd3a33b);
  const shopper = person(actors, 0xb16045);

  const pumpX = fuelX(fuelBays.right.x);
  const pumpZ = fuelBays.right.z;
  const stopZ = pumpZ + 3.3;
  const fuelIn = path([[-40, 10.4], [-29, 10.4], [-22, 7.2], [-17, stopZ], [-10, stopZ], [pumpX, stopZ]]);
  const fuelOut = path([[pumpX, stopZ], [pumpX + 2.35, stopZ], [1, 7.5], [6, 10.4], [12, 10.4], [40, 10.4]]);
  const visitIn = path([[39, 14], [23, 14], [10, 13.6], [4.6, 10.8], [2.05, 7.2], [2.05, 1.2]]);
  const visitReverse = path([[2.05, 1.2], [2.05, 4.9], [2.05, 7.1], [1.45, 8.5], [.3, 8.7]]);
  const visitOut = path([[.3, 8.7], [2, 8.7], [6.5, 9.1], [11.8, 13.8], [23, 14], [40, 14]]);
  const toPump = path([[pumpX + .38, stopZ - 1.19], [pumpX - .36, pumpZ + 1.91], [pumpX - .69, pumpZ + 1.17]]);
  const toShop = path([[.88, 1.05], [.52, -.7], [.52, -3.5], [.5, -5.46], [.5, -6.09, .28], [.5, -8.12, .28]]);
  const hose = tube(actors, m.rubber, [[pumpX - .46, 1.65, pumpZ + .08],
    [pumpX - .66, .38, pumpZ + .54], [pumpX - .94, .31, pumpZ + 1.27],
    [pumpX - 1.38, .55, stopZ - 1.16], [pumpX - 1.52, .93, stopZ - .97]], .037);

  function update(elapsed) {
    const t = elapsed % 66;
    const f = (elapsed + 15) % 66;
    if (f < 11) drive(fuel, fuelIn, ease(0, 11, f));
    else if (f < 25) drive(fuel, fuelIn, 1);
    else drive(fuel, fuelOut, ease(25, 39, f));
    fuel.visible = f < 39;

    driver.actor.visible = f >= 12 && f < 24.5;
    if (driver.actor.visible) {
      const arriving = f < 20.8;
      const progress = arriving ? ease(12, 15.1, f) : 1 - ease(20.8, 24.5, f);
      walk(driver, toPump, progress, arriving, f, progress > 0 && progress < 1);
      if (f >= 15.1 && f < 20.8) driver.arms[1].rotation.x = -.72;
    }
    hose.visible = f >= 15.1 && f < 20.8;

    if (t < 12) drive(visitor, visitIn, ease(0, 12, t));
    else if (t < 42) drive(visitor, visitIn, 1);
    else if (t < 48) drive(visitor, visitReverse, ease(42, 48, t), true);
    else drive(visitor, visitOut, ease(48, 62, t));
    visitor.visible = t < 62;

    shopper.actor.visible = t >= 15 && t < 38;
    shopper.bag.visible = t >= 26;
    market.product.visible = t < 26 || t >= 39;
    let open = 0;
    if (shopper.actor.visible) {
      const entering = t < 27;
      const progress = entering ? ease(15, 24, t) : 1 - ease(27, 38, t);
      walk(shopper, toShop, progress, entering, t, progress > 0 && progress < 1);
      if (t >= 24 && t < 27) shopper.arms[1].rotation.x = -.9;
      open = ease(-7.35, -6.6, shopper.actor.position.z) * (1 - ease(-5.2, -4.45, shopper.actor.position.z));
    }
    for (const [index, door] of market.doors.entries()) {
      door.position.x = (index === 0 ? -1 : 1) * (.73 + open * 1.22);
    }
  }

  update(0);
  return update;
}
