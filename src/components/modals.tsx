import { useState } from "react";
import { BsArrowRight } from "react-icons/bs";
import { Button, Card } from "pixel-retroui";
import { WalletModal } from "./wallet-state";

export function ContestEndedModal({ onClose }: {
  onClose: () => void;
}) {
  console.log("Contest ended modal");

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <Card
        bg="#239B3F"
        borderColor="#26541B"
        shadowColor="#59b726"
        className="flex flex-col p-2 pointer-events-auto"
      >
        <h2 className="z-50 text-2xl text-[#671919] mb-4">
          Contest Ended!
        </h2>
        <p className="pb-4">
          The current contest has ended. Please wait for the next contest to start!
        </p>
        <Button
          bg="transparent"
          shadow="#429e34"
          className="space-x-2 text-sm !border-0 flex flex-row items-center justify-center"
          onClick={onClose}
        >
          <p>Close</p> <BsArrowRight />
        </Button>
      </Card>
    </div>
  );
}

export function ChargeModal({ onClose, capsuleClient }
  : { onClose: () => void; capsuleClient: any }
) {
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const handleChargeClick = () => {
    setIsWalletOpen(true);
  };

  const handleWalletClose = () => {
    setIsWalletOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <Card
          bg="#239B3F"
          borderColor="#26541B"
          shadowColor="#59b726"
          className="flex flex-col p-2 pointer-events-auto"
        >
          <h2 className="z-50 text-2xl text-[#671919] mb-4">
            Insufficient balance!
          </h2>
          <p className="pb-4">
            To start the game, you must have a minimum balance of 0.2$!
          </p>
          <p className="text-center text-xl pb-3">Get lives</p>
          <div className="flex flex-row w-full pb-8 justify-center items-center">
            <Button
              bg="transparent"
              shadow="#429e34"
              className="p-4 text-sm w-1/3 text-center"
              onClick={handleChargeClick}
            >
              <p className="text-xl">Deposit funds</p>
            </Button>
          </div>
          <Button
            bg="transparent"
            shadow="#429e34"
            className="space-x-2 text-sm !border-0 flex flex-row items-center justify-center"
            onClick={onClose}
          >
            <p>Exit to MainMenu</p> <BsArrowRight />
          </Button>
        </Card>
      </div>

      <WalletModal
        isOpen={isWalletOpen}
        onClose={handleWalletClose}
        capsuleClient={capsuleClient}
      />
    </>
  );
}