import Phaser from 'phaser';
import { audioVolume } from './audio.ts';
import { isEntityInWater } from './collision.ts';
import { readLevel, type LevelData } from './level.ts';
import { Enemy, checkEnemyHit, type EnemyHooks } from './enemy.ts';
import { ObjectManager, objectDrawDepth, type GameObject, type Projectile } from './objects.ts';
import { DialogueEffects, type DialogueEffect, Rain } from './effects.ts';
import { Player, type PlayerHooks } from './player.ts';
import { MouseClicks, cameraOffset, canHandleClick, canHandleKey, centerOffset, containsRect, gameCoordinate, javaFillRect, spriteTopEdge, updatePlaying, type PlayingOverlay, type PlayingSteps } from './playing.ts';

const WIDTH = 1664;
const HEIGHT = 896;
const ASSET = import.meta.env.BASE_URL;

type Tree = { x: number; y: number; type: number; tick: number; frame: number; image: Phaser.GameObjects.Image; edge?: Phaser.GameObjects.Image };

class GameScene extends Phaser.Scene {
  private mode: 'menu' | 'playing' | 'options' | 'credits' = 'menu';
  private menuItems: Phaser.GameObjects.GameObject[] = [];
  private level!: LevelData;
  private character!: Player;
  private playerImage!: Phaser.GameObjects.Image;
  private worldItems: Phaser.GameObjects.GameObject[] = [];
  private water: Phaser.GameObjects.Image[] = [];
  private bigClouds: Phaser.GameObjects.Image[] = [];
  private smallClouds: Phaser.GameObjects.Image[] = [];
  private smallCloudPositions = Array.from({ length: 8 }, () => 180 + Math.floor(Math.random() * 200));
  private ship!: Phaser.GameObjects.Image;
  private shipTick = 0;
  private shipFrame = 0;
  private shipY = 0;
  private shipDir = 1;
  private drawShip = true;
  private waterTick = 0;
  private waterFrame = 0;
  private offset = 0;
  private accumulated = 0;
  private lastFrameTime?: number;
  private enemies: { enemy: Enemy; image: Phaser.GameObjects.Image }[] = [];
  private enemyLevels = new Map<number, Enemy[]>();
  private objectLevels = new Map<number, ObjectManager>();
  private treeLevels = new Map<number, Tree[]>();
  private healthBar!: Phaser.GameObjects.Rectangle;
  private powerBar!: Phaser.GameObjects.Rectangle;
  private objects!: ObjectManager;
  private objectImages = new Map<GameObject | Projectile, Phaser.GameObjects.Image>();
  private trees: Tree[] = [];
  private playerSpawn?: { x: number; y: number };
  private levelIndex = 0;
  private playerDying = false;
  private overlay: PlayingOverlay = 'none';
  private overlayItems: Phaser.GameObjects.GameObject[] = [];
  private musicMuted = false;
  private effectsMuted = false;
  private audioPressed = [false, false, false];
  private audioHover = [false, false, false];
  private buttonPressed = new Map<string, boolean>();
  private buttonHover = new Map<string, boolean>();
  private volume = 0.5;
  private sliderValue = 0;
  private volumeX = 833;
  private song?: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
  private effects = new Map<string, Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound>();
  private creditsImage?: Phaser.GameObjects.Image;
  private creditsEntities: Phaser.GameObjects.Image[] = [];
  private creditsOffset = 0;
  private creditsTick = 0;
  private rain = new Rain();
  private drawRain = false;
  private rainImages: Phaser.GameObjects.Image[] = [];
  private dialogue = new DialogueEffects();
  private dialogueImages = new Map<DialogueEffect, Phaser.GameObjects.Image>();
  private playingSteps: PlayingSteps = {
    dialogue: () => this.dialogue.update(),
    rain: () => this.rain.update(this.offset),
    level: () => { if (++this.waterTick >= 40) { this.waterTick = 0; this.waterFrame = (this.waterFrame + 1) % 4; } },
    objects: () => {
      for (const tree of this.trees) if (++tree.tick >= 35) { tree.tick = 0; tree.frame = (tree.frame + 1) % 4; }
      this.objects.update(this.level.tiles, this.player.box, this.character.tileY, damage => this.character.changeHealth(-damage));
    },
    player: () => this.character.update(this.playerHooks()),
    enemies: () => this.updateEnemies(),
    camera: () => this.updateCamera(),
    ship: () => this.updateShip(),
  };

  private get player() { return this.character.movement; }
  private get animation() { return this.character.animation; }

  private updateBars(): void {
    const camera = this.cameras.main;
    const zoom = camera.zoom;
    const offsetX = Math.round(-camera.scrollX * zoom);
    const offsetY = Math.round(-camera.scrollY * zoom);
    const update = (bar: Phaser.GameObjects.Rectangle, x: number, y: number, width: number, height: number) => {
      const bounds = javaFillRect(x, y, width, height, zoom, offsetX, offsetY);
      bar.setPosition(bounds.x, bounds.y).setSize(bounds.width, bounds.height);
    };
    update(this.healthBar, 88, 48, this.character.healthWidth, 8);
    update(this.powerBar, 108, 88, this.character.powerWidth, 4);
  }

  private gamePoint(pointer: Phaser.Input.Pointer) {
    const camera = this.cameras.main;
    return {
      x: gameCoordinate(pointer.x, Math.round(-camera.scrollX * camera.zoom), camera.zoom),
      y: gameCoordinate(pointer.y, Math.round(-camera.scrollY * camera.zoom), camera.zoom),
    };
  }

  preload(): void {
    for (const name of ['background_menu', 'menu_background', 'playing_bg_img', 'big_clouds', 'small_clouds', 'water', 'health_power_bar', 'trap_atlas', 'ball', 'death_screen', 'completed_sprite', 'game_completed', 'pause_menu', 'options_background', 'credits_list', 'volume_buttons', 'rain_particle'])
      this.load.image(name, `${ASSET}${name}.png`);
    for (let i = 1; i <= 5; i++) this.load.image(`level${i}`, `${ASSET}lvls/${i}.png`);
    this.load.spritesheet('buttons', `${ASSET}button_atlas.png`, { frameWidth: 140, frameHeight: 56 });
    this.load.spritesheet('tiles', `${ASSET}outside_sprites.png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('waterTop', `${ASSET}water_atlas_animation.png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('player', `${ASSET}player_sprites.png`, { frameWidth: 64, frameHeight: 40 });
    this.load.spritesheet('ship', `${ASSET}ship.png`, { frameWidth: 78, frameHeight: 72 });
    this.load.spritesheet('crabby', `${ASSET}crabby_sprite.png`, { frameWidth: 72, frameHeight: 32 });
    this.load.spritesheet('pinkstar', `${ASSET}pinkstar_atlas.png`, { frameWidth: 34, frameHeight: 30 });
    this.load.spritesheet('shark', `${ASSET}shark_atlas.png`, { frameWidth: 34, frameHeight: 30 });
    this.load.spritesheet('potions', `${ASSET}potions_sprites.png`, { frameWidth: 12, frameHeight: 16 });
    this.load.spritesheet('containers', `${ASSET}objects_sprites.png`, { frameWidth: 40, frameHeight: 30 });
    this.load.spritesheet('cannon', `${ASSET}cannon_atlas.png`, { frameWidth: 40, frameHeight: 26 });
    this.load.spritesheet('grass', `${ASSET}grass_atlas.png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('tree1', `${ASSET}tree_one_atlas.png`, { frameWidth: 39, frameHeight: 92 });
    this.load.spritesheet('tree2', `${ASSET}tree_two_atlas.png`, { frameWidth: 62, frameHeight: 54 });
    this.load.spritesheet('urm', `${ASSET}urm_buttons.png`, { frameWidth: 56, frameHeight: 56 });
    this.load.spritesheet('soundButton', `${ASSET}sound_button.png`, { frameWidth: 42, frameHeight: 42 });
    this.load.spritesheet('question', `${ASSET}question_atlas.png`, { frameWidth: 14, frameHeight: 12 });
    this.load.spritesheet('exclamation', `${ASSET}exclamation_atlas.png`, { frameWidth: 14, frameHeight: 12 });
    this.load.audio('menuMusic', `${ASSET}audio/menu.wav`);
    this.load.audio('levelMusic', `${ASSET}audio/level1.wav`);
    this.load.audio('levelMusic2', `${ASSET}audio/level2.wav`);
    for (const name of ['die', 'gameover', 'lvlcompleted', 'jump', 'attack1', 'attack2', 'attack3']) this.load.audio(name, `${ASSET}audio/${name}.wav`);
  }

  create(): void {
    const resizeCamera = (size: Phaser.Structs.Size) => {
      const zoom = Math.min(size.width / WIDTH, size.height / HEIGHT);
      if (zoom <= 0) return;
      // Java clips to the window, so objects can extend beyond the game area.
      this.cameras.main.roundPixels = false;
      this.cameras.main.setViewport(0, 0, size.width, size.height).setOrigin(0, 0).setZoom(zoom)
        .setScroll(-centerOffset(size.width, WIDTH, zoom) / zoom, -centerOffset(size.height, HEIGHT, zoom) / zoom);
      if (this.healthBar?.scene && this.powerBar?.scene && this.character) this.updateBars();
      this.updateTreeEdges();
    };
    this.scale.on('resize', resizeCamera);
    this.events.once('shutdown', () => this.scale.off('resize', resizeCamera));
    resizeCamera(this.scale.gameSize);
    this.sound.pauseOnBlur = false;
    for (const [key, field] of [['A', 'left'], ['D', 'right'], ['SPACE', 'jump']] as const) {
      this.input.keyboard!.on(`keydown-${key}`, () => {
        if (canHandleKey(this.mode === 'playing', this.overlay)) this.player[field] = true;
      });
      this.input.keyboard!.on(`keyup-${key}`, () => {
        if (canHandleKey(this.mode === 'playing', this.overlay)) this.player[field] = false;
      });
    }
    this.textures.get('volume_buttons').add('slider', 0, 84, 0, 215, 44);
    for (let i = 0; i < 3; i++) this.textures.get('volume_buttons').add(`knob${i}`, 0, i * 28, 0, 28, 44);
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.mode === 'options') this.showMenuFromScreen();
      else if (this.mode === 'playing' && (this.overlay === 'none' || this.overlay === 'pause')) {
        if (this.overlay === 'pause') this.closeOverlay(); else this.showPause();
      }
    });
    this.input.keyboard!.on('keyup-ESC', () => { if (this.mode === 'credits') this.showMenuFromScreen(true); });
    this.game.events.on('blur', () => { if (this.mode === 'playing') { this.player.left = false; this.player.right = false; } });
    const canvas = this.game.canvas;
    const preventContextMenu = (event: MouseEvent) => event.preventDefault();
    const clicks = new MouseClicks();
    canvas.addEventListener('contextmenu', preventContextMenu);
    this.events.once('shutdown', () => canvas.removeEventListener('contextmenu', preventContextMenu));
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => clicks.press(pointer.button, pointer.x, pointer.y));
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => clicks.move(pointer.x, pointer.y, pointer.isDown));
    this.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => clicks.release(pointer.button));
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!clicks.release(pointer.button) || !canHandleClick(this.mode === 'playing', this.overlay)) return;
      if (pointer.button === 0) this.animation.attacking = true;
      else if (pointer.button === 2) this.character.powerAttack();
    });
    this.showMenu();
    this.playSong('menuMusic');
  }

  private image(x: number, y: number, key: string, frame?: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, key, frame).setOrigin(0);
  }

  private interactive(image: Phaser.GameObjects.Image): Phaser.GameObjects.Image {
    return image.setInteractive(new Phaser.Geom.Rectangle(0, 0, image.width, image.height), () => {
      const { x, y } = this.gamePoint(this.input.activePointer);
      return containsRect(image.getBounds(), Math.trunc(x), Math.trunc(y));
    });
  }

  private showMenu(): void {
    this.mode = 'menu';
    this.menuItems.push(this.image(0, 0, 'background_menu').setDisplaySize(WIDTH, HEIGHT));
    const panel = this.image(0, 50, 'menu_background').setScale(2);
    panel.x = WIDTH / 2 - panel.displayWidth / 2;
    this.menuItems.push(panel);
    const buttons = [0, 1, 3, 2];
    buttons.forEach((row, i) => {
      const button = this.interactive(this.image(WIDTH / 2 - 140, (130 + i * 70) * 2, 'buttons', row * 3).setScale(2));
      let pressed = false;
      button.on('pointerover', (pointer: Phaser.Input.Pointer) => { if (!pointer.isDown) button.setFrame(row * 3 + (pressed ? 2 : 1)); });
      button.on('pointermove', (pointer: Phaser.Input.Pointer) => { if (!pointer.isDown) button.setFrame(row * 3 + (pressed ? 2 : 1)); });
      button.on('pointerout', (pointer: Phaser.Input.Pointer) => { if (!pointer.isDown) button.setFrame(row * 3 + (pressed ? 2 : 0)); });
      this.resetOnPointerUp(button, () => { pressed = false; button.setFrame(row * 3); });
      button.on('pointerdown', () => { pressed = true; button.setFrame(row * 3 + 2); });
      button.on('pointerup', () => {
        if (pressed) {
          if (i === 0) this.startPlaying();
          else if (i === 1) this.showOptions();
          else if (i === 2) this.showCredits();
          else { this.game.destroy(true); window.close(); }
          return;
        }
        if (i === 0) this.playSong(this.levelIndex % 2 === 0 ? 'levelMusic' : 'levelMusic2');
        pressed = false;
        button.setFrame(row * 3);
      });
      this.menuItems.push(button);
    });
  }

  private clearMenuItems(): void { for (const item of this.menuItems) item.destroy(); this.menuItems = []; }

  private resetOnPointerUp(item: Phaser.GameObjects.GameObject, reset: () => void, shouldReset: (pointer: Phaser.Input.Pointer) => boolean = () => true): void {
    const creationEvent = this.input.activePointer.event;
    const onUp = (pointer: Phaser.Input.Pointer) => { if (pointer.event !== creationEvent && shouldReset(pointer)) reset(); };
    this.input.on('pointerup', onUp);
    this.input.on('pointerupoutside', onUp);
    item.once('destroy', () => {
      this.input.off('pointerup', onUp);
      this.input.off('pointerupoutside', onUp);
    });
  }

  private playSong(key: string): void {
    this.song?.destroy();
    this.song = this.sound.add(key, { loop: true, volume: audioVolume(this.volume), mute: this.musicMuted }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
    this.song.play();
  }

  private playEffect(key: string): void {
    let effect = this.effects.get(key);
    if (!effect) {
      effect = this.sound.add(key, { volume: audioVolume(this.volume), mute: this.effectsMuted }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
      this.effects.set(key, effect);
    }
    if (effect.isPlaying) effect.stop();
    effect.play();
  }

  private showMenuFromScreen(playMusic = false): void {
    this.clearMenuItems();
    this.creditsEntities = [];
    this.creditsImage = undefined;
    this.creditsOffset = 0;
    if (playMusic) this.playSong('menuMusic');
    this.showMenu();
  }

  private showOptions(): void {
    this.clearMenuItems(); this.mode = 'options';
    this.menuItems.push(this.image(0, 0, 'background_menu').setDisplaySize(WIDTH, HEIGHT));
    const panel = this.image(0, 66, 'options_background').setScale(2);
    panel.x = WIDTH / 2 - panel.displayWidth / 2;
    this.menuItems.push(panel);
    this.uiButton(this.menuItems, 'urm', 2, 774, 650, () => this.showMenuFromScreen());
    this.addAudioControls(this.menuItems);
  }

  private showCredits(): void {
    this.clearMenuItems(); this.mode = 'credits'; this.creditsOffset = 0;
    this.menuItems.push(this.image(0, 0, 'background_menu').setDisplaySize(WIDTH, HEIGHT));
    this.creditsImage = this.image(0, HEIGHT, 'credits_list').setScale(2);
    this.creditsImage.x = WIDTH / 2 - this.creditsImage.displayWidth / 2;
    this.menuItems.push(this.creditsImage);
    const specs: [string, number, number][] = [['player', 83, 716], ['crabby', 249, 672], ['pinkstar', 1164, 672], ['shark', 1331, 716]];
    this.creditsEntities = specs.map(([key, x, y], i) =>
      this.image(x, y, key, Math.floor(this.creditsTick / 25) % [5, 9, 8, 8][i]).setScale(4));
    this.menuItems.push(...this.creditsEntities);
  }

  private uiButton(target: Phaser.GameObjects.GameObject[], key: string, row: number, x: number, y: number, action: () => void, depth = 0): void {
    const id = `${this.mode}:${this.overlay}:${key}:${row}:${x}:${y}`;
    let pressed = this.buttonPressed.get(id) ?? false;
    const button = this.interactive(this.image(x, y, key, row * 3 + (pressed ? 2 : this.buttonHover.get(id) ? 1 : 0)).setScale(2).setDepth(depth));
    const move = (x: number, y: number) => {
      const over = containsRect(button.getBounds(), Math.trunc(x), Math.trunc(y));
      this.buttonHover.set(id, over);
      button.setFrame(row * 3 + (pressed ? 2 : over ? 1 : 0));
    };
    const movePointer = (pointer: Phaser.Input.Pointer) => {
      const { x, y } = this.gamePoint(pointer);
      if (!pointer.isDown) move(x, y);
    };
    this.input.on('pointermove', movePointer);
    button.once('destroy', () => this.input.off('pointermove', movePointer));
    const reset = () => { pressed = false; this.buttonPressed.set(id, false); this.buttonHover.set(id, false); button.setFrame(row * 3); };
    this.resetOnPointerUp(button, reset);
    button.on('pointerdown', () => { pressed = true; this.buttonPressed.set(id, true); button.setFrame(row * 3 + 2); });
    button.on('pointerup', () => { if (pressed) { reset(); action(); } });
    target.push(button);
  }

  private addAudioControls(target: Phaser.GameObjects.GameObject[], depth = 0): void {
    const overNavigation = (x: number, y: number) => target.some(item => item instanceof Phaser.GameObjects.Image
      && item.texture.key === 'urm' && containsRect(item.getBounds(), Math.trunc(x), Math.trunc(y)));
    const releaseAudio = (pointer: Phaser.Input.Pointer) => {
      const { x, y } = this.gamePoint(pointer);
      return !overNavigation(x, y);
    };
    const buttons: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < 2; i++) {
      const button = this.interactive(this.image(900, i === 0 ? 280 : 372, 'soundButton', (i === 0 ? this.musicMuted : this.effectsMuted) ? 3 : 0)
        .setScale(2).setDepth(depth));
      const frame = (state: number) => button.setFrame(((i === 0 ? this.musicMuted : this.effectsMuted) ? 3 : 0) + state);
      frame(this.audioPressed[i] ? 2 : this.audioHover[i] ? 1 : 0);
      this.resetOnPointerUp(button, () => { this.audioPressed[i] = false; this.audioHover[i] = false; frame(0); }, releaseAudio);
      button.on('pointerdown', () => { this.audioPressed[i] = true; frame(2); });
      button.on('pointerup', () => {
        if (this.audioPressed[i]) {
          if (i === 0) { this.musicMuted = !this.musicMuted; this.song?.setMute(this.musicMuted); }
          else {
            this.effectsMuted = !this.effectsMuted;
            for (const effect of this.effects.values()) effect.setMute(this.effectsMuted);
            if (!this.effectsMuted) this.playEffect('jump');
          }
        }
        this.audioPressed[i] = false; frame(0);
      });
      buttons.push(button);
      target.push(button);
    }
    const slider = this.add.image(618, 556, 'volume_buttons', 'slider').setOrigin(0).setScale(2).setDepth(depth);
    const knob = this.interactive(this.add.image(this.volumeX - 28, 556, 'volume_buttons', this.audioPressed[2] ? 'knob2' : this.audioHover[2] ? 'knob1' : 'knob0').setOrigin(0).setScale(2).setDepth(depth));
    knob.on('pointerdown', () => { this.audioPressed[2] = true; knob.setFrame('knob2'); });
    this.resetOnPointerUp(knob, () => { this.audioPressed[2] = false; this.audioHover[2] = false; knob.setFrame('knob0'); }, releaseAudio);
    const moveAudio = (x: number, y: number) => {
      if (overNavigation(x, y)) return;
      const controls = [...buttons, knob];
      const over = controls.findIndex(item => containsRect(item.getBounds(), Math.trunc(x), Math.trunc(y)));
      controls.forEach((item, i) => {
        this.audioHover[i] = i === over;
        const state = this.audioPressed[i] ? 2 : this.audioHover[i] ? 1 : 0;
        item.setFrame(i === 2 ? `knob${state}` : ((i === 0 ? this.musicMuted : this.effectsMuted) ? 3 : 0) + state);
      });
    };
    const changeVolume = (x: number) => {
      this.volumeX = Math.max(646, Math.min(1020, Math.trunc(x)));
      knob.x = this.volumeX - 28;
      const value = Math.fround((this.volumeX - 646) / 374);
      if (value !== this.sliderValue) {
        this.sliderValue = value;
        this.volume = value;
        this.song?.setVolume(audioVolume(this.volume));
        for (const effect of this.effects.values()) effect.setVolume(audioVolume(this.volume));
      }
    };
    const movePointer = (pointer: Phaser.Input.Pointer) => {
      const { x, y } = this.gamePoint(pointer);
      if (!pointer.isDown) moveAudio(x, y);
      else if (this.audioPressed[2]) changeVolume(x);
    };
    this.input.on('pointermove', movePointer);
    knob.once('destroy', () => this.input.off('pointermove', movePointer));
    target.push(slider, knob);
  }

  private startPlaying(playMusic = true, changeSpawn = false): void {
    this.clearMenuItems();
    this.mode = 'playing';
    const source = this.textures.get(`level${this.levelIndex + 1}`).getSourceImage() as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = source.width; canvas.height = source.height;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(source, 0, 0);
    this.level = readLevel(source.width, source.height, context.getImageData(0, 0, source.width, source.height).data);
    if (!this.level.spawn) throw new Error('Level has no player spawn');
    if (!this.playerSpawn || changeSpawn) this.playerSpawn = this.level.spawn;
    if (this.character) this.character.reset(this.playerSpawn.x, this.playerSpawn.y, this.level.tiles);
    else this.character = new Player(this.playerSpawn.x, this.playerSpawn.y, this.level.tiles);
    this.playerDying = false;
    this.drawRain = Math.random() >= 0.8;
    const existingObjects = this.objectLevels.get(this.levelIndex);
    this.objects = existingObjects ?? new ObjectManager(this.level.objects);
    if (existingObjects) this.objects.reset();
    else this.objectLevels.set(this.levelIndex, this.objects);
    this.worldItems.push(this.image(0, 0, 'playing_bg_img').setDisplaySize(WIDTH, HEIGHT));
    for (let i = 0; i < 4; i++) this.bigClouds.push(this.image(i * 896, 408, 'big_clouds').setDisplaySize(896, 202));
    for (let i = 0; i < 8; i++) this.smallClouds.push(this.image(592 * i, this.smallCloudPositions[i], 'small_clouds').setDisplaySize(148, 48));
    if (this.drawRain) for (let i = 0; i < this.rain.drops.length; i++)
      this.rainImages.push(this.image(0, 0, 'rain_particle').setDisplaySize(3, 12).setDepth(1));
    this.ship = this.image(200, 576, 'ship', 0).setScale(2).setDepth(2).setVisible(this.drawShip);
    this.worldItems.push(...this.bigClouds, ...this.smallClouds, this.ship);
    this.level.tiles.forEach((row, y) => row.forEach((tile, x) => {
      const image = tile === 48 ? this.image(x * 64, y * 64, 'waterTop', 0)
        : tile === 49 ? this.image(x * 64, y * 64, 'water') : this.image(x * 64, y * 64, 'tiles', tile);
      image.setDisplaySize(64, 64).setDepth(10);
      image.setData('worldX', x * 64);
      this.worldItems.push(image);
      if (tile === 48) this.water.push(image);
    }));
    for (const grass of this.level.grass) {
      const image = this.image(grass.x, grass.y, 'grass', grass.type).setScale(2).setDepth(25);
      image.setData('worldX', grass.x);
      this.worldItems.push(image);
    }
    let levelEnemies = this.enemyLevels.get(this.levelIndex);
    if (levelEnemies) for (const enemy of levelEnemies) enemy.reset();
    else {
      levelEnemies = [...this.level.enemies].sort((a, b) => a.type - b.type).map(item => new Enemy(item.type, item.x, item.y));
      this.enemyLevels.set(this.levelIndex, levelEnemies);
    }
    for (const enemy of levelEnemies) {
      const image = this.image(0, 0, ['crabby', 'pinkstar', 'shark'][enemy.type], 0).setScale(2).setDepth(30);
      this.enemies.push({ enemy, image });
      this.worldItems.push(image);
    }
    this.playerImage = this.image(0, 0, 'player', 0).setScale(2).setDepth(40);
    this.worldItems.push(this.playerImage);
    const savedTrees = this.treeLevels.get(this.levelIndex);
    if (savedTrees) {
      this.trees = savedTrees;
      for (const tree of this.trees) tree.image = this.image(0, 0, tree.type === 7 ? 'tree1' : 'tree2', 0).setScale(2).setDepth(50);
    } else {
      for (const item of this.level.objects.filter(item => item.type >= 7)) {
        const image = this.image(0, 0, item.type === 7 ? 'tree1' : 'tree2', 0).setScale(2).setDepth(50);
        this.trees.push({ ...item, tick: 0, frame: Math.floor(Math.random() * 4), image });
      }
      this.treeLevels.set(this.levelIndex, this.trees);
    }
    this.trees.forEach((tree, i) => {
      tree.image.setDepth(50 + i * 0.001);
      tree.edge = this.image(0, 0, tree.type === 7 ? 'tree1' : 'tree2', 0).setDepth(50 + i * 0.001 + 0.0005).setVisible(false);
    });
    this.worldItems.push(this.image(20, 20, 'health_power_bar').setDisplaySize(384, 116).setDepth(41));
    this.healthBar = this.add.rectangle(88, 48, 300, 8, 0xff0000).setOrigin(0).setDepth(41);
    this.powerBar = this.add.rectangle(108, 88, 208, 4, 0xffff00).setOrigin(0).setDepth(41);
    if (playMusic) this.playSong(this.levelIndex % 2 === 0 ? 'levelMusic' : 'levelMusic2');
  }

  update(time: number, delta: number): void {
    if (this.lastFrameTime !== undefined) delta = Math.max(0, time - this.lastFrameTime);
    this.lastFrameTime = time;
    if (this.mode === 'credits') {
      this.accumulated += delta;
      while (this.accumulated >= 5) {
        this.accumulated -= 5;
        this.creditsOffset = Math.fround(this.creditsOffset - Math.fround(0.2));
        this.creditsTick++;
      }
      if (this.creditsImage) this.creditsImage.y = Math.trunc(Math.fround(HEIGHT + this.creditsOffset));
      this.creditsEntities.forEach((image, i) => image.setFrame(Math.floor(this.creditsTick / 25) % [5, 9, 8, 8][i]));
      return;
    }
    if (this.mode !== 'playing' || this.overlay !== 'none') return;
    this.accumulated += delta;
    while (this.accumulated >= 5) {
      this.accumulated -= 5;
      updatePlaying(this.playerDying, this.drawRain, this.playingSteps);
      if (this.overlay !== 'none') break;
    }
    for (const item of this.worldItems) if (item instanceof Phaser.GameObjects.Image && item.getData('worldX') !== undefined)
      item.x = item.getData('worldX') - this.offset;
    this.water.forEach(image => image.setFrame(this.waterFrame));
    this.bigClouds.forEach((image, i) => image.x = i * 896 - Math.trunc(this.offset * 0.3));
    this.smallClouds.forEach((image, i) => image.x = i * 592 - Math.trunc(this.offset * 0.7));
    this.ship.setPosition(200 - this.offset, Math.trunc(Math.fround(576 + this.shipY))).setFrame(this.shipFrame);
    this.playerImage.setPosition(Math.trunc(Math.fround(this.player.box.x - 42)) - this.offset,
      Math.trunc(Math.fround(Math.fround(this.player.box.y - 8) + Math.trunc(this.player.pushDrawOffset))))
      .setFrame(this.animation.state * 8 + this.animation.index).setFlipX(this.player.flip === -1);
    this.updateBars();
    this.renderObjects();
    this.rainImages.forEach((image, i) => image.setPosition(Math.trunc(this.rain.drops[i].x) - this.offset, Math.trunc(this.rain.drops[i].y)));
    for (const effect of this.dialogue.items) {
      let image = this.dialogueImages.get(effect);
      if (!image && effect.active) {
        image = this.image(0, 0, effect.type === 0 ? 'question' : 'exclamation', 0).setScale(2).setDepth(70);
        this.dialogueImages.set(effect, image);
      }
      if (image) image.setVisible(effect.active).setPosition(effect.x - this.offset, effect.y).setFrame(effect.index);
    }
    for (const { enemy, image } of this.enemies) {
      image.setVisible(enemy.active);
      const xOffset = [52, 18, 16][enemy.type];
      const yOffset = [18, 14, 12][enemy.type];
      const columns = enemy.type === 0 ? 9 : 8;
      image.setPosition(Math.trunc(enemy.box.x) - this.offset - xOffset,
        Math.trunc(enemy.box.y) - yOffset + Math.trunc(enemy.pushDrawOffset))
        .setFrame(enemy.state * columns + enemy.index).setFlipX(enemy.walkDir === 2);
    }
  }

  private updateEnemies(): void {
    const hooks: EnemyHooks = {
      hitPlayer: (damage, enemy) => this.character.changeHealth(-damage, enemy.box.x),
      onSpikes: enemy => { if (this.objects.touchesSpikes(enemy.box)) enemy.hurt(200); },
      dialogue: (x, y, type) => this.dialogue.add(x, y, type),
    };
    let anyActive = false;
    for (const { enemy } of this.enemies) if (enemy.active) { enemy.update(this.level.tiles, this.player.box, hooks); anyActive = true; }
    if (!anyActive) {
      this.song?.stop(); this.playEffect('lvlcompleted');
      if (this.levelIndex === 4) {
        this.clearPlaying(); this.levelIndex = 0; this.startPlaying(false); this.showOverlay('gameCompleted');
      } else this.showOverlay('levelCompleted');
    }
  }

  private updateCamera(): void {
    this.offset = cameraOffset(this.player.box.x, this.offset, this.level.offset);
  }

  private updateShip(): void {
    if (!this.drawShip) return;
    if (++this.shipTick >= 35) { this.shipTick = 0; this.shipFrame = (this.shipFrame + 1) % 4; }
    this.shipY = Math.max(0, Math.min(20, Math.fround(this.shipY + Math.fround(0.1 * this.shipDir))));
    if (this.shipY === 0) this.shipDir = 1;
    else if (this.shipY === 20) this.shipDir = -1;
  }

  private playerHooks(): PlayerHooks {
    return {
      potion: player => this.objects.checkPotions(player.movement.box, type => {
        if (type === 0) player.changeHealth(15); else player.changePower(10);
      }),
      spikes: player => { if (this.objects.touchesSpikes(player.movement.box)) player.kill(); },
      water: box => isEntityInWater(box, this.level.tiles),
      enemyHit: box => checkEnemyHit(this.enemies.map(({ enemy }) => enemy), box),
      objectHit: box => this.objects.checkHit(box),
      effect: name => this.playEffect(name === 'attack' ? `attack${1 + Math.floor(Math.random() * 3)}` : name),
      dying: () => { this.playerDying = true; },
      gameOver: () => { this.song?.stop(); this.showOverlay('gameOver'); },
    };
  }

  private showOverlay(kind: 'gameOver' | 'levelCompleted' | 'gameCompleted'): void {
    this.overlay = kind;
    const shade = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0, 200 / 255).setOrigin(0).setDepth(80);
    const key = kind === 'gameOver' ? 'death_screen' : kind === 'levelCompleted' ? 'completed_sprite' : 'game_completed';
    const background = this.image(0, kind === 'levelCompleted' ? 150 : 200, key).setScale(2).setDepth(81);
    background.x = WIDTH / 2 - background.displayWidth / 2;
    this.overlayItems.push(shade, background);
    if (kind === 'gameCompleted') {
      this.overlayButton('buttons', 2, WIDTH / 2 - 140, 540, () => this.returnMenu());
      this.overlayButton('buttons', 3, WIDTH / 2 - 140, 400, () => { this.clearPlaying(); this.levelIndex = 0; this.showCredits(); });
      return;
    }
    const menuX = kind === 'gameOver' ? 670 : 660;
    const nextX = kind === 'gameOver' ? 880 : 890;
    this.overlayButton('urm', 2, menuX, 390, () => this.returnMenu());
    this.overlayButton('urm', 0, nextX, 390, () => {
      if (kind === 'levelCompleted') { this.levelIndex++; this.drawShip = false; }
      this.restartLevel(true, kind === 'levelCompleted');
    });
  }

  private showPause(): void {
    this.overlay = 'pause';
    this.overlayItems.push(this.add.rectangle(0, 0, WIDTH, HEIGHT, 0, 150 / 255).setOrigin(0).setDepth(80));
    const panel = this.image(0, 50, 'pause_menu').setScale(2).setDepth(81);
    panel.x = WIDTH / 2 - panel.displayWidth / 2;
    this.overlayItems.push(panel);
    this.overlayButton('urm', 2, 626, 650, () => this.returnMenu());
    this.overlayButton('urm', 1, 774, 650, () => this.restartLevel(false));
    this.overlayButton('urm', 0, 924, 650, () => this.closeOverlay());
    this.addAudioControls(this.overlayItems, 82);
  }

  private closeOverlay(): void {
    for (const item of this.overlayItems) item.destroy();
    this.overlayItems = [];
    this.overlay = 'none';
  }

  private overlayButton(key: string, row: number, x: number, y: number, action: () => void): void {
    this.uiButton(this.overlayItems, key, row, x, y, action, 82);
  }

  private clearPlaying(): void {
    for (const item of this.overlayItems) item.destroy();
    for (const item of this.worldItems) item.destroy();
    for (const image of this.objectImages.values()) image.destroy();
    for (const tree of this.trees) { tree.image.destroy(); tree.edge?.destroy(); }
    for (const image of this.rainImages) image.destroy();
    for (const image of this.dialogueImages.values()) image.destroy();
    this.rainImages = []; this.dialogueImages.clear(); this.dialogue.clear();
    this.healthBar.destroy(); this.powerBar.destroy();
    this.overlayItems = []; this.worldItems = []; this.objectImages.clear(); this.trees = [];
    this.water = []; this.bigClouds = []; this.smallClouds = []; this.enemies = [];
    this.overlay = 'none'; this.accumulated = 0;
  }

  private restartLevel(playMusic = true, changeSpawn = false): void { this.clearPlaying(); this.startPlaying(playMusic, changeSpawn); }

  private returnMenu(): void {
    const finished = this.overlay === 'gameCompleted';
    this.clearPlaying();
    if (finished) this.levelIndex = 0;
    this.mode = 'menu';
    this.playSong('menuMusic');
    this.showMenu();
  }

  private renderObjects(): void {
    const objects = [...this.objects.potions, ...this.objects.containers, ...this.objects.spikes, ...this.objects.cannons];
    for (const object of objects) {
      let image = this.objectImages.get(object);
      if (!image) {
        const key = object.type <= 1 ? 'potions' : object.type <= 3 ? 'containers' : object.type === 4 ? 'trap_atlas' : 'cannon';
        image = this.image(0, 0, key, object.type === 4 ? undefined : 0).setScale(2).setDepth(objectDrawDepth(object.type));
        this.objectImages.set(object, image);
      }
      image.setVisible(object.active);
      if (object.type <= 1) image.setPosition(Math.trunc(Math.fround(Math.fround(object.box.x - 6) - this.offset)), Math.trunc(Math.fround(object.box.y - 4)))
        .setFrame((object.type === 0 ? 7 : 0) + object.index);
      else if (object.type <= 3) image.setPosition(Math.trunc(object.box.x - (object.type === 3 ? 14 : 16)) - this.offset,
        Math.trunc(object.box.y - (object.type === 3 ? 24 : 10))).setFrame((object.type === 2 ? 8 : 0) + object.index);
      else if (object.type === 4) image.setPosition(Math.trunc(object.box.x) - this.offset, Math.trunc(object.box.y - 32));
      else image.setPosition(Math.trunc(object.box.x) - this.offset, Math.trunc(object.box.y)).setFrame(object.index).setFlipX(object.type === 6);
    }
    for (const projectile of this.objects.projectiles) {
      let image = this.objectImages.get(projectile);
      if (!image) { image = this.image(0, 0, 'ball').setDisplaySize(30, 30).setDepth(24); this.objectImages.set(projectile, image); }
      image.setVisible(projectile.active).setPosition(Math.trunc(Math.fround(projectile.box.x - this.offset)), Math.trunc(projectile.box.y));
    }
    for (const tree of this.trees) {
      const x = tree.type === 7 ? tree.x - 7 : tree.type === 8 ? tree.x + 25 : tree.x + 38 - 124;
      const y = tree.type === 7 ? tree.y - 56 : tree.y - 57;
      tree.image.setPosition(x - this.offset, y).setFrame(tree.frame).setFlipX(tree.type === 9);
    }
    this.updateTreeEdges();
  }

  private updateTreeEdges(): void {
    const camera = this.cameras.main;
    const zoom = camera.zoom;
    const offsetY = Math.round(-camera.scrollY * zoom);
    for (const tree of this.trees) {
      if (!tree.edge) continue;
      // shortcut: corrects tree top edges only; other sprite sampling still differs from Java.
      const y = spriteTopEdge(tree.image.y, zoom, offsetY);
      tree.edge.setVisible(y !== undefined);
      if (y !== undefined) tree.edge.setPosition(tree.image.x, y).setScale(2, 1 / zoom)
        .setFrame(tree.frame).setFlipX(tree.type === 9).setCrop(0, 0, tree.image.width, 1);
    }
  }
}

new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: WIDTH, height: HEIGHT, pixelArt: true, backgroundColor: '#eeeeee',
  fps: { smoothStep: false },
  scale: { mode: Phaser.Scale.RESIZE }, scene: GameScene });
