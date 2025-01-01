import { Scene } from "phaser";
import { EventBus } from "../event-bus";

export class Boot extends Scene {
  scaleReadyPromise!: Promise<void>;

  constructor() {
    super("Boot");
  }

  async preload() {
    //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
    //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.
    this.load.image("background", "assets/bg.png");

    EventBus.emit("current-scene-ready", this);
  }

  create() {
    console.log("starting preloader");
    this.scene.start("Preloader");
  }
}
