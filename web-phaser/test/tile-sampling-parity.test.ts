import { test } from 'node:test';
import { ok, strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { javaImageSample, shouldBiasImageAxis } from '../src/imageSampling.ts';

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
