import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    const { width, height } = this.scale;

    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(0, 0, "background").setOrigin(0, 0);

    //  A simple progress bar. This is the outline of the bar.
    this.add
      .rectangle(width / 2, height / 1.8, width / 2.5, 24)
      .setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(
      width / 2.5 - 126,
      height / 1.8,
      4,
      22,
      0xffffff
    );

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress: number) => {
      //  Update the progress bar
      bar.width = (width / 2.5) * (progress === 0 ? 0.1 : progress);
    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath("assets");

    this.load.image("logo", "logo.png");
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.
    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start("MainMenu");
  }
}
