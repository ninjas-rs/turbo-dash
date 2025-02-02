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
import { fetchLatestContestId, fetchPlayerState, getPlayerStateAsJSON } from "@/utils/transactions";

import Season from "./season";

// const Mock = [
//   {
//     address: "0x4r...897",
//     score: 1000,
//   },
//   {
//     address: "0x4r...897",
//     score: 1000,
//   },
//   {
//     address: "0x4r...897",
//     score: 1000,
//   },
//   {
//     address: "0x4r...897",
//     score: 1000,
//   },
//   {
//     address: "0x4r...897",
//     score: 1000,
//   },
//   {
//     address: "0x4r...897",
//     score: 1000,
//   },
// ];

const LoadingButton = ({ onClick, loading }) => {
  return (
    <div className="relative inline-block">
      <button
        className={`bg-none pointer-events-auto transition-opacity duration-200 ${loading ? 'opacity-50' : ''}`}
        onClick={onClick}
        disabled={loading}
      >
        <Image
          src={"/assets/start.png"}
          alt="start"
          width={180}
          height={60}
        />
      </button>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
};

const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const formatScore = (score: number) => {
  return score.toLocaleString();
};

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  
  function fetchLeaderboard() {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.data && data.data.length > 0) {
          setLeaderboard(data.data);
        }
      });
  }

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <PixelatedCard>
      <Card
        textColor="black"
        shadowColor="#59b726"
        borderColor="#26541B"
        bg="#239B3F"
        className="!border-0 w-[70%] mb-3 p-1 text-sm text-center"
      >
        <div className="grid grid-cols-3 w-full items-center px-2">
          <h2 className="text-left">Rank</h2>
          <h2>Address</h2>
          <h2 className="text-right">Score</h2>
        </div>
      </Card>
      <div className="flex flex-col space-y-2 w-[70%] mx-auto">
        {leaderboard.map((item, index) => {
          return (
            <Card
              key={index}
              bg="#239B3F"
              textColor="black"
              shadowColor="#59b726"
              borderColor="#26541B"
              className="mx-auto w-[90%] p-1 text-sm"
            >
              <div className="grid grid-cols-3 w-full items-center px-2">
                <span className="text-left font-bold">#{index + 1}</span>
                <span className="text-center font-mono">{formatAddress(item.address)}</span>
                <span className="text-right tabular-nums">{formatScore(item.score)}</span>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="relative bottom-0 right-0 flex flex-row space-x-2 mt-4">
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
            {/* <Button
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
            </Button> */}
            <Button
              bg="transparent"
              shadow="#429e34"
              className="p-4 text-sm w-1/3"
              onClick={handleChargeClick}
            >
              <p className="text-xl">Deposit funds</p>
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
  const { isActive, balanceUsd, balance, signer } = useCapsuleStore();
  const { capsuleClient, initialize, connection } = useCapsule();
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // while the wallet is not connected, keep loading true
    if (!isActive || (balanceUsd === null || balanceUsd === undefined)) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [isActive, balanceUsd]);

  const joinContest = async () => {
    // If already initialized or no signer, return early
    if (hasInitialized.current || !signer?.address) return;

    try {
      const pubkey = new PublicKey(signer.address);
      const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

      const latestContest = await fetchLatestContestId(connection, programId);
      const latestContestId = latestContest?.latestContestId || null;

      if (!latestContestId) {
        console.log("No active contests found");
        return false;
      }

      const playerState = await fetchPlayerState(connection, programId, pubkey, latestContestId);

      if (playerState) {
        console.log("Player has already joined the contest");
        return true;
      }

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
    

      // Mark as initialized after successful completion
      hasInitialized.current = true;

    } catch (error) {
      console.log("Error initializing player:", error);
      // Reset initialization flag on error so it can be retried
      hasInitialized.current = false;
    }

    return hasInitialized.current;
  };

  // At the top of your component:
  const hasInitialized = useRef(false);

  const handleJoin = async () => {
    try {
      setLoading(true);
      console.log("Balance: ", balanceUsd);

      const balance = parseFloat(balanceUsd || "0");
      if (balance < 0.2) {
        setIsRechargeModalOpen(true);
        return;
      }

      if (!isActive || !capsuleClient || !signer?.address) {
        console.log("Wallet not connected");
        return;
      }

      const pubkey = new PublicKey(signer.address);

      const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

      const latestContest = await fetchLatestContestId(connection, pubkey);

      console.log("Latest contest:", latestContest);

      const latestContestId = latestContest?.latestContestId || null;

      if (!latestContestId) {
        console.log("No active contests found");
        setLoading(false);
        return;
      }

      const playerState = await fetchPlayerState(connection, programId, pubkey, latestContestId);

      // try {
      //   // If we get here, player has already joined
      //   scene.scene.start("Game");
      // } catch (error) {
      //   // If player state doesn't exist, join the contest
      //   console.log("Player hasn't joined yet, joining contest...");
      //   const joined = await joinContest();
      //   if (joined) {
      //     scene.scene.start("Game");
      //   } else {
      //     console.log("Failed to join contest");
      //   }
      // }

      if (!playerState) {
        // player has not joined any contests yet
        console.log("Player hasn't joined yet, joining contest...");
        try {
          const joined = await joinContest();
          if (joined) {
            scene.scene.start("Game");
          } else {
            console.log("Failed to join contest");
          }
        } catch (error) {
          console.log("Error joining contest:", error);
        }
      } else if (playerState.contestId !== latestContestId) {
        // player has joined a different contest
        console.log("Player has joined a different contest");
        console.log("Latest contest ID:", latestContestId);
        console.log("Player contest ID:", playerState.contestId);
        console.log("Joining new contest...");
        
        try {
          const joined = await joinContest();
          if (joined) {
            scene.scene.start("Game");
          } else {
            console.log("Failed to join contest");
          }
        } catch (error) {
          console.log("Error joining contest:", error);
        } 
      } else if (playerState.contestId === latestContestId) {
        // player has already joined the latest contest
        console.log("Player has already joined the contest");
        scene.scene.start("Game");
      }

    } catch (error) {
      console.log("Error in handleJoin:", error);
    } finally {
      setLoading(false);
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
          <WalletState text="Sign in to Play" capsuleClient={capsuleClient} initialize={initialize} />
        </div>
      </div>

      <div className="h-full flex mx-10 flex-row justify-between items-center">
        <Leaderboard />
        <div className="flex flex-col items-center justify-center space-y-8">
          {isActive ? (
            <LoadingButton onClick={handleJoin} loading={loading} />
          ) : (
            <WalletState mainMenu={true} capsuleClient={capsuleClient} initialize={initialize} />
            // <></>
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

      {/* {isRechargeModalOpen && (
        // <ChargeModal
        //   onClose={() => setIsRechargeModalOpen(false)}
        //   // capsuleClient={capsuleClient}
        // />
      )} */}
    </div>
  );
}