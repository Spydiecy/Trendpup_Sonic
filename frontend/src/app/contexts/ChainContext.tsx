import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChainContextType {
  selectedChain: 'solana' | 'ethereum' | null;
  setSelectedChain: (chain: 'solana' | 'ethereum') => void;
  resetChain: () => void;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

export function ChainProvider({ children }: { children: ReactNode }) {
  const [selectedChain, setSelectedChain] = useState<'solana' | 'ethereum' | null>(null);

  const resetChain = () => setSelectedChain(null);

  return (
    <ChainContext.Provider value={{ selectedChain, setSelectedChain, resetChain }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChain() {
  const context = useContext(ChainContext);
  if (context === undefined) {
    throw new Error('useChain must be used within a ChainProvider');
  }
  return context;
}
