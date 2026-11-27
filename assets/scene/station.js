import * as T from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { box, canopy, canopyCamera, dispenser, group, market, materials as m, securityCamera, utilityBay } from './model.js';
import { environment, lighting, sky, studioReflections } from './environment.js';
import { stationActivity } from './activity.js';
import { services } from './services.js';
import { chargingBay, entryCamera, fuelBays, fuelCanopy, fuelOffsetX, fuelX, paymentColumn, rearFuelBays, serviceBay } from './layout.js';

function buildStation(scene) {
  const forecourt = group(scene, fuelOffsetX, 0, 0);
  const { x, z, width, depth, height } = fuelCanopy;
  canopy(forecourt, x, z, width, depth, height);
  canopy(scene, 12.25, -.65, 10.2, 6.8, 4.72);
  const left = dispenser(forecourt, fuelBays.left.x, fuelBays.left.z);
  left.userData.zone = 1;
  const right = dispenser(forecourt, fuelBays.right.x, fuelBays.right.z);
  const entrance = securityCamera(forecourt, entryCamera.position, entryCamera.target);
  entrance.userData.zone = 0;
  canopyCamera(forecourt, fuelBays.left.x, fuelBays.left.z);
  canopyCamera(forecourt, fuelBays.right.x, fuelBays.right.z);
  for (const bay of Object.values(rearFuelBays)) {
    const rear = dispenser(forecourt, bay.x, bay.z);
    delete rear.userData.zone;
    canopyCamera(forecourt, bay.x, bay.z);
  }
  dispenser(scene, 10, 1.35, true);
  const charge = dispenser(scene, chargingBay.x, chargingBay.z, true);
  const shop = market(scene);
  shop.shop.userData.zone = 5;
  const payment = group(scene, paymentColumn.x, 2.28, paymentColumn.z + .34);
  payment.userData.zone = 3;
  box(payment, m.frame, 0, 0, 0, .48, .43, .11);
  box(payment, m.cyan, 0, .04, .061, .33, .15, .018);
  const utility = utilityBay(scene, serviceBay.x, serviceBay.z);
  utility.userData.zone = 6;
  return { interactive: [entrance, left, right, payment, charge, shop.shop, utility], updateActivity: stationActivity(scene, shop) };
}

export function mountStation(view, handlers, motion) {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'default' });
  if (!gl) throw new Error('WebGL 2 no está disponible.');

  const high = matchMedia('(pointer: fine)').matches && (navigator.hardwareConcurrency ?? 4) >= 4;
  const renderer = new T.WebGLRenderer({ canvas, context: gl });
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.23;
  renderer.setPixelRatio(Math.min(devicePixelRatio, high ? 1.55 : 1.1));
  const scene = new T.Scene();
  const dayUniform = sky(scene);
  const setLighting = lighting(scene);
  const reflections = high ? studioReflections(renderer, scene) : null;
  environment(scene, high);
  const { interactive, updateActivity } = buildStation(scene);
  scene.updateMatrixWorld(true);
  const bounds = interactive.map(object => new T.Box3().setFromObject(object));
  const highlight = new T.Box3Helper(new T.Box3(), 0xe8c05a);
  highlight.visible = false;
  highlight.userData.ignorePick = true;
  scene.add(highlight);

  const camera = new T.PerspectiveCamera(45, 1, .2, 295);
  view.append(canvas);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .085;
  controls.zoomToCursor = false;
  controls.minDistance = 8;
  controls.maxDistance = 100;
  controls.minPolarAngle = .18;
  controls.maxPolarAngle = Math.PI / 2 + .11;
  controls.autoRotateSpeed = .22;
  controls.minTargetRadius = 0;

  const initialTarget = new T.Vector3(-2.65, 3.15, 0);
  const initialPosition = new T.Vector3(10.25, 7.15, 35.2);
  const solidVolumes = [
    new T.Box3(
      new T.Vector3(fuelX(fuelCanopy.x - fuelCanopy.width / 2) - .4, 5.17, fuelCanopy.z - fuelCanopy.depth / 2 - .4),
      new T.Vector3(fuelX(fuelCanopy.x + fuelCanopy.width / 2) + .4, 6.55, fuelCanopy.z + fuelCanopy.depth / 2 + .4),
    ),
    new T.Box3(new T.Vector3(6.7, 4.12, -4.45), new T.Vector3(17.8, 5.48, 3.15)),
    new T.Box3(new T.Vector3(-7.25, 0, -12.25), new T.Vector3(8.25, 5.16, -5.6)),
  ];
  const cameraRay = new T.Raycaster();
  const anchors = services.map(service => new T.Vector3(...service.anchor));
  const cameraDirection = new T.Vector3();
  const screen = new T.Vector3();
  const position = new T.Vector3();
  const center = new T.Vector3();
  const panMin = new T.Vector3(-19, 1, -13);
  const panMax = new T.Vector3(20, 9, 13);
  const pointer = new T.Vector2();
  let transition, selection = null, active = true, visible = true, day = false;
  let frame = 0, idleUntil = performance.now() + 6300, nextMarkers = 0;
  let down;
  let lastTick = performance.now(), dirty = true;
  let activity = !motion.matches, activityTime = 0, activityFrame = 0;
  const previousPosition = new T.Vector3();
  const previousTarget = new T.Vector3();

  function pose(zone) {
    if (zone === null) {
      const scale = Math.max(1, 1.1 / camera.aspect);
      const target = initialTarget.clone();
      if (camera.aspect < .86) target.x -= 1.35;
      return [initialPosition.clone().sub(initialTarget).multiplyScalar(Math.min(scale, 2.45)).add(target), target];
    }
    const service = services[zone];
    const target = new T.Vector3(...service.target);
    const offset = new T.Vector3(...service.angle);
    if (camera.aspect < .85) offset.multiplyScalar(1.3);
    return [target.clone().add(offset), target];
  }

  function moveTo(zone, animate = true) {
    selection = zone;
    idleUntil = performance.now() + 12500;
    const [toPosition, toTarget] = pose(zone);
    if (!animate || motion.matches) {
      transition = undefined;
      camera.position.copy(toPosition);
      controls.target.copy(toTarget);
      controls.update();
      return;
    }
    transition = {
      start: performance.now(),
      fromPosition: camera.position.clone(), fromTarget: controls.target.clone(), toPosition, toTarget,
    };
  }

  function resize() {
    camera.aspect = view.clientWidth / Math.max(view.clientHeight, 1);
    camera.fov = camera.aspect < .86 ? 64 : 45;
    camera.updateProjectionMatrix();
    dirty = true;
    renderer.setSize(view.clientWidth, view.clientHeight, false);
    moveTo(selection, false);
  }

  function pick(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    cameraRay.setFromCamera(pointer, camera);
    cameraRay.far = 120;
    const hits = cameraRay.intersectObjects(scene.children.filter(object => !object.userData.ignorePick), true);
    for (const hit of hits) {
      let object = hit.object;
      if (object.userData.ignorePick || !object.visible || object.isLineSegments) continue;
      while (object) {
        if (object.userData.zone !== undefined) return object.userData.zone;
        object = object.parent;
      }
      return null;
    }
    return null;
  }

  function highlightZone(zone) {
    dirty = true;
    highlight.visible = zone !== null;
    if (zone !== null) highlight.box.copy(bounds[zone]).expandByScalar(.15);
  }

  function markers() {
    const blockers = scene.children.filter(object => !object.userData.ignorePick);
    for (const [index, anchor] of anchors.entries()) {
      cameraDirection.subVectors(anchor, camera.position);
      const distance = cameraDirection.length();
      screen.copy(anchor).project(camera);
      let shown = screen.z > -1 && screen.z < 1 && Math.abs(screen.x) < .94 && Math.abs(screen.y) < .92;
      if (shown) {
        cameraRay.set(camera.position, cameraDirection.normalize());
        cameraRay.far = distance - .3;
        shown = !cameraRay.intersectObjects(blockers, true).some(hit =>
          hit.object !== highlight && !hit.object.material?.transparent);
      }
      handlers.marker(index, (screen.x + 1) * 50, (1 - screen.y) * 50, shown);
    }
  }

  function tick(now) {
    if (!active) return;
    frame = requestAnimationFrame(tick);
    const elapsed = Math.max(0, (now - lastTick) / 1000);
    const dt = Math.min(elapsed, .05);
    lastTick = now;
    if (!visible || document.hidden) return;
    if (activity) {
      activityTime += Math.min(elapsed, .15);
      if (activityTime - activityFrame >= (high ? 1 / 50 : 1 / 28)) {
        updateActivity(activityTime);
        activityFrame = activityTime;
        dirty = true;
      }
    }
    controls.autoRotate = !motion.matches && !transition && selection === null && now > idleUntil;
    if (transition) {
      const { start, fromPosition, fromTarget, toPosition, toTarget } = transition;
      const t = Math.min(1, (now - start) / 1050);
      const ease = t * t * (3 - 2 * t);
      camera.position.lerpVectors(fromPosition, toPosition, ease);
      controls.target.lerpVectors(fromTarget, toTarget, ease);
      if (t === 1) transition = undefined;
    }
    controls.update(dt);
    center.copy(controls.target).clamp(panMin, panMax);
    if (!controls.target.equals(center)) {
      camera.position.add(position.copy(center).sub(controls.target));
      controls.target.copy(center);
    }
    camera.position.y = Math.max(2.4, camera.position.y);
    for (const solid of solidVolumes) {
      if (solid.containsPoint(camera.position)) camera.position.y = solid.max.y + .02;
    }
    camera.lookAt(controls.target);
    if (!dirty && previousPosition.distanceToSquared(camera.position) < .00000001 &&
        previousTarget.distanceToSquared(controls.target) < .00000001) return;
    dirty = false;
    previousPosition.copy(camera.position);
    previousTarget.copy(controls.target);
    renderer.render(scene, camera);
    if (now >= nextMarkers) {
      markers();
      nextMarkers = now + (high ? 45 : 85);
    } else {
      dirty = true;
    }
  }

  controls.addEventListener('start', () => {
    idleUntil = performance.now() + 12500;
    transition = undefined;
    controls.autoRotate = false;
  });
  controls.addEventListener('end', () => { idleUntil = performance.now() + 12500; });
  canvas.addEventListener('pointerdown', event => { down = [event.clientX, event.clientY]; });
  canvas.addEventListener('pointerup', event => {
    if (!down || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 6 || event.button !== 0) return;
    const zone = pick(event);
    if (zone !== null) handlers.select(zone);
  });
  canvas.addEventListener('pointermove', event => {
    if (!event.buttons && event.pointerType === 'mouse') {
      const zone = pick(event);
      highlightZone(zone);
      canvas.style.cursor = zone === null ? '' : 'pointer';
    }
  });
  canvas.addEventListener('pointerleave', () => highlightZone(null));

  const resizeObserver = new ResizeObserver(resize);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  function dispose() {
    if (!active) return;
    active = false;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    intersection.disconnect();
    controls.dispose();
    const resources = new Set();
    scene.traverse(object => {
      if (object.geometry) resources.add(object.geometry);
      for (const material of [object.material].flat()) {
        if (!material) continue;
        if (material.map) resources.add(material.map);
        resources.add(material);
      }
    });
    highlight.dispose();
    for (const resource of resources) resource.dispose();
    reflections?.dispose();
    renderer.dispose();
    canvas.remove();
  }

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    dispose();
    handlers.fallback();
  }, { once: true });
  window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, { once: true });

  resizeObserver.observe(view);
  intersection.observe(view);
  resize();
  try {
    renderer.render(scene, camera);
    markers();
  } catch (error) {
    dispose();
    throw error;
  }
  frame = requestAnimationFrame(tick);

  return {
    focus: moveTo,
    highlight: highlightZone,
    setActivity(enabled) {
      activity = enabled;
    },
    toggleDay() {
      day = !day;
      dirty = true;
      dayUniform.value = Number(day);
      setLighting(day);
      return day;
    },
  };
}
