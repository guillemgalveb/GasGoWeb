const enabled = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
const lifetime = 620;
let last, frame = 0, canvas, ctx;
const tracks = [];

function size() {
  if (!ctx) return;
  const ratio = Math.min(devicePixelRatio, 2);
  canvas.width = innerWidth * ratio;
  canvas.height = innerHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function paint(now) {
  frame = 0;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  while (tracks.length && now - tracks[0].time >= lifetime) tracks.shift();
  ctx.lineCap = 'round';
  for (const { a, b, time } of tracks) {
    const opacity = Math.min(1, 1 - (now - time) / lifetime);
    ctx.beginPath();
    for (const side of [-1, 1]) {
      ctx.moveTo(a.x + side * a.nx, a.y + side * a.ny);
      ctx.lineTo(b.x + side * b.nx, b.y + side * b.ny);
    }
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = `rgba(236, 245, 237, ${.21 * opacity})`;
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `rgba(10, 24, 20, ${.62 * opacity})`;
    ctx.stroke();
  }
  if (tracks.length) frame = requestAnimationFrame(paint);
}

function track(event) {
  if (!enabled.matches || event.pointerType !== 'mouse') return;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'cursor-trail';
    canvas.setAttribute('aria-hidden', 'true');
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    document.body.append(canvas);
    size();
  }
  if (!ctx) return;
  const point = { x: event.clientX, y: event.clientY, time: performance.now() };
  if (last && point.time - last.time < 120) {
    const dx = point.x - last.x;
    const dy = point.y - last.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 3) return;
    if (distance < 175) {
      point.nx = -dy * 4 / distance;
      point.ny = dx * 4 / distance;
      const rear = { ...point, x: point.x - dx * 10 / distance, y: point.y - dy * 10 / distance };
      const from = last.rear ?? { ...last, nx: point.nx, ny: point.ny };
      tracks.push({ a: from, b: rear, time: point.time });
      point.rear = rear;
      if (!frame) frame = requestAnimationFrame(paint);
    }
  }
  last = point;
}

window.addEventListener('pointermove', track, { passive: true });
window.addEventListener('resize', size);
document.documentElement.addEventListener('pointerleave', () => { last = undefined; });
enabled.addEventListener('change', () => {
  last = undefined;
  if (!enabled.matches) tracks.length = 0;
});
