import * as T from './vendor/three.module.min.js';
import { box, group, materials as m, mesh, standard, tube } from './model.js';
import { motorcycle, vehicle } from './vehicles.js';
import { refuellingCounter } from './refuelling-counter.js';
import { chargingBay, fuelBays, fuelStopOffset, fuelX, refuellingDemo, rearFuelBays, serviceBay } from './layout.js';

const path = points => new T.CatmullRomCurve3(points.map(([x, z, y = 0]) => new T.Vector3(x, y, z)));
const ease = (from, to, time) => T.MathUtils.smoothstep(time, from, to);
const point = new T.Vector3();
const direction = new T.Vector3();

function drive(car, route, progress, reverse = false) {
  route.getPointAt(progress, car.position);
  route.getTangentAt(progress, direction);
  const sign = reverse ? 1 : -1;
  car.rotation.y = Math.atan2(sign * direction.x, sign * direction.z);
  const spin = route.getLength() * progress / (car.userData.wheelRadius ?? .4) * sign;
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

const fuelPhaseOffset = 15;
const cycleSeconds = 88;
const frontArrival = 11;
const queueRelease = frontArrival + refuellingDemo.gasGoSeconds + 4;

function refuellingVisit(actors, {
  bay, duration, paint, jacket, gasGo = false, arrive = frontArrival, queued = false, kind = "car",
}) {
  const car = kind === "motorcycle" ? motorcycle(actors, paint, jacket) : vehicle(actors, 0, 0, paint, false, kind === "minivan");
  car.name = queued ? `Queue: ${gasGo ? "Gas&Go" : "conventional"}` : `Pump: ${bay.z < 0 ? "rear" : "front"} ${bay.x}`;
  const driver = person(actors, jacket);
  const counter = refuellingCounter(car, gasGo);
  const pumpX = fuelX(bay.x);
  const pumpZ = bay.z;
  const stopZ = pumpZ + fuelStopOffset;
  const rear = pumpZ < 0;
  const leavesAt = arrive + duration;
  const exitsAt = leavesAt + 14;
  const connectAt = arrive + (gasGo ? 4.1 : 8.1);
  const disconnectAt = leavesAt - (gasGo ? 4.2 : 5.7);
  const entersCarAt = leavesAt - .5;

  const regularEntry = rear
    ? [[pumpX - 40, 2.7], [pumpX - 25, 2.7], [pumpX - 15, 1.9], [pumpX - 9, stopZ], [pumpX, stopZ]]
    : [[pumpX - 40, 10.4], [pumpX - 28, 10.4], [pumpX - 20, 7.1], [pumpX - 12, stopZ], [pumpX - 5, stopZ], [pumpX, stopZ]];
  const waitX = gasGo ? -19.5 : -25.5;
  const waitZ = 7.8;
  const enter = path(queued ? [[waitX - 43.5, 10.4], [waitX - 22, 10.2], [waitX - 9, waitZ], [waitX, waitZ]] : regularEntry);
  const queueMovesAt = gasGo ? queueRelease : frontArrival + refuellingDemo.conventionalSeconds + 7;
  const advance = queued ? path(gasGo
    ? [[waitX, waitZ], [-15.2, waitZ], [-10.8, 6.7], [-8.15, stopZ], [pumpX, stopZ]]
    : [[waitX, waitZ], [-22, waitZ], [-19.4, 5.7], [-17.8, stopZ], [pumpX, stopZ]]) : null;
  const exit = path(rear
    ? [[pumpX, stopZ], [pumpX + 2.65, stopZ - 1.1], [pumpX + 6.9, -3.92], [10, -4.45], [23, -4.45], [43, -4.45]]
    : [[pumpX, stopZ], [pumpX + 2.35, stopZ], [pumpX + 5.7, 7.5], [pumpX + 10.7, 10.4], [pumpX + 18, 10.4], [43, 10.4]]);
  const dismountX = kind === "motorcycle" ? pumpX - .18 : pumpX + .38;
  const dismountZ = stopZ - (kind === "motorcycle" ? .54 : 1.19);
  const tank = kind === "motorcycle" ? [pumpX + .28, 1.09, stopZ - .23] : [pumpX - 1.52, .93, stopZ - .97];
  const toPump = path([[dismountX, dismountZ], [pumpX - .36, pumpZ + 1.91], [pumpX - .69, pumpZ + 1.17]]);
  const hose = tube(actors, m.rubber, [[pumpX - .46, 1.65, pumpZ + .08],
    [pumpX - .66, .38, pumpZ + .54], [pumpX - .94, .31, pumpZ + 1.27],
    [tank[0] - .13, .55, tank[2] - .19], tank], .037);

  return phase => {
    if (phase < arrive) {
      if (queued && phase >= queueMovesAt) drive(car, advance, ease(queueMovesAt, arrive, phase));
      else drive(car, enter, queued ? ease(3, 17, phase) : ease(0, frontArrival, phase));
    } else if (phase < leavesAt) {
      drive(car, advance || enter, 1);
    } else {
      drive(car, exit, ease(leavesAt, exitsAt, phase));
    }
    car.visible = phase < exitsAt && (!queued || phase >= 3);
    counter(phase >= arrive && phase < leavesAt, (phase - arrive) / duration);
    driver.actor.visible = phase >= arrive + 1 && phase < entersCarAt;
    hose.visible = phase >= connectAt && phase < disconnectAt;
    if (car.userData.rider) car.userData.rider.visible = !driver.actor.visible;
    if (driver.actor.visible) {
      const returning = phase >= disconnectAt;
      const progress = returning
        ? 1 - ease(disconnectAt, entersCarAt, phase)
        : ease(arrive + 1, arrive + 4.1, phase);
      walk(driver, toPump, progress, !returning, phase, progress > 0 && progress < 1);
      if (hose.visible) driver.arms[1].rotation.x = -.72;
    }
  };
}

function visitService(actors) {
  const car = vehicle(actors, 0, 0, 0xa58459);
  car.name = 'Service&Go visitor';
  const driver = person(actors, 0xb0bd6b);
  const badge = refuellingCounter(car, true, 'Service&Go');
  const { x, z } = serviceBay;
  const parkZ = z + 2.75;
  const park = [x, parkZ];
  const enter = path([[-43, -.8], [-25, -1.3], [-9, -1.45], [-3, -2.1], [2, -4.15], [8.5, parkZ], park]);
  const leave = path([park, [20, parkZ], [32, parkZ], [45, parkZ]]);
  const toEquipment = path([[x + .47, parkZ - 1.18], [x + .1, z + 1.47], [x - .57, z + .92]]);
  const hose = tube(actors, m.rubber, [[x - .66, 1.02, z + .11], [x - .78, .23, z + .75],
    [x - .95, .15, z + 1.28], [x - 1.38, .32, parkZ - 1.12]], .036);
  const arrived = 14;
  const departing = 45;
  const leavesView = 55;

  return time => {
    const phase = (time + 30) % cycleSeconds;
    if (phase < arrived) drive(car, enter, ease(0, arrived, phase));
    else if (phase < departing) drive(car, enter, 1);
    else drive(car, leave, ease(departing, leavesView, phase));
    car.visible = phase < leavesView;

    driver.actor.visible = phase >= 27 && phase < 44.5;
    hose.visible = phase >= 31 && phase < 40.5;
    badge(phase >= arrived && phase < departing, (phase - arrived) / (departing - arrived));
    if (driver.actor.visible) {
      const returning = phase >= 40.5;
      const progress = returning ? 1 - ease(40.5, 44.5, phase) : ease(27, 31, phase);
      walk(driver, toEquipment, progress, !returning, phase, progress > 0 && progress < 1);
      if (hose.visible) driver.arms[1].rotation.x = -.72;
    }
  };
}

export function stationActivity(scene, market) {
  const actors = group(scene, 0, 0, 0);
  actors.userData.ignorePick = true;
  const visits = [
    { bay: fuelBays.right, duration: refuellingDemo.gasGoSeconds, paint: 0x66736b, jacket: 0xd3a33b, gasGo: true },
    { bay: fuelBays.left, duration: refuellingDemo.conventionalSeconds, paint: 0x9b644e, jacket: 0x808ba1, kind: "minivan" },
    { bay: rearFuelBays.right, duration: 29, paint: 0x9f8b62, jacket: 0x8d5141 },
    { bay: rearFuelBays.left, duration: 36, paint: 0x687d95, jacket: 0x6e8b58, kind: "motorcycle" },
    { bay: fuelBays.right, duration: refuellingDemo.gasGoSeconds, paint: 0x456d81, jacket: 0xcda662, gasGo: true, queued: true, arrive: 33.5, kind: "motorcycle" },
    { bay: fuelBays.left, duration: refuellingDemo.conventionalSeconds, paint: 0x80758e, jacket: 0x5b8392, queued: true, arrive: 46 },
  ].map(config => refuellingVisit(actors, config));
  const visitor = vehicle(actors, 0, 0, 0x7799a3);
  visitor.name = "Take&Go visitor";
  const shopper = person(actors, 0xb16045);
  const visitIn = path([[39, 14], [23, 14], [10, 13.6], [4.6, 10.8], [2.05, 7.2], [2.05, 1.2]]);
  const visitReverse = path([[2.05, 1.2], [2.05, 4.9], [2.05, 7.1], [1.45, 8.5], [.3, 8.7]]);
  const visitOut = path([[.3, 8.7], [2, 8.7], [6.5, 9.1], [11.8, 13.8], [23, 14], [40, 14]]);
  const toShop = path([[.88, 1.05], [.52, -.7], [.52, -3.5], [.5, -5.46], [.5, -6.09, .28], [.5, -8.12, .28]]);

  const electric = vehicle(actors, 0, 0, 0x146853, true);
  electric.name = "Electric";
  const chargeStopX = chargingBay.x + 1.25;
  const chargeStopZ = chargingBay.z + 2.93;
  const chargeIn = path([[43, 9.4], [29, 9.4], [23, 8.2], [19.8, 5.15], [17.5, chargeStopZ], [chargeStopX, chargeStopZ]]);
  const chargeOut = path([[chargeStopX, chargeStopZ], [12.2, chargeStopZ], [8.1, 7.5],
    [3, 9.2], [-10, 9.2], [-43, 9.2]]);
  const chargeCable = tube(actors, m.rubber, [
    [chargingBay.x + .48, 1.28, chargingBay.z + .17],
    [chargingBay.x + .76, .32, chargingBay.z + .72],
    [chargeStopX + .94, .29, chargeStopZ - 1.35],
    [chargeStopX + 1.48, .96, chargeStopZ - .96],
  ], .044);

  const service = visitService(actors);

  function update(elapsed) {
    const t = elapsed % cycleSeconds;
    const f = (elapsed + fuelPhaseOffset) % cycleSeconds;
    const charge = (elapsed + 16) % cycleSeconds;
    if (charge < 12) drive(electric, chargeIn, ease(0, 12, charge));
    else if (charge < 43) drive(electric, chargeIn, 1);
    else drive(electric, chargeOut, ease(43, 55, charge));
    electric.visible = charge < 55;
    chargeCable.visible = charge >= 13 && charge < 42;
    for (const visit of visits) visit(f);
    service(t);

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
