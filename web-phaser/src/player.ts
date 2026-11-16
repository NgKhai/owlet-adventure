import { PlayerAnimation } from './animation.ts';
import { canMoveHere, isEntityOnFloor, type Rect } from './collision.ts';
import { PlayerMovement } from './movement.ts';

export type PlayerHooks = {
  potion: (player: Player) => void;
  spikes: (player: Player) => void;
  water: (box: Rect) => boolean;
  enemyHit: (box: Rect) => void;
  objectHit: (box: Rect) => void;
  effect: (name: 'jump' | 'attack' | 'die' | 'gameover') => void;
  dying: () => void;
  gameOver: () => void;
};

export class Player {
  readonly movement: PlayerMovement;
  readonly animation = new PlayerAnimation();
  readonly attackBox: Rect = { x: 230, y: 200, width: 70, height: 40 };
  health = 100;
  power = 200;
  healthWidth = 300;
  powerWidth = 208;
  tileY = 0;
  private powerTick = 0;
  private level: number[][];

  constructor(x: number, y: number, level: number[][]) {
    this.level = level;
    this.movement = new PlayerMovement(x, y, level);
    this.movement.inAir = !isEntityOnFloor({ x: 200, y: 200, width: 40, height: 54 }, level);
  }

  reset(x: number, y: number, level: number[][]): void {
    this.level = level;
    this.movement.reset(x, y, level);
    this.animation.reset();
    this.health = 100;
    this.power = 200;
    this.attackBox.x = this.movement.flip === 1
      ? Math.fround(Math.fround(x + this.movement.box.width) - 10)
      : Math.fround(Math.fround(x - this.movement.box.width) - 20);
  }

  changeHealth(value: number, enemyX?: number): void {
    if (value < 0) {
      if (this.animation.state === 5) return;
      this.animation.state = 5; this.animation.tick = 0; this.animation.index = 0;
    }
    this.health = Math.max(0, Math.min(100, this.health + value));
    if (enemyX !== undefined) this.movement.hitByEnemy(enemyX);
  }

  changePower(value: number): void { this.power = Math.max(0, Math.min(200, this.power + value)); }
  kill(): void { this.health = 0; }
  powerAttack(): void {
    if (!this.movement.powerAttackActive && this.power >= 60) {
      this.movement.powerAttackActive = true;
      this.changePower(-60);
    }
  }

  update(hooks: PlayerHooks): void {
    this.healthWidth = Math.trunc(Math.fround(Math.fround(this.health / 100) * 300));
    this.powerWidth = Math.trunc(Math.fround(Math.fround(this.power / 200) * 208));
    if (++this.powerTick >= 15) { this.powerTick = 0; this.changePower(1); }
    const m = this.movement, a = this.animation;
    if (this.health <= 0) {
      if (a.state !== 6) {
        a.updateDeath(); hooks.dying(); hooks.effect('die');
        if (!isEntityOnFloor(m.box, this.level)) { m.inAir = true; m.airSpeed = 0; }
      } else if (a.updateDeath()) { hooks.gameOver(); hooks.effect('gameover'); }
      else if (m.inAir) {
        if (canMoveHere(m.box.x, Math.fround(m.box.y + m.airSpeed), m.box.width, m.box.height, this.level)) {
          m.box.y = Math.fround(m.box.y + m.airSpeed);
          m.airSpeed = Math.fround(m.airSpeed + Math.fround(0.08));
        } else m.inAir = false;
      }
      return;
    }

    if (m.left && m.right) this.attackBox.x = m.flip === 1
      ? Math.fround(Math.fround(m.box.x + m.box.width) - 10) : Math.fround(Math.fround(m.box.x - m.box.width) - 20);
    else if (m.right || (m.powerAttackActive && m.flip === 1)) this.attackBox.x = Math.fround(Math.fround(m.box.x + m.box.width) - 10);
    else if (m.left || (m.powerAttackActive && m.flip === -1)) this.attackBox.x = Math.fround(Math.fround(m.box.x - m.box.width) - 20);
    this.attackBox.y = Math.fround(m.box.y + 20);
    if (a.state === 5) m.updateHit(a.index);
    else {
      if (m.jump && !m.inAir) hooks.effect('jump');
      m.update();
    }
    if (m.moving) {
      hooks.potion(this);
      hooks.spikes(this);
      if (hooks.water(m.box)) this.kill();
      this.tileY = Math.trunc(m.box.y / 64);
      if (m.powerAttackActive && ++m.powerAttackTick >= 35) { m.powerAttackTick = 0; m.powerAttackActive = false; }
    }
    if ((a.attacking || m.powerAttackActive) && !a.attackChecked && a.index === 1) {
      a.attackChecked = !m.powerAttackActive;
      hooks.enemyHit(this.attackBox);
      hooks.objectHit(this.attackBox);
      hooks.effect('attack');
    }
    a.update(m.moving, m.inAir, m.airSpeed, m.powerAttackActive, () => {
      m.recoverFromHit();
      return { inAir: m.inAir, airSpeed: m.airSpeed };
    });
  }
}
