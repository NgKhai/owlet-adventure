export class DialogueEffect {
  x: number;
  y: number;
  type: number;
  index = 0;
  tick = 0;
  active = true;
  constructor(x: number, y: number, type: number) { this.x = x; this.y = y; this.type = type; }
  update(): void {
    if (++this.tick >= 25) {
      this.tick = 0;
      if (++this.index >= 5) { this.active = false; this.index = 0; }
    }
  }
  reset(x: number, y: number): void { this.x = x; this.y = y; this.active = true; }
}

export class DialogueEffects {
  items: DialogueEffect[] = [];
  constructor() {
    for (const type of [1, 0]) for (let i = 0; i < 10; i++) {
      const effect = new DialogueEffect(0, 0, type);
      effect.active = false;
      this.items.push(effect);
    }
  }
  add(x: number, y: number, type: number): void {
    this.items.push(new DialogueEffect(x, y - 30, type));
    for (const effect of this.items) if (!effect.active && effect.type === type) { effect.reset(x, -30); return; }
  }
  update(): void { for (const effect of this.items) if (effect.active) effect.update(); }
  clear(): void { this.items = []; }
}

export class Rain {
  drops: { x: number; y: number }[] = [];
  private random: () => number;
  constructor(random: () => number = Math.random) {
    this.random = random;
    for (let i = 0; i < 1000; i++) this.drops.push({ x: this.newX(0), y: Math.floor(this.random() * 896) });
  }
  private newX(offset: number): number { return -1664 + Math.floor(this.random() * 4992) + offset; }
  update(offset: number): void {
    for (const drop of this.drops) {
      drop.y = Math.fround(drop.y + 1.25);
      if (drop.y >= 896) { drop.y = -20; drop.x = this.newX(offset); }
    }
  }
}


export class ShipMotion {
  tick = 0;
  frame = 0;
  y = 0;
  direction = 1;

  update(): void {
    if (++this.tick >= 35) { this.tick = 0; this.frame = (this.frame + 1) % 4; }
    this.y = Math.max(0, Math.min(20, Math.fround(this.y + Math.fround(0.1 * this.direction))));
    if (this.y === 0) this.direction = 1;
    else if (this.y === 20) this.direction = -1;
  }
}
