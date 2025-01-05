import { Scene } from "phaser";
import { EventBus } from "../event-bus";

export class Game extends Scene {
  background!: Phaser.GameObjects.Image;
  planet!: Phaser.GameObjects.TileSprite;
  trees!: Phaser.GameObjects.TileSprite;
  grass!: Phaser.GameObjects.TileSprite;

  constructor() {
    super("Game");
  }

  create() {
    const { width, height } = this.scale;

    this.planet = this.add
      .tileSprite(0, 0, width, height, "bg_planet")
      .setOrigin(0, 0);

    this.trees = this.add
      .tileSprite(0, 0, width, height, "bg_trees")
      .setOrigin(0, 0);

    this.grass = this.add
      .tileSprite(0, 0, width, height, "bg_grass")
      .setOrigin(0, 0);

    EventBus.emit("current-scene-ready", this);
  }

  update() {
    this.planet.tilePositionX += 0.05;
    this.trees.tilePositionX += 0.3;
    this.grass.tilePositionX += 0.75;
  }
}
