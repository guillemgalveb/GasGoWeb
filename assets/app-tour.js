const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const icons = {
  signal: 'M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0m-4 4h.01',
  pump: 'M3 21h12M5 21V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v17M5 11h8m0 3h2a2 2 0 0 1 2 2v1a2 2 0 1 0 4 0V9l-3-3m3 6h-2V9',
  qr: 'M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zm12 0h3m3 0v3m-6 0v3h6',
  card: 'M3 6h18v12H3zm0 4h18m-14 4h4',
};

function setup(tour) {
  const steps = [...tour.querySelectorAll('.app-tour-steps li, .reference-steps article')];
  const nav = tour.querySelector('.app-tour-nav');
  const tabs = [...nav.querySelectorAll('button')];
  const controls = tour.querySelector('.app-tour-controls');
  const [previous, next] = controls.querySelectorAll('button');
  const counter = controls.querySelector('output');
  const visual = tour.querySelector('.app-tour-visual');
  const phone = visual.querySelector('.app-tour-screen');
  const preview = visual.querySelector('.reference-phone-content');
  const screens = phone && steps.map(({ dataset }) => {
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
    const data = steps[index].dataset;
    if (phone) {
      phone.src = screens[index];
      phone.alt = data.alt;
    } else {
      visual.dataset.tone = data.tone;
      preview.querySelector('path').setAttribute('d', icons[data.icon]);
      preview.querySelector('.reference-title').textContent = data.preview;
      preview.querySelector('.reference-message').textContent = data.message;
      preview.querySelector('.reference-action').textContent = data.actionLabel;
    }
    if (changed && !reducedMotion.matches) {
      transition?.cancel();
      transition = (phone || preview).animate([{ opacity: .35 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' });
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
  visual.hidden = false;
  nav.hidden = false;
  controls.hidden = false;
  tour.classList.add('tour-ready');
}

document.querySelectorAll('.app-tour, .reference-tour').forEach(setup);
