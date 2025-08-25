'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useDisconnect, useSwitchChain } from 'wagmi';
import { FaLock, FaSpinner, FaCheckCircle, FaWallet } from 'react-icons/fa';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';

// Import contract configuration directly
const SONIC_CONTRACT = {
  address: '0xCa36dD890F987EDcE1D6D7C74Fb9df627c216BF6' as `0x${string}`,
  abi: [
    {
      "inputs": [],
      "name": "pay",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "hasPaid",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
} as const;

const SONIC_FEE_AMOUNT = '1000000000000000000'; // 1 SONIC in wei

interface AccessControlProps {
  children: React.ReactNode;
}

export default function AccessControl({ children }: Readonly<AccessControlProps>) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sonic Testnet chain ID
  const targetChainId = 14601;
  
  // Check if user has paid access fee
  const { data: hasAccess, isLoading: isCheckingAccess, refetch: refetchAccess } = useReadContract({
    address: SONIC_CONTRACT.address,
    abi: SONIC_CONTRACT.abi,
    functionName: 'hasPaid',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && chainId === targetChainId,
    },
  });

  // Payment contract interactions
  const { writeContract, data: paymentHash, isPending: isPaymentPending } = useWriteContract();
  
  const { isLoading: isPaymentConfirming, isSuccess: isPaymentSuccess } = useWaitForTransactionReceipt({
    hash: paymentHash,
  });

  // Handle payment
  const handlePayment = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);

    try {
      writeContract({
        address: SONIC_CONTRACT.address,
        abi: SONIC_CONTRACT.abi,
        functionName: 'pay',
        value: BigInt(SONIC_FEE_AMOUNT),
      });
    } catch (err) {
      setError('Payment failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect();
  };

  // Handle chain switch
  const handleSwitchToSonic = () => {
    if (switchChain) {
      switchChain({ chainId: targetChainId });
    }
  };

  useEffect(() => {
    if (isPaymentSuccess) {
      refetchAccess();
    }
  }, [isPaymentSuccess, refetchAccess]);

  // Show loading state while checking access
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-trendpup-beige via-white to-trendpup-beige flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <FaSpinner className="animate-spin text-trendpup-orange text-4xl mx-auto mb-4" />
            <h2 className="text-xl font-bold text-trendpup-dark mb-2">Checking Access</h2>
            <p className="text-gray-600">Verifying your TrendPup subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access granted - render children
  if (hasAccess && chainId === targetChainId) {
    return <>{children}</>;
  }

  // Render connection component
  const renderConnectionFlow = () => {
    if (!isConnected) {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <FaWallet className="text-trendpup-orange text-3xl mx-auto mb-2" />
            <h3 className="font-semibold text-trendpup-dark">Connect Your Wallet</h3>
            <p className="text-sm text-gray-600 mb-4">Connect to Sonic Network to access TrendPup</p>
          </div>
          <div className="flex justify-center">
            <ConnectButton chainStatus="none" />
          </div>
        </div>
      );
    }

    if (chainId !== targetChainId) {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-yellow-600">⚠️</span>
            </div>
            <h3 className="font-semibold text-trendpup-dark">Wrong Network</h3>
            <p className="text-sm text-gray-600 mb-4">Please switch to Sonic Testnet</p>
          </div>
          <button
            onClick={handleSwitchToSonic}
            className="w-full bg-trendpup-orange text-white py-2 px-4 rounded-lg font-medium hover:bg-trendpup-orange/90 transition-colors"
          >
            Switch to Sonic Testnet
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      );
    }

    if (!hasAccess) {
      const getButtonText = () => {
        if (isPaymentPending) return 'Confirm in Wallet...';
        if (isPaymentConfirming) return 'Processing Payment...';
        return 'Pay 1 SONIC for Access';
      };

      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-trendpup-orange rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-xl">💰</span>
            </div>
            <h3 className="font-semibold text-trendpup-dark">Premium Access Required</h3>
            <p className="text-sm text-gray-600 mb-4">Pay 1 SONIC for lifetime access to TrendPup</p>
          </div>
          
          <div className="bg-trendpup-beige rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-trendpup-dark">Access Fee:</span>
              <span className="text-lg font-bold text-trendpup-orange">1 SONIC</span>
            </div>
            <div className="text-xs text-gray-600">
              One-time payment for lifetime access to premium features
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={isLoading || isPaymentPending || isPaymentConfirming}
            className="w-full bg-trendpup-orange text-white py-3 px-4 rounded-lg font-medium hover:bg-trendpup-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {(isLoading || isPaymentPending || isPaymentConfirming) ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                {getButtonText()}
              </>
            ) : (
              <>
                <FaCheckCircle className="mr-2" />
                Pay 1 SONIC for Access
              </>
            )}
          </button>

          <button
            onClick={handleDisconnect}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      );
    }

    return null;
  };

  // Show connection/payment flow
  return (
    <div className="min-h-screen bg-gradient-to-br from-trendpup-beige via-white to-trendpup-beige flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-trendpup-orange rounded-full flex items-center justify-center mx-auto mb-4">
            <FaLock className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-trendpup-dark mb-2">Access TrendPup</h1>
          <p className="text-gray-600">Premium memecoin intelligence on Sonic Network</p>
        </div>

        {/* Network Selection */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <div className="flex-1 py-2 px-3 rounded-md text-sm font-medium bg-white text-blue-600 shadow-sm flex items-center justify-center">
              <Image src="/sonic.svg" alt="Sonic" width={16} height={16} className="mr-1" />
              Sonic Network
            </div>
          </div>
        </div>

        {renderConnectionFlow()}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Secure payments powered by Sonic Network
          </p>
        </div>
      </div>
    </div>
  );
}
