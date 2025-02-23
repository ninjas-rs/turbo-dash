import { Scene } from "phaser";
import { EventBus } from "../event-bus";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(0, 0, "background").setOrigin(0, 0);

    EventBus.emit("current-scene-ready", this);
  }

  createParticleTexture() {
    const graphics = this.add.graphics();
    const radius = 4;

    // Draw a green circle
    graphics.fillStyle(0x774c30, 1); // Emerald green color
    graphics.fillCircle(radius, radius, radius);

    // Generate texture from graphics
    graphics.generateTexture("particle", radius * 2, radius * 2);
    graphics.destroy();
  }

  preload() {
    this.load.setPath("assets");
    this.sound.setVolume(0.1);
    this.load.image("logo", "logo.svg");
    this.load.image("main_menu_bg", "main_menu_bg.svg");
    this.load.image("player", "player.png");
    this.load.image("player_obstacle", "player_red.png");
    this.load.image("bg_planet", "bg_planet.png");
    this.load.image("bg_trees", "bg_trees.png");
    this.load.image("ground", "ground.svg");
    this.load.image("coffin", "coffin.png");
    this.load.image("grave_1", "grave_1.png");
    this.load.image("grave_2", "grave_2.png");
    this.load.audio("background_music", "background.mp3");
    this.load.audio("jump_sound", "jump.wav");
    this.load.audio("hit_sound", "hit.wav");
    this.load.audio("game_over_sound", "game_over.mp3");

    this.createParticleTexture();
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.
    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
  }
}
