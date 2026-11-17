import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Enemy, checkEnemyHit } from '../src/enemy.ts';

test('player attacks select enemies in the same order as Java', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-enemy-hit-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'EnemyHitOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const expected = execFileSync('java', ['-cp', output, 'entities.EnemyHitOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    strictEqual(expected.length, 6);
    for (let scenario = 0; scenario < 6; scenario++) {
      const far = scenario === 1 || scenario === 2;
      const crab = new Enemy(0, far ? 400 : 100, 100);
      const pink = new Enemy(1, far ? 400 : 100, 100);
      const shark = new Enemy(2, 100, 100);
      if (far) { pink.state = 2; pink.index = scenario === 1 ? 3 : 2; }
      if (scenario === 3) crab.state = 3;
      if (scenario === 4) { crab.active = false; pink.state = 4; }
      checkEnemyHit([crab, pink, shark], { x: scenario === 5 ? 0 : 100, y: 100, width: scenario === 5 ? 100 : 70, height: 40 });
      strictEqual([crab.health, pink.health, shark.health].join(','), expected[scenario], `scenario ${scenario}`);
    }
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
