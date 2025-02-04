import React, { useEffect, useState } from 'react';
import { Card } from "pixel-retroui";
import { BsCheckCircle } from "react-icons/bs";

interface Toast {
  id: string;
  signature: string;
  timestamp: number;
}

const SingleToast = ({ signature }: { signature: string }) => {
  const shortSignature = `${signature.slice(0, 4)}...${signature.slice(-4)}`;
  
  return (
    <Card
      bg="#239B3F"
      borderColor="#26541B"
      shadowColor="#59b726"
      className="p-3 flex items-center space-x-2 min-w-[280px] mb-2 transform transition-all duration-300"
    >
      <BsCheckCircle className="text-[#26541B] text-xl flex-shrink-0" />
      <div className="flex flex-col flex-grow min-w-0">
        <p className="text-sm">Transaction Success!</p>
        <p className="text-xs text-[#26541B] font-mono truncate">{shortSignature}</p>
        <a 
          href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#26541B] underline hover:text-[#1b3d13]"
        >
          View on Explorer
        </a>
      </div>
    </Card>
  );
};

const TransactionToastQueue = ({ activeSignature }: { activeSignature: string | null }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  useEffect(() => {
    if (activeSignature) {
      setToasts(prev => [
        { id: Math.random().toString(), signature: activeSignature, timestamp: Date.now() },
        ...prev
      ]);
    }
  }, [activeSignature]);

  useEffect(() => {
    const timer = setInterval(() => {
      setToasts(prev => 
        prev.filter(toast => Date.now() - toast.timestamp < 2000)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex flex-col">
        {toasts.map((toast, index) => (
          <div 
            key={toast.id}
            className="transform transition-all duration-300"
            style={{
              opacity: 1 - (index * 0.2),
              transform: `translateY(${index * 8}px)`,
            }}
          >
            <SingleToast signature={toast.signature} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionToastQueue;