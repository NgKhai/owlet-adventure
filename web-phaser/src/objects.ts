import { isAllTilesClear, isSolid, type Rect } from './collision.ts';
import type { Placement } from './level.ts';

export function intersects(a: Rect, b: Rect): boolean {
  return a.x + a.width > b.x && b.x + b.width > a.x && a.y + a.height > b.y && b.y + b.height > a.y;
}

export class GameObject {
  readonly type: number;
  readonly x: number;
  readonly y: number;
  readonly box: Rect;
  active = true;
  animate = false;
  index = 0;
  tick = 0;
  hover = 0;
  hoverDir = 1;

  constructor(type: number, x: number, y: number) {
    this.type = type; this.x = x; this.y = y;
    if (type <= 1) { this.box = { x, y, width: 14, height: 28 }; this.animate = true; }
    else if (type === 2) this.box = { x: x + 8, y: y + 14, width: 46, height: 50 };
    else if (type === 3) this.box = { x: x + 7, y: y + 28, width: 50, height: 36 };
    else if (type === 4) this.box = { x, y: y + 32, width: 64, height: 32 };
    else this.box = { x, y: y + 12, width: 80, height: 52 };
  }

  update(): void {
    if (this.animate && ++this.tick >= 25) {
      this.tick = 0;
      if (++this.index >= (this.type === 2 || this.type === 3 ? 8 : 7)) {
        this.index = 0;
        if (this.type === 2 || this.type === 3) { this.animate = false; this.active = false; }
        else if (this.type === 5 || this.type === 6) this.animate = false;
      }
    }
    if (this.type <= 1) {
      this.hover = Math.fround(this.hover + Math.fround(0.15 * this.hoverDir));
      if (this.hover >= 20) this.hoverDir = -1;
      else if (this.hover < 0) this.hoverDir = 1;
      this.box.y = Math.fround(this.y + this.hover);
    }
  }

  reset(): void {
    this.index = 0;
    this.tick = 0;
    this.active = true;
    this.animate = this.type !== 2 && this.type !== 3 && this.type !== 5 && this.type !== 6;
  }
}

export class Projectile {
  box: Rect;
  active = true;
  dir: number;
  constructor(x: number, y: number, dir: number) {
    this.dir = dir;
    this.box = { x: x + (dir === 1 ? 58 : -6), y: y + 10, width: 30, height: 30 };
  }
}

export class ObjectManager {
  potions: GameObject[] = [];
  containers: GameObject[] = [];
  spikes: GameObject[] = [];
  cannons: GameObject[] = [];
  projectiles: Projectile[] = [];
  private originalPotions: GameObject[] = [];
  private originalContainers: GameObject[] = [];

  constructor(placements: Placement[]) {
    for (const p of placements) {
      if (p.type > 6) continue;
      const item = new GameObject(p.type, p.x, p.y);
      if (p.type <= 1) this.potions.push(item);
      else if (p.type <= 3) this.containers.push(item);
      else if (p.type === 4) this.spikes.push(item);
      else this.cannons.push(item);
    }
    this.originalPotions = [...this.potions];
    this.originalContainers = [...this.containers];
  }

  reset(): void {
    this.potions = [...this.originalPotions];
    this.containers = [...this.originalContainers];
    this.projectiles = [];
    for (const item of [...this.potions, ...this.containers, ...this.cannons]) item.reset();
  }

  checkHit(box: Rect): void {
    for (const container of this.containers) {
      if (container.active && !container.animate && intersects(container.box, box)) {
        container.animate = true;
        this.potions.push(new GameObject(container.type === 2 ? 1 : 0,
          Math.trunc(container.box.x + container.box.width / 2), Math.trunc(container.box.y - container.box.height / 2)));
        return;
      }
    }
  }

  checkPotions(box: Rect, apply: (type: number) => void): void {
    for (const potion of this.potions) if (potion.active && intersects(box, potion.box)) {
      potion.active = false;
      apply(potion.type);
    }
  }

  touchesSpikes(box: Rect): boolean { return this.spikes.some(spike => intersects(spike.box, box)); }

  update(level: number[][], player: Rect, tileY: number, damage: (amount: number) => void): void {
    for (const potion of this.potions) if (potion.active) potion.update();
    for (const container of this.containers) if (container.active) container.update();
    for (const cannon of this.cannons) {
      const first = Math.trunc(player.x / 64), second = Math.trunc(cannon.box.x / 64);
      if (!cannon.animate && Math.trunc(cannon.y / 64) === tileY && Math.trunc(Math.abs(player.x - cannon.box.x)) <= 320
        && (cannon.type === 5 ? cannon.box.x > player.x : cannon.box.x < player.x)
        && isAllTilesClear(Math.min(first, second), Math.max(first, second), Math.trunc(cannon.y / 64), level)) cannon.animate = true;
      cannon.update();
      if (cannon.index === 4 && cannon.tick === 0)
        this.projectiles.push(new Projectile(Math.trunc(cannon.box.x), Math.trunc(cannon.box.y), cannon.type === 5 ? -1 : 1));
    }
    for (const projectile of this.projectiles) if (projectile.active) {
      projectile.box.x = Math.fround(projectile.box.x + projectile.dir * 1.5);
      if (intersects(projectile.box, player)) { damage(25); projectile.active = false; }
      else if (isSolid(projectile.box.x + projectile.box.width / 2, projectile.box.y + projectile.box.height / 2, level)) projectile.active = false;
    }
  }
}
