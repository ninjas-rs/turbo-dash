import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Redis } from '@upstash/redis';
import { env } from "../../../config/env";
import { TurbodashIdl } from "@/config/idl";

export const runtime = "edge";

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

const CACHE_KEY = "turbodash:all-contests";
const CACHE_DURATION = 60 * 5; // 5 minutes

async function getCachedContests() {
    try {
        const cached = await redis.get(CACHE_KEY);
        return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
        console.error("Error getting cached contests:", error);
        return null;
    }
}

async function cacheContests(contests: any[]): Promise<void> {
    try {
        await redis.setex(CACHE_KEY, CACHE_DURATION, JSON.stringify(contests));
    } catch (error) {
        console.error("Error caching contests:", error);
    }
}

export const GET = async (req: NextRequest) => {
    try {
        // Check cache first
        const cachedData = await getCachedContests();
        if (cachedData) {
            return NextResponse.json({
                success: true,
                data: cachedData,
                fromCache: true
            }, { status: 200 });
        }

        const connection = new Connection(env.NEXT_PUBLIC_RPC_ENDPOINT);
        
        // Setup proper provider
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

        const program = new Program(
            TurbodashIdl,
            provider
        );

        console.log('Cache miss - fetching all contest accounts...');
        
        // Fetch all contest accounts directly using the program
        const allContests = await program.account.contestState.all();
        console.log(`Found ${allContests.length} contests`);

        const contests = allContests.map(contest => {
            const account = contest.account;
            const currentTime = Math.floor(Date.now() / 1000);
            
            const status = currentTime > account.endTime.toNumber() ? "Ended" : 
                          currentTime < account.startTime.toNumber() ? "Not Started" : 
                          "Active";

            return {
                roundId: account.id.toNumber(),
                contestPubKey: contest.publicKey.toString(),
                creator: account.creator.toString(),
                startTime: account.startTime.toNumber(),
                endTime: account.endTime.toNumber(),
                prizePool: account.prizePool.toNumber() / 1e9, // Convert to SOL
                leader: {
                    address: account.leader.toString(),
                    score: account.highestScore.toNumber(),
                },
                status,
                totalParticipants: account.totalParticipants.toNumber()
            };
        });

        // Sort by roundId descending (newest first)
        const sortedContests = contests.sort((a, b) => b.roundId - a.roundId);

        // Cache the results
        await cacheContests(sortedContests);

        return NextResponse.json({
            success: true,
            data: sortedContests,
            fromCache: false
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching contests:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to fetch contests"
        }, { status: 500 });
    }
};