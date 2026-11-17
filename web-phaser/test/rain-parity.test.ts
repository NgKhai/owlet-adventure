import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Rain } from '../src/effects.ts';

test('rain movement and respawn match Java with the same random values', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-rain-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'RainOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const expected = execFileSync('java', ['-cp', output, 'effects.RainOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    strictEqual(expected.length, 150);
    const rain = new Rain(() => 0.5);
    rain.drops = [{ x: 0, y: 895 }, { x: 1000, y: 880 }, { x: -100, y: -20 }];
    const bits = new DataView(new ArrayBuffer(4));
    const floatBits = (value: number) => { bits.setFloat32(0, value); return bits.getInt32(0); };
    let line = 0;
    for (let tick = 0; tick < 50; tick++) {
      rain.update(tick * 13);
      for (const drop of rain.drops)
        strictEqual(`${floatBits(drop.x)},${floatBits(drop.y)}`, expected[line++], `tick ${tick}`);
    }
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
