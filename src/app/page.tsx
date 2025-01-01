"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { IPropsPhaserGame } from "@/game/phaser-game";

const PhaserGame = dynamic<IPropsPhaserGame>(
  () => import("@/game/phaser-game"),
  {
    ssr: false,
    loading: () => <div className="h-screen w-screen bg-[#a1fea0]"></div>,
  }
);

export default function Home() {
  const phaserElement = useRef(null);

  return (
    <div className="relative">
      <div className="absolute h-screen w-screen pointer-events-none flex justify-center items-center text-black">
        Overlayed from react!
      </div>

      <PhaserGame ref={phaserElement} setCanMoveSprite={() => false} />
    </div>
  );
}
