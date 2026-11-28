import * as T from './vendor/three.module.min.js';

export function refuellingCounter(car, gasGo, label = gasGo ? 'Gas&Go' : 'Convencional', brand) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 192;
  const ctx = canvas.getContext('2d');
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const material = new T.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
  const sprite = new T.Sprite(material);
  sprite.name = 'Refuelling progress';
  sprite.position.y = 2.76;
  sprite.scale.set(2.14, 2.14, 1);
  car.add(sprite);
  let previous = -1;

  return (visible, fraction) => {
    sprite.visible = visible;
    if (!visible) return;
    const progress = Math.round(T.MathUtils.clamp(fraction, 0, 1) * 64);
    if (progress === previous) return;
    previous = progress;

    ctx.clearRect(0, 0, 192, 192);
    ctx.beginPath();
    ctx.arc(96, 96, 85, 0, Math.PI * 2);
    ctx.fillStyle = brand?.primary ?? (gasGo ? '#fcda2f' : '#ecf5ed');
    ctx.fill();
    ctx.lineWidth = 13;
    ctx.strokeStyle = brand ? '#164c85' : gasGo ? '#a99a32' : '#a8bab2';
    ctx.stroke();
    if (progress) {
      ctx.beginPath();
      ctx.arc(96, 96, 85, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress / 64);
      ctx.strokeStyle = brand ? '#81b4e8' : gasGo ? '#035141' : '#062b24';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.fillStyle = brand?.tertiary ?? (gasGo ? '#035141' : '#062b24');
    ctx.font = '700 24px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (brand?.badgeImage) {
      const h = 142 * brand.badgeImage.naturalHeight / brand.badgeImage.naturalWidth;
      ctx.drawImage(brand.badgeImage, 25, 96 - h / 2, 142, h);
    } else {
      ctx.fillText(label, 96, 96, 148);
    }
    texture.needsUpdate = true;
  };
}
