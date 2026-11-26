const FIXED_ONE = 2 ** 32;

export function javaImageSample(pixel: number, logical: number, offset: number, zoom: number, sourceSize = 32, otherSize = 32): number {
  const start = offset + logical * zoom;
  if (Math.abs(sourceSize * 2 * zoom - sourceSize) < 0.0001 && Math.abs(otherSize * 2 * zoom - otherSize) < 0.0001)
    return pixel - Math.floor(start + 0.5);
  const first = Math.max(0, Math.floor(start));
  const inverse = 1 / (2 * zoom);
  const translation = -start / (2 * zoom);
  const base = Math.trunc(((first + 0.5) * inverse + translation) * FIXED_ONE);
  const step = Math.trunc(inverse * FIXED_ONE);
  return Math.floor((base + (pixel - first) * step) / FIXED_ONE);
}

export function shouldBiasImageAxis(logical: number, offset: number, screenSize: number, zoom: number, sourceSize = 32, otherSize = 32): boolean {
  if (Math.abs(sourceSize * 2 * zoom - sourceSize) < 0.0001 && Math.abs(otherSize * 2 * zoom - otherSize) < 0.0001) return false;
  const start = offset + logical * zoom;
  const first = Math.max(0, Math.floor(start));
  const last = Math.min(screenSize, Math.ceil(start + sourceSize * 2 * zoom));
  const inverse = 1 / (2 * zoom);
  let needsBias = false;
  for (let pixel = first; pixel < last; pixel++) {
    const exact = (pixel + 0.5 - start) * inverse;
    if (Math.abs(exact) < 0.005 || Math.abs(exact - sourceSize) < 0.005) return false;
    const nearest = Math.round(exact);
    if (nearest <= 0 || nearest >= sourceSize) continue;
    const delta = exact - nearest;
    if (Math.abs(delta) < 1e-7) {
      if (javaImageSample(pixel, logical, offset, zoom, sourceSize, otherSize) !== nearest - 1) return false;
      needsBias = true;
    } else if (delta > 0 && delta < 0.005) return false;
  }
  return needsBias;
}
