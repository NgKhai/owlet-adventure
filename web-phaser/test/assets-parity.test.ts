import { test } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

test('web assets match every Java resource byte for byte', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const source = join(root, 'res');
  const assets = join(root, 'web-phaser', 'assets');
  const files = readdirSync(source, { recursive: true, withFileTypes: true }).filter(entry => entry.isFile());
  for (const file of files) {
    const path = join(file.parentPath, file.name);
    const name = relative(source, path);
    deepStrictEqual(readFileSync(join(assets, name)), readFileSync(path), name);
  }
});
