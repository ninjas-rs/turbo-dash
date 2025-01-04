import Image from "next/image";

import { Button, Card } from "pixel-retroui";

export default function MainMenu({ scene }: { scene: Phaser.Scene }) {
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
