import { test } from 'node:test';
import { strictEqual, throws } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAllTilesClear, isAllTilesWalkable, isTileSolid } from '../src/collision.ts';

test('tile and sight checks match Java, including outside map bounds', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-tiles-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'TileOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-cp', output, 'utilz.TileOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    strictEqual(lines.length, 1920);
    const level = Array.from({ length: 14 }, (_, y) => Array.from({ length: 26 }, (_, x) => [0, 11, 48, 49][(x + y) % 4]));
    for (const line of lines) {
      const [row, first, end, solid, clear, walkable] = line.split(',');
      const y = Number(row), start = Number(first), stop = Number(end);
      for (const [expected, check] of [[solid, () => isTileSolid(start, y, level)], [clear, () => isAllTilesClear(start, stop, y, level)], [walkable, () => isAllTilesWalkable(start, stop, y, level)]] as const) {
        if (expected === 'error') throws(check, line);
        else strictEqual(check(), expected === 'true', line);
      }
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});
