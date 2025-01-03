import { Scene, GameObjects, Physics, Input, Tweens } from "phaser";
import { EventBus } from "../event-bus";
import { GameAssets } from "../ai/assets";

interface GameConfig {
  WIDTH: number;
  HEIGHT: number;
  GROUND: {
    Y: number;
    HEIGHT: number;
  };
  PLAYER: {
    INITIAL_X: number;
    INITIAL_Y: number;
    GRAVITY: number;
    SPEED: number;
    JUMP_FORCE: number;
  };
  OBSTACLES: {
    MIN_SPACING: number;
    TYPES: ObstacleConfig[];
  };
  SCORE: {
    BACKGROUND_CHANGE: number;
  };
}

export const GAME_CONFIG: GameConfig = {
  WIDTH: 1280,
  HEIGHT: 720,

  GROUND: {
    Y: 650, // Adjusted for new height
    HEIGHT: 120, // Slightly larger for the bigger resolution
  },

  PLAYER: {
    INITIAL_X: 160, // Moved slightly further from the left edge
    INITIAL_Y: 530, // Adjusted for new ground position
    GRAVITY: 800,
    SPEED: 400, // Increased for larger screen width
    JUMP_FORCE: -450, // Slightly stronger jump for larger vertical space
  },

  OBSTACLES: {
    MIN_SPACING: 2000,
    TYPES: [
      {
        type: "blade",
        y: 530, // Adjusted for new ground position
        points: 10,
      },
      {
        type: "spike",
        y: 580, // Adjusted for new ground position
        points: 5,
      },
      {
        type: "bird",
        // y is omitted to allow random y position between 200-500
        points: 15,
      },
      {
        type: "laser",
        y: 400, // Adjusted for new screen height
        points: 20,
      },
    ],
  },

  SCORE: {
    BACKGROUND_CHANGE: 10,
  },
};

interface ObstacleConfig {
  type: string;
  y?: number;
  points: number;
}

interface Backgrounds {
  day: GameObjects.TileSprite;
  night: GameObjects.TileSprite;
}

interface CustomObstacle extends Physics.Arcade.Sprite {
  points: number;
  passed: boolean;
}

export class Game extends Scene {
  private score: number;
  private lives: number;
  private isGameOver: boolean;
  private isDayTime: boolean;
  private isPaused: boolean;
  private lastObstacleTime: number;

  private backgrounds: Backgrounds;
  private ground: GameObjects.TileSprite;
  private player: Physics.Arcade.Sprite;
  private obstacles: Physics.Arcade.Group;
  private spacebar: Input.Keyboard.Key;
  private scoreText: GameObjects.Text;
  private hearts: GameObjects.Image[];
  private pauseScreen: GameObjects.Container;
  private obstacleEvent: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: "Game" });
    this.init();
  }

  private init(): void {
    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isDayTime = true;
    this.isPaused = false;
    this.lastObstacleTime = 0;
  }

  preload(): void {
    GameAssets.createTextures(this);
  }

  create(): void {
    this.createBackgrounds();
    this.createGameObjects();
    this.setupCollisions();
    this.setupInput();
    this.createUI();
    this.startObstacleGeneration();

    EventBus.emit("current-scene-ready", this);
  }

  private createBackgrounds(): void {
    this.backgrounds = {
      day: this.add
        .tileSprite(
          GAME_CONFIG.WIDTH / 2,
          GAME_CONFIG.HEIGHT / 2,
          GAME_CONFIG.WIDTH,
          GAME_CONFIG.HEIGHT,
          "bg-day",
        )
        .setScrollFactor(0)
        .setDepth(0),
      night: this.add
        .tileSprite(
          GAME_CONFIG.WIDTH / 2,
          GAME_CONFIG.HEIGHT / 2,
          GAME_CONFIG.WIDTH,
          GAME_CONFIG.HEIGHT,
          "bg-night",
        )
        .setScrollFactor(0)
        .setDepth(0)
        .setAlpha(0),
    };
  }

  private createGameObjects(): void {
    // Create ground
    this.ground = this.add.tileSprite(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.GROUND.Y,
      GAME_CONFIG.WIDTH,
      GAME_CONFIG.GROUND.HEIGHT,
      "ground",
    );
    this.physics.add.existing(this.ground, true);

    // Create player
    this.player = this.physics.add.sprite(
      GAME_CONFIG.PLAYER.INITIAL_X,
      GAME_CONFIG.PLAYER.INITIAL_Y,
      "player",
    );
    this.player.setCollideWorldBounds(true);
    this.player.body.setGravityY(GAME_CONFIG.PLAYER.GRAVITY);
  }

  private setupCollisions(): void {
    this.physics.add.collider(this.player, this.ground);
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, () =>
      this.handleCollision(),
    );
  }

  private setupInput(): void {
    this.spacebar = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);
    this.input.on("pointerdown", () => this.jump());
    this.input.keyboard.on("keydown-P", () => this.togglePause());
  }

  private createUI(): void {
    // Score text
    this.scoreText = this.add
      .text(16, 16, "Score: 0", {
        fontFamily: "Space Grotesk",
        fontSize: "32px",
        fill: "#fff",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setScrollFactor(0)
      .setDepth(100);

    // Lives display
    this.hearts = [];
    for (let i = 0; i < 3; i++) {
      this.hearts.push(
        this.add
          .image(700 + i * 40, 30, "heart")
          .setScale(0.5)
          .setScrollFactor(0)
          .setDepth(100),
      );
    }

    // Create pause screen
    this.createPauseScreen();
  }

  private createPauseScreen(): void {
    this.pauseScreen = this.add.container(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2,
    );

    const pauseBg = this.add.rectangle(
      0,
      0,
      GAME_CONFIG.WIDTH,
      GAME_CONFIG.HEIGHT,
      0x000000,
      0.7,
    );

    const pauseText = this.add
      .text(0, 0, "PAUSED\nPress P to continue", {
        fontFamily: "Space Grotesk",
        fontSize: "40px",
        fill: "#fff",
        align: "center",
      })
      .setOrigin(0.5);

    this.pauseScreen.add([pauseBg, pauseText]);
    this.pauseScreen.setDepth(1000).setVisible(false);
  }

  private startObstacleGeneration(): void {
    this.obstacleEvent = this.time.addEvent({
      delay: GAME_CONFIG.OBSTACLES.MIN_SPACING,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true,
    });
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    this.pauseScreen.setVisible(this.isPaused);

    if (this.isPaused) {
      this.physics.pause();
      this.obstacleEvent.paused = true;
    } else {
      this.physics.resume();
      this.obstacleEvent.paused = false;
    }
  }

  private spawnObstacle(): void {
    if (this.isGameOver || this.isPaused) return;

    const currentTime = this.time.now;
    if (currentTime - this.lastObstacleTime < GAME_CONFIG.OBSTACLES.MIN_SPACING)
      return;

    const obstacleConfig = Phaser.Math.RND.pick(GAME_CONFIG.OBSTACLES.TYPES);
    const obstacle = this.obstacles.create(
      GAME_CONFIG.WIDTH + 50,
      obstacleConfig.y || Phaser.Math.Between(200, 400),
      obstacleConfig.type,
    ) as CustomObstacle;

    obstacle.points = obstacleConfig.points;
    obstacle.passed = false;
    obstacle.body.setAllowGravity(false);
    obstacle.setImmovable(true);
    obstacle.setVelocityX(-GAME_CONFIG.PLAYER.SPEED);

    if (obstacleConfig.type === "blade") {
      this.tweens.add({
        targets: obstacle,
        angle: 360,
        duration: 1000,
        repeat: -1,
      });
    }

    this.lastObstacleTime = currentTime;
  }

  private jump(): void {
    if (this.player.body.touching.down && !this.isGameOver && !this.isPaused) {
      this.player.setVelocityY(GAME_CONFIG.PLAYER.JUMP_FORCE);
      this.tweens.add({
        targets: this.player,
        angle: 360,
        duration: 800,
        ease: "Linear",
      });
    }
  }

  private handleCollision(): void {
    if (this.isGameOver || this.player.alpha < 1 || this.isPaused) return;

    this.lives--;
    if (this.hearts[this.lives]) {
      this.hearts[this.lives].destroy();
    }

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      // Invulnerability period
      this.player.setAlpha(0.5);
      this.time.delayedCall(1500, () => {
        this.player.setAlpha(1);
      });
    }
  }

  private gameOver(): void {
    this.isGameOver = true;
    this.physics.pause();
    this.obstacleEvent.destroy();

    const overlay = this.add
      .rectangle(
        GAME_CONFIG.WIDTH / 2,
        GAME_CONFIG.HEIGHT / 2,
        GAME_CONFIG.WIDTH,
        GAME_CONFIG.HEIGHT,
        0x000000,
        0.7,
      )
      .setDepth(90);

    this.add
      .text(GAME_CONFIG.WIDTH / 2, 250, "Game Over", {
        fontFamily: "Space Grotesk",
        fontSize: "64px",
        fill: "#fff",
        stroke: "#000",
        strokeThickness: 6,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.add
      .text(GAME_CONFIG.WIDTH / 2, 320, `Final Score: ${this.score}`, {
        fontFamily: "Space Grotesk",
        fontSize: "32px",
        fill: "#fff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.add
      .text(GAME_CONFIG.WIDTH / 2, 380, "Click to restart", {
        fontFamily: "Space Grotesk",
        fontSize: "24px",
        fill: "#fff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.input.once("pointerdown", () => {
      this.scene.restart();
    });
  }

  private switchBackground(): void {
    this.isDayTime = !this.isDayTime;
    const targetAlpha = this.isDayTime ? 0 : 1;

    this.tweens.add({
      targets: this.backgrounds.night,
      alpha: targetAlpha,
      duration: 1000,
    });
  }

  update(): void {
    if (this.isGameOver || this.isPaused) return;

    if (this.spacebar.isDown) {
      this.jump();
    }

    // Update parallax backgrounds
    this.backgrounds.day.tilePositionX += 2;
    this.backgrounds.night.tilePositionX += 2;
    this.ground.tilePositionX += GAME_CONFIG.PLAYER.SPEED / 60;

    // Check for passed obstacles and update score
    this.obstacles.getChildren().forEach((obstacle: CustomObstacle) => {
      if (!obstacle.passed && obstacle.x < this.player.x) {
        obstacle.passed = true;
        this.score += obstacle.points;
        this.scoreText.setText(`Score: ${this.score}`);

        // Switch background every 10 points
        if (this.score % GAME_CONFIG.SCORE.BACKGROUND_CHANGE === 0) {
          this.switchBackground();
        }
      }

      // Clean up off-screen obstacles
      if (obstacle.x < -100) {
        obstacle.destroy();
      }
    });
  }
}
