import { Scene } from "phaser";
import { EventBus } from "../event-bus";

export class Game extends Scene {
  camera!: Phaser.Cameras.Scene2D.Camera;
  background!: Phaser.GameObjects.Image;
  msg_text!: Phaser.GameObjects.Text;

  constructor() {
    super("Game");
  }

  create() {
    this.background = this.add.image(0, 0, "background").setOrigin(0, 0);

    EventBus.emit("current-scene-ready", this);
  }
}
