import { services } from './services.js';

const station = document.querySelector('.station');
const view = station.querySelector('.station-view');
const panel = station.querySelector('.station-panel');
const title = panel.querySelector('h2');
const description = panel.querySelector('.station-description');
const discover = panel.querySelector('.station-discover');
const number = panel.querySelector('.station-number');
const tour = panel.querySelector('.station-tour');
const tourBack = panel.querySelector('.station-tour-back');
const stepNav = panel.querySelector('.station-step-nav');
const previousStep = stepNav.querySelector('.station-step-prev');
const nextStep = stepNav.querySelector('.station-step-next');
const nextLabel = nextStep.querySelector('.station-step-next-label');
const nextLogo = nextStep.querySelector('.service-mark');
const panelLogo = panel.querySelector('.station-brand-logo');
const startButton = station.querySelector('.station-start');
const firstService = services.findIndex(service => service.complementary);
const directory = station.querySelector('.station-directory');
const buttons = [...station.querySelectorAll('.station-marker')];
const actions = station.querySelector('.station-actions');
const activityButton = actions.querySelector('[data-action="activity"]');
const fullscreen = actions.querySelector('[data-action="fullscreen"]');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let scene, returnFocus, selected = null;

function place(index, x, y, shown = true) {
  const marker = buttons[index];
  marker.style.left = x + '%';
  marker.style.top = y + '%';
  marker.hidden = !shown;
}

function layoutPoster() {
  if (scene) return;
  const w = view.clientWidth, h = view.clientHeight;
  if (!w || !h) return;
  const scale = Math.min(w / 1440, h / 810);
  services.forEach(({ poster: [x, y] }, index) => {
    const px = 50 + (x - .5) * scale * 1440 / w * 100;
    const py = 50 + (y - .5) * scale * 810 / h * 100;
    place(index, px, py, px >= 4 && px <= 96 && py >= 4 && py <= 96);
  });
}

function openPanel() {
  directory.open = false;
  panel.hidden = false;
  panel.scrollTop = 0;
  title.focus({ preventScroll: true });
}

function showTour(trigger) {
  if (trigger) returnFocus = trigger;
  selected = null;
  panel.removeAttribute('data-brand');
  panelLogo.hidden = true;
  title.textContent = 'Tu recorrido con Gas&Go';
  number.hidden = true;
  description.hidden = true;
  discover.hidden = true;
  tourBack.hidden = true;
  stepNav.hidden = true;
  tour.hidden = false;
  openPanel();
  scene?.focus(null);
  scene?.highlight(null);
}

function select(index, trigger, follow = false) {
  selected = index;
  const service = services[index];
  const fromTour = follow ? !tourBack.hidden : Boolean(trigger?.closest('.station-tour'));
  if (!follow && !fromTour) returnFocus = trigger || buttons[index];
  number.textContent = service.complementary ? 'S.C.' : String(index + 1).padStart(2, '0');
  number.hidden = false;
  if (service.brand) panel.dataset.brand = service.brand;
  else panel.removeAttribute('data-brand');
  panelLogo.hidden = !service.brand;
  title.textContent = service.name;
  description.textContent = service.description;
  description.hidden = false;
  discover.hidden = !service.discover;
  tour.hidden = true;
  tourBack.hidden = !fromTour;
  stepNav.hidden = false;
  previousStep.hidden = index === 0;
  previousStep.textContent = service.complementary ? 'Gas&Go' : 'Paso anterior';
  const nextService = service.complementary ? services[index === firstService ? firstService + 1 : firstService] : null;
  if (nextService) nextStep.dataset.brand = nextService.brand;
  else nextStep.removeAttribute('data-brand');
  nextLogo.hidden = !nextService;
  nextLabel.textContent = nextService
    ? nextService.name.split(' - ')[1]
    : index === firstService - 1 ? 'Servicios complementarios' : 'Siguiente paso';
  openPanel();
  scene?.focus(index);
  scene?.highlight(null);
}

function reset(restoreFocus = false) {
  selected = null;
  panel.hidden = true;
  scene?.focus(null);
  if (restoreFocus) {
    const trigger = returnFocus?.closest('details') ? directory.querySelector('summary') : returnFocus;
    if (trigger && !trigger.hidden) trigger.focus({ preventScroll: true });
    else directory.querySelector('summary').focus({ preventScroll: true });
  }
}

station.querySelectorAll('[data-zone]').forEach(button => {
  const index = Number(button.dataset.zone);
  button.addEventListener('click', () => select(index, button));
  button.addEventListener('pointerenter', () => scene?.highlight(index));
  button.addEventListener('pointerleave', () => scene?.highlight(null));
  button.addEventListener('focus', () => scene?.highlight(index));
  button.addEventListener('blur', () => scene?.highlight(null));
});
startButton.hidden = false;
previousStep.addEventListener('click', () => {
  if (services[selected].complementary) reset(true);
  else select(selected - 1, undefined, true);
});
nextStep.addEventListener('click', () => {
  select(selected === services.length - 1 ? firstService : selected + 1, undefined, true);
});
directory.querySelector('.station-tour-trigger').addEventListener('click', event => showTour(event.currentTarget));
tourBack.addEventListener('click', () => showTour());
panel.querySelector('.station-close').addEventListener('click', () => reset(true));
actions.querySelector('[data-action="reset"]').addEventListener('click', () => reset());
function setActivity(enabled) {
  scene?.setActivity(enabled);
  activityButton.setAttribute('aria-pressed', enabled);
}
activityButton.addEventListener('click', () => setActivity(activityButton.getAttribute('aria-pressed') !== 'true'));
motion.addEventListener('change', event => setActivity(!event.matches));
actions.querySelector('[data-action="day"]').addEventListener('click', event => {
  const day = scene.toggleDay();
  event.currentTarget.textContent = day ? 'Noche' : 'Día';
  event.currentTarget.setAttribute('aria-pressed', day);
});
fullscreen.hidden = !document.fullscreenEnabled;
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement === station) await document.exitFullscreen();
    else await station.requestFullscreen();
  } catch (error) {
    console.warn('Pantalla completa no disponible.', error);
  }
});
document.addEventListener('fullscreenchange', () => {
  const active = document.fullscreenElement === station;
  fullscreen.textContent = active ? 'Salir de pantalla completa' : 'Pantalla completa';
  fullscreen.setAttribute('aria-pressed', active);
});
station.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !panel.hidden) reset(true);
});

new ResizeObserver(layoutPoster).observe(view);
const toolbar = station.querySelector('.station-toolbar');
new ResizeObserver(() => {
  station.style.setProperty('--toolbar-height', toolbar.offsetHeight + 'px');
}).observe(toolbar);
layoutPoster();

function fallback() {
  scene = undefined;
  actions.hidden = true;
  station.classList.remove('is-ready');
  station.querySelector('.station-instructions').textContent = 'Pulsa un punto para descubrir la estación.';
  layoutPoster();
}

async function start() {
  try {
    const { mountStation } = await import('./station.js');
    scene = await mountStation(view, { marker: place, select, fallback }, motion);
    if (selected !== null) scene.focus(selected, false);
    station.classList.add('is-ready');
    actions.hidden = false;
    setActivity(!motion.matches);
    station.querySelector('.station-instructions').textContent = 'Arrastra para explorar · Pulsa para descubrir';
  } catch (error) {
    console.warn('Se muestra la portada alternativa.', error);
    fallback();
  }
}
start();
