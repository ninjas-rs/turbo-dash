import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    COINGECKO_API_KEY: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    FEES_ACCOUNT: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_RPC_ENDPOINT: z.string().url(),
    NEXT_PUBLIC_PROGRAM_ID: z.string().min(1),
  },
  runtimeEnv: {
    FEES_ACCOUNT: process.env.FEES_ACCOUNT,
    DATABASE_URL: process.env.DATABASE_URL,
    COINGECKO_API_KEY: process.env.COINGECKO_KEY,
    NEXT_PUBLIC_PROGRAM_ID: process.env.NEXT_PUBLIC_PROGRAM_ID,
    NEXT_PUBLIC_RPC_ENDPOINT: process.env.NEXT_PUBLIC_RPC_ENDPOINT,
  },
});
