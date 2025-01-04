import { Scene } from "phaser";
import { EventBus } from "../event-bus";

export class Game extends Scene {
  background!: Phaser.GameObjects.Image;

  constructor() {
    super("Game");
  }

  create() {
    this.background = this.add.image(0, 0, "background").setOrigin(0, 0);

    EventBus.emit("current-scene-ready", this);
  }
}
