import React, { useState, useEffect, JSX } from 'react';
import { useCapsuleStore } from "@/stores/useCapsuleStore";
import { Button } from "pixel-retroui";
import { Card } from "pixel-retroui";
import { BsArrowLeft, BsArrowRight } from 'react-icons/bs';
import { PublicKeyInitData, Connection, Transaction } from '@solana/web3.js';
import { executeClaimPrizeTxn } from '@/utils/transactions';
import { CapsuleSolanaWeb3Signer as Signer } from '@usecapsule/solana-web3.js-v1-integration';
import { getEthPrice } from '@/app/actions';

interface ContestLeader {
  address: string;
  score: number;
}

interface Contest {
  roundId: number;
  contestPubKey: string;
  creator: string;
  startTime: number;
  endTime: number;
  prizePool: number;
  leader: ContestLeader;
  status: 'Ended' | 'Active' | 'Not Started';
  totalParticipants: number;
}

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  signer: Signer;
  connection: Connection;
  setActiveToast: (signature: string) => void;
  setToasts: (toasts: Set<string>) => void;
}

interface ClaimButtonProps {
  signer: Signer;
  connection: Connection;
  setActiveToast: (signature: string) => void;
  setToasts: (toasts: Set<string>) => void;
}

const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const formatScore = (score: number): string => {
  return score?.toLocaleString() || '0';
};

function ClaimModal({ isOpen, onClose, signer, connection, setActiveToast, setToasts }: ClaimModalProps): JSX.Element | null {
    const { isActive } = useCapsuleStore();
    const [contests, setContests] = useState<Contest[]>([]);
    const [ethPrice, setEthPrice] = useState<number | null>(null);
    const [loadingContests, setLoadingContests] = useState<Record<string, boolean>>({});
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchContests = async () => {
        setIsInitialLoading(true);
        try {
          const response = await fetch('/api/all-contests');
          const data = await response.json();
          setEthPrice(await getEthPrice());
          if (data.success) {
            let finalContests = [];

            for (let contest of data.data) {
              if (contest.prizePool === 0) {
                continue
              }
              finalContests.push(contest);
            }

            setContests(finalContests);
          }
        } catch (err) {
          setError('Failed to fetch contests');
          console.error(err);
        } finally {
          setIsInitialLoading(false);
        }
      };
  
      if (isOpen) {
        fetchContests();
      }
    }, [isOpen]);
  
    const handleClaim = async (contestId: number, contestPubKey: string): Promise<void> => {
      setLoadingContests(prev => ({ ...prev, [contestPubKey]: true }));
      try {
        await executeClaimPrizeTxn(signer, connection, contestId, contestPubKey, setActiveToast, setToasts);
        setContests(prev => prev.filter(c => c.contestPubKey !== contestPubKey));
      } catch (err) {
        setError('Failed to claim prize');
        console.error(err);
      } finally {
        setLoadingContests(prev => ({ ...prev, [contestPubKey]: false }));
      }
    };
  
    if (!isOpen || !isActive) return null;
  
    const userContests = contests.filter(contest => contest.leader.address === signer.address);
  
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 !z-50">
        <Card
          bg="#239B3F"
          borderColor="#26541B"
          shadowColor="#59b726"
          className="flex flex-col p-2 pointer-events-auto w-full max-w-md max-h-[90vh] min-h-0"
        >
          <div className="flex flex-col items-center w-full">
            <Card
              textColor="black"
              shadowColor="#59b726"
              borderColor="#26541B"
              bg="#239B3F"
              className="!border-0 w-full mb-3 p-1 text-sm text-center"
            >
              <div className="grid grid-cols-3 w-full items-center px-2">
                <h2 className="text-left">Round</h2>
                <h2>Winner</h2>
                <h2 className="text-right">Prize</h2>
              </div>
            </Card>
  
            <div className="flex flex-col space-y-2 w-full max-h-[60vh] overflow-y-auto">
              {isInitialLoading ? (
                <div className="text-center py-4">Loading contests...</div>
              ) : userContests.length === 0 ? (
                <div className="text-center py-4">No contests available to claim</div>
              ) : (
                userContests.map((contest) => (
                  <Card
                    key={contest.contestPubKey}
                    bg="#239B3F"
                    textColor="black"
                    shadowColor="#59b726"
                    borderColor="#26541B"
                    className="w-[90%] mx-auto p-1 text-sm"
                  >
                    <div className="grid grid-cols-3 w-full items-center px-2">
                      <span className="text-left font-bold">#{contest.roundId}</span>
                      <span className="text-center font-mono">
                        {formatAddress(contest.leader.address)}
                      </span>
                      <span className="text-right tabular-nums">
                        {ethPrice ? `${(contest.prizePool * ethPrice).toFixed(3)} $` : `${contest.prizePool} ETH`}
                      </span>
                    </div>
                    {contest.status === "Ended" && (
                      <Button
                        bg="#255706"
                        shadow="#234319"
                        borderColor="#59B726"
                        className="mt-2 w-full text-white"
                        onClick={() => handleClaim(contest.roundId, contest.contestPubKey)}
                        disabled={loadingContests[contest.contestPubKey]}
                      >
                        {loadingContests[contest.contestPubKey] ? 'Claiming...' : 'Claim'}
                      </Button>
                    )}
                  </Card>
                ))
              )}
            </div>
  
            {error && (
              <div className="text-red-500 mt-2 text-sm">{error}</div>
            )}
  
            <div className="flex flex-row space-x-2 mt-4">
              <Button bg="#59b726">
                <BsArrowLeft />
              </Button>
              <Button bg="#59b726">
                <BsArrowRight />
              </Button>
            </div>
          </div>
  
          <Button
            bg="transparent"
            shadow="#429e34"
            className="mt-4 text-sm"
            onClick={onClose}
          >
            Close
          </Button>
        </Card>
      </div>
    );
  }

export function ClaimButton({ signer, connection, setActiveToast, setToasts }: ClaimButtonProps): JSX.Element | null {
  const { isActive } = useCapsuleStore();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  if (!isActive) return null;

  return (
    <>
      <Button
        bg="#255706"
        shadow="#234319"
        borderColor="#59B726"
        className="text-white pointer-events-auto"
        onClick={() => setIsModalOpen(true)}
      >
        Claim Winnings
      </Button>

      <ClaimModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        signer={signer}
        connection={connection}
        setActiveToast={setActiveToast}
        setToasts={setToasts}
      />
    </>
  );
}

export default ClaimButton;