import { Card } from "pixel-retroui";
import { useEffect, useState } from "react";

export default function Game({ scene }: { scene: Phaser.Scene }) {
  const [lives, setLives] = useState(3);

  useEffect(() => {
    scene.events.on("obstacle-hit", () => {
      setLives((lives) => lives - 1);
    });

    return () => {
      scene.events.off("obstacle-hit");
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col p-8">
      <div className="flex flex-row justify-between">
        <Card className="">{lives}</Card>
        <Card className="">$100</Card>
      </div>
    </div>
  );
}
