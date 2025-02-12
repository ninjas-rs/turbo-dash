import React, { useEffect, useState } from 'react';
import { Card } from "pixel-retroui";
import { BsCheckCircle, BsHourglass } from "react-icons/bs";

const SingleToast = ({ signature, status }) => {
  const shortSignature = `${signature.slice(0, 4)}...${signature.slice(-4)}`;
  
  return (
    <Card
      bg={status === 'pending' ? "#bdba25" : "#239B3F"}
      borderColor={status === 'pending' ? "#7e851b" : "#26541B"}
      shadowColor={status === 'pending' ? "#7e851b" : "#59b726"}
      className="p-3 flex items-center space-x-2 min-w-[280px] mb-2 transform transition-all duration-300"
    >
      {status === 'pending' ? (
        <BsHourglass className="text-[#7e851b] text-xl flex-shrink-0 animate-spin" />
      ) : (
        <BsCheckCircle className="text-[#26541B] text-xl flex-shrink-0" />
      )}
      <div className="flex flex-col flex-grow min-w-0">
        <p className="text-sm">
          {status === 'pending' ? 'Transaction Pending...' : 'Transaction Success!'}
        </p>
        <p className="text-xs text-[#26541B] font-mono truncate">{shortSignature}</p>
        {status !== 'pending' && (
          <a 
            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#26541B] underline hover:text-[#1b3d13]"
          >
            View on Explorer
          </a>
        )}
      </div>
    </Card>
  );
};

const TransactionToastQueue = ({ activeSignature, pendingSignatures = new Set() }) => {
  const [toasts, setToasts] = useState([]);
  
  useEffect(() => {
    if (activeSignature) {
      const newToast = {
        id: Math.random().toString(),
        signature: activeSignature,
        timestamp: Date.now(),
        status: pendingSignatures.has(activeSignature) ? 'pending' : 'success'
      };

      setToasts(prev => {
        // If toast already exists, update its status
        if (prev.some(t => t.signature === activeSignature)) {
          return prev.map(t => 
            t.signature === activeSignature 
              ? { ...t, status: 'success', timestamp: Date.now() }
              : t
          );
        }
        // Otherwise add new toast
        return [newToast, ...prev];
      });
    }
  }, [activeSignature, pendingSignatures]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setToasts(prev => 
        prev.filter(toast => {
          const age = now - toast.timestamp;
          // Remove pending toasts if they're no longer in pendingSignatures
          if (toast.status === 'pending' && !pendingSignatures.has(toast.signature)) {
            return false;
          }
          // Keep pending toasts, and recent success toasts
          return toast.status === 'pending' || (age < 2000 && toast.status === 'success');
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [pendingSignatures]);

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
            <SingleToast 
              signature={toast.signature} 
              status={toast.status}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionToastQueue;