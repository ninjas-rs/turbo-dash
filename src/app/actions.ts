"use server";

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { Redis } from "@upstash/redis";
import { env } from "process";
import { TurbodashIdl } from "@/config/idl";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_KEY = "eth:latest-price";
const CACHE_DURATION = 50 * 5;

async function fetchEthPrice(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { next: { revalidate: 60 } },
    );
    const data = await response.json();
    const price = data.ethereum.usd;

    // Cache the new price
    await cachePrice(price);

    return price;
  } catch (error) {
    console.error("Error fetching ETH price:", error);
    return null;
  }
}

async function getCachedPrice(): Promise<number | null> {
  try {
    const cached = await redis.get(CACHE_KEY);
    return cached ? Number(cached) : null;
  } catch (error) {
    console.error("Error getting cached price:", error);
    return null;
  }
}

async function cachePrice(price: number): Promise<void> {
  try {
    await redis.setex(CACHE_KEY, CACHE_DURATION, price.toString());
  } catch (error) {
    console.error("Error caching price:", error);
  }
}

export async function getUserState(address: string, contestId: number = -1) {
  try {
    // Validate the Solana address
    let publicKey: PublicKey;
    const connection = new Connection(env.NEXT_PUBLIC_RPC_ENDPOINT);
    try {
      publicKey = new PublicKey(address);
    } catch (error) {
      throw new Error("Invalid Solana address");
    }

    // Set up the Anchor provider
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
    
    // If contestId is -1, get the latest contest ID
    if (contestId === -1) {
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
      
      contestId = latestContest.account.id.toNumber();
    }

    // Fetch all player states
    const allPlayerAccounts = await program.account.playerState.all();
    
    // Filter for players in the specific contest
    const contestPlayerAccounts = allPlayerAccounts.filter(
      account => account.account.contestId.toNumber() === contestId
    );

    // Sort by score to determine ranking
    const sortedPlayers = contestPlayerAccounts
      .map(account => ({
        address: account.account.owner.toString(),
        score: account.account.currentScore.toNumber(),
        contestId: account.account.contestId.toNumber(),
      }))
      .sort((a, b) => b.score - a.score);

    // Find the user's data and rank
    const userIndex = sortedPlayers.findIndex(player => player.address === address);
    
    if (userIndex === -1) {
      return null;
    }
    
    // Return the user's state with rank
    return {
      ...sortedPlayers[userIndex],
      rank: userIndex + 1
    };
  } catch (error) {
    console.error("Error fetching user state:", error);
    throw error;
  }
}

export async function getEthPrice() {
  try {
    // Always check cache first
    // let price = await getCachedPrice();
    let price = null; // for now

    if (price === null) {
      // console.log("Cache miss - fetching from API");
      // Cache miss - fetch from API
      price = await fetchEthPrice();
    } else {
      console.log("Fetched ETH price from cache");
    }

    if (price === null) {
      throw new Error("Failed to fetch ETH price");
    }

    return price;
  } catch (error) {
    console.error("Error fetching ETH price:", error);
    throw error;
  }
}
