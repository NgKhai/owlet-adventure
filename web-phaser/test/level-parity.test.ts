import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLevel } from '../src/level.ts';
import { ObjectManager } from '../src/objects.ts';

test('all five level images decode to the same tiles and placements as Java', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-levels-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'LevelOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-cp', output, 'levels.LevelOracle', join(root, 'res', 'lvls')], { encoding: 'utf8' }).trimEnd().split(/\r?\n/);
    for (let number = 0; number < 5; number++) {
      const start = number * 7, [width, height, spawnX, spawnY, offset] = lines[start].split(',').map(Number);
      const level = readLevel(width, height, new Uint8ClampedArray(Buffer.from(lines[start + 1], 'base64')));
      strictEqual(`${level.spawn?.x},${level.spawn?.y},${level.offset}`, `${spawnX},${spawnY},${offset}`);
      strictEqual(level.tiles.flat().join(','), lines[start + 2]);
      strictEqual(level.enemies.map(item => `${item.type}:${item.x}:${item.y}`).sort().join(';'), lines[start + 3]);
      const manager = new ObjectManager(level.objects);
      strictEqual([...manager.potions, ...manager.containers, ...manager.spikes, ...manager.cannons]
        .map(item => `${item.type}:${item.box.x}:${item.box.y}:${item.box.width}:${item.box.height}`).sort().join(';'), lines[start + 4]);
      strictEqual(level.objects.filter(item => item.type >= 7).map(item => `${item.type}:${item.x}:${item.y}`).sort().join(';'), lines[start + 5]);
      strictEqual(level.grass.map(item => `${item.type}:${item.x}:${item.y}`).sort().join(';'), lines[start + 6]);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});
