import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cameraOffset } from '../src/playing.ts';

test('camera follows and clamps like Java across level boundaries', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-camera-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'CameraOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const expected = execFileSync('java', ['-cp', output, 'CameraOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/).map(Number);
    strictEqual(expected.length, 5400);
    let line = 0;
    for (const max of [0, 1000, 3000]) {
      let offset = 0;
      for (let i = 0; i < 1800; i++) {
        const x = Math.fround((i < 900 ? -100 + i * 7 : 6200 - (i - 900) * 7) + 0.75);
        offset = cameraOffset(x, offset, max);
        strictEqual(offset, expected[line++], `max ${max}, step ${i}, x ${x}`);
      }
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});
