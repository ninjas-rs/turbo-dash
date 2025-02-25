import { BN } from "@coral-xyz/anchor";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  Connection,
  PublicKeyInitData,
} from "@solana/web3.js";
import { ParaSolanaWeb3Signer } from "@getpara/solana-web3.js-v1-integration";
import {
  getContestAccount,
  getGlobalAccount,
  getRoundCounterAccount,
} from "./pdas";
import { connection } from "next/server";
import { getEthPrice } from "@/app/actions";

/**
 *
 * q. there is no need for lives to be on-chain right?
 * 1. if the player lives end locally, (also is there any way to manipulate lives on the frontend to cheat)
 *
 * GAME FLOW
 *
 * user signs in
 * user deposits 1$ to play the game (or more, that is a modal as well)
 *  - also for starters users need to just deposit 1$ which would give them 50 obstacles cross powers (.02 per obstacle) + .00016$ gas fees
 *
 * user starts the game
 *
 * 2. basically, for me this is how the life system should work
 * a. player starts with 3 lives
 * b. if the player hit obstacle, the player loses a life
 * c. if the player loses all lives, the refill life modal shows up
 * d. user can buy more lives that is one onchain transaction to refill lives
 * e. on success refill, game unpauses, with just updated lives, from the same spot, and the score also remains the same
 * - every extra life they buy is .2$  + .00016$ gas fees
 *
 *
 * other txns
 * txns also go for each obstacle hit, but since they take 4 seconds they are queued up (use multithreading here prolly)
 *
 *
 * from the contract -
 * need the total value locked in pot for a season,
 * current rank, for a particular addres,
 * season-end (need a seperate setter function as well)
 *
 * also leaderboard that will update every hour let's say, with global season winners.
 *
 */

// export interface PlayerState {
//   owner: PublicKey;
//   contestId: number;
//   currentScore: number;
// }

/**
 *
 * @param solanaSigner
 * @returns demo txn function
 *
 * FLOW:
 *
 * use this on every obstacle passed
 */

const readI64FromBuffer = (buffer: Buffer, offset: number) => {
  // Get the raw bytes for the i64
  const bytes = buffer.slice(offset, offset + 8);
  // Convert to signed using DataView
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const value = view.getBigInt64(0, true); // true for little-endian
  return Number(value);
};

const safeNumber = (bn: BN) => {
  if (
    bn.gt(new BN(Number.MAX_SAFE_INTEGER)) ||
    bn.lt(new BN(Number.MIN_SAFE_INTEGER))
  ) {
    return bn.toString();
  }
  return bn.toNumber();
};

export const sendTestSolanaTransaction = async (
  solanaSigner: ParaSolanaWeb3Signer,
) => {
  try {
    const transaction = new Transaction();
    transaction.feePayer = solanaSigner.sender!;
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: solanaSigner.sender!,
        toPubkey: new PublicKey("5mKstYSwoa5eMyLijKL42CL2k9ASMsTJ7sGApKNB477F"),
        lamports: LAMPORTS_PER_SOL * 0.00001,
      }),
    );

    const signature = await solanaSigner.sendTransaction(transaction, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    console.log("Transaction sent successfully!");
    console.log("Signature:", signature);
    console.log(
      `View transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    );

    return signature;
  } catch (error) {
    console.error("Error in sending transaction:", error);
    throw error;
  }
};

export const fetchPlayerState = async (
  connection: Connection,
  programId: PublicKey,
  playerPubkey: PublicKey,
  contestId: number,
) => {
  try {
    const [playerPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("player"),
        playerPubkey.toBuffer(),
        new BN(contestId).toArrayLike(Buffer, "le", 8),
      ],
      programId,
    );

    console.log("Checking player state for:", {
      playerPubkey: playerPubkey.toString(),
      contestId,
      playerPDA: playerPDA.toString(),
    });

    const playerAccount = await connection.getAccountInfo(playerPDA);

    if (!playerAccount) {
      console.log("No player state found for PDA:", playerPDA.toString());
      return null;
    }

    console.log("Found player account with data:", playerAccount.data);

    const playerData = playerAccount.data;
    const data = {
      owner: new PublicKey(playerData.slice(8, 40)),
      contestId: new BN(playerData.slice(40, 48), "le").toNumber(),
      currentScore: new BN(playerData.slice(48, 56), "le").toNumber(),
    };

    console.log("Player state:", data);

    return data;
  } catch (error) {
    console.error("Error fetching player state:", error);
    return null;
  }
};

export const fetchLatestContestId = async () => {
  // check if we have the latest contest in localstorage
  // added in the last 10 minutes
  const latestContest = localStorage.getItem("latestContest");
  if (latestContest) {
    const parsed = JSON.parse(latestContest);
    const createdAt = new Date(parsed.createdAt);
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    if (diff < 10 * 60 * 1000) {
      return parsed;
    }
  }

  try {
    const response = await fetch("/api/latest-contest");
    if (!response.ok) {
      console.log("Error fetching latest contest:", response.statusText);
      return null;
    }

    const result = await response.json();

    // store date in localstorage
    result.createdAt = new Date().toISOString();
    localStorage.setItem("latestContest", JSON.stringify(result));

    if (!result.data) {
      console.log("No contest data found");
      return null;
    }

    return {
      data: result.data,
      contestPubKey: result.contestPubKey,
    };
  } catch (error) {
    console.log("Error fetching latest contest:", error);
    return null;
  }
};

interface RefillLivesParams {
  signer: { address: string; sendTransaction: Function };
  connection: Connection;
  programId: PublicKey;
  charge: number;
  shouldContinue: boolean;
}

export const executeClaimPrizeTxn = async (
  signer: ParaSolanaWeb3Signer,
  connection: { confirmTransaction: (arg0: any) => any },
  contestId: number,
  contestPubKey: string,
  setActiveToast: (arg0: string) => any,
  setPendingSignatures: (toasts: Set<string>) => void,
): Promise<string> => {
  if (!signer?.address) {
    throw new Error("No signer available");
  }

  const pubkey = new PublicKey(signer.address);

  const tempSignature = "pending-claim";

  // @ts-ignore // hehe
  setPendingSignatures((prev) => new Set(prev).add(tempSignature));
  setActiveToast(tempSignature);

  const response = await fetch("/api/claim-prize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userPubKey: pubkey.toBase58(),
      roundId: contestId,
      contestPubKey: contestPubKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get claim prize transaction");
  }

  const { txn: base64Transaction } = await response.json();

  // Deserialize and send transaction
  const transaction = Transaction.from(
    Buffer.from(base64Transaction, "base64"),
  );
  const signature = await signer.sendTransaction(transaction, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  // Wait for transaction confirmation
  await connection.confirmTransaction(signature);

  let solanaurl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

  console.log("Successfully claimed prize!");
  console.log("Transaction signature:", signature);
  console.log(solanaurl);

  // @ts-ignore // hehe
  setPendingSignatures((prev) => {
    const newSet = new Set(prev);
    newSet.delete(tempSignature);
    return newSet;
  });
  setActiveToast(signature);

  return signature;
};

export const executeRefillLivesTxn = async (
  signer: ParaSolanaWeb3Signer | null,
  connection: Connection,
  charge: number,
  shouldContinue: boolean,
): Promise<string> => {
  if (!signer?.address) {
    throw new Error("No signer available");
  }

  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

  const pubkey = new PublicKey(signer.address);
  const latestContest = await fetchLatestContestId();

  if (!latestContest?.data.contestId) {
    throw new Error("No active contests found");
  }

  const ethPrice = await getEthPrice();
  const chargeSol = charge / ethPrice;

  // Call the refill API
  const response = await fetch("/api/refill-lives", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userPubKey: pubkey.toBase58(),
      roundId: latestContest.data.contestId,
      contestPubKey: latestContest.contestPubKey,
      shouldContinue,
      charge: chargeSol,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get refill transaction");
  }

  const { txn: base64Transaction } = await response.json();

  // Deserialize and send transaction
  const transaction = Transaction.from(
    Buffer.from(base64Transaction, "base64"),
  );
  const signature = await signer.sendTransaction(transaction, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  // Wait for transaction confirmation
  await connection.confirmTransaction(signature);

  let solanaurl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

  console.log("Successfully refilled lives!");
  console.log("Transaction signature:", signature);
  console.log(solanaurl);

  return signature;
};
