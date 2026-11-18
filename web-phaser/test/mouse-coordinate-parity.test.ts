import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { centerOffset, gameCoordinate } from '../src/playing.ts';

test('resized mouse coordinates match Java GamePanel', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-mouse-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'MouseCoordinateOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'MouseCoordinateOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    strictEqual(lines.length, 6962);
    for (const line of lines) {
      const [width, height, x, y, expectedX, expectedY] = line.split(',').map(Number);
      const zoom = Math.min(width / 1664, height / 896);
      const actualX = Math.trunc(gameCoordinate(x, centerOffset(width, 1664, zoom), zoom));
      const actualY = Math.trunc(gameCoordinate(y, centerOffset(height, 896, zoom), zoom));
      strictEqual(actualX === expectedX && actualY === expectedY, true, line);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});
