const enabled = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
const lifetime = 700;
const root = document.documentElement;
const tracks = [];
let last, frame = 0, canvas, ctx, car, angle = 0;

function size() {
  if (!ctx) return;
  const ratio = Math.min(devicePixelRatio, 2);
  canvas.width = innerWidth * ratio;
  canvas.height = innerHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  last = undefined;
}

function paint(now) {
  frame = 0;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  while (tracks.length && now - tracks[0].time >= lifetime) tracks.shift();
  ctx.lineCap = 'round';
  for (const { a, b, time } of tracks) {
    const opacity = Math.min(1, 1 - (now - time) / lifetime);
    ctx.beginPath();
    for (let wheel = 0; wheel < a.length; wheel++) {
      ctx.moveTo(a[wheel].x, a[wheel].y);
      ctx.lineTo(b[wheel].x, b[wheel].y);
    }
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = `rgba(236, 245, 237, ${.25 * opacity})`;
    ctx.stroke();
    ctx.lineWidth = 1.85;
    ctx.strokeStyle = `rgba(10, 24, 20, ${.68 * opacity})`;
    ctx.stroke();
  }
  if (tracks.length) frame = requestAnimationFrame(paint);
}

// These are the rear tyres in the same coordinate space as the cursor artwork.
function rearWheels(x, y) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [[11, 36], [34, 37]].map(([wheelX, wheelY]) => {
    const dx = wheelX - 23;
    const dy = wheelY - 7;
    return { x: x + dx * cos - dy * sin, y: y + dx * sin + dy * cos };
  });
}

function hide() {
  last = undefined;
  root.classList.remove('cursor-car-active');
  if (car) car.hidden = true;
}

function track(event) {
  if (!enabled.matches || document.fullscreenElement || event.pointerType !== 'mouse') return;
  const { clientX: x, clientY: y, target } = event;
  if (target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) {
    hide();
    return;
  }
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'cursor-trail';
    canvas.setAttribute('aria-hidden', 'true');
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    car = new Image(44, 48);
    car.src = new URL('./images/cursor-car.svg', import.meta.url);
    car.alt = '';
    car.className = 'cursor-car';
    car.setAttribute('aria-hidden', 'true');
    document.body.append(canvas, car);
    size();
  }
  if (!ctx) return;
  const time = performance.now();
  const continuous = last && time - last.time < 150;
  const dx = last ? x - last.x : 0;
  const dy = last ? y - last.y : 0;
  const distance = Math.hypot(dx, dy);
  if (continuous && distance < 2) return;
  if (continuous && distance < 150) {
    const targetAngle = Math.atan2(dx, -dy);
    const turn = Math.atan2(Math.sin(targetAngle - angle), Math.cos(targetAngle - angle));
    angle += turn * Math.min(.72, .22 + distance / 75);
  }
  const rear = rearWheels(x, y);
  if (continuous && distance < 150) {
    tracks.push({ a: last.rear, b: rear, time });
    if (!frame) frame = requestAnimationFrame(paint);
  }
  car.style.transform = `translate3d(${x - 23}px, ${y - 7}px, 0) rotate(${angle}rad)`;
  if (car.complete && car.naturalWidth) {
    car.hidden = false;
    root.classList.add('cursor-car-active');
  }
  last = { x, y, time, rear };
}

window.addEventListener('pointermove', track, { passive: true });
window.addEventListener('resize', size);
window.addEventListener('blur', hide);
document.addEventListener('fullscreenchange', hide);
root.addEventListener('pointerleave', hide);
enabled.addEventListener('change', () => {
  hide();
  if (!enabled.matches) tracks.length = 0;
});
