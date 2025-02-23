import { useCallback, useEffect, useState } from "react";
import { Connection } from "@solana/web3.js";
import { CapsuleSolanaWeb3Signer } from "@usecapsule/solana-web3.js-v1-integration";
import { useCapsuleStore } from "@/stores/useCapsuleStore";
import Capsule, { Environment } from "@usecapsule/react-sdk";

export const useCapsule = () => {
  const { setActive, fetchBalance, setSigner, isActive } = useCapsuleStore();
  const [wallets, setWallets] = useState<any>({});

  useEffect(() => {
    console.log("Getting re-rendered");
  }, []);

  const capsuleClient = new Capsule(
    Environment.BETA,
    process.env.NEXT_PUBLIC_CAPSULE_API_KEY!,
  );

  const connection = new Connection("https://testnet.dev2.eclipsenetwork.xyz");

  const initializeSigner = useCallback(async () => {
    try {
      const isActive = capsuleClient.isEmail;
      const isLoggedIn = await capsuleClient.isFullyLoggedIn();
      console.log("Is logged in", isLoggedIn);
      if (!isLoggedIn) {
        console.log("Not logged in");
        setActive(false);
        return;
      }

      if (!isActive) {
        const wallets = await capsuleClient.getWallets();
        setWallets(wallets);

        console.log("No wallets found");
        const isActive = false;
        setActive(isActive);
        return;
      }

      setActive(isActive);
      if (isActive) {
        const wallets = await capsuleClient.getWallets();
        console.log("Wallets", wallets);
        setWallets(wallets);

        // get the first key value
        if (!wallets) return;

        if (Object.keys(wallets).length === 0) {
          console.error("No wallets found");
          return;
        }

        const wallet = Object.values(wallets)[0];

        const signer = new CapsuleSolanaWeb3Signer(
          capsuleClient,
          connection,
          wallet.id,
        );
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
