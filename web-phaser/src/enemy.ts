import { canMoveHere, isAllTilesWalkable, isEntityInWater, isEntityOnFloor, isSolid, type Rect } from './collision.ts';

export type EnemyHooks = {
  hitPlayer: (damage: number, enemy: Enemy) => void;
  onSpikes: (enemy: Enemy) => void;
  dialogue: (x: number, y: number, type: number) => void;
};

const intersects = (a: Rect, b: Rect): boolean =>
  a.x + a.width > b.x && a.y + a.height > b.y && b.x + b.width > a.x && b.y + b.height > a.y;

export class Enemy {
  readonly type: number;
  readonly box: Rect;
  readonly attackBox: Rect;
  state = 0;
  index = 0;
  tick = 0;
  active = true;
  health: number;
  inAir = false;
  airSpeed = 0;
  walkDir = 0;
  tileY = 0;
  pushDrawOffset = 0;
  private pushBackDir = 0;
  private pushUp = true;
  private firstUpdate = true;
  private attackChecked = false;
  private preRoll = true;
  private damageTick = 0;
  private idleTick = 0;
  private rollTick = 0;
  private spawnX: number;
  private spawnY: number;

  constructor(type: number, x: number, y: number) {
    this.type = type;
    this.spawnX = x;
    this.spawnY = y;
    this.health = type === 0 ? 50 : 25;
    this.box = { x, y, width: [44, 34, 36][type], height: [38, 42, 44][type] };
    this.attackBox = { x, y, width: type === 0 ? 164 : 40, height: type === 0 ? 38 : 40 };
  }

  private newState(state: number): void { this.state = state; this.tick = 0; this.index = 0; }

  reset(): void {
    this.box.x = this.spawnX;
    this.box.y = this.spawnY;
    this.firstUpdate = true;
    this.health = this.type === 0 ? 50 : 25;
    this.newState(0);
    this.active = true;
    this.airSpeed = 0;
    this.pushDrawOffset = 0;
  }

  hurt(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) this.newState(4);
    else {
      this.newState(3);
      this.pushBackDir = this.walkDir === 0 ? 2 : 0;
      this.pushUp = true;
      this.pushDrawOffset = 0;
    }
  }

  private canSee(level: number[][], player: Rect): boolean {
    if (Math.trunc(player.y / 64) !== this.tileY || Math.trunc(Math.abs(Math.fround(player.x - this.box.x))) > 320) return false;
    const first = Math.trunc(this.box.x / 64);
    const playerX = isSolid(player.x, Math.fround(Math.fround(player.y + player.height) + 1), level) ? player.x : Math.fround(player.x + player.width);
    const second = Math.trunc(playerX / 64);
    return isAllTilesWalkable(Math.min(first, second), Math.max(first, second), this.tileY, level);
  }

  private floorAhead(speed: number, level: number[][]): boolean {
    const x = speed > 0 ? Math.fround(Math.fround(this.box.x + this.box.width) + speed) : Math.fround(this.box.x + speed);
    return isSolid(x, Math.fround(Math.fround(this.box.y + this.box.height) + 1), level);
  }

  private move(level: number[][], hooks: EnemyHooks, multiplier = 1): void {
    const speed = Math.fround(Math.fround(this.walkDir === 0 ? -0.7 : 0.7) * multiplier);
    if (canMoveHere(Math.fround(this.box.x + speed), this.box.y, this.box.width, this.box.height, level) && this.floorAhead(speed, level)) {
      this.box.x = Math.fround(this.box.x + speed);
      return;
    }
    if (this.type === 2 && multiplier === 4) {
      this.newState(0); hooks.dialogue(Math.trunc(this.box.x), Math.trunc(this.box.y), 1);
    } else {
      if (this.type === 1 && this.state === 2) { this.rollOver(hooks); this.rollTick = 0; }
      this.walkDir = this.walkDir === 0 ? 2 : 0;
    }
  }

  private rollOver(hooks: EnemyHooks): void {
    this.newState(0);
    hooks.dialogue(Math.trunc(this.box.x), Math.trunc(this.box.y), 0);
  }

  private hitPlayer(player: Rect, hooks: EnemyHooks): void {
    if (intersects(this.attackBox, player)) hooks.hitPlayer([15, 20, 25][this.type], this);
    else if (this.type === 2) return;
    this.attackChecked = true;
  }

  private updateBehavior(level: number[][], player: Rect, hooks: EnemyHooks): void {
    if (this.firstUpdate) {
      if (!isEntityOnFloor(this.box, level)) this.inAir = true;
      this.firstUpdate = false;
    }
    if (this.inAir) {
      if (this.state !== 3 && this.state !== 4) {
        if (canMoveHere(this.box.x, Math.fround(this.box.y + this.airSpeed), this.box.width, this.box.height, level)) {
          this.box.y = Math.fround(this.box.y + this.airSpeed);
          this.airSpeed = Math.fround(this.airSpeed + Math.fround(0.08));
        } else {
          this.inAir = false;
          const tile = Math.trunc(this.box.y / 64) * 64;
          this.box.y = this.airSpeed > 0 ? tile + Math.trunc(64 - this.box.height) - 1 : tile;
          this.tileY = Math.trunc(this.box.y / 64);
        }
        hooks.onSpikes(this);
        if (isEntityInWater(this.box, level))
          this.hurt(this.type === 0 ? 50 : 25);
      }
      return;
    }
    if (this.state === 0) {
      if (this.type === 1) {
        this.preRoll = true;
        if (this.idleTick < 120) { this.idleTick++; return; }
        this.idleTick = 0; this.damageTick = 60;
      }
      if (isEntityOnFloor(this.box, level)) this.newState(1); else this.inAir = true;
    } else if (this.state === 1) {
      if (this.canSee(level, player)) {
        if (this.type === 1) this.newState(2);
        this.walkDir = player.x > this.box.x ? 2 : 0;
        if (this.type !== 1 && Math.trunc(Math.abs(Math.fround(player.x - this.box.x))) <= (this.type === 0 ? 64 : 128)) this.newState(2);
      }
      this.move(level, hooks, this.type === 1 && (this.state as number) === 2 ? 2 : 1);
    } else if (this.state === 2) {
      if (this.type === 1) {
        if (this.preRoll) { if (this.index >= 3) this.preRoll = false; }
        else {
          this.move(level, hooks, 2);
          if (intersects(this.box, player)) {
            if (this.damageTick >= 60) { this.damageTick = 0; hooks.hitPlayer(20, this); }
            else this.damageTick++;
          }
          if (++this.rollTick >= 300) { this.rollOver(hooks); this.rollTick = 0; }
        }
      } else {
        if (this.index === 0) this.attackChecked = false;
        if (this.index === 3) {
          if (!this.attackChecked) this.hitPlayer(player, hooks);
          if (this.type === 2) this.move(level, hooks, 4);
        }
      }
    } else if (this.state === 3) {
      if (this.index <= 2) {
        const speed = Math.fround(Math.fround(this.pushBackDir === 0 ? -0.7 : 0.7) * 2);
        if (canMoveHere(this.box.x + speed, this.box.y, this.box.width, this.box.height, level)) this.box.x = Math.fround(this.box.x + speed);
      }
      if (this.pushUp) {
        this.pushDrawOffset = Math.fround(this.pushDrawOffset - Math.fround(0.95));
        if (this.pushDrawOffset <= -30) this.pushUp = false;
      } else this.pushDrawOffset = Math.min(0, Math.fround(this.pushDrawOffset + Math.fround(0.95)));
      if (this.type === 1) this.idleTick = 120;
    }
  }

  update(level: number[][], player: Rect, hooks: EnemyHooks): void {
    this.updateBehavior(level, player, hooks);
    if (++this.tick >= 25) {
      this.tick = 0;
      this.index++;
      const amount = [this.type === 0 ? 9 : 8, 6, this.type === 2 ? 8 : 7, 4, 5][this.state];
      if (this.index >= amount) {
        if (this.type === 1 && this.state === 2) this.index = 3;
        else {
          this.index = 0;
          if (this.state === 2 || this.state === 3) this.state = 0;
          else if (this.state === 4) this.active = false;
        }
      }
    }
    if (this.type === 0) this.attackBox.x = Math.fround(this.box.x - 60);
    if (this.type === 2) this.attackBox.x = Math.fround(this.walkDir === 2 ? this.box.x + this.box.width : this.box.x - 40);
    this.attackBox.y = this.box.y;
  }
}
