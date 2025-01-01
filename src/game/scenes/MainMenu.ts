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
    this.background = this.add.image(0, 0, "background").setOrigin(0, 0);

    EventBus.emit("current-scene-ready", this);
  }
}
