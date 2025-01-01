import { Scene, GameObjects } from "phaser";
import { EventBus } from "../event-bus";

export class MainMenu extends Scene {
  background!: GameObjects.Image;
  logo!: GameObjects.Image;
  title!: GameObjects.Text;

  constructor() {
    super("MainMenu");
  }

  create() {
    const { width, height } = this.scale;

    this.background = this.add.image(0, 0, "background").setOrigin(0, 0);

    this.logo = this.add.image(width / 2, height / 3, "logo");

    EventBus.emit("current-scene-ready", this);
  }
}
