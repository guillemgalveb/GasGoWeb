export async function loadServiceBrands() {
  const root = getComputedStyle(document.documentElement);
  const entries = await Promise.all(['takego', 'servicego'].map(async name => {
    const image = new Image();
    image.src = new URL(`../images/${name}-logo.webp`, import.meta.url).href;
    const palette = Object.fromEntries(['primary', 'secondary', 'tertiary'].map(role =>
      [role, root.getPropertyValue(`--${name}-${role}`).trim()]));
    try {
      await image.decode();
      if (name !== 'servicego') return [name, { ...palette, image }];
      const badgeImage = new Image();
      badgeImage.src = new URL('../images/servicego-logo-light.webp', import.meta.url).href;
      await badgeImage.decode().catch(() => {});
      return [name, { ...palette, image, badgeImage: badgeImage.naturalWidth ? badgeImage : null }];
    } catch {
      return [name, palette];
    }
  }));
  return Object.fromEntries(entries);
}
