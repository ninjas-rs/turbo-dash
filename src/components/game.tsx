import { Button, Card } from "pixel-retroui";
import { useEffect, useState } from "react";
import WalletState from "./wallet-state";
import { BsArrowRight } from "react-icons/bs";

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
    <Card
      bg="#239B3F"
      borderColor="#26541B"
      shadowColor="#59b726"
      className="flex flex-col p-2 pointer-events-auto"
    >
      <h2 className="z-50 text-2xl text-[#671919] mb-4">
        Game Over! (For now)
      </h2>
      <p className="pb-4">
        You&apos;ve crossed paths with death herself, here on out you have two
        choices, restart, or here go down the extra mile to get that high score
        (trust me it&apos;s gonna be worth it in the end)
      </p>
      <p className="text-center text-xl pb-3">get more lives</p>
      <div className="flex flex-row w-full pb-8">
        <Button
          bg="transparent"
          shadow="#429e34"
          className="p-4 text-sm w-1/3"
          onClick={backToMainMenu}
        >
          <p className="text-xl"> 0.2$</p> (1 life)
        </Button>
        <Button
          bg="transparent"
          shadow="#429e34"
          className="p-4 text-sm w-1/3"
          onClick={backToMainMenu}
        >
          <p className="text-xl"> 0.5$</p> (3 lives)
        </Button>
        <Button
          bg="transparent"
          shadow="#429e34"
          onClick={backToMainMenu}
          className="p-4 text-sm w-1/3"
        >
          <p className="text-xl"> 1$</p> (6 lives)
        </Button>
      </div>

      <Button
        bg="transparent"
        shadow="#429e34"
        className="text-sm"
        onClick={() => restart()}
      >
        Start all over Again
      </Button>
      <Button
        bg="transparent"
        shadow="#429e34"
        className=" space-x-2 text-sm !border-0 flex flex-row items-center justify-center"
        onClick={backToMainMenu}
      >
        <p>Exit to MainMenu</p> <BsArrowRight className="" />
      </Button>
    </Card>
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

    scene.events.emit("back-to-main-menu");
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

  const scoreInc = (inc: number) => {
    console.log(`Adding ${inc} points`);
    setSp((score) => score + inc);
  };

  useEffect(() => {
    scene.events.on("obstacle-hit", handleObstacleHit);
    scene.events.on("score-inc", scoreInc);

    return () => {
      scene.events.off("obstacle-hit", handleObstacleHit);
      scene.events.off("score-inc", scoreInc);
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
