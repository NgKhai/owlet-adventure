export class PlayerAnimation {
  state = 0;
  index = 0;
  tick = 0;
  attacking = false;
  attackChecked = false;

  reset(): void { this.state = 0; this.attacking = false; }

  updateDeath(): boolean {
    if (this.state !== 6) { this.state = 6; this.index = 0; this.tick = 0; return false; }
    if (this.index === 7 && this.tick >= 24) return true;
    if (++this.tick >= 25) { this.tick = 0; this.index++; }
    return false;
  }

  update(moving: boolean, inAir: boolean, airSpeed: number, powerAttack = false,
    recover?: () => { inAir: boolean; airSpeed: number }): void {
    const amounts = [5, 6, 3, 1, 3, 4, 8];
    this.tick++;
    if (this.tick >= 25) {
      this.tick = 0;
      this.index++;
      if (this.index >= amounts[this.state]) {
        this.index = 0;
        this.attacking = false;
        this.attackChecked = false;
        if (this.state === 5) {
          this.state = 0;
          if (recover) ({ inAir, airSpeed } = recover());
        }
      }
    }
    const start = this.state;
    if (start === 5) return;
    this.state = moving ? 1 : 0;
    if (inAir) this.state = airSpeed < 0 ? 2 : 3;
    if (powerAttack) {
      this.state = 4;
      this.index = 1;
      this.tick = 0;
      return;
    }
    if (this.attacking) {
      this.state = 4;
      if (start !== 4) {
        this.index = 1;
        this.tick = 0;
        return;
      }
    }
    if (start !== this.state) { this.tick = 0; this.index = 0; }
  }
}
