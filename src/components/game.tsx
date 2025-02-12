import { Button, Card } from "pixel-retroui";
import { useEffect, useState } from "react";
import WalletState, { WalletModal } from "./wallet-state";
import { BsArrowRight, BsCheckCircle, BsHourglass } from "react-icons/bs";
import { useCapsule } from "@/hooks/useCapsule";
import { useCapsuleStore } from "@/stores/useCapsuleStore";
import { executeRefillLivesTxn, fetchLatestContestId } from "@/utils/transactions";

import {
  PublicKey,
  Transaction,
} from "@solana/web3.js";

interface Toast {
  id: string;
  signature: string;
  timestamp: number;
  status: 'pending' | 'success';
}

const SingleToast = ({ signature, status }: { signature: string, status: 'pending' | 'success' }) => {
  const shortSignature = `${signature.slice(0, 4)}...${signature.slice(-4)}`;
  
  return (
    <Card
      bg={status === 'pending' ? "#bdba25" : "#239B3F"}
      borderColor={status === 'pending' ? "#7e851b" : "#26541B"}
      shadowColor={status === 'pending' ? "#7e851b" : "#59b726"}
      className="p-3 flex items-center space-x-2 min-w-[280px] mb-2 transform transition-all duration-300"
    >
      {status === 'pending' ? (
        <BsHourglass className="text-[#7e851b] text-xl flex-shrink-0 animate-spin" />
      ) : (
        <BsCheckCircle className="text-[#26541B] text-xl flex-shrink-0" />
      )}
      <div className="flex flex-col flex-grow min-w-0">
        <p className="text-sm">
          {status === 'pending' ? 'Transaction Pending...' : 'Transaction Success!'}
        </p>
        <p className="text-xs text-[#26541B] font-mono truncate">{shortSignature}</p>
        <a 
          href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#26541B] underline hover:text-[#1b3d13]"
        >
          View on Explorer
        </a>
      </div>
    </Card>
  );
};

const TransactionToastQueue = ({ 
  activeSignature, 
  pendingSignatures = new Set()
}: { 
  activeSignature: string | null,
  pendingSignatures?: Set<string>
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  useEffect(() => {
    if (activeSignature) {
      const newToast = {
        id: Math.random().toString(),
        signature: activeSignature,
        timestamp: Date.now(),
        status: pendingSignatures.has(activeSignature) ? 'pending' : 'success' as const
      };

      setToasts(prev => {
        // If toast already exists, update its status
        if (prev.some(t => t.signature === activeSignature)) {
          return prev.map(t => 
            t.signature === activeSignature 
              ? { ...t, status: 'success' }
              : t
          );
        }
        // Otherwise add new toast
        return [newToast, ...prev];
      });
    }
  }, [activeSignature, pendingSignatures]);

  useEffect(() => {
    const timer = setInterval(() => {
      setToasts(prev => 
        prev.filter(toast => {
          const age = Date.now() - toast.timestamp;
          return toast.status === 'pending' || age < 2000;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex flex-col">
        {toasts.map((toast, index) => (
          <div 
            key={toast.id}
            className="transform transition-all duration-300"
            style={{
              opacity: 1 - (index * 0.2),
              transform: `translateY(${index * 8}px)`,
            }}
          >
            <SingleToast 
              signature={toast.signature} 
              status={toast.status}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const DEFAULT_LIVES = 3;

const makeLives = (len: number) =>
  Array.from({ length: len }).map(() => ({
    exhausted: false,
  }));

type ClickHandler = () => void;

function DeathModal({
  restart,
  backToMainMenu,
  scene,
  setLives,
  setDeathModalVisible,
  setActiveToast,
  pendingSignatures,
  setPendingSignatures
}: {
  restart: ClickHandler;
  backToMainMenu: ClickHandler;
  scene: Phaser.Scene;
  setLives: (lives: any[]) => void;
  setDeathModalVisible: (visible: boolean) => void;
  setActiveToast: (signature: string) => void;
  pendingSignatures: Set<string>;
  setPendingSignatures: (value: Set<string>) => void;
}) {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txnLock, setTxnLock] = useState(false);
  const [processingAmount, setProcessingAmount] = useState<number | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);

  const { capsuleClient, initialize, connection } = useCapsule();
  const { balanceUsd, signer } = useCapsuleStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!capsuleClient) {
    return null;
  }

  const handleChargeClick = async (charge: number) => {
    try {
      if (isProcessing || txnLock || isRestarting) {
        console.log("Transaction already in progress");
        return;
      }

      if (!signer) {
        console.error("No wallet connected");
        return;
      }

      const chargeMap = {
        0.2: 1,
        0.5: 3,
        1: 6,
      };
      setIsProcessing(true);
      setTxnLock(true);
      setProcessingAmount(charge);

      let balanceUsdFloat = parseFloat(balanceUsd || "0");
      if (balanceUsdFloat < charge) {
        setIsWalletOpen(true);
        setIsProcessing(false);
        setTxnLock(false);
        setProcessingAmount(null);
        return;
      }

      // Create a placeholder signature for the pending state
      const tempSignature = 'pending-' + Math.random().toString(36).slice(2);
      setPendingSignatures(prev => new Set(prev).add(tempSignature));
      setActiveToast(tempSignature);

      let signature = await executeRefillLivesTxn(
        signer,
        connection,
        new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!),
        charge,
        true
      );

      // Remove pending signature and show success
      setPendingSignatures(prev => {
        const next = new Set(prev);
        next.delete(tempSignature);
        return next;
      });
      setActiveToast(signature);

      setLives(makeLives(chargeMap[charge]));
      setDeathModalVisible(false);
      scene.events.emit("restart");
    } catch (error) {
      console.error("Error refilling lives:", error);
    } finally {
      setIsProcessing(false);
      setProcessingAmount(null);
      setTimeout(() => setTxnLock(false), 1000);
    }
  };

  const handleRestart = async () => {
    try {
      setIsRestarting(true);
      
      // Create a placeholder signature for the pending state
      const tempSignature = 'pending-' + Math.random().toString(36).slice(2);
      setPendingSignatures(prev => new Set(prev).add(tempSignature));
      setActiveToast(tempSignature);

      const signature = await executeRefillLivesTxn(
        signer,
        connection,
        new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!),
        0.0001,
        false
      );

      // Remove pending signature and show success
      setPendingSignatures(prev => {
        const next = new Set(prev);
        next.delete(tempSignature);
        return next;
      });
      setActiveToast(signature);

      setDeathModalVisible(false);
      setLives(makeLives(DEFAULT_LIVES));
      scene.events.emit("restart");
    } catch (error) {
      console.error("Error restarting game:", error);
    } finally {
      setIsRestarting(false);
    }
  };

  const handleWalletClose = () => {
    setIsWalletOpen(false);
  };

  const renderButtonContent = (charge: number, lives: number) => {
    if (processingAmount === charge) {
      return "Processing...";
    }
    if (isProcessing || isRestarting) {
      return "Please wait...";
    }
    return (
      <>
        <p className="text-xl">{charge}$</p> ({lives} {lives === 1 ? 'life' : 'lives'})
      </>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Card
        bg="#239B3F"
        borderColor="#26541B"
        shadowColor="#59b726"
        className="flex flex-col p-2 pointer-events-auto w-full max-w-md max-h-[90vh] min-h-0"
      >
        <div className="overflow-y-auto flex-1">
          <h2 className="z-50 text-2xl text-[#671919] mb-4">
            Game Over! (For now)
          </h2>
          <p className="pb-4">
            You&apos;ve crossed paths with death herself, here on out you have two
            choices, restart, or here go down the extra mile to get that high score
            (trust me it&apos;s gonna be worth it in the end)
          </p>
          <p className="text-center text-xl pb-3">get more lives</p>
          <div className="flex flex-row w-full pb-4 gap-2">
            <Button
              bg="transparent"
              shadow="#429e34"
              className="p-2 text-sm w-1/3 min-w-0"
              onClick={() => handleChargeClick(0.2)}
              disabled={isProcessing || txnLock || isRestarting}
            >
              {renderButtonContent(0.2, 1)}
            </Button>

            <Button
              bg="transparent"
              shadow="#429e34"
              className="p-2 text-sm w-1/3 min-w-0"
              onClick={() => handleChargeClick(0.5)}
              disabled={isProcessing || txnLock || isRestarting}
            >
              {renderButtonContent(0.5, 3)}
            </Button>

            <Button
              bg="transparent"
              shadow="#429e34"
              onClick={() => handleChargeClick(1)}
              className="p-2 text-sm w-1/3 min-w-0"
              disabled={isProcessing || txnLock || isRestarting}
            >
              {renderButtonContent(1, 6)}
            </Button>
          </div>
        </div>

        <div className="mt-auto flex flex-col items-center">
          <Button
            bg="transparent"
            shadow="#429e34"
            className="text-sm mb-2 min-w-[200px]"
            onClick={handleRestart}
            disabled={isProcessing || txnLock || isRestarting}
          >
            {isRestarting ? "Restarting..." : "Start all over Again"}
          </Button>
          <Button
            bg="transparent"
            shadow="#429e34"
            className="space-x-2 text-sm !border-0 flex flex-row items-center justify-center"
            onClick={backToMainMenu}
            disabled={isProcessing || txnLock || isRestarting}
          >
            <p>Exit to MainMenu</p> <BsArrowRight className="" />
          </Button>
        </div>

        <WalletModal
          isOpen={isWalletOpen}
          onClose={handleWalletClose}
          capsuleClient={capsuleClient}
        />
      </Card>
    </div>
  );
}

export default function Game({ scene }: { scene: Phaser.Scene }) {
  const [lives, setLives] = useState(makeLives(DEFAULT_LIVES));
  const { signer, isActive } = useCapsuleStore();
  const [sp, setSp] = useState(0);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const [pendingSignatures, setPendingSignatures] = useState<Set<string>>(new Set());

  const { capsuleClient, initialize, connection } = useCapsule();

  // Initialize capsuleClient
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (sp === 0) return;
    const recordProgress = async () => {
      try {
        if (!signer) {
          console.error("No wallet connected or no score to record");
          return;
        }
        if (!signer?.address) {
          console.error("No wallet connected");
          return;
        }
        const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID);
        const latestContest = await fetchLatestContestId();
        const latestContestId = latestContest?.data.contestId || null;
        if (!latestContestId) {
          console.error("No active contests found");
          return;
        }
        const contestPubKey = latestContest?.contestPubKey;

        // Create a placeholder signature for the pending state
        const tempSignature = 'pending-' + Math.random().toString(36).slice(2);
        setPendingSignatures(prev => new Set(prev).add(tempSignature));
        setActiveToast(tempSignature);

        // Call record-progress API
        const response = await fetch('/api/record-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userPubKey: signer?.address,
            roundId: latestContestId,
            contestPubKey: contestPubKey,
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to record progress');
        }
        const { txn } = await response.json();
        // Deserialize and send transaction
        const transaction = Transaction.from(Buffer.from(txn, 'base64'));
        const signature = await signer.sendTransaction(transaction, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });

        // Remove pending signature and show success
        setPendingSignatures(prev => {
          const next = new Set(prev);
          next.delete(tempSignature);
          return next;
        });
        setActiveToast(signature);

        console.log("Successfully recorded progress!");
        console.log("Transaction signature:", signature);
        console.log(
          `View transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`
        );
        
      } catch (error) {
        console.error("Error recording progress:", error);
      }
    };
    recordProgress();
  }, [sp]);

  const [deathModalVisible, setDeathModalVisible] = useState(false);

  const restartGame = async () => {
    // Create a placeholder signature for the pending state
    const tempSignature = 'pending-' + Math.random().toString(36).slice(2);
    setPendingSignatures(prev => new Set(prev).add(tempSignature));
    setActiveToast(tempSignature);

    let signature = await executeRefillLivesTxn(
      signer,
      connection,
      new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!),
      0.0001,
      false
    );

    // Remove pending signature and show success
    setPendingSignatures(prev => {
      const next = new Set(prev);
      next.delete(tempSignature);
      return next;
    });
    setActiveToast(signature);

    setDeathModalVisible(false);
    setLives(makeLives(DEFAULT_LIVES));
    setSp(0);

    scene.events.emit("restart");
  };

  const backToMainMenu = () => {
    setDeathModalVisible(false);
    setLives(makeLives(DEFAULT_LIVES));
    setSp(0);

    scene.events.emit("back-to-main-menu");
  };

  const handleDeath = () => {
    scene.events.emit("game-over");
    setDeathModalVisible(true);
  };

  const handleObstacleHit = () => {
    console.log("Obstacle hit! Lives remaining:", lives);
    console.log("Lives exhausted:", lives.every((life) => life.exhausted));
    if (lives.every((life) => life.exhausted)) {
      handleDeath();
      return;
    }

    setLives((prevLives) =>
      prevLives.map((life, index) =>
        !life.exhausted && index === prevLives.findIndex((l) => !l.exhausted)
          ? { exhausted: true }
          : life
      )
    );
  };

  const scoreInc = (inc: number) => {
    setSp((score) => score + inc);
  };

  useEffect(() => {
    scene.events.on("obstacle-hit", handleObstacleHit);
    scene.events.on("score-inc", scoreInc);

    return () => {
      scene.events.off("obstacle-hit", handleObstacleHit);
      scene.events.off("score-inc", scoreInc);
    };
  }, [lives]);

  return (
    <>
      <dialog
        open={deathModalVisible}
        className="left-0 top-0 bottom-0 right-0 w-1/3 h-1/2 bg-transparent"
      >
        <DeathModal
          restart={restartGame}
          backToMainMenu={backToMainMenu}
          scene={scene}
          setLives={setLives}
          setDeathModalVisible={setDeathModalVisible}
          setActiveToast={setActiveToast}
          pendingSignatures={pendingSignatures}
          setPendingSignatures={setPendingSignatures}
        />
      </dialog>

      <div className="h-full w-full flex flex-col p-8">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row space-x-8">
            <div className="flex flex-row space-x-2 !h-[10px]">
              {lives.map((life, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  alt="heart"
                  src={
                    life.exhausted
                      ? "/assets/heart_outlined.png"
                      : "/assets/heart_filled.png"
                  }
                  className="!h-9 !w-12"
                />
              ))}
            </div>
          </div>

          <div className="flex flex-row space-x-4">
            <Card
              bg="#bdba25"
              borderColor="#59b726"
              shadowColor="#7e851b"
              className="rounded-sm text-white"
            >
              {sp} SP
            </Card>
            <WalletState capsuleClient={capsuleClient} initialize={initialize} />
          </div>
        </div>
      </div>

      <TransactionToastQueue 
        activeSignature={activeToast} 
        pendingSignatures={pendingSignatures}
      />
    </>
  );
}