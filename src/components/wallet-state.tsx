"use client";

import { Button, Card } from "pixel-retroui";
import { ParaModal, OAuthMethod } from "@getpara/react-sdk";
import { useState, useMemo, useEffect } from "react";
import { useCapsuleStore } from "@/stores/useCapsuleStore";
import { LuWalletMinimal } from "react-icons/lu";
import Image from "next/image";

type WalletStateProps = {
  className?: string;
  text?: string;
  mainMenu?: boolean;
  para: any;
  initialize: () => void;
};

export function WalletModal({
  isOpen,
  onClose,
  para,
}: {
  isOpen: boolean;
  onClose: () => void;
  para: any;
}) {
  return (
    <ParaModal
      para={para}
      isOpen={isOpen}
      onClose={onClose}
      logo={"/assets/player.png"}
      theme={{
        mode: "dark",
        backgroundColor: "#2c2c2c",
        foregroundColor: "#ffffff",
        accentColor: "#000000",
      }}
      oAuthMethods={[OAuthMethod.GOOGLE, OAuthMethod.TWITTER]}
      disableEmailLogin={true}
      disablePhoneLogin={true}
      authLayout={["AUTH:FULL"]}
      externalWallets={[]}
      twoFactorAuthEnabled={false}
      recoverySecretStepEnabled={true}
      onRampTestMode
      className="pointer-events-auto"
    />
  );
}

export default function WalletState({
  className,
  text,
  mainMenu,
  para,
  initialize,
}: WalletStateProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isActive, signer, balanceUsd, balance } = useCapsuleStore();

  const truncatedAddress = useMemo(() => {
    if (!signer) return "";
    return `${signer.address!.slice(0, 4)}...${signer.address!.slice(-4)}`;
  }, [signer]);

  useEffect(() => {
    console.log("isActive: ", isActive);
  }, [isActive]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    // give it 0.2 seconds to initialize
    setTimeout(() => {
      initialize();
    }, 200);
    initialize();
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
        {para && (
          <WalletModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            para={para}
          />
        )}
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
          {/* Pretty sure there is a confusion somewhere here */}
          {balance ? balance : "..."} ETH (${balanceUsd})
          {/* { balance ? balance : "..." } SOL (${ balanceUsd }) */}
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

      {para && (
        <WalletModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          para={para}
        />
      )}
    </>
  );
}
