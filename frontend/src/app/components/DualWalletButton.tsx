'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAccount, useChainId, useDisconnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';

export default function DualWalletButton() {
  const [selectedChain, setSelectedChain] = useState<'solana' | 'ethereum'>('solana');
  
  // Ethereum wallet states
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const { disconnect: disconnectEth } = useDisconnect();
  const chainId = useChainId();
  
  // Solana wallet states
  const { publicKey: solanaPublicKey, connected: isSolanaConnected, disconnect: disconnectSol } = useWallet();

  const isConnected = selectedChain === 'solana' ? isSolanaConnected : isEthConnected;
  const currentAddress = selectedChain === 'solana' ? solanaPublicKey?.toString() : ethAddress;

  // Handle chain switching with wallet disconnection
  const handleChainSwitch = async (chain: 'solana' | 'ethereum') => {
    if (chain === 'solana' && isEthConnected) {
      // Disconnect Ethereum wallet when switching to Solana
      disconnectEth();
    } else if (chain === 'ethereum' && isSolanaConnected) {
      // Disconnect Solana wallet when switching to Ethereum
      try {
        await disconnectSol();
      } catch (error) {
        console.log('Solana wallet already disconnected');
      }
    }
    setSelectedChain(chain);
  };

  // Auto-disconnect the other wallet when one connects
  useEffect(() => {
    if (isEthConnected && isSolanaConnected) {
      // If both are connected, disconnect the one that's not selected
      if (selectedChain === 'ethereum' && isSolanaConnected) {
        disconnectSol();
      } else if (selectedChain === 'solana' && isEthConnected) {
        disconnectEth();
      }
    }
  }, [isEthConnected, isSolanaConnected, selectedChain, disconnectEth, disconnectSol]);

  return (
    <div className="flex flex-col gap-2">
      {/* Chain Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleChainSwitch('solana')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center ${
            selectedChain === 'solana'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Image src="/sol.svg" alt="Solana" width={16} height={16} className="mr-1" />
          Solana
        </button>
        <button
          onClick={() => handleChainSwitch('ethereum')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center ${
            selectedChain === 'ethereum'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Image src="/eth.svg" alt="Ethereum" width={16} height={16} className="mr-1" />
          Ethereum
        </button>
      </div>

      {/* Wallet Button */}
      <div className="flex justify-center">
        {selectedChain === 'solana' ? (
          <WalletMultiButton />
        ) : (
          <ConnectButton chainStatus="none" />
        )}
      </div>

      {/* Connection Status */}
      {isConnected && currentAddress && (
        <div className="text-xs text-gray-600 text-center">
          <div className="font-mono bg-gray-100 px-2 py-1 rounded">
            {currentAddress.slice(0, 8)}...{currentAddress.slice(-8)}
          </div>
          <div className="mt-1">
            {selectedChain === 'solana' ? 'Solana' : 
             chainId === 11155111 ? 'Sepolia' : 'Wrong Network'}
          </div>
        </div>
      )}
    </div>
  );
}
