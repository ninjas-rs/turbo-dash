import { Scene } from "phaser";
import { EventBus } from "../event-bus";

const grassHeight = 96;
const obstaclesConfig = {
  spacing: 1500,
  types: [
    { type: "coffin", points: 4, y: 480 },
    { type: "grave_1", points: 2, y: 480 },
    { type: "grave_2", points: 2, y: 480 },
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

  // Misc
  spacebar!: Phaser.Input.Keyboard.Key;
  obstacleEvent!: Phaser.Time.TimerEvent;
  lastObstacleTime!: number;

  // Dynamic
  groundSpeed = 0.75;
  playerSpeed = 0.75;

  constructor() {
    super("Game");
  }

  handleObstacleOverlap() {}

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
    }
  }

  spawnObstacle() {
    const { width } = this.scale;

    const currentTime = this.time.now;
    if (currentTime - this.lastObstacleTime < obstaclesConfig.spacing) return;

    const obstacleConf = Phaser.Math.RND.pick(obstaclesConfig.types);
    const obstacle = this.obstacles.create(
      width - 100,
      this.ground.y + (grassHeight - 24),
      obstacleConf.type,
    );
    obstacle.setScale(0.4, 0.4);

    obstacle.points = obstacleConf.points;
    obstacle.passed = false;
    obstacle.body.setAllowGravity(false);
    obstacle.setImmovable(true);
    obstacle.setVelocityX(-400);

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

    this.physics.add.existing(this.ground, true);
    this.player.setGravityY(1200);

    this.ground.body.setSize(width, height / 3 - grassHeight);
    this.ground.body.setOffset(0, grassHeight);
  }

  setupColliders() {
    this.physics.add.collider(this.player, this.ground);
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, () =>
      this.handleObstacleOverlap(),
    );
  }

  setupInputs() {
    this.spacebar = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
  }

  create() {
    this.setupObjects();
    this.setupColliders();
    this.setupInputs();

    EventBus.emit("current-scene-ready", this);

    this.startObstacleGeneration();
  }

  update() {
    const { width } = this.scale;

    // Parallax Effect
    this.planet.tilePositionX += 0.05;
    this.trees.tilePositionX += 0.3;

    this.ground.tilePositionX += this.groundSpeed;
    this.player.x -= this.playerSpeed;

    // Ensuring player doesn't go off-screen
    this.player.x = Phaser.Math.Clamp(
      this.player.x,
      this.player.width / 2,
      width - this.player.width / 2,
    );

    // Controls
    if (this.spacebar.isDown) {
      this.jump();
    }

    // Obstacles management
    this.obstacles.getChildren().forEach((obstacle) => {
      const obs = obstacle as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

      // Clean up off-screen obstacles
      if (obs.x < -100) {
        obs.destroy();
      }
    });
  }
}
