import {
    Connection,
    PublicKey,
    SystemProgram,
} from "@solana/web3.js";
import { env } from "../../../config/env";
import { NextRequest, NextResponse } from "next/server";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { TurbodashIdl } from "@/config/idl";

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { userPubKey, roundId, contestPubKey } = body;

        if (!userPubKey || roundId === undefined || !contestPubKey) {
            return NextResponse.json({
                success: false,
                error: "Missing required parameters"
            }, { status: 400 });
        }

        const connection = new Connection(env.NEXT_PUBLIC_RPC_ENDPOINT);
        const winner = new PublicKey(userPubKey);
        
        // Simple provider since we don't need to sign
        const provider = new AnchorProvider(
            connection,
            {
                publicKey: winner,
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

        // Derive player state PDA
        const [playerStatePDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("player"),
                winner.toBuffer(),
                new BN(roundId).toArrayLike(Buffer, "le", 8)
            ],
            program.programId
        );

        // Create the claim prize transaction
        const claimPrizeTxn = await program.methods
            .claimPrize()
            .accountsStrict({
                contest: new PublicKey(contestPubKey),
                playerState: playerStatePDA,
                winner: winner,
                systemProgram: SystemProgram.programId,
            })
            .transaction();

        // Get latest blockhash
        const response = await connection.getLatestBlockhash();
        claimPrizeTxn.recentBlockhash = response.blockhash;
        claimPrizeTxn.feePayer = winner;

        // Serialize the transaction
        const serializedTransaction = claimPrizeTxn.serialize({
            requireAllSignatures: false,
        });
        const base64 = serializedTransaction.toString("base64");

        return NextResponse.json(
            {
                success: true,
                txn: base64,
            },
            { status: 200 },
        );

    } catch (error) {
        console.error("Error creating claim prize transaction:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to create transaction"
        }, { status: 500 });
    }
};