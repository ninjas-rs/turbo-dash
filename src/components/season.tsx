import { useEffect, useState } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import PixelatedCard from './pixelated-card';
import { getRoundCounterAccount, getGlobalAccount } from '@/utils/pdas';

interface ContestDetails {
  startTime: number;
  endTime: number;
  prizePool: number;
  highestScore: number;
  totalParticipants: number;
  playerRank?: number;
}

const formatTimeRemaining = (endTime: number): string => {
  const now = Date.now() / 1000;
  const remaining = endTime - now;
  
  if (remaining <= 0) return "ENDED";
  
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = Math.floor(remaining % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

function Season() {
  const [contestDetails, setContestDetails] = useState<ContestDetails | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContestDetails = async () => {
      try {
        const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!);
        const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

        // Get counter account to find latest contest ID
        const counterPDA = getRoundCounterAccount();

        const counterAccount = await connection.getAccountInfo(counterPDA);
        
        if (!counterAccount) {
          console.log("No counter account found");
          setLoading(false);
          return;
        }

        // Parse counter (skip 8 bytes discriminator)
        const count = new BN(counterAccount.data.slice(8), 'le').toNumber();
        
        if (count === 0) {
          console.log("No contests created yet");
          setLoading(false);
          return;
        }

        // Get global account for authority
        const globalPDA = getGlobalAccount();
        const globalAccount = await connection.getAccountInfo(globalPDA);
        
        if (!globalAccount) {
          console.log("No global account found");
          setLoading(false);
          return;
        }

        const authority = new PublicKey(globalAccount.data.slice(8, 40));

        // Get latest contest PDA
        const latestContestId = count - 1;
        const [contestPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("contest"),
            authority.toBuffer(),
            new BN(latestContestId).toArrayLike(Buffer, "le", 8)
          ],
          programId
        );

        // Fetch latest contest account
        const contestAccount = await connection.getAccountInfo(contestPDA);
        
        if (!contestAccount) {
          console.log("No contest account found");
          setLoading(false);
          return;
        }

        // Parse contest data (skip 8 bytes discriminator)
        const data = contestAccount.data;
        const details: ContestDetails = {
          startTime: new BN(data.slice(48, 56), 'le').toNumber(),  // Added startTime
          endTime: new BN(data.slice(56, 64), 'le').toNumber(),    // Fixed endTime offset
          prizePool: new BN(data.slice(64, 72), 'le').toNumber() / LAMPORTS_PER_SOL,
          highestScore: new BN(data.slice(72, 80), 'le').toNumber(),
          totalParticipants: new BN(data.slice(144, 152), 'le').toNumber()
        };

        console.log("Contest details:", details);

        setContestDetails(details);
        setTimeRemaining(formatTimeRemaining(details.endTime));
      } catch (error) {
        console.error("Error fetching contest details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContestDetails();
    
    const timer = setInterval(() => {
      if (contestDetails?.endTime) {
        setTimeRemaining(formatTimeRemaining(contestDetails.endTime));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <PixelatedCard>
        <div className="flex flex-col items-center justify-center">
          <p>Loading season details...</p>
        </div>
      </PixelatedCard>
    );
  }

  if (!contestDetails) {
    return (
      <PixelatedCard>
        <div className="flex flex-col items-center justify-center">
          <p>No active season found</p>
        </div>
      </PixelatedCard>
    );
  }

  return (
    <PixelatedCard>
      <div className="flex flex-col items-center justify-center">
        <h1 className="py-4">EARLY WINTER ARC</h1>
        <p>season ends in</p>
        <h2 className="text-3xl text-bold">{timeRemaining}</h2>
        <br />
        <p>current rank</p>
        <h2 className="text-3xl text-bold">
          {contestDetails.playerRank ? 
            `${contestDetails.playerRank}${getOrdinalSuffix(contestDetails.playerRank)}` : 
            'Not ranked'}
        </h2>
        <br />
        <p>total rewards in pot</p>
        <h2 className="text-3xl text-bold">{contestDetails.prizePool.toFixed(2)}$</h2>
      </div>
    </PixelatedCard>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default Season;