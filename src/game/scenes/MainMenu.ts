import { Scene, GameObjects } from "phaser";
import { EventBus } from "../event-bus";

export class MainMenu extends Scene {
  background!: GameObjects.Image;
  player!: GameObjects.Image;

  constructor() {
    super("MainMenu");
  }

  create() {
    const { width, height } = this.scale;

    this.background = this.add.image(0, 0, "main_menu_bg").setOrigin(0, 0);

    this.player = this.add.image(width / 2, height / 1.6, "player");
    this.player.setScale(0.5, 0.5);

    EventBus.emit("current-scene-ready", this);
  }
}
