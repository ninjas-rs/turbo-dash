import Image from "next/image";
import PixelatedCard from "./pixelated-card";
import WalletState from "./wallet-state";
import { Button, Card } from "pixel-retroui";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { useEffect, useRef, useState } from "react";
import { useCapsuleStore } from "@/stores/useCapsuleStore";
import { useCapsule } from "@/hooks/useCapsule";

import { PublicKey, Transaction } from "@solana/web3.js";
import { getPlayerStateAccount } from "@/utils/pdas";
import {
  executeRefillLivesTxn,
  fetchLatestContestId,
  fetchPlayerState,
} from "@/utils/transactions";

import Season from "./season";
import TransactionToastQueue from "./toast";
import ClaimButton from "./claim-button";
import { ChargeModal, ContestEndedModal } from "./modals";
import Leaderboard from "./leaderboard";

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

const LoadingButton = ({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) => {
  return (
    <div className="relative inline-block">
      <button
        className={`bg-none pointer-events-auto transition-opacity duration-200 ${loading ? "opacity-50" : ""}`}
        onClick={onClick}
        disabled={loading}
      >
        <Image src={"/assets/start.png"} alt="start" width={180} height={60} />
      </button>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default function MainMenu({ scene }: { scene: Phaser.Scene }) {
  const { isActive, balanceUsd, balance, signer } = useCapsuleStore();
  const { capsuleClient, initialize, connection } = useCapsule();
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<string | undefined>(undefined);
  const [pendingSignatures, setPendingSignatures] = useState(new Set<string>());
  const [loading, setLoading] = useState(false);
  const [isContestEndedModalOpen, setIsContestEndedModalOpen] = useState(false);

  useEffect(() => {
    // while the wallet is not connected, keep loading true
    if (!isActive || balanceUsd === null || balanceUsd === undefined) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [isActive, balanceUsd]);

  const joinContest = async () => {
    // If already initialized or no signer, return early
    if (hasInitialized.current || !signer?.address) return;

    let signature = "";

    try {
      const pubkey = new PublicKey(signer.address);
      const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

      const latestContest = await fetchLatestContestId();
      const latestContestId = latestContest?.data.contestId || null;

      if (!latestContestId || !latestContest?.data?.endTime) {
        console.log("No active contests found");
        return {
          signature: signature,
          joined: false,
        };
      }

      if (latestContest?.data?.endTime < Date.now() / 1000) {
        console.log("Contest has ended");
        return {
          signature: signature,
          joined: false,
        };
      }

      const playerState = await fetchPlayerState(
        connection,
        programId,
        pubkey,
        latestContestId,
      );

      // if player is joining again with the current contest id,
      // just restart the game session.
      if (playerState) {
        console.log("Player has already joined the contest");
        let signature = await executeRefillLivesTxn(
          signer,
          connection,
          0.2,
          false,
        );
        return {
          signature: signature,
          joined: true,
        };
      }

      // No player state found, join contest
      const response = await fetch("/api/join-contest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerPublicKey: pubkey.toBase58(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get join transaction");
      }

      const { transaction: base64Transaction } = await response.json();

      // Deserialize and send transaction
      const transaction = Transaction.from(
        Buffer.from(base64Transaction, "base64"),
      );

      signature = await signer.sendTransaction(transaction, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      let solanaUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

      console.log("Successfully joined contest!");
      console.log("Transaction signature:", signature);
      console.log(`View transaction: ${solanaUrl}`);

      // Wait for transaction confirmation and fetch updated player state
      await connection.confirmTransaction(signature);
      // Mark as initialized after successful completion
      hasInitialized.current = true;
    } catch (error) {
      console.log("Error initializing player:", error);
      // Reset initialization flag on error so it can be retried
      hasInitialized.current = false;
    }

    // return hasInitialized.current;
    return {
      signature: signature,
      joined: hasInitialized.current,
    };
  };

  // At the top of your component:
  const hasInitialized = useRef(false);

  const handleJoin = async () => {
    try {
      const tempSignature = "pending-joining";

      setLoading(true);
      console.log("Balance: ", balanceUsd);

      const balance = parseFloat(balanceUsd || "0");
      if (balance < 0.2) {
        console.log("Insufficient balance");
        setIsRechargeModalOpen(true);
        return;
      }

      if (!isActive || !capsuleClient || !signer?.address) {
        console.log("Wallet not connected");
        return;
      }

      const pubkey = new PublicKey(signer.address);

      const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

      const latestContest = await fetchLatestContestId();

      console.log("Latest contest:", latestContest?.data);

      const latestContestId = latestContest?.data.contestId || null;

      if (!latestContestId) {
        console.log("No active contests found");
        setLoading(false);
        return;
      }

      console.log("Latest contest endtime: ", latestContest?.data?.endTime);
      console.log("Current time: ", Date.now() / 1000);

      if (latestContest?.data?.endTime < Date.now() / 1000) {
        console.log("Contest has ended");
        setLoading(false);
        setIsContestEndedModalOpen(true);
        return;
      }

      setPendingSignatures(new Set([tempSignature]));
      setActiveToast(tempSignature);

      const playerState = await fetchPlayerState(
        connection,
        programId,
        pubkey,
        latestContestId,
      );

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
          // const joined = await joinContest();
          const status = await joinContest();
          const joined = status?.joined;
          const signature = status?.signature;

          if (signature) {
            setPendingSignatures((prev) => {
              const newSet = new Set(prev);
              newSet.delete(tempSignature); // Remove temporary signature
              return newSet;
            });
            setActiveToast(signature); // Set the actual signature
          }

          if (joined) {
            scene.scene.start("Game");
          } else {
            console.log("Failed to join contest");
          }
        } catch (error) {
          console.log("Error joining contest:", error);
          setPendingSignatures((prev) => {
            const newSet = new Set(prev);
            newSet.delete(tempSignature);
            return newSet;
          });
        }
      } else if (playerState.contestId !== latestContestId) {
        // player has joined a different contest
        console.log("Player has joined a different contest");
        console.log("Latest contest ID:", latestContestId);
        console.log("Player contest ID:", playerState.contestId);
        console.log("Joining new contest...");

        try {
          // const joined = await joinContest();
          const status = await joinContest();
          const joined = status?.joined;
          const signature = status?.signature;
          setActiveToast(signature);

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
        const status = await joinContest();
        const joined = status?.signature;

        setActiveToast(status?.signature);

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
          <WalletState
            text="Sign in to Play"
            capsuleClient={capsuleClient}
            initialize={initialize}
          />
          {signer ? (
            <ClaimButton
              connection={connection}
              signer={signer}
              setActiveToast={setActiveToast}
              setToasts={setPendingSignatures}
            />
          ) : (
            <></>
          )}
        </div>
      </div>

      <div className="h-full flex mx-10 flex-row justify-between items-center">
        <Leaderboard />
        <div className="flex flex-col items-center justify-center space-y-8">
          {isActive ? (
            <LoadingButton onClick={handleJoin} loading={loading} />
          ) : (
            <WalletState
              mainMenu={true}
              capsuleClient={capsuleClient}
              initialize={initialize}
            />
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

      {isContestEndedModalOpen && (
        <ContestEndedModal onClose={() => setIsContestEndedModalOpen(false)} />
      )}

      {isRechargeModalOpen && (
        <ChargeModal
          onClose={() => {
            setIsRechargeModalOpen(false);
          }}
          capsuleClient={capsuleClient}
        />
      )}
      <TransactionToastQueue
        activeSignature={activeToast}
        pendingSignatures={pendingSignatures}
      />
    </div>
  );
}
