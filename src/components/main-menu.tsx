import Image from "next/image";
import PixelatedCard from "./pixelated-card";
import WalletState, { WalletModal } from "./wallet-state";
import { Button, Card } from "pixel-retroui";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { useEffect, useRef, useState } from "react";
import { useCapsuleStore } from "@/stores/useCapsuleStore";
import { useCapsule } from "@/hooks/useCapsule";

import { PublicKey, Transaction } from '@solana/web3.js';
import { getPlayerStateAccount } from "@/utils/pdas";
import { getPlayerStateAsJSON } from "@/utils/transactions";

import Season from "./season";

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

// function Season() {
//   return (
//     <PixelatedCard>
//       <div className="flex flex-col items-center justify-center">
//         <h1 className="py-4">EARLY WINTER ARC</h1>
//         <p>season ends in</p>
//         <h2 className="text-3xl text-bold">23:12:123</h2>
//         <br />
//         <p>current rank</p>
//         <h2 className="text-3xl text-bold">190th</h2>
//         <br />
//         <p>total rewards in pot</p>
//         <h2 className="text-3xl text-bold">1238$</h2>
//       </div>
//     </PixelatedCard>
//   );
// }


export function ChargeModal({ onClose, capsuleClient }) {
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const handleChargeClick = () => {
    setIsWalletOpen(true);
  };

  const handleWalletClose = () => {
    setIsWalletOpen(false);
  };

  return (
    <>
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
              onClick={handleChargeClick}
            >
              <p className="text-xl">0.2$</p> (1 life)
            </Button>
            <Button
              bg="transparent"
              shadow="#429e34"
              className="p-4 text-sm w-1/3"
              onClick={handleChargeClick}
            >
              <p className="text-xl">0.5$</p> (3 lives)
            </Button>
            <Button
              bg="transparent"
              shadow="#429e34"
              className="p-4 text-sm w-1/3"
              onClick={handleChargeClick}
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

      <WalletModal
        isOpen={isWalletOpen}
        onClose={handleWalletClose}
        capsuleClient={capsuleClient}
      />
    </>
  );
}


export default function MainMenu({ scene }: { scene: Phaser.Scene }) {
  const { isActive, balanceUsd, signer } = useCapsuleStore();
  const { capsuleClient, initialize, connection } = useCapsule();
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const joinContest = async () => {
    // If already initialized or no signer, return early
    if (hasInitialized.current || !signer?.address) return;

    try {
      const pubkey = new PublicKey(signer.address);
      const playerStateAccount = getPlayerStateAccount(pubkey, 0);

      const playerStateData = await getPlayerStateAsJSON(connection, playerStateAccount);
      console.log("Player state: ", playerStateData);

      // No player state found, join contest
      const response = await fetch('/api/join-contest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerPublicKey: pubkey.toBase58(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get join transaction');
      }

      const { transaction: base64Transaction } = await response.json();

      // Deserialize and send transaction
      const transaction = Transaction.from(
        Buffer.from(base64Transaction, 'base64')
      );

      const signature = await signer.sendTransaction(transaction, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      console.log("Successfully joined contest!");
      console.log("Transaction signature:", signature);
      console.log(
        `View transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`
      );

      // Wait for transaction confirmation and fetch updated player state
      await connection.confirmTransaction(signature);
      const updatedPlayerState = await getPlayerStateAsJSON(connection, playerStateAccount);

      console.log("Updated player state: ", updatedPlayerState);

      // Mark as initialized after successful completion
      hasInitialized.current = true;

    } catch (error) {
      console.error("Error initializing player:", error);
      // Reset initialization flag on error so it can be retried
      hasInitialized.current = false;
    }

    return hasInitialized.current;
  };

  // At the top of your component:
  const hasInitialized = useRef(false);

  const handleJoin = async () => {
    console.log("Balance: ", balanceUsd);

    const balance = parseFloat(balanceUsd || "0");
    if (balance < 0.2) {
      setIsRechargeModalOpen(true);
      return;
    }

    if (!isActive || !capsuleClient) {
      console.error("Wallet not connected");
      return;
    }

    // const joined = await joinContest();
    const joined = await joinContest();

    if (joined) {
      scene.scene.start("Game");
    } else {
      console.error("Failed to join contest");
    }
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
              disabled={loading}
            >
              <Image
                src={"/assets/start.png"}
                alt="start"
                width={180}
                height={60}
              />
            </button>
          ) : (
            <WalletState mainMenu={true} />
          )}
          <Image
            src={"/assets/player.png"}
            alt="player"
            width={109}
            height={89}
          />
        </div>
        <Season />
      </div>

      {isRechargeModalOpen && (
        <ChargeModal
          onClose={() => setIsRechargeModalOpen(false)}
          capsuleClient={capsuleClient}
        />
      )}
    </div>
  );
}