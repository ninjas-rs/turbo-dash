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
    const shouldContinue = body.shouldContinue ?? true; // Default to continuing with same score
    const charge = body.charge || 0.2;

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

    // Create signature message
    const SIGNATURE_MESSAGE = `TurboDash:Server:${userPubKey}:${Date.now().toString()}`;
    const MESSAGE = Uint8Array.from(Buffer.from(SIGNATURE_MESSAGE));
    const signature = await sign(MESSAGE, secretKey.slice(0, 32));

    console.log("charge: ", charge);

    const FEE = new BN(charge * LAMPORTS_PER_SOL);

    const playerStateKey = getPlayerStateAccount(
        new PublicKey(userPubKey),
        roundId as number,
    );

    // Create Ed25519 instruction for signature verification
    const sigIxn = Ed25519Program.createInstructionWithPublicKey({
        signature: signature,
        publicKey: publicKey.toBytes(),
        message: MESSAGE,
    });

    // Create the refill transaction
    const refillTxn = await program.methods
        .refillLifetimes(
            FEE,
            shouldContinue,
            Array.from(publicKey.toBuffer()),
            Buffer.from(MESSAGE),
            Array.from(signature),
        )
        .accountsStrict({
            player: userPubKey,
            playerState: playerStateKey,
            contest: new PublicKey(contestPubKey),
            backendSigner: publicKey,
            globalAccount: getGlobalAccount(),
            teamAccount: new PublicKey(env.FEES_ACCOUNT),
            systemProgram: SystemProgram.programId,
            ixSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .preInstructions([sigIxn], true)
        .transaction();

    // Get latest blockhash and sign transaction
    const response = await connection.getLatestBlockhash();
    refillTxn.recentBlockhash = response.blockhash;
    refillTxn.feePayer = new PublicKey(userPubKey);
    refillTxn.partialSign(keypair);

    // Serialize the transaction
    const serializedTransaction = refillTxn.serialize({
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