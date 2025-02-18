import {
    Connection,
    PublicKey,
    SystemProgram,
} from "@solana/web3.js";
import { env } from "../../../config/env";
import { NextRequest, NextResponse } from "next/server";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { TurbodashIdl } from "@/config/idl";
import { getPlayerStateAccount } from "@/utils/pdas";

export const POST = async (req: NextRequest) => {
    const body = await req.json();
    const userPubKey = body.userPubKey;
    const roundId = body.roundId;
    const contestPubKey = body.contestPubKey;

    const connection = new Connection(env.NEXT_PUBLIC_RPC_ENDPOINT);
    
    // Simple provider since we don't need to sign anything
    const provider = new AnchorProvider(
        connection,
        {
            publicKey: new PublicKey(userPubKey),
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

    const playerStateKey = getPlayerStateAccount(
        new PublicKey(userPubKey),
        roundId as number,
    );

    // Create the claim prize transaction
    const claimPrizeTxn = await program.methods
        .claimPrize()
        .accountsStrict({
            contest: new PublicKey(contestPubKey),
            playerState: playerStateKey,
            winner: new PublicKey(userPubKey),
            systemProgram: SystemProgram.programId,
        })
        .transaction();

    // Get latest blockhash
    const response = await connection.getLatestBlockhash();
    claimPrizeTxn.recentBlockhash = response.blockhash;
    claimPrizeTxn.feePayer = new PublicKey(userPubKey);

    // Serialize the transaction
    const serializedTransaction = claimPrizeTxn.serialize({
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