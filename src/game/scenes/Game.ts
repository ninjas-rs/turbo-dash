import { Scene } from "phaser";
import { EventBus } from "../event-bus";

export class Game extends Scene {
  background!: Phaser.GameObjects.Image;
  planet!: Phaser.GameObjects.TileSprite;
  trees!: Phaser.GameObjects.TileSprite;
  ground!: Phaser.GameObjects.TileSprite & {
    body: Phaser.Physics.Arcade.StaticBody;
  };
  player!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

  grassHeight = 96;

  constructor() {
    super("Game");
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
    this.player.setGravityY(1000);

    this.ground.body.setSize(width, height / 3 - this.grassHeight);
    this.ground.body.setOffset(0, this.grassHeight);
  }

  setupColliders() {
    this.physics.add.collider(this.player, this.ground);
  }

  create() {
    this.setupObjects();
    this.setupColliders();

    EventBus.emit("current-scene-ready", this);
  }

  update() {
    const { width, height } = this.scale;

    // Parallax Effect
    this.planet.tilePositionX += 0.05;
    this.trees.tilePositionX += 0.3;
    this.ground.tilePositionX += 0.75;

    // Stick the player to the ground
    this.player.x -= 0.75;

    // Ensuring player doesn't go off-screen
    this.player.x = Phaser.Math.Clamp(
      this.player.x,
      this.player.width / 2,
      width - this.player.width / 2
    );
  }
}
