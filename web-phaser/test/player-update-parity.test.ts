import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Player, type PlayerHooks } from '../src/player.ts';

test('complete player update matches Java during movement, combat and death', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-player-update-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'PlayerUpdateOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const java = execFileSync('java', ['-cp', output, 'entities.PlayerUpdateOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    const level = Array.from({ length: 14 }, (_, y) => Array(26).fill(y === 2 ? 0 : 11));
    const player = new Player(100, 73, level);
    player.movement.inAir = false;
    const bits = new DataView(new ArrayBuffer(4));
    const floatBits = (value: number) => { bits.setFloat32(0, value); return bits.getInt32(0); };
    let events = '';
    const hooks: PlayerHooks = {
      potion: () => { events += 'P'; }, spikes: () => { events += 'S'; }, water: () => false,
      enemyHit: () => { events += 'E'; }, objectHit: () => { events += 'O'; },
      effect: name => { events += name === 'jump' ? 'J' : name === 'die' ? 'D' : name === 'gameover' ? 'G' : 'A'; },
      dying: () => { events += 'D'; }, gameOver: () => { events += 'GS'; },
    };
    for (let tick = 0; tick < 680; tick++) {
      events = '';
      player.movement.left = tick >= 80 && tick < 140;
      player.movement.right = tick < 80;
      player.movement.jump = tick >= 20 && tick < 50;
      if (tick === 10 || tick === 100 || tick === 360) player.animation.attacking = true;
      if (tick === 180) player.powerAttack();
      if (tick === 240) player.changeHealth(-25);
      if (tick === 360) player.changeHealth(-25, 500);
      if (tick === 400) player.reset(100, 73, level);
      if (tick === 450) player.kill();
      player.update(hooks);
      const m = player.movement, a = player.animation;
      strictEqual([tick, floatBits(m.box.x), floatBits(m.box.y), floatBits(m.airSpeed), m.inAir,
        a.state, a.index, a.tick, player.health, player.power, player.healthWidth, player.powerWidth,
        m.flip, player.tileY, a.attacking, a.attackChecked,
        floatBits(player.attackBox.x), floatBits(player.attackBox.y), floatBits(m.pushDrawOffset),
        m.powerAttackActive, m.powerAttackTick, m.moving, events].join(','), java[tick]);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});
