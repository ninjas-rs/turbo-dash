import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, Connection } from "@solana/web3.js";
import { CapsuleSolanaWeb3Signer } from "@usecapsule/solana-web3.js-v1-integration";

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


/**
 * 
 * @param solanaSigner 
 * @returns demo txn function
 * 
 * FLOW:
 * 
 * use this on every obstacle passed 
 */
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

export const getPlayerStateAsJSON = async (
  connection: Connection,
  playerStateAddress: PublicKey
) => {
  const accountInfo = await connection.getAccountInfo(playerStateAddress);
  
  if (!accountInfo) {
    return null; // Account doesn't exist
  }

  // Skip the 8-byte discriminator
  const data = accountInfo.data.slice(8);
  
  // Decode the data according to the PlayerState layout:
  const playerState = {
    owner: new PublicKey(data.slice(0, 32)).toString(),  // 32 bytes - Pubkey
    contestId: new BN(data.slice(32, 40), 'le').toNumber(),  // 8 bytes - u64
    currentScore: new BN(data.slice(40, 48), 'le').toNumber()  // 8 bytes - u64
  };

  return playerState;
};