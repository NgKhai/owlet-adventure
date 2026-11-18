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

export function containsRect(rect: { x: number; y: number; width: number; height: number }, x: number, y: number): boolean {
  return rect.width > 0 && rect.height > 0 && x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}

export function centerOffset(size: number, gameSize: number, zoom: number): number {
  return Math.trunc((size - gameSize * zoom) / 2);
}

export function gameCoordinate(position: number, offset: number, zoom: number): number {
  return (position - offset) / zoom;
}

export function cameraOffset(playerX: number, offset: number, maxOffset: number): number {
  const diff = Math.trunc(playerX) - offset;
  if (diff > 1248) offset += diff - 1248;
  else if (diff < 416) offset += diff - 416;
  return Math.max(Math.min(offset, maxOffset), 0);
}

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
