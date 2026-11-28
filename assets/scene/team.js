import * as T from './vendor/three.module.min.js';
import { box, mesh, group, materials as m, shell, standard, tube } from './model.js';
import { motorcycle } from './vehicles.js';

const chapterList = [...document.querySelectorAll('[data-team-progress]')];
const story = document.querySelector('.team-story');
const view = document.querySelector('.team-view');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const up = new T.Vector3(0, 1, 0);
const direction = new T.Vector3();
const limb = new T.CylinderGeometry(.065, .085, 1, 8);

function align(segment, from, to) {
  direction.subVectors(to, from);
  segment.position.copy(from).lerp(to, .5);
  segment.scale.y = direction.length();
  segment.quaternion.setFromUnitVectors(up, direction.normalize());
}

function rider(scene, color, helmet, waveSide, sport) {
  const bike = motorcycle(scene, color, 0x24342e, { displayRider: false, sport });
  const jacket = standard(sport ? 0x28383d : 0x283833, .1, .7);
  const stripes = standard(color, .08, .62);
  const helmetShell = standard(helmet, .28, .25);
  const visor = standard(0x102327, .64, .22);
  const human = group(bike, 0, 0, 0);
  const lean = sport ? .3 : .11;
  const chest = box(human, jacket, 0, 1.23, .21 - lean, .48, .58, .33);
  chest.rotation.x = lean + .13;
  box(human, stripes, 0, 1.3, .035 - lean, .43, .095, .045);
  const headZ = .11 - lean;
  mesh(human, new T.IcosahedronGeometry(.215, 2), helmetShell, 0, 1.66, headZ);
  shell(human, visor, 0, 1.67, headZ - .189, .352, .147, .053, .058);
  box(human, m.frame, 0, 1.55, headZ - .166, .24, .075, .071);

  let wave;
  for (const side of [-1, 1]) {
    tube(human, jacket, [[side * .14, .96, .33], [side * .31, .75, -.01], [side * .25, .5, .34]], .084);
    box(human, m.frame, side * .25, .47, .27, .17, .16, .29);
    const shoulder = new T.Vector3(side * .245, 1.43, .11 - lean);
    const elbow = new T.Vector3(side * .31, 1.23, -.25);
    const handle = new T.Vector3(side * .33, 1.13, -.61);
    if (side !== waveSide) {
      const top = mesh(human, limb, jacket), bottom = mesh(human, limb, jacket);
      align(top, shoulder, elbow);
      align(bottom, elbow, handle);
      box(human, m.frame, handle.x, handle.y, handle.z, .125, .125, .12);
      continue;
    }
    const top = mesh(human, limb, jacket), bottom = mesh(human, limb, jacket);
    const glove = group(human, 0, 0, 0);
    box(glove, m.frame, 0, 0, 0, .115, .13, .085);
    const fingers = group(glove, 0, .04, 0);
    for (const finger of [-1, 1]) {
      box(fingers, m.frame, finger * .049, .085, 0, .039, .14, .043).rotation.z = finger * -.29;
    }
    const outElbow = new T.Vector3(side * .56, 1.22, -.015);
    const outHand = new T.Vector3(side * .83, 1.39, -.085);
    const middle = new T.Vector3(), tip = new T.Vector3();
    wave = amount => {
      middle.copy(elbow).lerp(outElbow, amount);
      tip.copy(handle).lerp(outHand, amount);
      align(top, shoulder, middle);
      align(bottom, middle, tip);
      glove.position.copy(tip);
      glove.rotation.z = side * -amount * .62;
      fingers.scale.setScalar(Math.max(.001, amount));
    };
  }
  return { bike, wave };
}

function roadway(scene) {
  const paving = mesh(scene, new T.PlaneGeometry(44, 120), standard(0x253e39, 0, .9), 0, -.016, 31);
  paving.rotation.x = -Math.PI / 2;
  const edge = standard(0x8f9f76);
  const center = standard(0xad9a37);
  for (const x of [-3.7, 3.7]) box(scene, edge, x, 0, 17, .056, .012, 65);
  for (let z = -7; z < 47; z += 3.5) box(scene, center, 0, 0, z, .06, .015, 1.65);
  const mountain = new T.ConeGeometry(1, 1, 5);
  for (const [x, z, width, height] of [[-19, 29, 16, 8], [18, 35, 18, 7], [-8, 44, 14, 11], [7, 46, 19, 12]]) {
    const slope = mesh(scene, mountain, standard(0x164a40, 0, .95), x, height / 2 - 1.4, z);
    slope.scale.set(width, height, width);
  }
}

function start() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { antialias: true });
  if (!gl) return;
  const renderer = new T.WebGLRenderer({ canvas, context: gl });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.26;
  const scene = new T.Scene();
  scene.background = new T.Color(0x082a24);
  scene.fog = new T.FogExp2(0x082a24, .035);
  const ambient = new T.HemisphereLight(0xbbe4d9, 0x50542d, 2.2);
  const key = new T.DirectionalLight(0xffefc2, 2.8);
  key.position.set(2, 6, -8);
  const rim = new T.DirectionalLight(0x72cfb8, 1.8);
  rim.position.set(-5, 5, 5);
  scene.add(ambient, key, rim);
  roadway(scene);
  const riders = [
    rider(scene, 0x035141, 0xf4f6f1, 1, false),
    rider(scene, 0xfcda2f, 0x9aa3a5, -1, true),
  ];
  const camera = new T.PerspectiveCamera(41, 1, .1, 140);
  view.append(canvas);
  let frame = 0;
  const points = chapterList.map(chapter => Number(chapter.dataset.teamProgress));

  function update() {
    frame = 0;
    const travel = Math.max(0, -story.getBoundingClientRect().top);
    const stops = chapterList.map(chapter => chapter.offsetTop);
    let index = stops.findIndex(stop => travel < stop);
    if (index < 0) index = stops.length - 1;
    index = Math.max(1, index);
    const t = T.MathUtils.clamp((travel - stops[index - 1]) / Math.max(1, stops[index] - stops[index - 1]), 0, 1);
    let progress = T.MathUtils.lerp(points[index - 1], points[index], t);
    if (reduced.matches) progress = t >= .5 ? points[index] : points[index - 1];
    const greeting = T.MathUtils.smoothstep(progress, .81, .985);
    for (const [index, { bike, wave }] of riders.entries()) {
      bike.position.set((index === 0 ? 1 : -1) * 1.43, 0, (1 - progress) * 9);
      for (const wheel of bike.userData.wheels) wheel.rotation.x = progress * -28.125;
      wave(greeting);
    }
    renderer.render(scene, camera);
  }

  function queue() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function resize() {
    camera.aspect = view.clientWidth / Math.max(1, view.clientHeight);
    const distance = 6.6 / Math.min(1, camera.aspect / 1.06);
    camera.position.set(0, 1.48, -distance);
    camera.lookAt(0, .95, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(view.clientWidth, view.clientHeight, false);
    queue();
  }

  new ResizeObserver(resize).observe(view);
  window.addEventListener('scroll', queue, { passive: true });
  reduced.addEventListener('change', queue);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    canvas.hidden = true;
  }, { once: true });
  resize();
}

try {
  start();
} catch (error) {
  console.warn('Se muestra la vista estática del equipo.', error);
}
