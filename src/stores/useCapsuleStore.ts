import { CapsuleSolanaWeb3Signer } from '@usecapsule/solana-web3.js-v1-integration';
import { create } from 'zustand';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getEthPrice } from '@/app/actions';

interface CapsuleStore {
  isActive: boolean;
  signer: CapsuleSolanaWeb3Signer | null;
  setActive: (isActive: boolean) => void;
  setSigner: (signer: CapsuleSolanaWeb3Signer) => void;
  balance: string | null;
  balanceUsd: string | null;
  setBalance: (balance: string) => void;
  fetchBalance: (rpcUrl?: string) => Promise<void>;
}

export const useCapsuleStore = create<CapsuleStore>((set, get) => ({
  isActive: false,
  signer: null,
  balance: null,
  balanceUsd: null,
  setActive: (isActive) => set({ isActive }),
  setSigner: (signer) => set({ signer }),
  setBalance: (balance) => set({ balance }),
  fetchBalance: async (rpcUrl = 'https://testnet.dev2.eclipsenetwork.xyz') => {
    const signer = get().signer;
    if (!signer?.address) return;

    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const pubKey = new PublicKey(signer.address);
      const balance = await connection.getBalance(pubKey);
      const solBalance = (balance / LAMPORTS_PER_SOL).toFixed(4);
      
      const ethPrice = await getEthPrice();
      // const solPrice = await getSolPrice();
      const balanceUsd = ethPrice
        ? (Number(solBalance) * ethPrice).toFixed(2)
        : null;

      set({ 
        balance: solBalance,
        balanceUsd
      });
    } catch (error) {
      console.error('Error fetching balance:', error);
      set({ 
        balance: null,
        balanceUsd: null
      });
    }
  }
}));