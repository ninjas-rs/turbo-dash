import { Button, Card } from "pixel-retroui";
import { useEffect, useState } from "react";
import PixelatedCard from "./pixelated-card";
import WalletState from "./wallet-state";

const DEFAULT_LIVES = 3;

const makeLives = (len: number) =>
  Array.from({ length: len }).map(() => ({
    exhausted: false,
  }));

type ClickHandler = () => void;

function DeathModal({
  restart,
  backToMainMenu,
}: {
  restart: ClickHandler;
  backToMainMenu: ClickHandler;
}) {
  return (
    <PixelatedCard>
      <h2 className="z-50 text-2xl text-[#d42f2f] mb-4">Game Over!</h2>
      <Button bg="transparent" shadow="#429e34" onClick={() => restart()}>
        Restart Game
      </Button>
      <Button bg="transparent" shadow="#429e34" onClick={backToMainMenu}>
        Exit to MainMenu
      </Button>
    </PixelatedCard>
  );
}

export default function Game({ scene }: { scene: Phaser.Scene }) {
  const [lives, setLives] = useState(makeLives(DEFAULT_LIVES));
  const [sp, setSp] = useState(0);

  const [deathModalVisible, setDeathModalVisible] = useState(false);

  const restartGame = () => {
    setDeathModalVisible(false);
    setLives(makeLives(DEFAULT_LIVES));
    setSp(0);

    scene.events.emit("restart");
  };

  const backToMainMenu = () => {
    setDeathModalVisible(false);
    setLives(makeLives(DEFAULT_LIVES));
    setSp(0);

    scene.scene.start("MainMenu");
  };

  const handleDeath = () => {
    scene.events.emit("pause");
    setDeathModalVisible(true);
  };

  const handleObstacleHit = () => {
    if (lives.every((life) => life.exhausted)) {
      handleDeath();
      return;
    }

    setLives((prevLives) =>
      prevLives.map((life, index) =>
        !life.exhausted && index === prevLives.findIndex((l) => !l.exhausted)
          ? { exhausted: true }
          : life
      )
    );
  };

  useEffect(() => {
    scene.events.on("obstacle-hit", handleObstacleHit);

    return () => {
      scene.events.off("obstacle-hit", handleObstacleHit);
    };
  }, [lives]);

  return (
    <>
      <dialog
        open={deathModalVisible}
        className="left-0 top-0 bottom-0 right-0 w-1/3 h-1/2 bg-transparent"
      >
        <DeathModal restart={restartGame} backToMainMenu={backToMainMenu} />
      </dialog>

      <div className="h-full w-full flex flex-col p-8">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row space-x-8">
            <div className="flex flex-row space-x-2 !h-[10px]">
              {lives.map((life, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  alt="heart"
                  src={
                    life.exhausted
                      ? "/assets/heart_outlined.png"
                      : "/assets/heart_filled.png"
                  }
                  className="!h-9 !w-12"
                />
              ))}
            </div>
          </div>

          <div className="flex flex-row space-x-4">
            <Card
              bg="#bdba25"
              borderColor="#59b726"
              shadowColor="#7e851b"
              className="rounded-sm text-white"
            >
              {sp} SP
            </Card>
            <WalletState />
          </div>
        </div>
      </div>
    </>
  );
}
