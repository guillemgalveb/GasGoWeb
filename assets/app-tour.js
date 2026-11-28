const tour = document.querySelector('.app-tour');
const steps = [...tour.querySelectorAll('.app-tour-steps li')];
const nav = tour.querySelector('.app-tour-nav');
const tabs = [...nav.querySelectorAll('button')];
const controls = tour.querySelector('.app-tour-controls');
const [previous, next] = controls.querySelectorAll('button');
const counter = controls.querySelector('output');
const visual = tour.querySelector('.app-tour-visual');
const phone = visual.querySelector('.app-tour-screen');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const screens = steps.map(({ dataset }) => {
  const image = new Image();
  image.src = new URL(`./images/app-tour/${dataset.screen}.webp`, import.meta.url);
  return image.src;
});
let current = 0;
let transition;
let touch;

function select(index) {
  if (index < 0 || index >= steps.length) return;
  const changed = index !== current;
  current = index;
  steps.forEach((step, position) => { step.hidden = position !== index; });
  tabs.forEach((tab, position) => {
    if (position === index) tab.setAttribute('aria-current', 'step');
    else tab.removeAttribute('aria-current');
  });
  counter.value = `${index + 1} / ${steps.length}`;
  previous.setAttribute('aria-disabled', String(index === 0));
  next.setAttribute('aria-disabled', String(index === steps.length - 1));
  phone.src = screens[index];
  phone.alt = steps[index].dataset.alt;
  if (changed && !reducedMotion.matches) {
    transition?.cancel();
    transition = phone.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' });
  }
}

tabs.forEach((tab, index) => tab.addEventListener('click', () => select(index)));
for (const button of [previous, next]) {
  button.addEventListener('click', () => select(current + Number(button.dataset.tourMove)));
}
nav.addEventListener('keydown', event => {
  const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
  if (!direction) return;
  event.preventDefault();
  select(current + direction);
  tabs[current].focus();
});
visual.addEventListener('pointerdown', event => {
  if (event.pointerType === 'touch' && event.isPrimary) touch = event.clientX;
});
visual.addEventListener('pointerup', event => {
  if (event.pointerType !== 'touch' || !event.isPrimary) return;
  const delta = event.clientX - touch;
  touch = undefined;
  if (Math.abs(delta) > 45) select(current - Math.sign(delta));
});
visual.addEventListener('pointercancel', () => { touch = undefined; });

select(0);
nav.hidden = false;
controls.hidden = false;
