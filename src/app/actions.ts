'use server'

import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

const CACHE_KEY = "eth:latest-price";
const CACHE_DURATION = 50*5;

async function fetchEthPrice(): Promise<number | null> {
    try {
        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
            { next: { revalidate: 60 } }
        );
        const data = await response.json();
        const price = data.ethereum.usd;

        // Cache the new price
        await cachePrice(price);
        
        return price;
    } catch (error) {
        console.error('Error fetching ETH price:', error);
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

export async function getEthPrice() {
    try {
        // Always check cache first
        let price = await getCachedPrice();

        if (price === null) {
            console.log("Cache miss - fetching from API");
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