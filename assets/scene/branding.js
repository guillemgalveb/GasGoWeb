export async function loadServiceBrands() {
  const root = getComputedStyle(document.documentElement);
  const entries = await Promise.all(['takego', 'servicego'].map(async name => {
    const image = new Image();
    image.src = new URL(`../images/${name}-logo.webp`, import.meta.url).href;
    const palette = Object.fromEntries(['primary', 'secondary', 'tertiary'].map(role =>
      [role, root.getPropertyValue(`--${name}-${role}`).trim()]));
    try {
      await image.decode();
      return [name, { ...palette, image }];
    } catch {
      return [name, palette];
    }
  }));
  return Object.fromEntries(entries);
}
