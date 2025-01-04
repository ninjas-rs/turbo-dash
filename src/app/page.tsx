"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";

import { IPropsPhaserGame, IRefPhaserGame } from "@/game/phaser-game";
import Diagnostics from "@/components/diagnostics";
import Preloader from "@/components/preloader";
import MainMenu from "@/components/main-menu";
import Game from "@/components/game";

const PhaserGame = dynamic<IPropsPhaserGame>(
  () => import("@/game/phaser-game"),
  {
    ssr: false,
    loading: () => <div className="h-screen w-screen bg-[#060A02]"></div>,
  }
);

export default function Home() {
  const phaserRef = useRef<IRefPhaserGame>(null);
  const [scene, setScene] = useState<Phaser.Scene | null>(null);

  const DynamicUI = () => {
    switch (scene?.scene.key) {
      case "Preloader":
        return <Preloader scene={scene} />;
      case "MainMenu":
        return <MainMenu scene={scene} />;
      case "Game":
        return <Game scene={scene} />;
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
