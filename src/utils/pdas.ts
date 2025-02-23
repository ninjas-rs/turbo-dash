import { env } from "@/config/env";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

export const getGlobalAccount = () => {
  console.log("programId", programId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("global")],
    programId,
  )[0];
};

export const getRoundCounterAccount = () => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("contest_counter")],
    programId,
  )[0];
};

export const getPlayerStateAccount = (
  playerKey: PublicKey,
  round_id: number,
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("player"),
      playerKey.toBuffer(),
      new BN(round_id).toArrayLike(Buffer, "le", 8),
    ],
    programId,
  )[0];
};

export const getContestAccount = (authority: PublicKey, contestId: number) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("contest"),
      authority.toBuffer(),
      new BN(contestId).toArrayLike(Buffer, "le", 8),
    ],
    programId,
  )[0];
};
