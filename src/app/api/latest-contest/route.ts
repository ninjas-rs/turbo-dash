import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { TurbodashIdl } from "@/config/idl";
import { BN } from "@coral-xyz/anchor";

export const runtime = "edge";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!);

const CACHE_KEY = "turbodash:latest-contest";
const CACHE_DURATION = 60 * 5; // 5 minutes

const safeNumber = (bn: BN): number => {
  try {
    return bn.toNumber();
  } catch (error) {
    console.error("Error converting BN to number:", error);
    return 0;
  }
};

interface ContestData {
  contestId: number;
  creator: string;
  startTime: number;
  endTime: number;
  prizePool: number;
  highestScore: number;
  leader: string;
  teamAccount: string;
  totalParticipants: number;
}

interface ContestResponse {
  data: ContestData;
  contestPubKey: string;
}

async function fetchLatestContest(): Promise<ContestResponse | null> {
  try {
    const provider = new AnchorProvider(
      connection,
      {
        publicKey: PublicKey.default,
        signTransaction: async () => {
          throw new Error("Not implemented");
        },
        signAllTransactions: async () => {
          throw new Error("Not implemented");
        },
      },
      { commitment: "confirmed" },
    );

    const program = new Program(TurbodashIdl, provider);

    const allContests = await program.account.contestState.all();
    if (allContests.length === 0) {
      return null;
    }

    let latestContest = allContests[0];
    for (const contest of allContests) {
      if (contest.account.id.toNumber() > latestContest.account.id.toNumber()) {
        latestContest = contest;
      }
    }

    const account = latestContest.account;

    const response = {
      data: {
        contestId: safeNumber(account.id),
        creator: account.creator.toString(),
        startTime: safeNumber(account.startTime),
        endTime: safeNumber(account.endTime),
        prizePool: safeNumber(account.prizePool),
        highestScore: safeNumber(account.highestScore),
        leader: account.leader.toString(),
        teamAccount: account.teamAccount.toString(),
        totalParticipants: safeNumber(account.totalParticipants),
      },
      contestPubKey: latestContest.publicKey.toString(),
    };

    // Cache the new response
    await cacheContest(response);

    return response;
  } catch (error) {
    console.error("Error fetching latest contest:", error);
    throw error;
  }
}

async function getCachedContest(): Promise<ContestResponse | null> {
  try {
    const cached = await redis.get(CACHE_KEY);
    //@ts-expect-error
    return cached || null;
  } catch (error) {
    console.error("Error getting cached contest:", error);
    return null;
  }
}

async function cacheContest(contestResponse: ContestResponse): Promise<void> {
  try {
    await redis.setex(CACHE_KEY, CACHE_DURATION, contestResponse);
  } catch (error) {
    console.error("Error caching contest:", error);
  }
}

export async function GET(request: Request) {
  try {
    // Always check cache first
    let contestResponse = await getCachedContest();
    let fromCache = false;

    if (contestResponse) {
      fromCache = true;
    } else {
      console.log("Cache miss - fetching from chain");
      // Cache miss - fetch from chain
      contestResponse = await fetchLatestContest();
    }

    if (!contestResponse) {
      return NextResponse.json(
        { error: "No contest data found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      fromCache,
      ...contestResponse,
    });
  } catch (error) {
    console.error("Error in latest contest API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
