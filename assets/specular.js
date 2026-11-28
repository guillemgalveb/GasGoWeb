const buttons = [...document.querySelectorAll('.specular')];
const tracking = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
const proximity = 250;
let pointer;
let frame = 0;

function draw() {
  frame = 0;
  for (const button of buttons) {
    const bounds = button.getBoundingClientRect();
    if (!pointer || !tracking.matches || !bounds.width || !bounds.height) {
      button.style.removeProperty('--shine-angle');
      button.style.removeProperty('--shine-x');
      button.style.removeProperty('--shine-y');
      button.style.removeProperty('--shine-strength');
      continue;
    }
    const x = pointer.clientX - bounds.left;
    const y = pointer.clientY - bounds.top;
    const edgeX = Math.max(0, Math.min(bounds.width, x));
    const edgeY = Math.max(0, Math.min(bounds.height, y));
    const distance = Math.hypot(x - edgeX, y - edgeY);
    const angle = Math.atan2((x - bounds.width / 2) / bounds.width, -(y - bounds.height / 2) / bounds.height);
    button.style.setProperty('--shine-angle', angle + 'rad');
    button.style.setProperty('--shine-x', edgeX + 'px');
    button.style.setProperty('--shine-y', edgeY + 'px');
    button.style.setProperty('--shine-strength', .34 + .66 * Math.max(0, 1 - distance / proximity));
  }
}

function queue() {
  if (!frame) frame = requestAnimationFrame(draw);
}

window.addEventListener('pointermove', event => {
  if (!tracking.matches || event.pointerType !== 'mouse') return;
  pointer = event;
  queue();
}, { passive: true });
document.documentElement.addEventListener('pointerleave', () => {
  pointer = undefined;
  queue();
});
tracking.addEventListener('change', queue);
