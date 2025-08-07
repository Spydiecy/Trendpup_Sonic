'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { getContractByChain, getFeeByChain } from '../config/contract';
import { FaLock, FaSpinner, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';

interface AccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccessGranted: () => void;
}

export default function AccessControlModal({ isOpen, onClose, onAccessGranted }: AccessControlModalProps) {
  // Ethereum wallet states
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  // Get current chain configuration for Ethereum
  const targetChainId = 11155111; // Sepolia
  const currentContract = getContractByChain(targetChainId);
  const currentFeeAmount = getFeeByChain(targetChainId);
  
  // Check if current chain has a valid contract setup
  const hasValidContract = currentContract.address !== '0x0000000000000000000000000000000000000000' && 
                          currentContract.abi.length > 0;

  // Check if user has paid access fee
  const { data: hasAccess, isLoading: isCheckingAccess, refetch: refetchAccess } = useReadContract({
    address: currentContract.address,
    abi: currentContract.abi,
    functionName: 'hasPaid',
    args: ethAddress ? [ethAddress] : undefined,
    query: {
      enabled: !!ethAddress && hasValidContract && chainId === targetChainId,
    },
  });

  // Contract interaction
  const { writeContract, data: paymentHash, isPending: isWritePending, error: writeError } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: paymentHash,
  });

  // Reset error when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setShowPayment(false);
    }
  }, [isOpen]);

  // Check access status when connected and on correct chain
  useEffect(() => {
    if (isEthConnected && chainId === targetChainId && hasAccess) {
      onAccessGranted();
      onClose();
    }
  }, [hasAccess, isEthConnected, chainId, onAccessGranted, onClose]);

  // Handle payment success
  useEffect(() => {
    if (isConfirmed && paymentHash) {
      refetchAccess();
      setTimeout(() => {
        onAccessGranted();
        onClose();
      }, 2000);
    }
  }, [isConfirmed, paymentHash, refetchAccess, onAccessGranted, onClose]);

  const handlePayment = async () => {
    if (!ethAddress || !hasValidContract) {
      setError('Please connect your Ethereum wallet first.');
      return;
    }

    if (chainId !== targetChainId) {
      setError('Please switch to Sepolia Testnet.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      writeContract({
        address: currentContract.address,
        abi: currentContract.abi,
        functionName: 'pay',
        value: BigInt(currentFeeAmount),
      });

      setShowPayment(true);
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNetworkSwitch = async () => {
    if (switchChain) {
      try {
        await switchChain({ chainId: targetChainId });
      } catch (error) {
        console.error('Failed to switch chain:', error);
        setError('Failed to switch chain. Please try switching manually in your wallet.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl border border-trendpup-brown/10 p-8 max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes size={20} />
        </button>

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src="/eth.svg" 
              alt="Ethereum" 
              width={60} 
              height={60}
            />
          </div>
          
          <h2 className="text-2xl font-bold text-trendpup-dark mb-2">Ethereum Access Required</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Premium access to Ethereum memecoins requires a 0.01 ETH subscription.
          </p>

          {/* Connection Status */}
          {!isEthConnected ? (
            <div className="space-y-4">
              <p className="text-orange-600 font-medium">Please connect your Ethereum wallet first</p>
              <ConnectButton />
            </div>
          ) : chainId !== targetChainId ? (
            <div className="space-y-4">
              <p className="text-orange-600 font-medium">Please switch to Sepolia Testnet</p>
              <button
                onClick={handleNetworkSwitch}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Switch to Sepolia
              </button>
            </div>
          ) : isCheckingAccess ? (
            <div className="space-y-4">
              <FaSpinner className="animate-spin text-3xl text-trendpup-orange mx-auto" />
              <p className="text-gray-600">Checking subscription status...</p>
            </div>
          ) : hasAccess ? (
            <div className="space-y-4">
              <FaCheckCircle className="text-4xl text-green-500 mx-auto" />
              <p className="text-green-600 font-medium">Access granted! You can now use Ethereum features.</p>
            </div>
          ) : showPayment && isConfirming ? (
            <div className="space-y-4">
              <FaSpinner className="animate-spin text-3xl text-trendpup-orange mx-auto" />
              <p className="text-gray-600">Processing payment...</p>
              {paymentHash && (
                <p className="text-xs text-gray-500 break-all">
                  Transaction: {paymentHash}
                </p>
              )}
            </div>
          ) : showPayment && isConfirmed ? (
            <div className="space-y-4">
              <FaCheckCircle className="text-4xl text-green-500 mx-auto" />
              <p className="text-green-600 font-medium">Payment successful! Access granted.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaLock className="text-orange-500 mr-2" />
                    <span className="font-medium text-orange-800">Subscription Required</span>
                  </div>
                  <span className="font-bold text-orange-800">0.01 ETH</span>
                </div>
                <p className="text-orange-700 text-sm mt-2">
                  One-time payment for lifetime access to Ethereum features
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={isLoading || isWritePending}
                className="w-full px-6 py-3 bg-trendpup-orange hover:bg-trendpup-orange/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors shadow-lg flex items-center justify-center"
              >
                {isLoading || isWritePending ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay 0.01 ETH
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
