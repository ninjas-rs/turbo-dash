import { Button, Card } from "pixel-retroui";
import { useEffect, useState } from "react";
import WalletState, { WalletModal } from "./wallet-state";
import { BsArrowRight, BsCheckCircle, BsHourglass } from "react-icons/bs";
import { useCapsule } from "@/hooks/useCapsule";
import { useCapsuleStore } from "@/stores/useCapsuleStore";
import { executeRefillLivesTxn, fetchLatestContestId } from "@/utils/transactions";
import { PublicKey, Transaction } from "@solana/web3.js";

const TransactionCounter = ({ pendingCount, completedCount }) => {
  return (
    <Card
      bg="#239B3F"
      borderColor="#26541B"
      shadowColor="#59b726"
      className="p-2 flex flex-row space-x-4"
    >
      <div className="flex items-center space-x-2">
        <span className="text-sm">Pending:</span>
        <span className="font-mono text-sm bg-yellow-600 px-2 py-1 rounded">
          {pendingCount}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm">Completed:</span>
        <span className="font-mono text-sm bg-green-700 px-2 py-1 rounded">
          {completedCount}
        </span>
      </div>
    </Card>
  );
};

const SingleToast = ({ signature, status }) => {
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

const TransactionToastQueue = ({ activeSignature, pendingSignatures = new Set() }) => {
  const [toasts, setToasts] = useState([]);
  
  useEffect(() => {
    if (activeSignature) {
      const newToast = {
        id: Math.random().toString(),
        signature: activeSignature,
        timestamp: Date.now(),
        status: pendingSignatures.has(activeSignature) ? 'pending' : 'success'
      };

      setToasts(prev => {
        // If toast already exists, update its status
        if (prev.some(t => t.signature === activeSignature)) {
          return prev.map(t => 
            t.signature === activeSignature 
              ? { ...t, status: 'success', timestamp: Date.now() }
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
      const now = Date.now();
      setToasts(prev => 
        prev.filter(toast => {
          const age = now - toast.timestamp;
          // Remove pending toasts if they're no longer in pendingSignatures
          if (toast.status === 'pending' && !pendingSignatures.has(toast.signature)) {
            return false;
          }
          // Keep pending toasts, and recent success toasts
          return toast.status === 'pending' || (age < 2000 && toast.status === 'success');
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [pendingSignatures]);

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

const makeLives = (len) =>
  Array.from({ length: len }).map(() => ({
    exhausted: false,
  }));

  function DeathModal({
    restart,
    backToMainMenu,
    scene,
    setLives,
    setDeathModalVisible,
    setActiveToast,
    setPendingSignatures,
    setTransactionStats,
    setSp
  }) {
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [txnLock, setTxnLock] = useState(false);
    const [processingAmount, setProcessingAmount] = useState(null);
    const [isRestarting, setIsRestarting] = useState(false);
  
    const { capsuleClient, initialize, connection } = useCapsule();
    const { balanceUsd, signer } = useCapsuleStore();
  
    useEffect(() => {
      initialize();
    }, [initialize]);
  
    if (!capsuleClient) {
      return null;
    }
  
    const handleChargeClick = async (charge) => {
      const tempSignature = 'pending-' + Math.random().toString(36).slice(2);
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
    
        // Reset transaction stats before starting new transaction
        setTransactionStats({
          pending: 1,
          completed: 0
        });
    
        // Create temporary signature for pending state
        setPendingSignatures(prev => new Set(prev).add(tempSignature));
        setActiveToast(tempSignature);
    
        // Fetch latest contest ID first
        const latestContest = await fetchLatestContestId();
        if (!latestContest?.data?.contestId) {
          throw new Error("No active contests found");
        }
    
        // Execute the actual transaction with the proper PublicKey
        let signature = await executeRefillLivesTxn(
          signer,
          connection, 
          charge,
          true
        );
    
        // Remove temporary signature
        setPendingSignatures(prev => {
          const next = new Set(prev);
          next.delete(tempSignature);
          return next;
        });
    
        // Update toast with real signature
        setActiveToast(signature);
    
        // Update transaction stats
        if (!signature.startsWith('pending-')) {
          setTransactionStats({
            pending: 0,
            completed: 1
          });
        } else {
          setTransactionStats({
            pending: 0,
            completed: 0
          });
        }
    
        // Update game state
        setSp(0); // Reset SP counter
        setLives(makeLives(chargeMap[charge]));
        setDeathModalVisible(false);
        scene.events.emit("restart");
    
      } catch (error) {
        console.error("Error refilling lives:", error);
        // Reset transaction stats on error
        setTransactionStats({
          pending: 0,
          completed: 0
        });
        
        // Clean up pending signature if error occurs
        setPendingSignatures(prev => {
          const next = new Set(prev);
          next.delete(tempSignature);
          return next;
        });
    
      } finally {
        setIsProcessing(false);
        setProcessingAmount(null);
        // Add slight delay before unlocking to prevent double-clicks
        setTimeout(() => setTxnLock(false), 1000);
      }
    };
  
    const handleRestart = async () => {
      try {
        setIsRestarting(true);
        
        // Reset transaction stats before starting new transaction
        setTransactionStats({
          pending: 1,
          completed: 0
        });
  
        // Reset SP to 0
        setSp(0);
  
        const tempSignature = 'pending-' + Math.random().toString(36).slice(2);
        setPendingSignatures(prev => new Set(prev).add(tempSignature));
        setActiveToast(tempSignature);
  
        const signature = await executeRefillLivesTxn(
          signer,
          connection,
          0.0001,
          false
        );
  
        setPendingSignatures(prev => {
          const next = new Set(prev);
          next.delete(tempSignature);
          return next;
        });
        setActiveToast(signature);
  
        if (!signature.startsWith('pending-')) {
          setTransactionStats({
            pending: 0,
            completed: 1
          });
        } else {
          setTransactionStats({
            pending: 0,
            completed: 0
          });
        }
  
        setDeathModalVisible(false);
        setLives(makeLives(DEFAULT_LIVES));
        scene.events.emit("restart");
      } catch (error) {
        console.error("Error restarting game:", error);
      } finally {
        setIsRestarting(false);
        setTransactionStats({
          pending: 0,
          completed: 0
        });
      }
    };
  
    const handleWalletClose = () => {
      setIsWalletOpen(false);
    };
  
    const renderButtonContent = (charge, lives) => {
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

export default function Game({ scene }) {
  const [lives, setLives] = useState(makeLives(DEFAULT_LIVES));
  const { signer, isActive } = useCapsuleStore();
  const [sp, setSp] = useState(0);
  const [activeToast, setActiveToast] = useState(null);
  const [pendingSignatures, setPendingSignatures] = useState(new Set());
  const [pendingScoreUpdates, setPendingScoreUpdates] = useState(new Set());
  const [transactionStats, setTransactionStats] = useState({
    pending: 0,
    completed: 0
  });

  const { capsuleClient, initialize, connection } = useCapsule();

  useEffect(() => {
    initialize();
  }, [initialize]);

useEffect(() => {
  if (sp === 0) return;

  const recordProgress = async () => {
    if (!signer?.address) {
      console.error("No wallet connected");
      return;
    }

    const scoreKey = `score-${sp}`;
    if (pendingScoreUpdates.has(scoreKey)) {
      return;
    }

    try {
      setPendingScoreUpdates(prev => new Set(prev).add(scoreKey));
      setTransactionStats(prev => ({
        ...prev,
        pending: prev.pending + 1
      }));

      const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID);
      const latestContest = await fetchLatestContestId();
      if (!latestContest?.data.contestId) {
        throw new Error("No active contests found");
      }

      const tempSignature = 'pending-' + scoreKey; 
      setPendingSignatures(prev => new Set(prev).add(tempSignature));
      setActiveToast(tempSignature);

      const response = await fetch('/api/record-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPubKey: signer.address,
          roundId: latestContest.data.contestId,
          contestPubKey: latestContest.contestPubKey,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record progress');
      }

      const { txn } = await response.json();
      const transaction = Transaction.from(Buffer.from(txn, 'base64'));
      const signature = await signer.sendTransaction(transaction, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      setPendingSignatures(prev => {
        const next = new Set(prev);
        next.delete(tempSignature);
        return next;
      });
      setActiveToast(signature);

      if (!signature.startsWith('pending-')) {
        setTransactionStats(prev => ({
          pending: Math.max(0, prev.pending - 1),
          completed: prev.completed + 1
        }));
      } else {
        setTransactionStats(prev => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1)
        }));
      }

    } catch (error) {
      console.error("Error recording progress:", error);
      setTransactionStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1)
      }));
    } finally {
      setPendingScoreUpdates(prev => {
        const next = new Set(prev);
        next.delete(scoreKey);
        return next;
      });
    }
  };

  recordProgress();
}, [sp, signer]);

  const [deathModalVisible, setDeathModalVisible] = useState(false);

  const restartGame = async () => {
    try {
      setTransactionStats(prev => ({
        ...prev,
        pending: prev.pending + 1
      }));

      const tempSignature = 'pending-' + Math.random().toString(36).slice(2);
      setPendingSignatures(prev => new Set(prev).add(tempSignature));
      setActiveToast(tempSignature);

      let signature = await executeRefillLivesTxn(
        signer,
        connection,
        0.0001,
        false
      );

      setPendingSignatures(prev => {
        const next = new Set(prev);
        next.delete(tempSignature);
        return next;
      });
      setActiveToast(signature);

      setTransactionStats(prev => ({
        pending: prev.pending - 1,
        completed: prev.completed + 1
      }));

      setDeathModalVisible(false);
      setLives(makeLives(DEFAULT_LIVES));
      setSp(0);

      scene.events.emit("restart");
    } catch (error) {
      console.error("Error in restart game:", error);
      setTransactionStats(prev => ({
        ...prev,
        pending: prev.pending - 1
      }));
    }
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

  const scoreInc = (inc) => {
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
          setPendingSignatures={setPendingSignatures}
          setTransactionStats={setTransactionStats}
          setSp={setSp}
        />
      </dialog>

      <div className="h-full w-full flex flex-col p-8">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row space-x-8">
            <div className="flex flex-row space-x-2 !h-[10px]">
              {lives.map((life, idx) => (
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
            <TransactionCounter 
              pendingCount={transactionStats.pending}
              completedCount={transactionStats.completed}
            />
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