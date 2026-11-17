import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DialogueEffects } from '../src/effects.ts';

test('dialogue allocation, reuse and reset match Java every tick', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-dialogue-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'DialogueOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const expected = execFileSync('java', ['-cp', output, 'effects.DialogueOracle'], { encoding: 'utf8' }).trimEnd().split(/\r?\n/);
    strictEqual(expected.length, 250);
    const effects = new DialogueEffects();
    for (let tick = 0; tick < 250; tick++) {
      if ([0, 10, 125, 150, 181].includes(tick)) effects.add(100 + tick, 200 + tick, tick === 10 || tick === 181 ? 1 : 0);
      if (tick === 180) effects.clear();
      effects.update();
      const actual = effects.items.map(e => [e.x, e.y, e.type, e.index, e.tick, e.active].join(':')).join(';');
      strictEqual(actual, expected[tick], `tick ${tick}`);
    }
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
