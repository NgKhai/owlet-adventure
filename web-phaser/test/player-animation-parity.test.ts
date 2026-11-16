import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PlayerAnimation } from '../src/animation.ts';

test('player animation states match Java for movement, attacks and hit recovery', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-player-animation-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'PlayerAnimationOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const java = execFileSync('java', ['-cp', output, 'entities.PlayerAnimationOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    const animation = new PlayerAnimation();
    for (let tick = 0; tick < 600; tick++) {
      const moving = tick % 150 >= 50 && tick % 150 < 100;
      const inAir = tick % 200 >= 120 && tick % 200 < 160;
      const airSpeed = tick % 200 < 140 ? -2 : 2;
      const power = tick >= 260 && tick < 280;
      if (tick === 15 || tick === 180) animation.attacking = true;
      if (tick === 400) { animation.state = 5; animation.tick = 0; animation.index = 0; }
      animation.update(moving, inAir, airSpeed, power, () => ({ inAir, airSpeed: 0 }));
      strictEqual([tick, animation.state, animation.index, animation.tick, animation.attacking, animation.attackChecked].join(','), java[tick]);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});
