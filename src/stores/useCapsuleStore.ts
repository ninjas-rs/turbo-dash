import { CapsuleSolanaWeb3Signer } from '@usecapsule/solana-web3.js-v1-integration';
import { create } from 'zustand';

interface CapsuleStore {
  isActive: boolean;
  signer: CapsuleSolanaWeb3Signer | null
  setActive: (isActive: boolean) => void;
  setSigner: (signer: CapsuleSolanaWeb3Signer) => void;
  balance: string | null;
  setBalance: (balance: string) => void;
}

export const useCapsuleStore = create<CapsuleStore>((set) => ({
  isActive: false,
  signer: null,
  setActive: (isActive) => set({ isActive }),
  setSigner: (signer) => set({ signer }),
  balance: null,
  setBalance: (balance) => set({ balance }),
}));