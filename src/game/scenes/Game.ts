import { Scene } from "phaser";
import { EventBus } from "../event-bus";

const grassHeight = 96;
const obstaclesConfig = {
  spacing: 1500,
  types: [
    {
      type: "coffin",
      points: 4,
      y: 480,
      hitboxOffset: { width: 60, height: 80 },
    },
    {
      type: "grave_1",
      points: 2,
      y: 480,
      hitboxOffset: { width: 40, height: 40 },
    },
    {
      type: "grave_2",
      points: 2,
      y: 480,
      hitboxOffset: { width: 70, height: 40 },
    },
  ],
};

export class Game extends Scene {
  // Game objects
  background!: Phaser.GameObjects.Image;
  planet!: Phaser.GameObjects.TileSprite;
  trees!: Phaser.GameObjects.TileSprite;
  ground!: Phaser.GameObjects.TileSprite & {
    body: Phaser.Physics.Arcade.StaticBody;
  };
  player!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  obstacles!: Phaser.Physics.Arcade.Group;
  skidEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Misc
  spacebar!: Phaser.Input.Keyboard.Key;
  obstacleEvent!: Phaser.Time.TimerEvent;
  lastObstacleTime!: number;

  // Dynamic
  groundSpeed = 300;
  playerSpeed = 300;
  obstaclesSpeed = 300;

  constructor() {
    super("Game");
  }

  pause() {
    this.scene.pause();
  }

  handleObstacleOverlap(
    obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    this.events.emit("obstacle-hit");
    obstacle.destroy();

    this.sound.add("hit_sound").play();
  }

  jump() {
    if (this.player.body.touching.down) {
      this.player.setVelocityX(0);
      this.player.setVelocityY(-500);
      this.player.setVelocityX(200);

      this.tweens
        .add({
          targets: this.player,
          angle: 180,
          duration: 800,
          ease: "Linear",
        })
        .on("complete", () => this.player.setVelocityX(0));

      this.sound.add("jump_sound").play();
    }
  }

  spawnObstacle() {
    const { width } = this.scale;

    const currentTime = this.time.now;
    if (currentTime - this.lastObstacleTime < obstaclesConfig.spacing) return;

    const obstacleConf = Phaser.Math.RND.pick(obstaclesConfig.types);
    const obstacle = this.obstacles.create(
      width,
      this.ground.y + (grassHeight - 24),
      obstacleConf.type,
    );
    obstacle.setScale(0.4, 0.4);

    obstacle.points = obstacleConf.points;
    obstacle.passed = false;
    obstacle.body.setAllowGravity(false);
    obstacle.body.moves = false;
    obstacle.setPushable(false);
    obstacle.setImmovable(true);
    obstacle.setVelocityX(0);

    obstacle.body.setSize(
      obstacle.width - obstacleConf.hitboxOffset.width,
      obstacle.height - obstacleConf.hitboxOffset.height,
    ); // make hitbox smaller than sprite

    this.lastObstacleTime = currentTime;
  }

  startObstacleGeneration() {
    this.obstacleEvent = this.time.addEvent({
      delay: 100,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true,
    });
  }

  setupObjects() {
    const { width, height } = this.scale;

    this.planet = this.add
      .tileSprite(0, 0, width, height, "bg_planet")
      .setOrigin(0, 0);

    this.trees = this.add
      .tileSprite(0, 0, width, height, "bg_trees")
      .setOrigin(0, 0);

    // @ts-ignore
    this.ground = this.add
      .tileSprite(0, height - height / 3, width, height / 3, "ground")
      .setOrigin(0, 0);

    this.player = this.physics.add
      .image(width / 2, height / 2, "player")
      .setScale(0.5, 0.5);

    this.player.body.setSize(this.player.width - 20, this.player.height - 20); // make hitbox smaller than sprite

    this.physics.add.existing(this.ground, true);
    this.player.setGravityY(1200);

    this.ground.body.setSize(width, height / 3 - grassHeight);
    this.ground.body.setOffset(0, grassHeight);
  }

  setupColliders() {
    this.physics.add.collider(this.player, this.ground);
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, (_, obstacle) =>
      this.handleObstacleOverlap(
        obstacle as Phaser.Types.Physics.Arcade.GameObjectWithBody,
      ),
    );
  }

  setupInputs() {
    this.spacebar = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
  }

  setupParticles() {
    this.skidEmitter = this.add.particles(0, 0, "particle", {
      speed: { min: 50, max: 100 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.4, end: 0 },
      lifespan: 300,
      gravityY: 300,
      quantity: 2,
      frequency: 80,
    });
  }

  setupEventsFromReact() {
    this.events.on("pause", () => {
      this.scene.pause();
    });

    this.events.on("resume", () => {
      // we can have a backwards counter here maybe
      this.scene.resume();
    });

    this.events.on("restart", () => {
      this.scene.restart();
    });
  }

  create() {
    this.setupObjects();
    this.setupColliders();
    this.setupInputs();
    this.setupParticles();
    this.setupEventsFromReact();

    EventBus.emit("current-scene-ready", this);

    this.startObstacleGeneration();
  }

  update(time: number, delta: number) {
    // Parallax Effect
    const parallaxFactor = delta / 16.6667; // Normalize to 60 FPS
    this.planet.tilePositionX += 0.05 * parallaxFactor;
    this.trees.tilePositionX += 0.3 * parallaxFactor;

    this.ground.tilePositionX += (this.groundSpeed / 1000) * delta;
    this.player.x -= (this.playerSpeed / 1000) * delta;

    // Ensuring player doesn't go off-screen
    this.player.x = Phaser.Math.Clamp(
      this.player.x,
      this.player.width * 2,
      this.scale.width - this.player.width / 2,
    );

    // Controls
    if (this.spacebar.isDown) {
      this.jump();
    }

    // Obstacles management
    this.obstacles.getChildren().forEach((obstacle) => {
      const obs = obstacle as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
      obs.x -= this.obstaclesSpeed * (delta / 1000);

      if (obs.x < -100) {
        obs.destroy(); // Clean up off-screen obstacles
      }
    });

    // Update particle emitter position and emit particles when skidding
    if (this.player.body.touching.down) {
      this.skidEmitter.setPosition(
        this.player.x,
        this.player.y + this.player.height / 4,
      );
      this.skidEmitter.start();
    } else {
      this.skidEmitter.stop();
    }
  }
}
