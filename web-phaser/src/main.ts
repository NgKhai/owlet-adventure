import Phaser from 'phaser';
import type { Rect } from './collision.ts';
import { readLevel, type LevelData } from './level.ts';
import { Enemy, type EnemyHooks } from './enemy.ts';
import { ObjectManager, type GameObject, type Projectile } from './objects.ts';
import { DialogueEffects, type DialogueEffect, Rain } from './effects.ts';
import { Player, type PlayerHooks } from './player.ts';

const WIDTH = 1664;
const HEIGHT = 896;
const ASSET = import.meta.env.BASE_URL;

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
  private enemies: { enemy: Enemy; image: Phaser.GameObjects.Image }[] = [];
  private enemyLevels = new Map<number, Enemy[]>();
  private objectLevels = new Map<number, ObjectManager>();
  private treeLevels = new Map<number, { x: number; y: number; type: number; tick: number; frame: number; image: Phaser.GameObjects.Image }[]>();
  private healthBar!: Phaser.GameObjects.Rectangle;
  private powerBar!: Phaser.GameObjects.Rectangle;
  private objects!: ObjectManager;
  private objectImages = new Map<GameObject | Projectile, Phaser.GameObjects.Image>();
  private trees: { x: number; y: number; type: number; tick: number; frame: number; image: Phaser.GameObjects.Image }[] = [];
  private playerSpawn?: { x: number; y: number };
  private levelIndex = 0;
  private playerDying = false;
  private overlay: 'none' | 'pause' | 'gameOver' | 'levelCompleted' | 'gameCompleted' = 'none';
  private overlayItems: Phaser.GameObjects.GameObject[] = [];
  private musicMuted = false;
  private effectsMuted = false;
  private volume = 0.5;
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
  private keys!: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; SPACE: Phaser.Input.Keyboard.Key };

  private get player() { return this.character.movement; }
  private get animation() { return this.character.animation; }

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
    this.keys = this.input.keyboard!.addKeys('A,D,SPACE') as typeof this.keys;
    this.textures.get('volume_buttons').add('slider', 0, 84, 0, 215, 44);
    for (let i = 0; i < 3; i++) this.textures.get('volume_buttons').add(`knob${i}`, 0, i * 28, 0, 28, 44);
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.mode === 'options') this.showMenuFromScreen();
      else if (this.mode === 'playing' && (this.overlay === 'none' || this.overlay === 'pause')) {
        if (this.overlay === 'pause') this.closeOverlay(); else this.showPause();
      }
    });
    this.input.keyboard!.on('keyup-ESC', () => { if (this.mode === 'credits') this.showMenuFromScreen(true); });
    this.game.events.on('blur', () => { if (this.mode === 'playing') { this.keys.A.reset(); this.keys.D.reset(); } });
    this.game.canvas.addEventListener('contextmenu', event => event.preventDefault());
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.mode !== 'playing' || this.overlay !== 'none') return;
      if (pointer.button === 0) this.animation.attacking = true;
      else if (pointer.button === 2) this.character.powerAttack();
    });
    this.showMenu();
    this.playSong('menuMusic');
  }

  private image(x: number, y: number, key: string, frame?: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, key, frame).setOrigin(0);
  }

  private showMenu(): void {
    this.mode = 'menu';
    this.menuItems.push(this.image(0, 0, 'background_menu').setDisplaySize(WIDTH, HEIGHT));
    const panel = this.image(0, 50, 'menu_background').setScale(2);
    panel.x = WIDTH / 2 - panel.displayWidth / 2;
    this.menuItems.push(panel);
    const buttons = [0, 1, 3, 2];
    buttons.forEach((row, i) => {
      const button = this.image(WIDTH / 2 - 140, (130 + i * 70) * 2, 'buttons', row * 3).setScale(2).setInteractive();
      let pressed = false;
      button.on('pointerover', () => button.setFrame(row * 3 + (pressed ? 2 : 1)));
      button.on('pointerout', () => button.setFrame(row * 3));
      button.on('pointerupoutside', () => { pressed = false; button.setFrame(row * 3); });
      button.on('pointerdown', () => { pressed = true; button.setFrame(row * 3 + 2); });
      button.on('pointerup', () => {
        if (pressed) {
          if (i === 0) this.startPlaying();
          else if (i === 1) this.showOptions();
          else if (i === 2) this.showCredits();
          else window.close();
          return;
        }
        pressed = false;
        button.setFrame(row * 3);
      });
      this.menuItems.push(button);
    });
  }

  private clearMenuItems(): void { for (const item of this.menuItems) item.destroy(); this.menuItems = []; }

  private playSong(key: string): void {
    this.song?.stop();
    this.song = this.sound.add(key, { loop: true, volume: this.volume, mute: this.musicMuted }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
    this.song.play();
  }

  private playEffect(key: string): void {
    let effect = this.effects.get(key);
    if (!effect) {
      effect = this.sound.add(key, { volume: this.volume, mute: this.effectsMuted }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
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
    this.clearMenuItems(); this.mode = 'credits'; this.creditsOffset = 0; this.creditsTick = 0;
    this.menuItems.push(this.image(0, 0, 'background_menu').setDisplaySize(WIDTH, HEIGHT));
    this.creditsImage = this.image(0, HEIGHT, 'credits_list').setScale(2);
    this.creditsImage.x = WIDTH / 2 - this.creditsImage.displayWidth / 2;
    this.menuItems.push(this.creditsImage);
    const specs: [string, number, number][] = [['player', 83, 716], ['crabby', 249, 672], ['pinkstar', 1164, 672], ['shark', 1331, 716]];
    this.creditsEntities = specs.map(([key, x, y]) => this.image(x, y, key, 0).setScale(4));
    this.menuItems.push(...this.creditsEntities);
  }

  private uiButton(target: Phaser.GameObjects.GameObject[], key: string, row: number, x: number, y: number, action: () => void, depth = 0): void {
    const button = this.image(x, y, key, row * 3).setScale(2).setDepth(depth).setInteractive();
    let pressed = false;
    button.on('pointerover', () => button.setFrame(row * 3 + (pressed ? 2 : 1)));
    button.on('pointerout', () => button.setFrame(row * 3));
    button.on('pointerupoutside', () => { pressed = false; button.setFrame(row * 3); });
    button.on('pointerdown', () => { pressed = true; button.setFrame(row * 3 + 2); });
    button.on('pointerup', () => { if (pressed) action(); });
    target.push(button);
  }

  private addAudioControls(target: Phaser.GameObjects.GameObject[], depth = 0): void {
    for (let i = 0; i < 2; i++) {
      const button = this.image(900, i === 0 ? 280 : 372, 'soundButton', (i === 0 ? this.musicMuted : this.effectsMuted) ? 3 : 0)
        .setScale(2).setDepth(depth).setInteractive();
      let pressed = false;
      const frame = (state: number) => button.setFrame(((i === 0 ? this.musicMuted : this.effectsMuted) ? 3 : 0) + state);
      button.on('pointerover', () => frame(pressed ? 2 : 1));
      button.on('pointerout', () => frame(0));
      button.on('pointerupoutside', () => { pressed = false; frame(0); });
      button.on('pointerdown', () => { pressed = true; frame(2); });
      button.on('pointerup', () => {
        if (pressed) {
          if (i === 0) { this.musicMuted = !this.musicMuted; this.song?.setMute(this.musicMuted); }
          else {
            this.effectsMuted = !this.effectsMuted;
            for (const effect of this.effects.values()) effect.setMute(this.effectsMuted);
            if (!this.effectsMuted) this.playEffect('jump');
          }
        }
        pressed = false; frame(0);
      });
      target.push(button);
    }
    const slider = this.add.image(618, 556, 'volume_buttons', 'slider').setOrigin(0).setScale(2).setDepth(depth);
    const knob = this.add.image(this.volumeX - 28, 556, 'volume_buttons', 'knob0').setOrigin(0).setScale(2).setDepth(depth).setInteractive({ draggable: true });
    knob.on('pointerover', () => knob.setFrame('knob1'));
    knob.on('pointerout', () => knob.setFrame('knob0'));
    knob.on('pointerdown', () => knob.setFrame('knob2'));
    knob.on('pointerup', () => knob.setFrame('knob0'));
    knob.on('drag', (pointer: Phaser.Input.Pointer) => {
      this.volumeX = Math.max(646, Math.min(1020, Math.trunc(pointer.x)));
      knob.x = this.volumeX - 28;
      this.volume = (this.volumeX - 646) / 374;
      this.song?.setVolume(this.volume);
      for (const effect of this.effects.values()) effect.setVolume(this.volume);
    });
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
      const image = this.image(grass.x, grass.y, 'grass', grass.type).setScale(2).setDepth(21);
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
    this.worldItems.push(this.image(20, 20, 'health_power_bar').setDisplaySize(384, 116).setDepth(60));
    this.healthBar = this.add.rectangle(88, 48, 300, 8, 0xff0000).setOrigin(0).setDepth(60);
    this.powerBar = this.add.rectangle(108, 88, 208, 4, 0xffff00).setOrigin(0).setDepth(60);
    if (playMusic) this.playSong(this.levelIndex % 2 === 0 ? 'levelMusic' : 'levelMusic2');
  }

  update(_time: number, delta: number): void {
    if (this.mode === 'credits') {
      this.accumulated += delta;
      while (this.accumulated >= 5) {
        this.accumulated -= 5;
        this.creditsOffset = Math.fround(this.creditsOffset - Math.fround(0.2));
        this.creditsTick++;
      }
      if (this.creditsImage) this.creditsImage.y = Math.trunc(HEIGHT + this.creditsOffset);
      this.creditsEntities.forEach((image, i) => image.setFrame(Math.floor(this.creditsTick / 25) % [5, 9, 8, 8][i]));
      return;
    }
    if (this.mode !== 'playing' || this.overlay !== 'none') return;
    this.accumulated += delta;
    while (this.accumulated >= 5) {
      this.accumulated -= 5;
      this.player.left = this.keys.A.isDown;
      this.player.right = this.keys.D.isDown;
      this.player.jump = this.keys.SPACE.isDown;
      if (++this.powerTick >= 15) { this.powerTick = 0; this.power = Math.min(200, this.power + 1); }
      if (this.playerDying) {
        if (this.animation.updateDeath()) { this.song?.stop(); this.playEffect('gameover'); this.showOverlay('gameOver'); break; }
        this.updateDeathFall();
        continue;
      }
      this.dialogue.update();
      if (this.drawRain) this.rain.update(this.offset);
      this.objects.update(this.level.tiles, this.player.box, this.playerTileY, damage => this.damagePlayer(damage));
      for (const tree of this.trees) if (++tree.tick >= 35) { tree.tick = 0; tree.frame = (tree.frame + 1) % 4; }
      if (this.health <= 0) {
        this.playerDying = true;
        this.animation.updateDeath();
        this.playEffect('die');
        if (!isEntityOnFloor(this.player.box, this.level.tiles)) { this.player.inAir = true; this.player.airSpeed = 0; }
      } else {
      if (this.player.left && this.player.right) {
        this.attackBox.x = this.player.flip === 1 ? this.player.box.x + this.player.box.width - 10 : this.player.box.x - this.player.box.width - 20;
      } else if (this.player.right || (this.player.powerAttackActive && this.player.flip === 1))
        this.attackBox.x = this.player.box.x + this.player.box.width - 10;
      else if (this.player.left || (this.player.powerAttackActive && this.player.flip === -1))
        this.attackBox.x = this.player.box.x - this.player.box.width - 20;
      this.attackBox.y = this.player.box.y + 20;
      if (this.animation.state === 5) this.player.updateHit(this.animation.index);
      else {
        if (this.player.jump && !this.player.inAir) this.playEffect('jump');
        this.player.update();
      }
      if (this.player.moving && this.player.powerAttackActive && ++this.player.powerAttackTick >= 35) {
        this.player.powerAttackTick = 0;
        this.player.powerAttackActive = false;
      }
      if (this.player.moving) {
        this.objects.checkPotions(this.player.box, type => {
          if (type === 0) this.health = Math.min(100, this.health + 15);
          else this.power = Math.min(200, this.power + 10);
        });
        if (this.objects.touchesSpikes(this.player.box)) this.health = 0;
        const b = this.player.box, y = Math.trunc((b.y + b.height) / 64);
        if (this.level.tiles[y][Math.trunc(b.x / 64)] === 48 || this.level.tiles[y][Math.trunc((b.x + b.width) / 64)] === 48) this.health = 0;
        this.playerTileY = Math.trunc(b.y / 64);
      }
      if ((this.animation.attacking || this.player.powerAttackActive) && !this.animation.attackChecked && this.animation.index === 1) {
        this.animation.attackChecked = !this.player.powerAttackActive;
        for (const { enemy } of this.enemies) {
          if (!enemy.active) continue;
          if (enemy.type === 1 && enemy.state === 2 && enemy.index >= 3) break;
          const a = this.attackBox, b = enemy.box;
          if (enemy.state !== 3 && enemy.state !== 4 && a.x + a.width > b.x && b.x + b.width > a.x && a.y + a.height > b.y && b.y + b.height > a.y) {
            enemy.hurt(20); break;
          }
        }
        this.objects.checkHit(this.attackBox);
        this.playEffect(`attack${1 + Math.floor(Math.random() * 3)}`);
      }
      this.animation.update(this.player.moving, this.player.inAir, this.player.airSpeed, this.player.powerAttackActive, () => {
        this.player.recoverFromHit();
        return { inAir: this.player.inAir, airSpeed: this.player.airSpeed };
      });
      }
      const hooks: EnemyHooks = {
        hitPlayer: (damage, enemy) => this.damagePlayer(damage, enemy.box.x),
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
        break;
      }
      const diff = Math.trunc(this.player.box.x) - this.offset;
      if (diff > 1248) this.offset += diff - 1248;
      else if (diff < 416) this.offset += diff - 416;
      this.offset = Math.max(Math.min(this.offset, this.level.offset), 0);
      if (++this.waterTick >= 40) { this.waterTick = 0; this.waterFrame = (this.waterFrame + 1) % 4; }
      if (++this.shipTick >= 35) { this.shipTick = 0; this.shipFrame = (this.shipFrame + 1) % 4; }
      this.shipY = Math.max(0, Math.min(20, Math.fround(this.shipY + Math.fround(0.1 * this.shipDir))));
      if (this.shipY === 0) this.shipDir = 1;
      else if (this.shipY === 20) this.shipDir = -1;
    }
    for (const item of this.worldItems) if (item instanceof Phaser.GameObjects.Image && item.getData('worldX') !== undefined)
      item.x = item.getData('worldX') - this.offset;
    this.water.forEach(image => image.setFrame(this.waterFrame));
    this.bigClouds.forEach((image, i) => image.x = i * 896 - Math.trunc(this.offset * 0.3));
    this.smallClouds.forEach((image, i) => image.x = i * 592 - Math.trunc(this.offset * 0.7));
    this.ship.setPosition(200 - this.offset, Math.trunc(576 + this.shipY)).setFrame(this.shipFrame);
    this.playerImage.setPosition(Math.trunc(this.player.box.x - 42) - this.offset, Math.trunc(this.player.box.y - 8 + Math.trunc(this.player.pushDrawOffset)))
      .setFrame(this.animation.state * 8 + this.animation.index).setFlipX(this.player.flip === -1);
    this.healthBar.width = Math.trunc(this.health / 100 * 300);
    this.powerBar.width = Math.trunc(this.power / 200 * 208);
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

  private updateDeathFall(): void {
    if (!this.player.inAir) return;
    const b = this.player.box;
    if (canMoveHere(b.x, Math.fround(b.y + this.player.airSpeed), b.width, b.height, this.level.tiles)) {
      b.y = Math.fround(b.y + this.player.airSpeed);
      this.player.airSpeed = Math.fround(this.player.airSpeed + Math.fround(0.08));
    } else this.player.inAir = false;
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
    for (const tree of this.trees) tree.image.destroy();
    for (const image of this.rainImages) image.destroy();
    for (const image of this.dialogueImages.values()) image.destroy();
    this.rainImages = []; this.dialogueImages.clear(); this.dialogue.clear();
    this.healthBar.destroy(); this.powerBar.destroy();
    this.overlayItems = []; this.worldItems = []; this.objectImages.clear(); this.trees = [];
    this.water = []; this.bigClouds = []; this.smallClouds = []; this.enemies = [];
    this.overlay = 'none'; this.offset = 0; this.accumulated = 0;
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

  private damagePlayer(damage: number, enemyX?: number): void {
    if (this.animation.state === 5) return;
    this.health = Math.max(0, this.health - damage);
    this.animation.state = 5; this.animation.index = 0; this.animation.tick = 0;
    if (enemyX !== undefined) this.player.hitByEnemy(enemyX);
  }

  private renderObjects(): void {
    const objects = [...this.objects.potions, ...this.objects.containers, ...this.objects.spikes, ...this.objects.cannons];
    for (const object of objects) {
      let image = this.objectImages.get(object);
      if (!image) {
        const key = object.type <= 1 ? 'potions' : object.type <= 3 ? 'containers' : object.type === 4 ? 'trap_atlas' : 'cannon';
        image = this.image(0, 0, key, object.type === 4 ? undefined : 0).setScale(2).setDepth(20);
        this.objectImages.set(object, image);
      }
      image.setVisible(object.active);
      if (object.type <= 1) image.setPosition(Math.trunc(object.box.x - 6) - this.offset, Math.trunc(object.box.y - 4))
        .setFrame((object.type === 0 ? 7 : 0) + object.index);
      else if (object.type <= 3) image.setPosition(Math.trunc(object.box.x - (object.type === 3 ? 14 : 16)) - this.offset,
        Math.trunc(object.box.y - (object.type === 3 ? 24 : 10))).setFrame((object.type === 2 ? 8 : 0) + object.index);
      else if (object.type === 4) image.setPosition(Math.trunc(object.box.x) - this.offset, Math.trunc(object.box.y - 32));
      else image.setPosition(Math.trunc(object.box.x) - this.offset, Math.trunc(object.box.y)).setFrame(object.index).setFlipX(object.type === 6);
    }
    for (const projectile of this.objects.projectiles) {
      let image = this.objectImages.get(projectile);
      if (!image) { image = this.image(0, 0, 'ball').setDisplaySize(30, 30).setDepth(20); this.objectImages.set(projectile, image); }
      image.setVisible(projectile.active).setPosition(Math.trunc(projectile.box.x - this.offset), Math.trunc(projectile.box.y));
    }
    for (const tree of this.trees) {
      const x = tree.type === 7 ? tree.x - 7 : tree.type === 8 ? tree.x + 25 : tree.x + 38 - 124;
      const y = tree.type === 7 ? tree.y - 56 : tree.y - 57;
      tree.image.setPosition(x - this.offset, y).setFrame(tree.frame).setFlipX(tree.type === 9);
    }
  }
}

new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: WIDTH, height: HEIGHT, pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: GameScene });
