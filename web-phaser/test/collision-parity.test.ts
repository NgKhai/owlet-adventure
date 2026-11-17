import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canMoveHere, isEntityInWater, isEntityOnFloor } from '../src/collision.ts';

test('collision probes match Java at tile boundaries and varied positions', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-collision-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'CollisionOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-cp', output, 'utilz.CollisionOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    strictEqual(lines.length, 7000);
    const level = Array.from({ length: 14 }, (_, y) =>
      Array.from({ length: 26 }, (_, x) => [0, 11, 48, 49, 11][(x * 7 + y * 11) % 5]));
    const bits = new DataView(new ArrayBuffer(4));
    const fromBits = (value: string) => { bits.setInt32(0, Number(value)); return bits.getFloat32(0); };
    for (const [index, line] of lines.entries()) {
      const [xb, yb, w, h, move, floor, water] = line.split(',');
      const box = { x: fromBits(xb), y: fromBits(yb), width: Number(w), height: Number(h) };
      strictEqual(canMoveHere(box.x, box.y, box.width, box.height, level), move === 'true', `move case ${index}`);
      strictEqual(isEntityOnFloor(box, level), floor === 'true', `floor case ${index}`);
      strictEqual(isEntityInWater(box, level), water === 'true', `water case ${index}`);
    }
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
