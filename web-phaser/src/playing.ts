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
