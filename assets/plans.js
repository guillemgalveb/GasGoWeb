const form = document.querySelector('.plans-profiles');
const rates = [...form.querySelectorAll('[data-rates]')];
const screens = [...form.querySelectorAll('[data-screen]')];
const back = form.querySelector('.plans-back');
const vehicles = form.querySelector('.plans-vehicles');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const icons = [
  'M3 12l2-5h14l2 5v7h-2v-2H5v2H3zm0 0h18M6 14h2m8 0h2',
  'M4 6h4l2 3h4l2-3h4M7 12l2-3h6l2 3-3 2h-4zm3 2v6h4v-6M10 11h4',
  'M3 19V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12h-2v-2H5v2zm0-7h18M6 14h2m8 0h2',
  'M3 19V5h18v14h-2v-2H5v2zm0-8h18m-15 3h2m8 0h2M10 14h4',
];
let stage = 'audience';
let shownVehicles = -1;

function updateVehicles(count) {
  vehicles.hidden = current === 'estacion';
  if (current === 'estacion' || count === shownVehicles) return;
  shownVehicles = count;
  const limit = 24;
  const marks = Array.from({ length: Math.min(count, limit) }, (_, index) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', icons[index % icons.length]);
    svg.append(path);
    return svg;
  });
  if (count > limit) {
    const rest = document.createElement('span');
    rest.textContent = '+' + (count - limit).toLocaleString('es-ES');
    marks.push(rest);
  }
  vehicles.replaceChildren(...marks);
}

const quantity = form.querySelector('#plans-quantity');
const quantityLabel = form.querySelector('.plans-quantity-label');
const stepButtons = [...form.querySelectorAll('[data-adjust]')];
const extras = [...form.querySelectorAll('.plans-extras input')];
const planName = form.querySelector('.plans-result-name');
const monthly = form.querySelector('#plans-monthly');
const installation = form.querySelector('#plans-installation');
const installationRow = installation.closest('p');
const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const profiles = {
  particular: {
    minimum: 1, maximum: 5,
    price: count => count === 1 ? ['Gratis', 0] : count <= 3 ? ['Plus', 2] : ['Familiar', 5],
  },
  autonomo: {
    minimum: 1,
    price: count => count <= 2 ? ['Gratis', 0] : ['Plus', (count - 2) * 2],
  },
  estacion: {
    minimum: 4,
    price: count => ['Estación', 199 + (count - 4) * 25, 5100 + (count - 4) * 1275],
  },
  flota: {
    minimum: 1,
    price: count => ['Flota', 29 + count * 3],
  },
};

let current;
const counts = {};
const maximumFor = profile => profile.maximum ?? Math.floor(Number.MAX_SAFE_INTEGER / 1300);

function update() {
  const profile = profiles[current];
  const count = Math.min(maximumFor(profile), Math.max(profile.minimum, Math.floor(quantity.valueAsNumber || profile.minimum)));
  counts[current] = count;
  const [name, base, setup] = profile.price(count);
  const additional = extras.filter(input => input.checked).length;
  planName.textContent = current === 'particular' || current === 'autonomo' ? 'Plan ' + name : name;
  monthly.value = euros.format(base + additional);
  installationRow.hidden = setup === undefined;
  installation.value = setup === undefined ? '' : euros.format(setup);
  stepButtons[0].disabled = count <= profile.minimum;
  stepButtons[1].disabled = count >= maximumFor(profile);
  for (const section of rates) {
    for (const offer of section.querySelectorAll('[data-offer]')) {
      const selected = section.dataset.rates === current && offer.dataset.offer === name;
      offer.classList.toggle('is-estimated', selected);
      offer.querySelector('.plan-pick').setAttribute('aria-pressed', selected);
    }
  }
  updateVehicles(count);
  return count;
}

function show(next, direction = 1) {
  stage = next;
  const active = screens.find(screen => screen.dataset.screen === next);
  for (const screen of screens) screen.hidden = screen !== active;
  back.hidden = next === 'audience';
  if (!reducedMotion.matches) {
    active.animate([
      { opacity: .15, transform: `translateX(${direction * 56}px) scale(.92)` },
      { opacity: 1, transform: 'none' },
    ], { duration: 440, easing: 'cubic-bezier(.2,.75,.25,1)' });
  }
  active.querySelector('[tabindex="-1"]:not([hidden] *)')?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function selectProfile(profileName) {
  current = profileName;
  const profile = profiles[current];
  quantityLabel.textContent = current === 'estacion' ? 'Surtidores' : 'Vehículos';
  quantity.min = profile.minimum;
  if (profile.maximum) quantity.max = profile.maximum;
  else quantity.removeAttribute('max');
  quantity.value = counts[current] ?? profile.minimum;
  for (const section of rates) section.hidden = section.dataset.rates !== current;
  update();
  show('rates');
}

form.addEventListener('submit', event => event.preventDefault());
for (const button of form.querySelectorAll('[data-profile]')) {
  button.addEventListener('click', () => {
    if (button.dataset.profile === 'profesional') show('profession');
    else selectProfile(button.dataset.profile);
  });
}
back.addEventListener('click', () => {
  show(stage === 'rates' && current !== 'particular' ? 'profession' : 'audience', -1);
});
for (const button of form.querySelectorAll('.plan-pick')) {
  button.addEventListener('click', () => {
    quantity.value = button.dataset.minimum;
    update();
  });
}
for (const input of extras) input.addEventListener('change', update);
quantity.addEventListener('input', update);
quantity.addEventListener('change', () => { quantity.value = update(); });
for (const button of stepButtons) {
  button.addEventListener('click', () => {
    const count = update();
    quantity.value = count + Number(button.dataset.adjust);
    update();
  });
}

const effects = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
for (const row of form.querySelectorAll('.branch-grid')) {
  const tiles = [...row.querySelectorAll('.bento-tile')];
  row.addEventListener('pointermove', event => {
    if (!effects.matches || event.pointerType === 'touch') return;
    for (const tile of tiles) {
      const rect = tile.getBoundingClientRect();
      tile.style.setProperty('--spot-x', (event.clientX - rect.left) + 'px');
      tile.style.setProperty('--spot-y', (event.clientY - rect.top) + 'px');
    }
    row.classList.add('is-lit');
  });
  row.addEventListener('pointerleave', () => row.classList.remove('is-lit'));
}
