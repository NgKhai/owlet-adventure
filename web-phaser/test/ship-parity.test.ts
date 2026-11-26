import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ShipMotion } from '../src/effects.ts';

test('ship animation and motion match Java over multiple complete cycles', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-ship-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'EnvironmentOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const expected = execFileSync('java', ['-cp', output, 'EnvironmentOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    strictEqual(expected.length, 1000);
    const ship = new ShipMotion(), bits = new DataView(new ArrayBuffer(4));
    for (let tick = 0; tick < expected.length; tick++) {
      ship.update();
      bits.setFloat32(0, ship.y);
      strictEqual(`${ship.tick},${ship.frame},${bits.getInt32(0)},${ship.direction}`, expected[tick], `tick ${tick + 1}`);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});
