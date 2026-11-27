import { test } from 'node:test';
import { ok, strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { javaImageSample, shouldBiasImageAxis, shouldRaiseImageAxis, splitImageAxis } from '../src/imageSampling.ts';

test('tile bias is limited to safe boundaries', () => {
  const zoom = 600 / 1664;
  strictEqual(shouldBiasImageAxis(1500, 0, 600, zoom), true);
  strictEqual(shouldBiasImageAxis(256, 288, 900, zoom), true);
  strictEqual(shouldBiasImageAxis(1500, 0, 832, 0.5), false);
  strictEqual(shouldBiasImageAxis(20, 0, 600, zoom, 192, 58), true);
  strictEqual(shouldBiasImageAxis(20, 288, 900, zoom, 58, 192), true);
  strictEqual(shouldBiasImageAxis(1088, 0, 600, zoom), true);
  strictEqual(shouldBiasImageAxis(704, 288, 900, zoom), true);
});

test('tile pixel sampling matches Java across scales, offsets and clipped edges', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-tile-sampling-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'TileSamplingOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'TileSamplingOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    ok(lines.length > 5000);
    for (const line of lines) {
      const [width, offsetX, x, y, px, py, sx, sy] = line.split(',').map(Number);
      const zoom = width / 1664;
      strictEqual(javaImageSample(px, x, offsetX, zoom), sx, line);
      strictEqual(javaImageSample(py, y, 20, zoom), sy, line);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});

test('status bar image sampling matches Java across scales and offsets', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-status-sampling-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'StatusBarSamplingOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'StatusBarSamplingOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    ok(lines.length > 2500);
    for (const line of lines) {
      const [width, ox, oy, px, py, sx, sy] = line.split(',').map(Number);
      const zoom = width / 1664;
      strictEqual(javaImageSample(px, 20, ox, zoom, 192, 58), sx, line);
      strictEqual(javaImageSample(py, 20, oy, zoom, 58, 192), sy, line);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});

test('cloud image sampling matches Java across scales and clipped edges', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-cloud-sampling-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'CloudSamplingOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'CloudSamplingOracle'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }).trim().split(/\r?\n/);
    ok(lines.length > 1000);
    for (const line of lines) {
      const [width, ox, oy, sw, sh, x, y, px, py, sample] = line.split(',').map(Number);
      const zoom = width / 1664;
      strictEqual(javaImageSample(px, x, ox, zoom, sw, sh), sample >> 8, line);
      strictEqual(javaImageSample(py, y, oy, zoom, sh, sw), sample & 255, line);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});


test('player sprite sampling matches Java across scales and clipped edges', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-player-sampling-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'PlayerSamplingOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'PlayerSamplingOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    ok(lines.length > 1000);
    for (const line of lines) {
      const [width, ox, oy, sw, sh, x, y, px, py, sample] = line.split(',').map(Number);
      const zoom = width / 1664;
      strictEqual(javaImageSample(px, x, ox, zoom, sw, sh), sample >> 8, line);
      strictEqual(javaImageSample(py, y, oy, zoom, sh, sw), sample & 255, line);
    }
    strictEqual(shouldBiasImageAxis(568, 217, 900, 864 / 1664, 40, 64), true);
  } finally { rmSync(output, { recursive: true, force: true }); }
});


test('tree sprite sampling matches Java across scales and clipped edges', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-tree-sampling-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'TreeSamplingOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'TreeSamplingOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    ok(lines.length > 1000);
    for (const line of lines) {
      const [width, ox, oy, sw, sh, x, y, px, py, sample] = line.split(',').map(Number);
      const zoom = width / 1664;
      strictEqual(javaImageSample(px, x, ox, zoom, sw, sh), sample >> 8, line);
      strictEqual(javaImageSample(py, y, oy, zoom, sh, sw), sample & 255, line);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});


test('enemy sprite sampling matches Java across scales and clipped edges', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-enemy-sampling-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'EnemySamplingOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'EnemySamplingOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    ok(lines.length > 1000);
    for (const line of lines) {
      const [width, ox, oy, sw, sh, x, y, px, py, sample] = line.split(',').map(Number);
      const zoom = width / 1664;
      strictEqual(javaImageSample(px, x, ox, zoom, sw, sh), sample >> 8, line);
      strictEqual(javaImageSample(py, y, oy, zoom, sh, sw), sample & 255, line);
    }
    strictEqual(shouldBiasImageAxis(558, 217, 900, 864 / 1664, 32, 72), true);
  } finally { rmSync(output, { recursive: true, force: true }); }
});


test('flipped tree sprites use the mirrored Java sampling positions', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-flipped-tree-sampling-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'FlippedTreeSamplingOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'FlippedTreeSamplingOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    ok(lines.length > 1000);
    for (const line of lines) {
      const [width, ox, oy, sw, sh, x, y, px, py, sample] = line.split(',').map(Number);
      const zoom = width / 1664;
      strictEqual(sw - 1 - javaImageSample(px, x, ox, zoom, sw, sh), sample >> 8, line);
      // Java selects a different vertical raster path for mirrored 1:1 images.
      if (width !== 832) strictEqual(javaImageSample(py, y, oy, zoom, sh, sw), sample & 255, line);
    }
    strictEqual(shouldBiasImageAxis(362, 0, 864, 864 / 1664, 62, 54), true);
  } finally { rmSync(output, { recursive: true, force: true }); }
});


test('positive status bar bias is applied only when Java samples the higher pixel', () => {
  strictEqual(shouldRaiseImageAxis(20, 340, 900, 408 / 1664, 58, 192), true);
  strictEqual(shouldRaiseImageAxis(20, 340, 900, 832 / 1664, 58, 192), false);
  let checked = 0;
  for (let width = 350; width < 1500; width++) for (const offset of [0, 20, 217, 288, 340]) {
    const zoom = width / 1664;
    if (!shouldRaiseImageAxis(20, offset, 900, zoom, 58, 192)) continue;
    checked++;
    const start = offset + 20 * zoom;
    for (let pixel = Math.max(0, Math.floor(start)); pixel < Math.min(900, Math.ceil(start + 116 * zoom)); pixel++) {
      const source = (pixel + 0.5 - start) / (2 * zoom);
      if (source >= 0 && source < 58)
        strictEqual(Math.floor(source + 0.00384), javaImageSample(pixel, 20, offset, zoom, 58, 192), `${width},${offset},${pixel}`);
    }
  }
  ok(checked > 20);
});


test('positive tile bias preserves Java sampling across positions and scales', () => {
  let checked = 0;
  for (let width = 350; width < 1500; width++) for (const position of [-64, 0, 64, 320, 512, 704]) {
    const zoom = width / 1664, offset = 340;
    if (!shouldRaiseImageAxis(position, offset, 900, zoom, 32, 32)) continue;
    checked++;
    const start = offset + position * zoom;
    for (let pixel = Math.max(0, Math.floor(start)); pixel < Math.min(900, Math.ceil(start + 64 * zoom)); pixel++) {
      const source = (pixel + 0.5 - start) / (2 * zoom);
      if (source >= 0 && source < 32)
        strictEqual(Math.floor(source + 0.00384), javaImageSample(pixel, position, offset, zoom), `${width},${position},${pixel}`);
    }
  }
  ok(checked > 0);
});


test('positive enemy bias preserves Java sprite samples across positions and scales', () => {
  let checked = 0;
  for (const [size, other] of [[72, 32], [34, 30]])
    for (let width = 350; width < 1500; width++) for (const position of [-64, 0, 558, 1292]) {
      const zoom = width / 1664, offset = 340;
      if (!shouldRaiseImageAxis(position, offset, 900, zoom, size, other)) continue;
      checked++;
      const start = offset + position * zoom;
      for (let pixel = Math.max(0, Math.floor(start)); pixel < Math.min(900, Math.ceil(start + size * 2 * zoom)); pixel++) {
        const source = (pixel + 0.5 - start) / (2 * zoom);
        if (source >= 0 && source < size)
          strictEqual(Math.floor(source + 0.00384), javaImageSample(pixel, position, offset, zoom, size, other), `${width},${position},${pixel}`);
      }
    }
  ok(checked > 0);
});


test('ship sprite sampling matches Java across scales and clipping', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-ship-sampling-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'ShipSamplingOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'ShipSamplingOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    ok(lines.length > 1000);
    for (const line of lines) {
      const [width, ox, oy, sw, sh, x, y, px, py, sample] = line.split(',').map(Number);
      const zoom = width / 1664;
      strictEqual(javaImageSample(px, x, ox, zoom, sw, sh), sample >> 8, line);
      strictEqual(javaImageSample(py, y, oy, zoom, sh, sw), sample & 255, line);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});


test('cannon and container sprite sampling matches Java', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-object-sampling-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'ObjectSamplingOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'ObjectSamplingOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    ok(lines.length > 1000);
    for (const line of lines) {
      const [width, ox, oy, sw, sh, x, y, px, py, sample] = line.split(',').map(Number);
      const zoom = width / 1664;
      strictEqual(javaImageSample(px, x, ox, zoom, sw, sh), sample >> 8, line);
      strictEqual(javaImageSample(py, y, oy, zoom, sh, sw), sample & 255, line);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});


test('pause panel sampling matches Java at different scales', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-pause-sampling-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'PauseSamplingOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'PauseSamplingOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    ok(lines.length > 1000);
    for (const line of lines) {
      const [width, oy, px, py, sx, sy] = line.split(',').map(Number), zoom = width / 1664;
      strictEqual(javaImageSample(px, 574, 0, zoom, 258, 389), sx, line);
      strictEqual(javaImageSample(py, 50, oy, zoom, 389, 258), sy, line);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});


test('completion and game-over panels sample like Java', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-overlay-sampling-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'OverlaySamplingOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'OverlaySamplingOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    ok(lines.length > 1000);
    for (const line of lines) {
      const [width, oy, sw, sh, x, y, px, py, sx, sy] = line.split(',').map(Number), zoom = width / 1664;
      strictEqual(javaImageSample(px, x, 0, zoom, sw, sh), sx, line);
      strictEqual(javaImageSample(py, y, oy, zoom, sh, sw), sy, line);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});


test('menu background and panels sample like Java', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-menu-sampling-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'MenuSamplingOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'MenuSamplingOracle'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }).trim().split(/\r?\n/);
    ok(lines.length > 1000);
    for (const line of lines) {
      const [width, oy, sw, sh, x, y, px, py, sx, sy] = line.split(',').map(Number), zoom = width / 1664;
      strictEqual(javaImageSample(px, x, 0, zoom, sw, sh), sx, line);
      strictEqual(javaImageSample(py, y, oy, zoom, sh, sw), sy, line);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});


test('menu button sampling matches Java across scales', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-menu-button-sampling-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'MenuButtonSamplingOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'MenuButtonSamplingOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    ok(lines.length > 1000);
    for (const line of lines) {
      const [width, ox, oy, sw, sh, x, y, px, py, sample] = line.split(',').map(Number), zoom = width / 1664;
      strictEqual(javaImageSample(px, x, ox, zoom, sw, sh), sample >> 8, line);
      strictEqual(javaImageSample(py, y, oy, zoom, sh, sw), sample & 255, line);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});


test('tree left-edge correction only selects Java source pixels', () => {
  strictEqual(shouldRaiseImageAxis(520, 0, 600, 600 / 1664, 39, 92), false);
  strictEqual(shouldRaiseImageAxis(520, 0, 600, 600 / 1664, 39, 92, true), true);
  let checked = 0;
  for (const [size, other] of [[39, 92], [62, 54]]) for (let width = 350; width < 1500; width++)
    for (const position of [0, 200, 520, 574, 900]) {
      const zoom = width / 1664, start = position * zoom;
      if (!shouldRaiseImageAxis(position, 0, width, zoom, size, other, true)) continue;
      checked++;
      for (let pixel = Math.max(0, Math.floor(start)); pixel < Math.min(width, Math.ceil(start + size * 2 * zoom)); pixel++) {
        const source = (pixel + 0.5 - start) / (2 * zoom);
        if (source >= 0 && source < size)
          strictEqual(Math.floor(source + 0.00384), javaImageSample(pixel, position, 0, zoom, size, other), `${width},${position},${pixel}`);
      }
    }
  ok(checked > 0);
});


test('player right-edge correction keeps Java sampling positions', () => {
  strictEqual(shouldBiasImageAxis(470, 0, 800, 800 / 1664, 64, 40), false);
  strictEqual(shouldBiasImageAxis(470, 0, 800, 800 / 1664, 64, 40, true), true);
  let checked = 0;
  for (let width = 350; width < 1500; width++) for (const position of [0, 200, 470, 520, 692]) {
    const zoom = width / 1664, start = position * zoom;
    if (!shouldBiasImageAxis(position, 0, width, zoom, 64, 40, true)) continue;
    checked++;
    for (let pixel = Math.max(0, Math.floor(start)); pixel < Math.min(width, Math.ceil(start + 128 * zoom)); pixel++) {
      const source = (pixel + 0.5 - start) / (2 * zoom);
      if (source > 0 && source <= 64)
        strictEqual(Math.floor(source - 0.00384), javaImageSample(pixel, position, 0, zoom, 64, 40), `${width},${position},${pixel}`);
    }
  }
  ok(checked > 0);
});


test('split tiles preserve Java samples on both sides of conflicting boundaries', () => {
  const split = splitImageAxis(960, 0, 800, 800 / 1664);
  ok(split);
  strictEqual(split.before, 1);
  strictEqual(split.after, -1);
  let checked = 0;
  for (let width = 350; width < 1500; width++) for (const position of [-100, 0, 128, 448, 960, 1400]) for (const offset of [0, 84, 288]) {
    const zoom = width / 1664, plan = splitImageAxis(position, offset, 900, zoom);
    if (!plan) continue;
    checked++;
    const start = offset + position * zoom;
    for (let pixel = Math.max(0, Math.floor(start)); pixel < Math.min(900, Math.ceil(start + 64 * zoom)); pixel++) {
      const source = (pixel + 0.5 - start) / (2 * zoom);
      if (source < 0 || source >= 32) continue;
      const bias: number = source < plan.cut ? plan.before : plan.after;
      strictEqual(Math.floor(source + bias * 0.00384), javaImageSample(pixel, position, offset, zoom), `${width},${position},${offset},${pixel}`);
    }
  }
  ok(checked > 20);
});


test('split clouds preserve Java samples at conflicting boundaries', () => {
  const split = splitImageAxis(896, 0, 408, 408 / 1664, 448, 101);
  ok(split);
  strictEqual(split.before, 1);
  strictEqual(split.after, -1);
  let checked = 0;
  for (const [size, other] of [[448, 101], [74, 24], [101, 448], [24, 74]])
    for (let width = 350; width < 1500; width++) for (const position of [-50, 0, 200, 408, 592, 896]) {
      const zoom = width / 1664, plan = splitImageAxis(position, 0, width, zoom, size, other);
      if (!plan) continue;
      checked++;
      const start = position * zoom;
      for (let pixel = Math.max(0, Math.floor(start)); pixel < Math.min(width, Math.ceil(start + size * 2 * zoom)); pixel++) {
        const source = (pixel + 0.5 - start) / (2 * zoom);
        if (source < 0 || source >= size) continue;
        const bias: number = source < plan.cut ? plan.before : plan.after;
        strictEqual(Math.floor(source + bias * 0.00384), javaImageSample(pixel, position, 0, zoom, size, other), `${width},${position},${pixel}`);
      }
    }
  ok(checked > 0);
});


test('overlay button sampling matches Java across scales', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-ui-button-sampling-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'UiButtonSamplingOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'UiButtonSamplingOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    ok(lines.length > 1000);
    for (const line of lines) {
      const [width, ox, oy, sw, sh, x, y, px, py, sample] = line.split(',').map(Number), zoom = width / 1664;
      strictEqual(javaImageSample(px, x, ox, zoom, sw, sh), sample >> 8, line);
      strictEqual(javaImageSample(py, y, oy, zoom, sh, sw), sample & 255, line);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});
