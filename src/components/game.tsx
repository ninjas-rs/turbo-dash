import Image from "next/image";
import { Button, Card } from "pixel-retroui";
import { useEffect, useState } from "react";

const DEFAULT_LIVES = 3;

const makeLives = (len: number) =>
  Array.from({ length: len }).map(() => ({
    exhausted: false,
  }));

function DeathModal({ restart }: { restart: () => void }) {
  return (
    <Card
      bg="#75dd6a"
      borderColor="#26541b"
      shadowColor="#444444"
      className="rounded-md border-8 flex flex-col h-full w-full items-center pointer-events-auto p-8"
    >
      <h2 className="text-2xl text-[#d42f2f] mb-4">Game Over!</h2>
      <Button bg="transparent" shadow="#429e34" onClick={restart}>
        Restart Game
      </Button>
    </Card>
  );
}

export default function Game({ scene }: { scene: Phaser.Scene }) {
  const [lives, setLives] = useState(makeLives(DEFAULT_LIVES));
  const [sp, setSp] = useState(0);
  const [xp, setXp] = useState(0); // load default from web3 or db
  const [walletAddress, setWalletAddress] = useState("0x12345678901234567890"); // load from web3

  const [deathModalVisible, setDeathModalVisible] = useState(false);

  const restartGame = () => {
    setDeathModalVisible(false);
    setLives(makeLives(DEFAULT_LIVES));
    setSp(0);

    scene.events.emit("restart");
  };

  const handleDeath = () => {
    console.log("player died");

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
          : life,
      ),
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
        <DeathModal restart={restartGame} />
      </dialog>

      <div className="h-full w-full flex flex-col p-8">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row space-x-8">
            <div className="flex flex-row space-x-2">
              {lives.map((life, idx) => (
                <Image
                  key={idx}
                  height={48}
                  width={48}
                  alt="heart"
                  src={
                    life.exhausted
                      ? "/assets/heart_outlined.png"
                      : "/assets/heart_filled.png"
                  }
                />
              ))}
            </div>

            <Card
              bg="#bdba25"
              borderColor="#59b726"
              shadowColor="#7e851b"
              className="rounded-sm text-white"
            >
              {sp} SP
            </Card>
          </div>

          <div className="flex flex-row space-x-8">
            <Card
              bg="#255706"
              shadowColor="#234319"
              borderColor="#59b726"
              className="text-white"
            >
              {xp} XP
            </Card>

            <Card
              bg="#255706"
              shadowColor="#234319"
              borderColor="#59b726"
              className="text-white"
            >
              {walletAddress}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
