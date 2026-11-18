import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { javaFillRect } from '../src/playing.ts';

test('status bar raster bounds match Java at different scales and offsets', () => {
  const output = mkdtempSync(join(tmpdir(), 'owlet-rect-'));
  try {
    const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'RectOracle.java');
    execFileSync('javac', ['-d', output, fixture], { stdio: 'pipe' });
    const lines = execFileSync('java', ['-Djava.awt.headless=true', '-cp', output, 'RectOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    strictEqual(lines.length, 3510);
    for (const line of lines) {
      const [zoom, offset, x, width, first, last] = line.split(',').map(Number);
      const rect = javaFillRect(x, 0, width, 4, zoom, offset, 0);
      const actualFirst = rect.width === 0 ? -1 : Math.round(rect.x * zoom + offset);
      const actualLast = rect.width === 0 ? -1 : Math.round((rect.x + rect.width) * zoom + offset) - 1;
      strictEqual(actualFirst, first, line);
      strictEqual(actualLast, last, line);
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});
