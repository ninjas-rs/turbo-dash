import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { assert, expect } from "chai";
import { sign } from "@noble/ed25519";
import { Turbodash } from "../target/types/turbodash";

describe("Tests:TurboDash", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Turbodash as Program<Turbodash>;

  const serverKey = anchor.web3.Keypair.generate();
  const feesAccount = anchor.web3.Keypair.generate();
  const adminKey = provider.publicKey;
  const payer = provider.publicKey;

  const MSG = Uint8Array.from(Buffer.from("A Good Message to Sign"));

  const getGlobalAccount = () => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("global")],
      program.programId
    )[0];
  };

  const getRoundCounterAccount = () => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("contest_counter")],
      program.programId
    )[0];
  };

  const getPlayerStateAccount = (
    playerKey: anchor.web3.PublicKey,
    round_id: anchor.BN
  ) => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("player"),
        playerKey.toBuffer(),
        round_id.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    )[0];
  };

  it("Initialize global account", async () => {
    await program.methods
      .initialize(serverKey.publicKey, feesAccount.publicKey)
      .accountsStrict({
        global: getGlobalAccount(),
        payer: payer,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .rpc();

    const globalAccountData = await program.account.globalAccount.fetch(
      getGlobalAccount()
    );

    expect(
      globalAccountData.feesAccount.toString() ==
        feesAccount.publicKey.toString()
    );
  });

  it("Initialize Round Counter", async () => {
    await program.methods
      .initializeCounter()
      .accountsStrict({
        systemProgram: SYSTEM_PROGRAM_ID,
        authority: payer,
        contestCounter: getRoundCounterAccount(),
      })
      .rpc();
    const counterAccountData = await program.account.contestCounter.fetch(
      getRoundCounterAccount()
    );
    expect(counterAccountData.count.toNumber() === 0);
  });

  it("Creates a new Contest", async () => {
    const currentCount = (
      await program.account.contestCounter.fetch(getRoundCounterAccount())
    ).count;

    const contest_duration = new anchor.BN(3);

    const derivedContestAddress = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("contest"),
        adminKey.toBuffer(),
        currentCount.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    )[0];

    await program.methods
      .createContest(contest_duration)
      .accountsStrict({
        contestCounter: getRoundCounterAccount(),
        authority: payer,
        systemProgram: SYSTEM_PROGRAM_ID,
        globalAccount: getGlobalAccount(),
        teamAccount: feesAccount.publicKey,
        contest: derivedContestAddress,
      })
      .rpc();

    const createdContest = await program.account.contestState.fetch(
      derivedContestAddress
    );
    expect(createdContest.id.toNumber() === currentCount.toNumber() + 1);
    expect(
      createdContest.leader.toString() ===
        anchor.web3.PublicKey.default.toString()
    );
  });

  it("Joins a Contest", async () => {
    const allRounds = await program.account.contestState.all();
    const latestRound = allRounds[0];

    const derivedPlayerStatePubkey = getPlayerStateAccount(
      payer,
      latestRound.account.id
    );
    await program.methods
      .joinContest()
      .accountsStrict({
        contest: latestRound.publicKey,
        contestCounter: getRoundCounterAccount(),
        systemProgram: SYSTEM_PROGRAM_ID,
        player: payer,
        playerState: derivedPlayerStatePubkey,
      })
      .rpc();

    const createdPlayerState = await program.account.playerState.fetch(
      derivedPlayerStatePubkey
    );

    expect(createdPlayerState.owner.toString() === payer.toString());
    expect(
      createdPlayerState.contestId.toNumber() ===
        latestRound.account.id.toNumber()
    );
  });

  it("Recored Progess", async () => {
    const allRounds = await program.account.contestState.all();
    const latestRound = allRounds[0];

    const derivedPlayerStatePubkey = getPlayerStateAccount(
      payer,
      latestRound.account.id
    );

    const txn = new anchor.web3.Transaction();

    const signature = await sign(MSG, serverKey.secretKey.slice(0, 32));

    const sigix = anchor.web3.Ed25519Program.createInstructionWithPublicKey({
      signature: signature,
      publicKey: serverKey.publicKey.toBytes(),
      message: MSG,
    });

    const FEES_IN_LAMPORT = new anchor.BN(5000000);

    const beforeTxnPlayerState = await program.account.playerState.fetch(
      derivedPlayerStatePubkey
    );
    const ixn = await program.methods
      .recordProgress(
        FEES_IN_LAMPORT,
        Array.from(serverKey.publicKey.toBuffer()),
        Buffer.from(MSG),
        Array.from(signature)
      )
      .accountsStrict({
        feesAccount: feesAccount.publicKey,
        contest: latestRound.publicKey,
        playerState: derivedPlayerStatePubkey,
        player: payer,
        systemProgram: SYSTEM_PROGRAM_ID,
        globalAccount: getGlobalAccount(),
        ixSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        backendSigner: serverKey.publicKey,
      })
      .preInstructions([sigix], true)
      .transaction();

    txn.add(ixn);

    const { blockhash, lastValidBlockHeight } =
      await provider.connection.getLatestBlockhash();
    txn.lastValidBlockHeight = lastValidBlockHeight;
    txn.recentBlockhash = blockhash;
    txn.feePayer = payer;
    txn.partialSign(serverKey);

    await provider.sendAndConfirm(txn);

    const upadtedPlayerState = await program.account.playerState.fetch(
      derivedPlayerStatePubkey
    );

    expect(
      upadtedPlayerState.currentScore.toNumber() ===
        beforeTxnPlayerState.currentScore.toNumber() + 10
    );
  });

  it("Refill lifelines within time slot to keep score", async () => {
    const allRounds = await program.account.contestState.all();
    const latestRound = allRounds[0];

    const derivedPlayerStatePubkey = getPlayerStateAccount(
      payer,
      latestRound.account.id
    );

    const txn = new anchor.web3.Transaction();

    const signature = await sign(MSG, serverKey.secretKey.slice(0, 32));

    const sigix = anchor.web3.Ed25519Program.createInstructionWithPublicKey({
      signature: signature,
      publicKey: serverKey.publicKey.toBytes(),
      message: MSG,
    });

    const FEES_IN_LAMPORT = new anchor.BN(5000000);

    const beforeTxnPlayerState = await program.account.playerState.fetch(
      derivedPlayerStatePubkey
    );
    const ixn = await program.methods
      .refillLifetimes(
        FEES_IN_LAMPORT,
        true,
        Array.from(serverKey.publicKey.toBuffer()),
        Buffer.from(MSG),
        Array.from(signature)
      )
      .accountsStrict({
        playerState: derivedPlayerStatePubkey,
        backendSigner: serverKey.publicKey,
        ixSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        globalAccount: getGlobalAccount(),
        systemProgram: SYSTEM_PROGRAM_ID,
        player: payer,
        contest: latestRound.publicKey,
        teamAccount: feesAccount.publicKey,
      })
      .preInstructions([sigix], true)
      .transaction();

    txn.add(ixn);

    const { blockhash, lastValidBlockHeight } =
      await provider.connection.getLatestBlockhash();
    txn.lastValidBlockHeight = lastValidBlockHeight;
    txn.recentBlockhash = blockhash;
    txn.feePayer = payer;
    txn.partialSign(serverKey);

    await provider.sendAndConfirm(txn);

    const upadtedPlayerState = await program.account.playerState.fetch(
      derivedPlayerStatePubkey
    );

    expect(
      upadtedPlayerState.currentScore.toNumber() ===
        beforeTxnPlayerState.currentScore.toNumber()
    );
  });

  it("Refill lifelines with missed timeslot", async () => {
    const allRounds = await program.account.contestState.all();
    const latestRound = allRounds[0];

    const derivedPlayerStatePubkey = getPlayerStateAccount(
      payer,
      latestRound.account.id
    );

    const txn = new anchor.web3.Transaction();

    const signature = await sign(MSG, serverKey.secretKey.slice(0, 32));

    const sigix = anchor.web3.Ed25519Program.createInstructionWithPublicKey({
      signature: signature,
      publicKey: serverKey.publicKey.toBytes(),
      message: MSG,
    });

    const FEES_IN_LAMPORT = new anchor.BN(5000000);

    const ixn = await program.methods
      .refillLifetimes(
        FEES_IN_LAMPORT,
        false,
        Array.from(serverKey.publicKey.toBuffer()),
        Buffer.from(MSG),
        Array.from(signature)
      )
      .accountsStrict({
        playerState: derivedPlayerStatePubkey,
        backendSigner: serverKey.publicKey,
        ixSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        globalAccount: getGlobalAccount(),
        systemProgram: SYSTEM_PROGRAM_ID,
        player: payer,
        contest: latestRound.publicKey,
        teamAccount: feesAccount.publicKey,
      })
      .preInstructions([sigix], true)
      .transaction();

    txn.add(ixn);

    const { blockhash, lastValidBlockHeight } =
      await provider.connection.getLatestBlockhash();
    txn.lastValidBlockHeight = lastValidBlockHeight;
    txn.recentBlockhash = blockhash;
    txn.feePayer = payer;
    txn.partialSign(serverKey);

    await provider.sendAndConfirm(txn);

    const updatedPlayerState = await program.account.playerState.fetch(
      derivedPlayerStatePubkey
    );

    expect(updatedPlayerState.currentScore.toNumber() === 0);
  });

  it("Should not be able to claim prize when caller is not leader", async () => {
    const allRounds = await program.account.contestState.all();
    const latestRound = allRounds[0];

    const unauthorizedAdmin = anchor.web3.Keypair.generate();

    const airdropSignature = await provider.connection.requestAirdrop(
      unauthorizedAdmin.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);

    const derivedUnAuthPlayerStatePubkey = getPlayerStateAccount(
      unauthorizedAdmin.publicKey,
      latestRound.account.id
    );

    await program.methods
      .joinContest()
      .accountsStrict({
        contest: latestRound.publicKey,
        contestCounter: getRoundCounterAccount(),
        systemProgram: SYSTEM_PROGRAM_ID,
        player: unauthorizedAdmin.publicKey,
        playerState: derivedUnAuthPlayerStatePubkey,
      })
      .signers([unauthorizedAdmin])
      .rpc();

    await new Promise((r) => setTimeout(r, 3000));

    try {
      await program.methods
        .claimPrize()
        .accountsStrict({
          systemProgram: SYSTEM_PROGRAM_ID,
          contest: latestRound.publicKey,
          playerState: derivedUnAuthPlayerStatePubkey,
          winner: unauthorizedAdmin.publicKey,
        })
        .signers([unauthorizedAdmin])
        .rpc();
    } catch (error) {
      console.log(error.error.errorCode.code);
      expect(error.error.errorCode.code === "You are not the highest scorer");
    }
  });
  it("Should be able to claim prize", async () => {
    await new Promise((r) => setTimeout(r, 3000));
    const allRounds = await program.account.contestState.all();
    const latestRound = allRounds[0];

    const derivedPlayerStatePubkey = getPlayerStateAccount(
      payer,
      latestRound.account.id
    );
    await program.methods
      .claimPrize()
      .accountsStrict({
        systemProgram: SYSTEM_PROGRAM_ID,
        contest: latestRound.publicKey,
        playerState: derivedPlayerStatePubkey,
        winner: payer,
      })
      .rpc();

    const afterClaimState = await program.account.contestState.fetch(
      latestRound.publicKey
    );
    expect(afterClaimState.prizePool.toNumber() === 0);
  });

  it("Should update the config", async () => {
    const newServerKey = anchor.web3.Keypair.generate();
    await program.methods
      .processAdminAction({
        updateServerKey: {
          "0": newServerKey.publicKey,
        },
      })
      .accountsStrict({
        globalAccount: getGlobalAccount(),
        admin: adminKey,
      })
      .rpc();

    const updatedState = await program.account.globalAccount.fetch(
      getGlobalAccount()
    );
    expect(
      updatedState.serverKey.toString() === newServerKey.publicKey.toString()
    );
  });

  it("Should fail to update the config with an unauthorized admin key", async () => {
    const unauthorizedAdmin = anchor.web3.Keypair.generate();

    const airdropSignature = await provider.connection.requestAirdrop(
      unauthorizedAdmin.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);

    const newServerKey = anchor.web3.Keypair.generate();

    try {
      await program.methods
        .processAdminAction({
          updateServerKey: {
            "0": newServerKey.publicKey,
          },
        })
        .accountsStrict({
          globalAccount: getGlobalAccount(),
          admin: unauthorizedAdmin.publicKey,
        })
        .signers([unauthorizedAdmin])
        .rpc();

      assert.fail("The unauthorized admin was able to update the config");
    } catch (error) {
      expect(error.error.errorCode.code === "Unauthorized");
    }

    const globalAccountState = await program.account.globalAccount.fetch(
      getGlobalAccount()
    );

    expect(globalAccountState.serverKey.toString()).to.not.equal(
      newServerKey.publicKey.toString(),
      "The server key was incorrectly updated"
    );
  });
});
