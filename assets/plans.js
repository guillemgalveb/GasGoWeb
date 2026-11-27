const form = document.querySelector('.plans-profiles');
const rates = [...form.querySelectorAll('[data-rates]')];
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

let current = form.elements.profile.value;
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
      offer.classList.toggle('is-estimated', section.dataset.rates === current && offer.dataset.offer === name);
    }
  }
  return count;
}

function selectProfile() {
  current = form.elements.profile.value;
  const profile = profiles[current];
  quantityLabel.textContent = current === 'estacion' ? 'Surtidores' : 'Vehículos';
  quantity.min = profile.minimum;
  if (profile.maximum) quantity.max = profile.maximum;
  else quantity.removeAttribute('max');
  quantity.value = counts[current] ?? profile.minimum;
  for (const section of rates) section.hidden = section.dataset.rates !== current;
  update();
}

form.addEventListener('submit', event => event.preventDefault());
for (const input of form.querySelectorAll('[name="profile"]')) input.addEventListener('change', selectProfile);
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
selectProfile();
