import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, Connection } from "@solana/web3.js";
import { CapsuleSolanaWeb3Signer } from "@usecapsule/solana-web3.js-v1-integration";
import { getContestAccount, getGlobalAccount, getRoundCounterAccount } from "./pdas";
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
  if (bn.gt(new BN(Number.MAX_SAFE_INTEGER)) || bn.lt(new BN(Number.MIN_SAFE_INTEGER))) {
    return bn.toString();
  }
  return bn.toNumber();
};

export const sendTestSolanaTransaction = async (solanaSigner: CapsuleSolanaWeb3Signer) => {
  try {
    const transaction = new Transaction();
    transaction.feePayer = solanaSigner.sender!;
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: solanaSigner.sender!,
        toPubkey: new PublicKey(
          "5mKstYSwoa5eMyLijKL42CL2k9ASMsTJ7sGApKNB477F",
        ),
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
  contestId: number
) => {
  try {
    const [playerPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("player"),
        playerPubkey.toBuffer(),
        new BN(contestId).toArrayLike(Buffer, "le", 8)
      ],
      programId
    );

    console.log("Checking player state for:", {
      playerPubkey: playerPubkey.toString(),
      contestId,
      playerPDA: playerPDA.toString()
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
      contestId: new BN(playerData.slice(40, 48), 'le').toNumber(),
      currentScore: new BN(playerData.slice(48, 56), 'le').toNumber()
    };

    console.log("Player state:", data);

    return data;
  } catch (error) {
    console.error("Error fetching player state:", error);
    return null;
  }
};

export const fetchLatestContestId = async (
  connection: Connection,
  programId: PublicKey
) => {
  try {
    const counterPDA = getRoundCounterAccount();
    const counterAccount = await connection.getAccountInfo(counterPDA);
    
    if (!counterAccount) {
      console.log("No counter account found");
      return null;
    }
    
    const count = new BN(counterAccount.data.slice(8), 'le').toNumber();
    if (count === 0) {
      console.log("No contests created yet");
      return null;
    }


    
    const globalPDA = getGlobalAccount();
    const globalAccount = await connection.getAccountInfo(globalPDA);
    
    if (!globalAccount) {
      console.log("No global account found");
      return null;
    }
    
    const authority = new PublicKey(globalAccount.data.slice(8, 40));
    const latestContestId = count - 1;

    console.log("Latest contest id:", latestContestId);
    
    const contestPubKey = getContestAccount(authority, latestContestId);
    const contestAccount = await connection.getAccountInfo(contestPubKey);
    
    if (!contestAccount) {
      console.log("No contest account found");
      return null;
    }

    // fetch latest contest data
    // const contestData = contestAccount.data;
    // const data = {
    //   contestId: new BN(contestData.slice(8, 16), 'le').toNumber(),
    //   startTime: new BN(contestData.slice(16, 24), 'le').toNumber(),
    //   endTime: new BN(contestData.slice(24, 32), 'le').toNumber(),
    //   pot: new BN(contestData.slice(32, 40), 'le').toNumber(),
    //   totalPlayers: new BN(contestData.slice(40, 48), 'le').toNumber(),
    //   totalObstacles: new BN(contestData.slice(48, 56), 'le').toNumber(),
    // };

    // fetch latest contest data
    const contestData = contestAccount.data;
    const data = {
      contestId: safeNumber(new BN(contestData.slice(8, 16), 'le')),       // id: u64
      creator: new PublicKey(contestData.slice(16, 48)),                   // creator: Pubkey (32 bytes)
      startTime: safeNumber(new BN(contestData.slice(48, 56), 'le')),      // start_time: i64 
      endTime: safeNumber(new BN(contestData.slice(56, 64), 'le')),        // end_time: i64
      prizePool: safeNumber(new BN(contestData.slice(64, 72), 'le')),      // prize_pool: u64
      highestScore: safeNumber(new BN(contestData.slice(72, 80), 'le')),   // highest_score: u64
      leader: new PublicKey(contestData.slice(80, 112)),                   // leader: Pubkey
      teamAccount: new PublicKey(contestData.slice(112, 144)),             // team_account: Pubkey
      totalParticipants: safeNumber(new BN(contestData.slice(144, 152), 'le')), // total_participants: u64
    };

    return { data, contestPubKey };
  } catch (error) {
    console.log("Error fetching latest contest id:", error);
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

export const executeRefillLivesTxn = async(
  signer,
  connection,
  programId,
  charge,
  shouldContinue,
): Promise<string> => {
  if (!signer?.address) {
    throw new Error("No signer available");
  }

  const pubkey = new PublicKey(signer.address);
  const latestContest = await fetchLatestContestId(connection, programId);
  
  if (!latestContest?.data.contestId) {
    throw new Error("No active contests found");
  }

  const ethPrice = await getEthPrice();
  const chargeSol = charge / ethPrice;

  // Call the refill API
  const response = await fetch('/api/refill-lives', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userPubKey: pubkey.toBase58(),
      roundId: latestContest.data.contestId,
      contestPubKey: latestContest.contestPubKey.toBase58(),
      shouldContinue,
      charge: chargeSol,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get refill transaction');
  }

  const { txn: base64Transaction } = await response.json();

  // Deserialize and send transaction
  const transaction = Transaction.from(Buffer.from(base64Transaction, 'base64'));
  const signature = await signer.sendTransaction(transaction, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  // Wait for transaction confirmation
  await connection.confirmTransaction(signature);

  let solanaurl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  
  console.log("Successfully refilled lives!");
  console.log("Transaction signature:", signature);
  console.log(
    solanaurl,
  );

  return signature;
}
