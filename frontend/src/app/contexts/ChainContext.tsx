import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface ChainContextType {
  connected: boolean;
  setConnected: (connected: boolean) => void;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

export function ChainProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [connected, setConnected] = useState(false);

  const value = useMemo(() => ({
    connected,
    setConnected,
  }), [connected]);

  return (
    <ChainContext.Provider value={value}>
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
