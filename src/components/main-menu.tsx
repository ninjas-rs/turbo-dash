import Image from "next/image";
import PixelatedCard from "./pixelated-card";
import WalletState from "./wallet-state";
import { Button, Card } from "pixel-retroui";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { useState } from "react";
import { useCapsuleStore } from "@/stores/useCapsuleStore";

const Mock = [
  {
    address: "0x4r...897",
    score: 1000,
  },
  {
    address: "0x4r...897",
    score: 1000,
  },
  {
    address: "0x4r...897",
    score: 1000,
  },
  {
    address: "0x4r...897",
    score: 1000,
  },
  {
    address: "0x4r...897",
    score: 1000,
  },
  {
    address: "0x4r...897",
    score: 1000,
  },
];

function Leaderboard() {
  return (
    <PixelatedCard>
      <Card
        textColor="black"
        shadowColor="#59b726 "
        borderColor="#26541B"
        bg="#239B3F"
        className="!border-0 w-[70%] mb-3 p-1 text-sm text-center flex flex-row justify-between items-center"
      >
        <h2>Address</h2>
        <h2>Score</h2>
      </Card>
      <div className="flex flex-col space-y-2 w-[70%] mx-auto">
        {Mock.map((item, index) => {
          return (
            <Card
              key={index}
              bg="#239B3F"
              textColor="black"
              shadowColor="#59b726 "
              borderColor="#26541B"
              className="mx-auto w-[90%] p-1 text-sm text-center flex flex-row justify-between items-center"
            >
              <h2>{item.address}</h2>
              <h2>{item.score}</h2>
            </Card>
          );
        })}
      </div>
      <div className="relative bottom-0 right-0 flex flex-row space-x-2">
        <Button bg="#59b726">
          <BsArrowLeft />
        </Button>
        <Button bg="#59b726">
          <BsArrowRight />
        </Button>
      </div>
    </PixelatedCard>
  );
}

function Season() {
  return (
    <PixelatedCard>
      <div className="flex flex-col items-center justify-center">
        <h1 className="py-4">EARLY WINTER ARC</h1>
        <p>season ends in</p>
        <h2 className="text-3xl text-bold">23:12:123</h2>
        <br />
        <p>current rank</p>
        <h2 className="text-3xl text-bold">190th</h2>
        <br />
        <p>total rewards in pot</p>
        <h2 className="text-3xl text-bold">1238$</h2>
      </div>
    </PixelatedCard>
  );
}


function ChargeModal({ onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <Card
        bg="#239B3F"
        borderColor="#26541B"
        shadowColor="#59b726"
        className="flex flex-col p-2 pointer-events-auto"
      >
        <h2 className="z-50 text-2xl text-[#671919] mb-4">
          Insufficient balance!
        </h2>
        <p className="pb-4">
          To start the game, you must have a minimum balance of 0.2$!
        </p>
        <p className="text-center text-xl pb-3">Get lives</p>
        <div className="flex flex-row w-full pb-8">
          <Button
            bg="transparent"
            shadow="#429e34"
            className="p-4 text-sm w-1/3"
          >
            <p className="text-xl">0.2$</p> (1 life)
          </Button>
          <Button
            bg="transparent"
            shadow="#429e34"
            className="p-4 text-sm w-1/3"
          >
            <p className="text-xl">0.5$</p> (3 lives)
          </Button>
          <Button
            bg="transparent"
            shadow="#429e34"
            className="p-4 text-sm w-1/3"
          >
            <p className="text-xl">1$</p> (6 lives)
          </Button>
        </div>

        <Button
          bg="transparent"
          shadow="#429e34"
          className="space-x-2 text-sm !border-0 flex flex-row items-center justify-center"
          onClick={onClose}
        >
          <p>Exit to MainMenu</p> <BsArrowRight />
        </Button>
      </Card>
    </div>
  );
}


export default function MainMenu({ scene }: { scene: Phaser.Scene }) {
  const { isActive, balanceUsd } = useCapsuleStore();
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);

  const handleJoin = () => {
    console.log("Balance: ", balanceUsd);

    // string to float
    const balance = parseFloat(balanceUsd || "0");
    if (balance < 0.2) {
      // open dead modal
      setIsRechargeModalOpen(true);
    }


    return
    scene.scene.start("Game");
  };

  return (
    <div className="h-full w-full bg-[url('/assets/main_menu_bg.svg')] bg-cover bg-center bg-no-repeat flex flex-col p-8">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row items-center space-x-4">
          <Image
            src="/assets/logo.svg"
            className="pt-4"
            width={scene.scale.width / 4}
            height={scene.scale.height / 4}
            alt="Game Logo"
          />
        </div>
        <div className="flex flex-row items-center space-x-4 pointer-events-auto">
          <WalletState text="Sign in to Play" />
        </div>
      </div>

      <div className="h-full flex mx-10 flex-row justify-between items-center">
        <Leaderboard />
        <div className="flex flex-col items-center justify-center space-y-8">
          {isActive ? (
            <button
              className="bg-none pointer-events-auto"
              onClick={handleJoin}
            >
              <Image
                src={"/assets/start.png"}
                alt="start"
                width={180}
                height={60}
              ></Image>
            </button>
          ) : (
            <WalletState mainMenu={true} />
          )}
          <Image
            src={"/assets/player.png"}
            alt="player"
            width={109}
            height={89}
          ></Image>
        </div>

        <Season />
      </div>

      {isRechargeModalOpen && (
        <ChargeModal onClose={() => setIsRechargeModalOpen(false)} />
      )}
    </div>
  );
}
