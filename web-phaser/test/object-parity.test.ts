import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameObject } from '../src/objects.ts';

test('potions, containers and cannons match Java hitboxes and animation through reset', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const output = mkdtempSync(join(tmpdir(), 'owlet-objects-'));
  try {
    const files = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.java')).map(entry => join(entry.parentPath, entry.name));
    files.push(join(root, 'web-phaser', 'test', 'fixtures', 'ObjectOracle.java'));
    execFileSync('javac', ['-encoding', 'UTF-8', '-d', output, ...files], { stdio: 'pipe' });
    const java = execFileSync('java', ['-cp', output, 'objects.ObjectOracle'], { encoding: 'utf8' }).trim().split(/\r?\n/);
    const bits = new DataView(new ArrayBuffer(4));
    const floatBits = (value: number) => { bits.setFloat32(0, value); return bits.getInt32(0); };
    let line = 0;
    for (const type of [0, 1, 2, 3, 5, 6]) {
      const object = new GameObject(type, 128, 64);
      for (let tick = 0; tick < 600; tick++) {
        if ((tick === 5 || tick === 305) && type >= 2) object.animate = true;
        if (tick === 300) object.reset();
        if (object.active || type >= 5) object.update();
        strictEqual([type, tick, floatBits(object.box.x), floatBits(object.box.y), floatBits(object.box.width),
          floatBits(object.box.height), object.index, object.tick, object.active, object.animate].join(','), java[line++]);
      }
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});
