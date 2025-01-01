import {
  Dispatch,
  RefObject,
  SetStateAction,
  useEffect,
  useLayoutEffect,
} from "react";
import StartGame from "./main";
import { EventBus } from "./event-bus";

interface IRefPhaserGame {
  game: Phaser.Game | null;
}

interface IPropsPhaserGame {
  ref: RefObject<IRefPhaserGame | null>;
  setScene: Dispatch<SetStateAction<Phaser.Scene | null>>;
}

const PhaserGame = ({ ref, setScene }: IPropsPhaserGame) => {
  useLayoutEffect(() => {
    if (ref.current === null) {
      const game = StartGame("game-container");
      ref.current = { game };
    }

    return () => {
      if (ref.current?.game) {
        let game = ref.current.game;
        game.destroy(true);
        if (ref.current.game !== null) {
          ref.current.game = null;
          ref.current = null;
        }
      }
    };
  }, [ref]);

  useEffect(() => {
    EventBus.on("current-scene-ready", (scene: Phaser.Scene) => {
      setScene(scene);
    });

    return () => {
      EventBus.removeListener("current-scene-ready");
    };
  }, [ref]);

  return <div id="game-container"></div>;
};

export { PhaserGame as default, type IRefPhaserGame, type IPropsPhaserGame };
