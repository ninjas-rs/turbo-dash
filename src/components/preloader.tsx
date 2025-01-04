import Image from "next/image";
import { useEffect, useState } from "react";

import { ProgressBar } from "pixel-retroui";

export default function Preloader({ scene }: { scene: Phaser.Scene }) {
  const [progress, setProgress] = useState<number>(5);

  useEffect(() => {
    if (progress == 100) {
      scene.scene.start("MainMenu");
    }
  }, [progress]);

  useEffect(() => {
    scene.load.on("progress", (prog: number) => {
      // FIXME: remove timeout once slow enough
      setTimeout(() => {
        setProgress(prog * 100);
      }, 2000);
    });

    () => {
      scene.load.off("progress");
    };
  }, []);

  return (
    <div className="h-full flex flex-col justify-center items-center pointer-events-auto space-y-12">
      <div className="flex flex-col items-center">
        <Image
          src="/assets/horns.png"
          width={scene.scale.width / 7}
          height={scene.scale.height / 7}
          alt="Horns"
          className="-my-4"
        />
        <Image
          src="/assets/logo.png"
          width={scene.scale.width / 1.4}
          height={scene.scale.height / 1.4}
          alt="Game Logo"
        />
      </div>

      <ProgressBar
        borderColor="#002D00"
        color="#74ff71"
        progress={progress}
        size="lg"
        className="w-1/6 border-8 h-14"
      />

      <p className="w-1/4 text-white text-center">
        I never thought that one day I might wake up and not recognize my own
        mother... It wasn't her.
      </p>
    </div>
  );
}
