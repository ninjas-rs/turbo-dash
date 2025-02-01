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

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const calculateTimeLeft = (endTime: number): TimeLeft => {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const difference = endTime - now;

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true
    };
  }

  return {
    days: Math.floor(difference / 86400),
    hours: Math.floor((difference % 86400) / 3600),
    minutes: Math.floor((difference % 3600) / 60),
    seconds: Math.floor(difference % 60),
    isExpired: false
  };
};

function Season() {
  const [contestDetails, setContestDetails] = useState<ContestDetails | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContestDetails = async () => {
      try {
        const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!);
        const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

        const counterPDA = getRoundCounterAccount();
        const counterAccount = await connection.getAccountInfo(counterPDA);
        
        if (!counterAccount) {
          console.log("No counter account found");
          setLoading(false);
          return;
        }

        const count = new BN(counterAccount.data.slice(8), 'le').toNumber();
        
        if (count === 0) {
          console.log("No contests created yet");
          setLoading(false);
          return;
        }

        const globalPDA = getGlobalAccount();
        const globalAccount = await connection.getAccountInfo(globalPDA);
        
        if (!globalAccount) {
          console.log("No global account found");
          setLoading(false);
          return;
        }

        const authority = new PublicKey(globalAccount.data.slice(8, 40));
        const latestContestId = count - 1;
        const [contestPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("contest"),
            authority.toBuffer(),
            new BN(latestContestId).toArrayLike(Buffer, "le", 8)
          ],
          programId
        );

        const contestAccount = await connection.getAccountInfo(contestPDA);
        
        if (!contestAccount) {
          console.log("No contest account found");
          setLoading(false);
          return;
        }

        const data = contestAccount.data;
        const details: ContestDetails = {
          startTime: new BN(data.slice(48, 56), 'le').toNumber(),
          endTime: new BN(data.slice(56, 64), 'le').toNumber(),
          prizePool: new BN(data.slice(64, 72), 'le').toNumber() / LAMPORTS_PER_SOL,
          highestScore: new BN(data.slice(72, 80), 'le').toNumber(),
          totalParticipants: new BN(data.slice(144, 152), 'le').toNumber()
        };

        setContestDetails(details);
        setTimeLeft(calculateTimeLeft(details.endTime));
      } catch (error) {
        console.error("Error fetching contest details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContestDetails();
    
    // Update countdown every second
    const timer = setInterval(() => {
      if (contestDetails?.endTime) {
        const newTimeLeft = calculateTimeLeft(contestDetails.endTime);
        setTimeLeft(newTimeLeft);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [contestDetails?.endTime]);

  if (loading) {
    return (
      <PixelatedCard>
        <div className="flex flex-col items-center justify-center">
          <p>Loading season details...</p>
        </div>
      </PixelatedCard>
    );
  }

  if (!contestDetails || !timeLeft) {
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
        {timeLeft.isExpired ? (
          <h2 className="text-3xl font-bold text-red-500">SEASON ENDED</h2>
        ) : (
          <div className="grid grid-cols-4 gap-4 text-center my-2">
            <div>
              <div className="text-3xl font-bold">{timeLeft.days}</div>
              <div className="text-sm">days</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</div>
              <div className="text-sm">hrs</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</div>
              <div className="text-sm">min</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</div>
              <div className="text-sm">sec</div>
            </div>
          </div>
        )}
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