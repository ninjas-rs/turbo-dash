"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { IPropsPhaserGame, IRefPhaserGame } from "@/game/phaser-game";
import { ProgressBar } from "pixel-retroui";

const PhaserGame = dynamic<IPropsPhaserGame>(
  () => import("@/game/phaser-game"),
  {
    ssr: false,
    loading: () => <div className="h-screen w-screen bg-[#74ff71]"></div>,
  }
);

function PreloaderUI({ scene }: { scene: Phaser.Scene }) {
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
    <div className="h-full flex flex-col justify-center items-center pointer-events-auto">
      <Image
        src="/assets/logo.png"
        width={scene.scale.width / 2}
        height={scene.scale.height / 2}
        alt="Game Logo"
        className="mb-16"
      />

      <p className="text-xl font-bold">Loading...</p>
      <ProgressBar progress={progress} size="lg" className="w-1/3" />
      <p>*insert random tip*</p>
    </div>
  );
}

function Diagnostics({ scene }: { scene: Phaser.Scene | null }) {
  return <div className="top-8 left-8">Scene: {scene?.scene.key}</div>;
}

export default function Home() {
  const phaserRef = useRef<IRefPhaserGame>(null);
  const [scene, setScene] = useState<Phaser.Scene | null>(null);

  const GameUI = () => {
    if (scene?.scene.isActive)
      switch (scene?.scene.key) {
        case "Preloader":
          return <PreloaderUI scene={scene} />;

        default:
          return <></>;
      }
  };

  return (
    <div className="relative bg-[#74ff71] min-h-screen">
      <div className="absolute h-screen w-screen pointer-events-none text-black">
        {process.env.NODE_ENV !== "production" && <Diagnostics scene={scene} />}
        <GameUI />
      </div>

      <PhaserGame ref={phaserRef} setScene={setScene} />
    </div>
  );
}
