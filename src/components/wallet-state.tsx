"use client";

import { Button, Card } from "pixel-retroui";
import clsx from "clsx";
import { CapsuleModal, OAuthMethod } from "@usecapsule/react-sdk";
import "@usecapsule/react-sdk/styles.css";
import { useState, useMemo } from "react";
import { useCapsule } from "@/hooks/useCapsule";
import { useCapsuleStore } from "@/stores/useCapsuleStore";
import { LuWalletMinimal } from "react-icons/lu";
import Image from "next/image";

type WalletStateProps = {
  className?: string;
  text?: string;
  mainMenu?: boolean;
};

export default function WalletState({
  className,
  text,
  mainMenu,
}: WalletStateProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { capsuleClient, initialize } = useCapsule();
  const { isActive, signer, balanceUsd, balance } = useCapsuleStore();

  const truncatedAddress = useMemo(() => {
    if (!signer) return "";
    return `${signer.address!.slice(0, 4)}...${signer.address!.slice(-4)}`;
  }, [signer]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    initialize();
  };

  const Modal = () => {
    return (
      <CapsuleModal
        capsule={capsuleClient}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        className={clsx("pointer-events-auto", className)}
        theme={{
          mode: "dark",
          backgroundColor: "#2c2c2c",
          foregroundColor: "#ffffff",
          accentColor: "#000000",
        }}
        oAuthMethods={[OAuthMethod.TWITTER]}
        disableEmailLogin={false}
        disablePhoneLogin={true}
        authLayout={["AUTH:FULL"]}
        twoFactorAuthEnabled={false}
        recoverySecretStepEnabled={false}
        onRampTestMode
      />
    );
  };

  if (mainMenu && !isActive) {
    return (
      <>
        <button
          className="bg-none pointer-events-auto"
          onClick={() => setIsModalOpen(true)}
        >
          <Image
            src={"/assets/start.png"}
            alt="start"
            width={180}
            height={60}
          ></Image>
        </button>
        {capsuleClient && <Modal />}
      </>
    );
  }

  return (
    <>
      {isActive && (
        <Card
          bg="#55AF4A"
          borderColor="#59b726"
          shadowColor="#7e851b"
          className="rounded-sm text-white mr-2"
        >
        {balance ? balance : '...'} ETH (${balanceUsd})
        </Card>
      )}
      <Button
        bg="#255706"
        shadow="#234319"
        borderColor="#59B726"
        className="text-white pointer-events-auto"
        onClick={() => setIsModalOpen(true)}
      >
        {isActive ? (
          <div className="flex flex-row items-center justify-center space-x-2">
            <LuWalletMinimal className="text-[#59B726]" />
            <p> {truncatedAddress}</p>
          </div>
        ) : (
          <> {text ? text : "Sign In"} </>
        )}
      </Button>

      {capsuleClient && <Modal />}
    </>
  );
}
