import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Enemy } from '../src/enemy.ts';

test('enemy detection, attacks and damage match Java each tick', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-enemy-combat-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'EnemyCombatOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const java = execFileSync('java', ['-cp', output, 'entities.EnemyCombatOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    const level = Array.from({ length: 14 }, (_, y) => Array(26).fill(y === 2 ? 0 : 11));
    const player = { x: 250, y: 73, width: 40, height: 54 };
    const bits = new DataView(new ArrayBuffer(4));
    const floatBits = (value: number) => { bits.setFloat32(0, value); return bits.getInt32(0); };
    const enemies = [new Enemy(0, 200, 89), new Enemy(1, 200, 85), new Enemy(2, 200, 83)];
    let line = 0;
    enemies.forEach((enemy, type) => {
      let health = 100, state = 0;
      enemy.tileY = 1;
      const hooks = { hitPlayer: (damage: number) => { if (state !== 5) { health = Math.max(0, health - damage); state = 5; } }, onSpikes: () => {}, dialogue: () => {} };
      for (let tick = 0; tick < 600; tick++) {
        if (tick % 50 === 0) state = 0;
        if (tick === 180) enemy.hurt(20);
        if (tick === 380) enemy.reset();
        enemy.update(level, player, hooks);
        strictEqual([type, tick, floatBits(enemy.box.x), enemy.state, enemy.index, enemy.walkDir, health, state].join(','), java[line++]);
      }
    });
  } finally { rmSync(output, { recursive: true, force: true }); }
});
