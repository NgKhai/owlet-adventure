import { test } from 'node:test';
import { ok, strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { javaTileSample, shouldBiasTileAxis } from '../src/tileSampling.ts';

test('tile bias is limited to safe boundaries', () => {
  const zoom = 600 / 1664;
  strictEqual(shouldBiasTileAxis(1500, 0, 600, zoom), true);
  strictEqual(shouldBiasTileAxis(256, 288, 900, zoom), true);
  strictEqual(shouldBiasTileAxis(1500, 0, 832, 0.5), false);
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
      strictEqual(javaTileSample(px, x, offsetX, zoom), sx, line);
      strictEqual(javaTileSample(py, y, 20, zoom), sy, line);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});
