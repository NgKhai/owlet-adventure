import { canMoveHere, isEntityOnFloor, isSolid, type Rect } from './collision.ts';

// The values and operation order follow Player.updatePos at 200 updates per second.
export class PlayerMovement {
  box: Rect;
  left = false;
  right = false;
  jump = false;
  moving = false;
  inAir = false;
  airSpeed = 0;
  flip = 1;
  powerAttackActive = false;
  powerAttackTick = 0;
  pushDrawOffset = 0;
  private pushDirection = -1;
  private pushUp = true;
  private level: number[][];

  constructor(x: number, y: number, level: number[][]) {
    this.level = level;
    this.box = { x, y, width: 40, height: 54 };
  }

  reset(x: number, y: number, level: number[][]): void {
    this.level = level;
    this.left = false;
    this.right = false;
    this.inAir = false;
    this.moving = false;
    this.airSpeed = 0;
    this.powerAttackActive = false;
    this.powerAttackTick = 0;
    this.box.x = x;
    this.box.y = y;
    if (!isEntityOnFloor(this.box, level)) this.inAir = true;
  }

  hitByEnemy(enemyX: number): void {
    this.pushDirection = enemyX < this.box.x ? 1 : -1;
    this.pushUp = true;
    this.pushDrawOffset = 0;
  }

  updateHit(animationIndex: number): void {
    if (animationIndex <= 1) {
      const speed = this.pushDirection * 2.5;
      if (canMoveHere(Math.fround(this.box.x + speed), this.box.y, this.box.width, this.box.height, this.level))
        this.box.x = Math.fround(this.box.x + speed);
    }
    if (this.pushUp) {
      this.pushDrawOffset = Math.fround(this.pushDrawOffset - Math.fround(0.95));
      if (this.pushDrawOffset <= -30) this.pushUp = false;
    } else this.pushDrawOffset = Math.min(0, Math.fround(this.pushDrawOffset + Math.fround(0.95)));
  }

  recoverFromHit(): void {
    this.airSpeed = 0;
    if (!isSolid(this.box.x, this.box.y + this.box.height + 1, this.level)) this.inAir = true;
  }

  update(): void {
    this.moving = false;
    if (this.jump && !this.inAir) {
      this.inAir = true;
      this.airSpeed = -4.5;
    }
    if (!this.inAir && !this.powerAttackActive && ((!this.left && !this.right) || (this.left && this.right))) return;

    let xSpeed = 0;
    if (this.left && !this.right) { xSpeed -= 2; this.flip = -1; }
    if (this.right && !this.left) { xSpeed += 2; this.flip = 1; }
    if (this.powerAttackActive) {
      if ((!this.left && !this.right) || (this.left && this.right)) xSpeed = this.flip * 2;
      xSpeed *= 3;
    }
    if (!this.inAir && !isEntityOnFloor(this.box, this.level)) this.inAir = true;
    if (this.inAir && !this.powerAttackActive) {
      if (canMoveHere(this.box.x, Math.fround(this.box.y + this.airSpeed), this.box.width, this.box.height, this.level)) {
        this.box.y = Math.fround(this.box.y + this.airSpeed);
        this.airSpeed = Math.fround(this.airSpeed + Math.fround(0.08));
      } else {
        const tile = Math.trunc(this.box.y / 64) * 64;
        this.box.y = this.airSpeed > 0 ? tile + Math.trunc(64 - this.box.height) - 1 : tile;
        if (this.airSpeed > 0) { this.inAir = false; this.airSpeed = 0; }
        else this.airSpeed = 1;
      }
    }
    if (canMoveHere(this.box.x + xSpeed, this.box.y, this.box.width, this.box.height, this.level))
      this.box.x = Math.fround(this.box.x + xSpeed);
    else {
      const tile = Math.trunc(this.box.x / 64) * 64;
      this.box.x = xSpeed > 0 ? tile + Math.trunc(64 - this.box.width) - 1 : tile;
      if (this.powerAttackActive) { this.powerAttackActive = false; this.powerAttackTick = 0; }
    }
    this.moving = true;
  }
}
