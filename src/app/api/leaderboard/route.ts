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

const CACHE_KEY_PREFIX = "turbodash:leaderboard:";
const CACHE_DURATION = 24 * 60 * 60;

interface LeaderboardEntry {
    player: string;
    score: number;
    rank: number;
    contestId: number;
}

async function fetchFromChain(contestId: number): Promise<LeaderboardEntry[]> {
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
        const playerAccounts = allAccounts.filter(account =>
            account.account.contestId === contestId
        );

        return playerAccounts
            .map(account => ({
                player: account.account.owner.toString(),
                score: account.account.currentScore.toNumber(),
                contestId: account.account.contestId
            }))
            .sort((a, b) => b.score - a.score)
            .map((entry, index) => ({
                ...entry,
                rank: index + 1
            }));
    } catch (error) {
        console.error("Error fetching from chain:", error);
        throw error;
    }
}

async function getCachedLeaderboard(contestId: number): Promise<LeaderboardEntry[] | null> {
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
        const contestId = parseInt(searchParams.get("contestId") || "0");
        const forceRefresh = searchParams.get("refresh") === "true";

        if (isNaN(contestId)) {
            return NextResponse.json(
                { error: "Invalid contest ID" },
                { status: 400 }
            );
        }

        let leaderboard: LeaderboardEntry[] | null = null;

        if (!forceRefresh) {
            leaderboard = await getCachedLeaderboard(contestId);
        }

        if (!leaderboard) {
            leaderboard = await fetchFromChain(contestId);
            await cacheLeaderboard(contestId, leaderboard);
        }

        return NextResponse.json({
            contestId,
            fromCache: !forceRefresh && leaderboard !== null,
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