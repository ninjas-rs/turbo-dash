import Image from "next/image";
import { Card } from "pixel-retroui";
import { useEffect, useState } from "react";

const DEFAULT_LIVES = 3;

export default function Game({ scene }: { scene: Phaser.Scene }) {
  const [lives, setLives] = useState(
    Array.from({ length: DEFAULT_LIVES }).map(() => ({
      exhausted: false,
    })),
  );

  const handleDeath = () => {
    console.log("player died");
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
    <div className="h-full w-full flex flex-col p-8">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
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
        </div>

        <Card>$100</Card>
      </div>
    </div>
  );
}
