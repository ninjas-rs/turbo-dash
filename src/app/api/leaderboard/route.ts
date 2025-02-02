import { NextResponse } from "next/server";
import { Redis } from '@upstash/redis';
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { TurbodashIdl } from "@/config/idl";

export const runtime = "edge";

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT);

const CACHE_KEY_PREFIX = "turbodash:leaderboard:contestId:";
const CACHE_DURATION = 5; // 5 seconds

interface LeaderboardEntry {
    player: string;
    score: number;
    rank: number;
    contestId: number;
}

async function fetchFromChain(contestId: number) : Promise<LeaderboardEntry[]> {
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
            { commitment: "confirmed" }
        );

        const program = new Program(TurbodashIdl, provider);
        const allAccounts = await program.account.playerState.all();

        if (contestId === -1) {
            // get latest contest ID
            const allContests = await program.account.contestState.all();
            if (allContests.length === 0) {
                return [];
            }

            let latestContest = allContests[0];

            // console.log("Fetched all contests:", allContests);
            for (const contest of allContests) {
                if (contest.account.id.toNumber() > latestContest.account.id.toNumber()) {
                    latestContest = contest;
                }
            }

            // const latestContest = allContests[allContests.length - 1];
            contestId = latestContest.account.id.toNumber();

            console.log("Latest contest ID:", contestId);
        }

        const playerAccounts = allAccounts.filter(account =>
            account.account.contestId.toNumber() == contestId
        );

        console.log("Fetched player accounts:", playerAccounts);

        return playerAccounts
            .map(account => ({
                address: account.account.owner.toString(),
                score: account.account.currentScore.toNumber(),
                contestId: account.account.contestId
            }))
            .sort((a, b) => b.score - a.score)
            .map((entry, index) => ({
                ...entry,
                rank: index + 1
            })) ;
    } catch (error) {
        console.error("Error fetching from chain:", error);
        throw error;
    }
}

async function getCachedLeaderboard(contestId: number): (Promise<LeaderboardEntry[] | null>) {
    const cacheKey = `${CACHE_KEY_PREFIX}${contestId}`;
    const cached = await redis.get(cacheKey);
    return cached || null;
}

async function cacheLeaderboard(contestId: number, data: LeaderboardEntry[]): Promise<void> {
    const cacheKey = `${CACHE_KEY_PREFIX}${contestId}`;
    await redis.setex(cacheKey, CACHE_DURATION, data);
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        let contestId = parseInt(searchParams.get("contestId") || "-1");
        const forceRefresh = searchParams.get("refresh") === "true";

        if (isNaN(contestId)) {
            return NextResponse.json(
                { error: "Invalid contest ID" },
                { status: 400 }
            );
        }

        let leaderboard: LeaderboardEntry[] | null = null;

        let fromCache = false;

        if (!forceRefresh) {
            leaderboard = await getCachedLeaderboard(contestId);
            if (leaderboard) {
                fromCache = true;
            }
        }

        if (!leaderboard) {
            leaderboard = await fetchFromChain(contestId);
            await cacheLeaderboard(contestId, leaderboard);
        }

        return NextResponse.json({
            fromCache: fromCache,
            data: leaderboard
        });

    } catch (error) {
        console.error("Error in leaderboard API:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}