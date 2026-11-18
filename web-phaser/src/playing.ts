export type PlayingSteps = {
  dialogue: () => void;
  rain: () => void;
  level: () => void;
  objects: () => void;
  player: () => void;
  enemies: () => void;
  camera: () => void;
  ship: () => void;
};

export type PlayingOverlay = 'none' | 'pause' | 'gameOver' | 'levelCompleted' | 'gameCompleted';

export function javaFillRect(x: number, y: number, width: number, height: number, zoom: number, offsetX: number, offsetY: number) {
  const left = Math.floor(x * zoom + offsetX + 0.25);
  const top = Math.floor(y * zoom + offsetY + 0.25);
  const right = Math.floor((x + width) * zoom + offsetX + 0.25);
  const bottom = Math.floor((y + height) * zoom + offsetY + 0.25);
  return { x: (left - offsetX) / zoom, y: (top - offsetY) / zoom, width: (right - left) / zoom, height: (bottom - top) / zoom };
}

export class MouseClicks {
  private buttons = 0;
  private x = 0;
  private y = 0;

  press(button: number, x: number, y: number): void {
    this.buttons |= 1 << button;
    this.x = x; this.y = y;
  }
  move(x: number, y: number, down: boolean): void {
    if (down && (x !== this.x || y !== this.y)) this.buttons = 0;
    this.x = x; this.y = y;
  }
  release(button: number): boolean {
    const mask = 1 << button;
    const clicked = (this.buttons & mask) !== 0;
    this.buttons &= ~mask;
    return clicked;
  }
}

export function canHandleKey(playing: boolean, overlay: PlayingOverlay): boolean {
  return playing && overlay !== 'gameOver' && overlay !== 'levelCompleted' && overlay !== 'gameCompleted';
}

export function canHandleClick(playing: boolean, overlay: PlayingOverlay): boolean {
  return playing && overlay !== 'gameOver';
}

export function updatePlaying(playerDying: boolean, drawRain: boolean, steps: PlayingSteps): void {
  if (playerDying) { steps.player(); return; }
  steps.dialogue();
  if (drawRain) steps.rain();
  steps.level();
  steps.objects();
  steps.player();
  steps.enemies();
  steps.camera();
  steps.ship();
}
