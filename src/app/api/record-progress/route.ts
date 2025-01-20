import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SystemProgram,
  Ed25519Program,
} from "@solana/web3.js";
import fs from "fs";
import { env } from "../../../config/env";
import { NextRequest, NextResponse } from "next/server";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { sign } from "@noble/ed25519";
import { TurbodashIdl } from "@/config/idl";
import { getGlobalAccount, getPlayerStateAccount } from "@/utils/pdas";

const loadKeyPairFromFile = (
  filePath: string = "./wallet-keypair.json",
): Keypair => {
  try {
    const secretKeyString = fs.readFileSync(filePath, { encoding: "utf-8" });
    const secretKey = Uint8Array.from(
      JSON.parse(secretKeyString ?? "{}") as number[],
    );

    const keypair = Keypair.fromSecretKey(secretKey);

    return keypair;
  } catch (error) {
    console.error("Error loading wallet:", error);
    throw error;
  }
};

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const userPubKey = body.userPubKey;
  const roundId = body.roundId;
  const contestPubKey = body.contestPubKey;

  const connection = new Connection(env.NEXT_PUBLIC_RPC_ENDPOINT);

  const keypair = loadKeyPairFromFile(process.cwd() + "/server_wallet.json");
  const publicKey = keypair.publicKey;
  const secretKey = keypair.secretKey;

  const provider = new AnchorProvider(
    connection,
    {
      publicKey: publicKey,
      signTransaction: async () => {
        return Promise.reject();
      },
      signAllTransactions: async () => {
        return await Promise.reject();
      },
    },
    { commitment: "confirmed" },
  );

  const program = new Program(TurbodashIdl, provider);

  const SIGNATURE_MESSAGE = `TurboDash:Server:${userPubKey}:${Date.now().toString()}`;
  const MESSAGE = Uint8Array.from(Buffer.from(SIGNATURE_MESSAGE));
  const signature = await sign(MESSAGE, secretKey.slice(0, 32));

  const FEE = new BN(0.00001 * LAMPORTS_PER_SOL);

  const playerStateKey = getPlayerStateAccount(
    new PublicKey(userPubKey),
    roundId as number,
  );

  const sigIxn = Ed25519Program.createInstructionWithPublicKey({
    signature: signature,
    publicKey: publicKey.toBytes(),
    message: MESSAGE,
  });

  const scoreTxn = await program.methods
    .recordProgress(
      FEE,
      Array.from(publicKey.toBuffer()),
      Buffer.from(MESSAGE),
      Array.from(signature),
    )
    .accountsStrict({
      player: userPubKey,
      playerState: playerStateKey,
      contest: new PublicKey(contestPubKey),
      ixSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      backendSigner: publicKey,
      globalAccount: getGlobalAccount(),
      systemProgram: SystemProgram.programId,
      feesAccount: new PublicKey(env.FEES_ACCOUNT),
    })
    .preInstructions([sigIxn], true)
    .transaction();

  const response = await connection.getLatestBlockhash();
  scoreTxn.recentBlockhash = response.blockhash;

  scoreTxn.feePayer = new PublicKey(userPubKey);

  scoreTxn.partialSign(keypair);

  const serializedTransaction = scoreTxn.serialize({
    requireAllSignatures: false,
  });

  const base64 = serializedTransaction.toString("base64");

  return NextResponse.json(
    {
      txn: base64,
    },
    { status: 200 },
  );
};
