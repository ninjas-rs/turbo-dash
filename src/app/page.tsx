"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { IPropsPhaserGame, IRefPhaserGame } from "@/game/phaser-game";
import { Button, Card, ProgressBar } from "pixel-retroui";

const PhaserGame = dynamic<IPropsPhaserGame>(
  () => import("@/game/phaser-game"),
  {
    ssr: false,
    loading: () => <div className="h-screen w-screen bg-[#060A02]"></div>,
  }
);

function GameUI({ scene }: { scene: Phaser.Scene }) {
  return (
    <div className="h-full relative">
      <Card className="absolute top-4 left-4">Player Name</Card>
      <Card className="absolute top-4 right-8">$100</Card>
    </div>
  );
}

function MainMenuUI({ scene }: { scene: Phaser.Scene }) {
  const handleJoin = () => {
    scene.scene.start("Game");
  };

  return (
    <div className="h-full w-full flex flex-col p-8">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row items-center space-x-4">
          <Image
            src="/assets/logo.png"
            width={scene.scale.width / 4}
            height={scene.scale.height / 4}
            alt="Game Logo"
          />
          <Image
            src="/assets/horns.png"
            width={scene.scale.width / 10}
            height={scene.scale.height / 10}
            alt="Horns"
          />
        </div>

        <div className="flex flex-row items-center space-x-4 pointer-events-auto">
          <Button bg="#234319" shadow="#59B726">
            Connect Wallet
          </Button>
        </div>
      </div>

      <div className="h-full flex flex-row justify-between items-center">
        <Card
          className="h-2/3 min-w-[20vw] border-8 flex flex-col items-center justify-center"
          bg="#75dd6a"
          shadowColor="#26541b"
        >
          Box 1
        </Card>

        <Button
          shadow="#7e851b"
          bg="#bdba25"
          className="p-4 rounded-lg text-xl text-white pointer-events-auto"
        >
          START
        </Button>

        <Card
          className="h-2/3 min-w-[20vw] border-8 flex flex-col items-center justify-center"
          bg="#75dd6a"
          shadowColor="#26541b"
        >
          Box 2
        </Card>
      </div>
    </div>
  );
}

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

function Diagnostics({ scene }: { scene: Phaser.Scene | null }) {
  return (
    <div className="absolute top-4 left-8 text-red-400">
      Scene: {scene?.scene.key}
    </div>
  );
}

export default function Home() {
  const phaserRef = useRef<IRefPhaserGame>(null);
  const [scene, setScene] = useState<Phaser.Scene | null>(null);

  const DynamicUI = () => {
    switch (scene?.scene.key) {
      case "Preloader":
        return <PreloaderUI scene={scene} />;
      case "MainMenu":
        return <MainMenuUI scene={scene} />;
      case "Game":
        return <GameUI scene={scene} />;
      default:
        return <></>;
    }
  };

  return (
    <div className="relative bg-[#060A02] min-h-screen">
      <div className="absolute h-screen w-screen pointer-events-none">
        <DynamicUI />
      </div>

      {process.env.NODE_ENV !== "production" && <Diagnostics scene={scene} />}
      <PhaserGame ref={phaserRef} setScene={setScene} />
    </div>
  );
}
