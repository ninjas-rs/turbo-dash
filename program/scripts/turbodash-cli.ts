import {
  Program,
  web3,
  AnchorProvider,
  setProvider,
  workspace,
  BN,
} from "@coral-xyz/anchor";
import { Turbodash } from "../target/types/turbodash";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import * as ed from '@noble/ed25519';
import { Buffer } from 'buffer';
import path from "path";
import fs from "fs";

// Constants
const LAMPORTS_PER_SOL = web3.LAMPORTS_PER_SOL;
const DEFAULT_FEES_ACCOUNT = "CX8Cztaym7jw7mMBFkkpqbVw4A5sk6qrm78tJjcpp3SE";

class TurbodashCLI {
  program: Program<Turbodash>;
  provider: AnchorProvider;
  serverKeypair: web3.Keypair;
  adminKeypair: web3.Keypair;

  constructor() {
    // Load admin keypair
    const keypairPath = path.join(process.cwd(), "admin.json");
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
    this.adminKeypair = web3.Keypair.fromSecretKey(Uint8Array.from(keypairData));

    // Initialize provider and program
    this.provider = AnchorProvider.env();
    setProvider(this.provider);
    this.program = workspace.Turbodash as Program<Turbodash>;

    // Generate server keypair (in production, this would be your actual server keypair)
    this.serverKeypair = web3.Keypair.generate();
  }

  // Utility functions for PDA derivation
  private async getAccountAddresses(contestId: number, playerPubkey?: web3.PublicKey) {
    const [globalAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("global")],
      this.program.programId
    );

    const [contestCounter] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("contest_counter")],
      this.program.programId
    );

    const [contestAccount] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("contest"),
        this.adminKeypair.publicKey.toBuffer(),
        new BN(contestId).toArrayLike(Buffer, "le", 8),
      ],
      this.program.programId
    );

    let playerState;
    if (playerPubkey) {
      [playerState] = web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("player"),
          playerPubkey.toBuffer(),
          new BN(contestId).toArrayLike(Buffer, "le", 8),
        ],
        this.program.programId
      );
    }

    return {
      globalAccount,
      contestCounter,
      contestAccount,
      playerState,
    };
  }

  // Read Operations
  async getContestInfo(contestId: number) {
    const { contestAccount } = await this.getAccountAddresses(contestId);
    try {
      const contestInfo = await this.program.account.contestState.fetch(contestAccount);
      return {
        id: contestInfo.id.toString(),
        creator: contestInfo.creator.toString(),
        startTime: new Date(contestInfo.startTime.toNumber() * 1000).toLocaleString(),
        endTime: new Date(contestInfo.endTime.toNumber() * 1000).toLocaleString(),
        prizePool: (contestInfo.prizePool.toNumber() / LAMPORTS_PER_SOL).toFixed(4) + " SOL",
        highestScore: contestInfo.highestScore.toString(),
        leader: contestInfo.leader.toString(),
        totalParticipants: contestInfo.totalParticipants.toString(),
      };
    } catch (error) {
      console.error("Error fetching contest info:", error);
      return null;
    }
  }

  async getPlayerInfo(contestId: number, playerPubkey: web3.PublicKey) {
    const { playerState } = await this.getAccountAddresses(contestId, playerPubkey);
    try {
      const playerInfo = await this.program.account.playerState.fetch(playerState);
      return {
        owner: playerInfo.owner.toString(),
        contestId: playerInfo.contestId.toString(),
        currentScore: playerInfo.currentScore.toString(),
      };
    } catch (error) {
      console.error("Error fetching player info:", error);
      return null;
    }
  }

  // Write Operations
  async createContest(durationInHours: number) {
    const contestDuration = new BN(durationInHours * 3600); // Convert hours to seconds
    const { contestCounter, globalAccount } = await this.getAccountAddresses(0);

    const currentCount = (
      await this.program.account.contestCounter.fetch(contestCounter)
    ).count;

    const [contestAccount] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("contest"),
        this.adminKeypair.publicKey.toBuffer(),
        currentCount.toArrayLike(Buffer, "le", 8),
      ],
      this.program.programId
    );

    try {
      const tx = await this.program.methods
        .createContest(contestDuration)
        .accountsStrict({
          contestCounter,
          authority: this.adminKeypair.publicKey,
          systemProgram: SYSTEM_PROGRAM_ID,
          globalAccount,
          teamAccount: new web3.PublicKey(DEFAULT_FEES_ACCOUNT),
          contest: contestAccount,
        })
        .signers([this.adminKeypair])
        .rpc();

      return {
        signature: tx,
        contestId: currentCount.toString()
      };
    } catch (error) {
      console.error("Error creating contest:", error);
      return null;
    }
  }

  async joinContest(contestId: number, playerKeypair: web3.Keypair) {
    const { contestCounter, contestAccount, playerState } =
      await this.getAccountAddresses(contestId, playerKeypair.publicKey);

    try {
      const tx = await this.program.methods
        .joinContest()
        .accountsStrict({
          contest: contestAccount,
          contestCounter,
          player: playerKeypair.publicKey,
          playerState,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .signers([playerKeypair])
        .rpc();

      return { signature: tx };
    } catch (error) {
      console.error("Error joining contest:", error);
      return null;
    }
  }

  async recordProgress(
    contestId: number,
    playerKeypair: web3.Keypair,
    feeInSol: number
  ) {
    const { contestAccount, playerState, globalAccount } =
      await this.getAccountAddresses(contestId, playerKeypair.publicKey);

    const message = Buffer.from("progress_verification");
    const messageBytes = message.toJSON().data;
    const signature = await ed.sign(message, this.serverKeypair.secretKey.slice(0, 32));
    const feeInLamports = new BN(feeInSol * LAMPORTS_PER_SOL);

    try {
      const tx = await this.program.methods
        // .recordProgress(
        //   feeInLamports,
        //   Array.from(this.serverKeypair.publicKey.toBytes()),
        //   messageBytes,
        //   Array.from(signature)
        // )
        .recordProgress(
          feeInLamports,
          Array.from(this.serverKeypair.publicKey.toBytes()),
          message,
          Array.from(signature)
        )
        .accountsStrict({
          contest: contestAccount,
          player: playerKeypair.publicKey,
          playerState,
          backendSigner: this.serverKeypair.publicKey,
          feesAccount: new web3.PublicKey(DEFAULT_FEES_ACCOUNT),
          globalAccount,
          systemProgram: SYSTEM_PROGRAM_ID,
          ixSysvar: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .signers([playerKeypair, this.serverKeypair])
        .rpc();

      return { signature: tx };
    } catch (error) {
      console.error("Error recording progress:", error);
      return null;
    }
  }

  async refillLifetime(
    contestId: number,
    playerKeypair: web3.Keypair,
    feeInSol: number,
    shouldContinue: boolean = true
  ) {
    const { contestAccount, playerState, globalAccount } =
      await this.getAccountAddresses(contestId, playerKeypair.publicKey);

    const message = Buffer.from("refill_verification");
    const messageBytes = message.toJSON().data;
    const signature = await ed.sign(message, this.serverKeypair.secretKey.slice(0, 32));
    const feeInLamports = new BN(feeInSol * LAMPORTS_PER_SOL);

    try {
      const tx = await this.program.methods
        .refillLifetimes(
          feeInLamports,
          true,
          // Array.from(this.serverKeypair.publicKey.toBuffer()),
          Array.from(this.serverKeypair.publicKey.toBytes()),
          message,
          Array.from(signature)
        )
        // .accountsStrict({
        //   playerState: derivedPlayerStatePubkey,
        //   backendSigner: serverKey.publicKey,
        //   ixSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        //   globalAccount: getGlobalAccount(),
        //   systemProgram: SYSTEM_PROGRAM_ID,
        //   player: payer,
        //   contest: latestRound.publicKey,
        //   teamAccount: feesAccount.publicKey,
        // })
        // .refillLifetimes(
        //   feeInLamports,
        //   shouldContinue,
        //   Array.from(this.serverKeypair.publicKey.toBytes()),
        //   messageBytes,
        //   Array.from(signature)
        // )
        .accountsStrict({
          player: playerKeypair.publicKey,
          playerState,
          contest: contestAccount,
          backendSigner: this.serverKeypair.publicKey,
          globalAccount,
          teamAccount: new web3.PublicKey(DEFAULT_FEES_ACCOUNT),
          systemProgram: SYSTEM_PROGRAM_ID,
          ixSysvar: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .signers([playerKeypair, this.serverKeypair])
        .rpc();

      return { signature: tx };
    } catch (error) {
      console.error("Error refilling lifetime:", error);
      return null;
    }
  }

  async claimPrize(contestId: number, playerKeypair: web3.Keypair) {
    const { contestAccount, playerState } =
      await this.getAccountAddresses(contestId, playerKeypair.publicKey);

    try {
      const tx = await this.program.methods
        .claimPrize()
        .accountsStrict({
          contest: contestAccount,
          playerState,
          winner: playerKeypair.publicKey,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .signers([playerKeypair])
        .rpc();

      return { signature: tx };
    } catch (error) {
      console.error("Error claiming prize:", error);
      return null;
    }
  }
}

// Example usage
async function main() {
  const cli = new TurbodashCLI();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case "create-contest": {
      const durationHours = parseInt(args[0]) || 24;
      const result = await cli.createContest(durationHours);
      console.log("Contest created:", result);
      break;
    }

    case "get-contest": {
      const contestId = parseInt(args[0]);
      const info = await cli.getContestInfo(contestId);
      console.log("Contest info:", info);
      break;
    }

    case "get-player": {
      const contestId = parseInt(args[0]);
      try {
        const playerPubkey = new web3.PublicKey(args[1]);
        const info = await cli.getPlayerInfo(contestId, playerPubkey);
        console.log("Player info:", info);
      } catch (error) {
        console.error("Error: Invalid public key provided");
        console.log("Usage: get-player <contest_id> <player_pubkey>");
      }
      break;
    }

    case "join-contest": {
      const contestId = parseInt(args[0]);
      // For testing, generate a new keypair. In production, you'd use a real keypair
      const playerKeypair = web3.Keypair.generate();
      // Airdrop some SOL for testing
      const airdropSig = await cli.provider.connection.requestAirdrop(
        playerKeypair.publicKey,
        LAMPORTS_PER_SOL
      );
      await cli.provider.connection.confirmTransaction(airdropSig);

      const result = await cli.joinContest(contestId, playerKeypair);
      console.log("Joined contest:", result);
      console.log("Player public key:", playerKeypair.publicKey.toString());
      break;
    }

    case "record-progress": {
      const contestId = parseInt(args[0]);
      const playerKeyString = args[1];
      const feeInSol = parseFloat(args[2]) || 0.001;
      // In production, you'd load the actual player keypair
      const playerKeypair = web3.Keypair.fromSecretKey(
        Buffer.from(JSON.parse(playerKeyString))
      );
      const result = await cli.recordProgress(contestId, playerKeypair, feeInSol);
      console.log("Progress recorded:", result);
      break;
    }

    default:
      console.log(`
Usage:
  create-contest <duration_hours>
  get-contest <contest_id>
  get-player <contest_id> <player_pubkey>
  join-contest <contest_id>
  record-progress <contest_id> <player_keypair_json> <fee_in_sol>
      `);
  }
}

main().catch(console.error);