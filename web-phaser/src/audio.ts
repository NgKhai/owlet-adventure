export function audioVolume(value: number): number {
  // shortcut: uses the measured Java mixer range; recalibrate if the mixer range differs.
  const gain = Math.fround(Math.fround(Math.fround(86.0206) * value) - 80);
  return 10 ** (gain / 20);
}
