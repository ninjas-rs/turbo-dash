"use client";

import { Button, Card } from "pixel-retroui";
import { CapsuleModal, OAuthMethod } from "@usecapsule/react-sdk";
import "@usecapsule/react-sdk/styles.css";
import { useState, useMemo } from "react";
import { useCapsule } from "@/app/hooks/useCapsule";
import { useCapsuleStore } from "@/stores/useCapsuleStore";
import { LuWalletMinimal } from "react-icons/lu";

export default function WalletState() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { capsuleClient, initialize } = useCapsule();
  const { isActive, signer } = useCapsuleStore();

  const truncatedAddress = useMemo(() => {
    if (!signer) return "";
    return `${signer.address!.slice(0, 4)}...${signer.address!.slice(-4)}`;
  }, [signer]);

  const handleModalClose = () => {
    console.log("Modal closed");
    setIsModalOpen(false);
    initialize();
  };

  return (
    <>
     {isActive && (
          <Card
          bg="#55AF4A"
          borderColor="#59b726"
          shadowColor="#7e851b"
          className="rounded-sm text-white mr-2"
        >
          0.001 ETH 
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
          "Sign in with Capsule"
        )}
      </Button>
     

      {capsuleClient && (
        <CapsuleModal
          capsule={capsuleClient}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          className="pointer-events-auto"
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
      )}
    </>
  );
}
