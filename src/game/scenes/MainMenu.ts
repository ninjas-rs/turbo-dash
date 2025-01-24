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
    this.events.on("shutdown", () => {
      this.backgroundMusic.destroy();
    });
  }

  create() {
    this.backgroundMusic = this.sound.add("main_menu_music", {
      loop: true,
    }) as Phaser.Sound.WebAudioSound;

    this.backgroundMusic.play();

    EventBus.emit("current-scene-ready", this);
  }
}
