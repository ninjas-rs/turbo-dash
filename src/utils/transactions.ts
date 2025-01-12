import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import Capsule, { Environment } from "@usecapsule/react-sdk";
import { CapsuleSolanaWeb3Signer } from "@usecapsule/solana-web3.js-v1-integration";


//THIS IS DEMO TXN FUNCTION 
export const sendTestSolanaTransaction = async () => {
    try {
      const solanaConnection = new Connection(
        "https://testnet.dev2.eclipsenetwork.xyz",
      );

      const capsuleClient = new Capsule(
        Environment.BETA,
        process.env.NEXT_PUBLIC_CAPSULE_API_KEY,
      );

      const solanaSigner = new CapsuleSolanaWeb3Signer(
        capsuleClient,
        solanaConnection,
      );

      const transaction = new Transaction();
      transaction.feePayer = solanaSigner.sender!;
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: solanaSigner.sender!,
          toPubkey: new PublicKey(
            "5YbBVDpEPe3WUca5hrARAFE3HEV25w5YJYztHQy7cUS4",
          ),
          lamports: LAMPORTS_PER_SOL * 0.0001,
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