const gallery = document.querySelector('.products');
const hover = matchMedia('(hover: hover) and (pointer: fine)');

for (const product of gallery.querySelectorAll('details')) {
  const summary = product.querySelector('summary');
  product.addEventListener('pointerenter', event => {
    if (hover.matches && event.pointerType === 'mouse') product.open = true;
  });
  summary.addEventListener('focus', () => { product.open = true; });
  summary.addEventListener('click', event => {
    event.preventDefault();
    product.open = true;
  });
}
