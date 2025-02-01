import { useCallback, useEffect } from "react";
import { Connection } from "@solana/web3.js";
import { CapsuleSolanaWeb3Signer } from "@usecapsule/solana-web3.js-v1-integration";
import { useCapsuleStore } from "@/stores/useCapsuleStore";
import Capsule, { Environment } from "@usecapsule/react-sdk";

export const useCapsule = () => {
  const { setActive, fetchBalance, setSigner, isActive } = useCapsuleStore();

  const capsuleClient = new Capsule(
    Environment.BETA,
    process.env.NEXT_PUBLIC_CAPSULE_API_KEY!,
  );

  const connection = new Connection("https://testnet.dev2.eclipsenetwork.xyz");

  const initializeSigner = useCallback(async () => {
    try {
      const isActive = capsuleClient.isEmail;
      setActive(isActive);
      if (isActive) {
        // get the signer wallet
        const wallets = await capsuleClient.getWallets();

        // get the first key value
        const wallet = Object.values(wallets)[0]

        const signer = new CapsuleSolanaWeb3Signer(capsuleClient, connection, wallet.id);
        if (signer) setSigner(signer);
      }
      console.log("Signer initialized successfully", isActive);
    } catch (error) {
      console.error("Signer initialization failed:", error);
      setActive(false);
    }
  }, [isActive]);

  useEffect(() => {
    console.log("Capsule email", capsuleClient.isEmail, "setting active");
    setActive(capsuleClient.isEmail);
  }, [capsuleClient.isEmail, setActive]);

  useEffect(() => {
    initializeSigner();
  }, [initializeSigner]);

  useEffect(() => {
    if (!isActive) return;

    fetchBalance();
    const interval = setInterval(() => {
      fetchBalance();
    }, 10000);

    return () => clearInterval(interval);
  }, [isActive, fetchBalance]);

  

  return {
    capsuleClient,
    initialize: initializeSigner,
    connection: connection,
  };
};
