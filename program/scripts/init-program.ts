import {
  Program,
  web3,
  AnchorProvider,
  setProvider,
  workspace,
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

  const serverKey = new web3.PublicKey(
    "1Vfioh6U5dRMtQw3d4LoFur7AU8URLymJfErY5t1bpu"
  );

  const feesKey = new web3.PublicKey(
    "CX8Cztaym7jw7mMBFkkpqbVw4A5sk6qrm78tJjcpp3SE"
  );

  const getGlobalAccount = () => {
    return web3.PublicKey.findProgramAddressSync(
      [Buffer.from("global")],
      program.programId
    )[0];
  };

  const getRoundCounterAccount = () => {
    return web3.PublicKey.findProgramAddressSync(
      [Buffer.from("contest_counter")],
      program.programId
    )[0];
  };

  console.log("Init:Global Account...");

  const initGlobalTxn = await program.methods
    .initialize(serverKey, feesKey)
    .accountsStrict({
      payer: adminSigner.publicKey,
      global: getGlobalAccount(),
      systemProgram: SYSTEM_PROGRAM_ID,
    })
    .signers([adminSigner])
    .rpc();
  console.log("Init:GlobalAccount:Sig:", initGlobalTxn);

  console.log("Init:Round Counter Account...");

  const txn = await program.methods
    .initializeCounter()
    .accountsStrict({
      systemProgram: SYSTEM_PROGRAM_ID,
      authority: adminSigner.publicKey,
      contestCounter: getRoundCounterAccount(),
    })
    .signers([adminSigner])
    .rpc();

  console.log("Init:RoundCounter:Sig", txn);
}

initProgram().catch(console.log);
