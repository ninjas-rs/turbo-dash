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
import path from "path";
import fs from "fs";

const keypairPath = path.join(process.cwd(), "admin.json");
const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
const adminSigner = web3.Keypair.fromSecretKey(Uint8Array.from(keypairData));

async function initProgram() {
  const provider = AnchorProvider.env();
  setProvider(provider);

  const program = workspace.Turbodash as Program<Turbodash>;

  const getRoundCounterAccount = () => {
    return web3.PublicKey.findProgramAddressSync(
      [Buffer.from("contest_counter")],
      program.programId
    )[0];
  };

  const currentCount = (
    await program.account.contestCounter.fetch(getRoundCounterAccount())
  ).count;

  const getGlobalAccount = () => {
    return web3.PublicKey.findProgramAddressSync(
      [Buffer.from("global")],
      program.programId
    )[0];
  };

  //5 days for testing
  const contest_duration = new BN(36000);

  const feesKey = new web3.PublicKey(
    "CX8Cztaym7jw7mMBFkkpqbVw4A5sk6qrm78tJjcpp3SE"
  );

  const derivedContestAddress = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("contest"),
      adminSigner.publicKey.toBuffer(),
      currentCount.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  )[0];

  const sig = await program.methods
    .createContest(contest_duration)
    .accountsStrict({
      contestCounter: getRoundCounterAccount(),
      authority: adminSigner.publicKey,
      systemProgram: SYSTEM_PROGRAM_ID,
      globalAccount: getGlobalAccount(),
      teamAccount: feesKey,
      contest: derivedContestAddress,
    })
    .signers([adminSigner])
    .rpc();

  console.log("Contest:CreateContest:Sig:", sig);
}

initProgram().catch(console.log);
