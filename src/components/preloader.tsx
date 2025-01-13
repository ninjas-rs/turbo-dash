import Image from "next/image";
import { useEffect, useState } from "react";
import { ProgressBar } from "pixel-retroui";

export default function Preloader({ scene }: { scene: Phaser.Scene }) {
  const [progress, setProgress] = useState<number>(5);

  useEffect(() => {
    if (progress == 100) {
      scene.scene.start("MainMenu");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  useEffect(() => {
    scene.load.on("progress", (prog: number) => {
      // FIXME: remove timeout once slow enough
      setTimeout(() => {
        setProgress(prog * 100);
      }, 2000);
    });

    return () => {
      scene.load.off("progress");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col justify-center items-center pointer-events-auto space-y-12">
      <div className="flex flex-col items-center">
        <Image
          src="/assets/logo.svg"
          width={scene.scale.width / 2}
          height={scene.scale.height / 2}
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

      <p className="w-1/3 text-white text-center">
        I never thought that one day I might wake up and not recognize my own
        mother... It wasn&apos;t her.
      </p>
    </div>
  );
}
