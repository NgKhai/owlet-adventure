import { test } from 'node:test';
import { ok, strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ObjectManager } from '../src/objects.ts';

test('object manager interactions, cannon shots and resets match Java', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-object-manager-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'ObjectManagerOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const java = execFileSync('java', ['-cp', [output, join(root, 'res')].join(delimiter), 'entities.ObjectManagerOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    const level = Array.from({ length: 14 }, () => Array(26).fill(11));
    const player = { x: 128, y: 64, width: 40, height: 54 };
    const objects = new ObjectManager([{ type: 0, x: 128, y: 64 }, { type: 3, x: 220, y: 64 }, { type: 5, x: 320, y: 64 }, { type: 6, x: 64, y: 64 }]);
    const bits = new DataView(new ArrayBuffer(4));
    const floatBits = (value: number) => { bits.setFloat32(0, value); return bits.getInt32(0); };
    let health = 50, state = 0, leftShot = false, rightShot = false;
    for (let tick = 0; tick < 600; tick++) {
      if (tick === 0 || tick === 280) level[1][3] = 0;
      if (tick === 100 || tick === 330) level[1][3] = 11;
      if (tick === 0 || tick === 200) player.x = 1000;
      if (tick === 40 || tick === 240) player.x = 128;
      if (tick % 50 === 0) state = 0;
      if (tick === 5 || tick === 305) objects.checkHit({ x: 220, y: 64, width: 80, height: 80 });
      if (tick === 45 || tick === 310) objects.checkPotions(player, type => { if (type === 0) health = Math.min(100, health + 15); });
      if (tick === 300) objects.reset();
      objects.update(level, player, 1, damage => { if (state !== 5) { state = 5; health = Math.max(0, health - damage); } });
      if (tick < 40) strictEqual(objects.cannons.every(cannon => !cannon.animate), true, 'out-of-range player does not trigger cannons');
      if (tick >= 40 && tick < 100) strictEqual(objects.cannons[0].animate, false, 'wall blocks the left-facing cannon');
      leftShot ||= objects.projectiles.some(shot => shot.dir === -1);
      rightShot ||= objects.projectiles.some(shot => shot.dir === 1);
      const projectileState = objects.projectiles.map(shot => `|${floatBits(shot.box.x)}:${shot.active}`).join('');
      const box = objects.containers[0], cannon = objects.cannons[0], rightCannon = objects.cannons[1];
      strictEqual([tick, health, state, objects.potions.length, objects.potions[0].active, box.index, box.tick,
        box.active, cannon.index, cannon.tick, rightCannon.index, rightCannon.tick, objects.projectiles.length, projectileState].join(','), java[tick]);
    }
    ok(leftShot && rightShot, 'both cannon directions fired');
  } finally { rmSync(output, { recursive: true, force: true }); }
});
