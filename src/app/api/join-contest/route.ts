import {
    Keypair,
    Connection,
    PublicKey,
    Transaction,
} from "@solana/web3.js";

import fs from "fs";
import { NextApiRequest, NextApiResponse } from 'next';
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { TurbodashIdl } from "@/config/idl";
import { SYSTEM_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/native/system';
import { NextRequest, NextResponse } from "next/server";
import { getPlayerStateAccount, getRoundCounterAccount } from "@/utils/pdas";

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
    const res = NextResponse;

    if (req.method !== 'POST') {
        return res.json({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        // const { playerPublicKey } = req.body;
        const body = await req.json();
        const playerPublicKey = body.playerPublicKey;

        if (!playerPublicKey) {
            return res.json({ error: 'Player public key is required' }, { status: 400 });
        }

        const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!, 'confirmed');

        const player = new PublicKey(playerPublicKey);

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

        // Get all contests and find the latest one
        const allContests = await program.account.contestState.all();
        if (allContests.length === 0) {
            return res.json({ error: 'No active contests found' }, { status: 404 });
        }

        // const latestContest = allContests[allContests.length - 1];
        let latestContest = allContests[0];

        // console.log("Fetched all contests:", allContests);
        for (const contest of allContests) {
            if (contest.account.id.toNumber() > latestContest.account.id.toNumber()) {
                latestContest = contest;
            }
        }

        // Get PDAs
        const playerStatePubkey = getPlayerStateAccount(
            player,
            latestContest.account.id.toNumber()
        );

        const contestCounterPubkey = getRoundCounterAccount();

        // Build transaction
        const transaction = new Transaction();

        // Add join contest instruction
        const joinContestIx = await program.methods
            .joinContest()
            .accounts({
                //@ts-expect-error
                contest: latestContest.publicKey,
                contestCounter: contestCounterPubkey,
                player: player,
                playerState: playerStatePubkey,
                systemProgram: SYSTEM_PROGRAM_ID
            })
            .instruction();

        transaction.add(joinContestIx);

        // Get the latest blockhash
        const latestBlockhash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = player;

        // Serialize and encode the transaction
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        });

        const base64Transaction = serializedTransaction.toString('base64');

        return res.json({
            transaction: base64Transaction,
            latestBlockhash: latestBlockhash.blockhash,
            playerState: playerStatePubkey.toBase58(),
            contest: latestContest.publicKey.toBase58()
        }, { status: 200 });

    } catch (error) {
        console.error('Error creating join contest transaction:', error);
        return res.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}