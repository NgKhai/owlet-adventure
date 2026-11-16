import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PlayerMovement } from '../src/movement.ts';

test('player movement matches Java every tick across walking, falling and direction changes', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-player-oracle-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'PlayerOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const java = execFileSync('java', ['-cp', output, 'entities.PlayerOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    const level = Array.from({ length: 14 }, (_, y) => Array(26).fill(y === 2 ? 0 : 11));
    const player = new PlayerMovement(100, 73, level);
    const bits = new DataView(new ArrayBuffer(4));
    const floatBits = (value: number) => { bits.setFloat32(0, value); return bits.getInt32(0); };
    for (let tick = 0; tick < 500; tick++) {
      player.left = tick % 160 < 60;
      player.right = tick % 160 >= 40 && tick % 160 < 120;
      if (tick === 150) { player.inAir = true; player.airSpeed = -4.5; }
      player.update();
      strictEqual([tick, floatBits(player.box.x), floatBits(player.box.y), floatBits(player.airSpeed), player.inAir, player.moving, player.flip].join(','), java[tick]);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});
