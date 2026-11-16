import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Enemy } from '../src/enemy.ts';

test('enemy patrol and animation match the Java implementation every tick', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-oracle-'));
  try {
    const sourceRoot = join(root, 'src');
    const files = readdirSync(sourceRoot, { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java'))
      .map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'EnemyOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const java = execFileSync('java', ['-cp', output, 'entities.EnemyOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    const level = Array.from({ length: 14 }, (_, y) => Array(26).fill(y === 2 ? 0 : 11));
    const player = { x: 1500, y: 73, width: 40, height: 54 };
    const hooks = { hitPlayer: () => {}, onSpikes: () => {}, dialogue: () => {} };
    const bits = new DataView(new ArrayBuffer(4));
    const floatBits = (value: number) => { bits.setFloat32(0, value); return bits.getInt32(0); };
    const enemies = [new Enemy(0, 100, 89), new Enemy(1, 100, 85), new Enemy(2, 100, 83)];
    let line = 0;
    enemies.forEach((enemy, type) => {
      for (let tick = 0; tick < 500; tick++) {
        enemy.update(level, player, hooks);
        strictEqual([type, tick, floatBits(enemy.box.x), floatBits(enemy.box.y), enemy.state, enemy.index].join(','), java[line++]);
      }
    });
  } finally { rmSync(output, { recursive: true, force: true }); }
});
