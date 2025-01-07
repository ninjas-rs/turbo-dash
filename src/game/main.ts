import { AUTO, Game } from "phaser";

import { Boot } from "./scenes/Boot";
import { Game as MainGame } from "./scenes/Game";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
  title: "Turbo Dash",
  type: AUTO,
  width: 1280,
  height: 720,
  backgroundColor: "#a1fea0", // eclipse auora
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Boot, Preloader, MainMenu, MainGame],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 10 },
      debug: false,
    },
  },
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
