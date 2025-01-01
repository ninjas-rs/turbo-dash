import { Scene, GameObjects } from "phaser";

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

    // this.title = this.add
    //   .text(512, 460, "Main Menu", {
    //     fontFamily: "Arial Black",
    //     fontSize: 38,
    //     color: "#ffffff",
    //     stroke: "#000000",
    //     strokeThickness: 8,
    //     align: "center",
    //   })
    //   .setOrigin(0.5);

    // this.input.once("pointerdown", () => {
    //   this.scene.start("Game");
    // });
  }
}
