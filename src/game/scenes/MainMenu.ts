import { Scene, GameObjects } from "phaser";
import { EventBus } from "../event-bus";

export class MainMenu extends Scene {
  background!: GameObjects.Image;
  player!: GameObjects.Image;
  backgroundMusic!: Phaser.Sound.WebAudioSound;

  constructor() {
    super("MainMenu");
  }

  init() {
  }

  create() {
    EventBus.emit("current-scene-ready", this);
  }
}
