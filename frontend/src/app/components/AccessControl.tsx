'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useDisconnect, useSwitchChain } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { parseEther } from 'viem';
import { getContractByChain, getFeeByChain, SUPPORTED_CHAINS } from '../config/contract';
import { FaLock, FaSpinner, FaCheckCircle, FaWallet } from 'react-icons/fa';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';

interface AccessControlProps {
  children: React.ReactNode;
}

export default function AccessControl({ children }: AccessControlProps) {
  // Ethereum wallet states
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect: disconnectEth } = useDisconnect();
  const { switchChain } = useSwitchChain();
  
  // Solana wallet states
  const { publicKey: solanaPublicKey, connected: isSolanaConnected } = useWallet();
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedChain, setSelectedChain] = useState<'solana' | 'ethereum' | null>(null);
  const [chainSelected, setChainSelected] = useState(false);

  // Get current chain configuration for Ethereum
  const targetChainId = 11155111; // Sepolia
  const currentContract = getContractByChain(targetChainId);
  const currentFeeAmount = getFeeByChain(targetChainId);
  const currentChain = SUPPORTED_CHAINS.ETHEREUM;
  
  // Check if current chain has a valid contract setup
  const hasValidContract = currentContract.address !== '0x0000000000000000000000000000000000000000' && 
                          currentContract.abi.length > 0;

  // Check if user has paid access fee (only for Ethereum users)
  const { data: hasAccess, isLoading: isCheckingAccess, refetch: refetchAccess } = useReadContract({
    address: currentContract.address,
    abi: currentContract.abi,
    functionName: 'hasPaid',
    args: ethAddress ? [ethAddress] : undefined,
    query: {
      enabled: !!ethAddress && hasValidContract && selectedChain === 'ethereum' && chainId === targetChainId,
    },
  });

  // Write contract for payment
  const { writeContract, data: paymentHash, isPending: isPaymentPending } = useWriteContract();

  // Wait for payment confirmation
  const { isLoading: isConfirming, isSuccess: isPaymentConfirmed } = useWaitForTransactionReceipt({
    hash: paymentHash,
  });

  // Handle payment success
  useEffect(() => {
    if (isPaymentConfirmed) {
      setIsLoading(false);
      setError(null);
      setShowPayment(false);
      // Refetch access status
      refetchAccess();
    }
  }, [isPaymentConfirmed, refetchAccess]);

  const handlePayment = async () => {
    if (!ethAddress || !hasValidContract) return;
    
    setIsLoading(true);
    setError(null);

    try {
      writeContract({
        address: currentContract.address,
        abi: currentContract.abi,
        functionName: 'pay',
        value: BigInt(currentFeeAmount),
      });
    } catch (err) {
      console.error('Payment error:', err);
      setError('Failed to process payment. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoBackHome = () => {
    disconnectEth();
    setSelectedChain(null);
    setChainSelected(false);
    window.location.href = '/';
  };

  // Handle chain selection
  const handleChainSelection = async (chain: 'solana' | 'ethereum') => {
    setSelectedChain(chain);
    
    if (chain === 'ethereum' && isEthConnected && switchChain) {
      try {
        await switchChain({ chainId: targetChainId });
        setChainSelected(true);
      } catch (error) {
        console.error('Failed to switch chain:', error);
        setError('Failed to switch chain. Please try switching manually in your wallet.');
      }
    } else {
      // For Solana or if Ethereum wallet is not connected yet
      setChainSelected(true);
    }
  };

  // Show loading state while checking access (only for Ethereum)
  if (selectedChain === 'ethereum' && isCheckingAccess) {
    return (
      <div className="min-h-screen dashboard-bg flex items-center justify-center">
        <div className="bg-white/95 rounded-3xl shadow-2xl border border-trendpup-brown/10 p-8 max-w-md w-full text-center">
          <FaSpinner className="animate-spin text-4xl text-trendpup-orange mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-trendpup-dark mb-2">Checking Access...</h2>
          <p className="text-gray-600">Please wait while we verify your access status.</p>
        </div>
      </div>
    );
  }

  // Show chain selection first
  if (!chainSelected) {
    return (
      <div className="min-h-screen dashboard-bg flex items-center justify-center">
        <div className="bg-white/95 rounded-3xl shadow-2xl border border-trendpup-brown/10 p-8 md:p-12 max-w-lg w-full text-center">
          <div className="flex justify-center mb-6">
            <Image 
              src="/trendpup-logo.png" 
              alt="TrendPup Logo" 
              width={150} 
              height={150}
              priority
              className="rounded-full"
            />
          </div>
          
          <h1 className="text-3xl font-bold text-trendpup-dark mb-2">Choose Your Blockchain</h1>
          <p className="text-gray-600 mb-8 text-sm">
            Select which blockchain you'd like to use for TrendPup access.
          </p>

          {/* Chain Selector */}
          <div className="space-y-4 mb-6">
            {/* Solana Option - Free */}
            <button
              onClick={() => handleChainSelection('solana')}
              className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedChain === 'solana'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image
                    src="/sol.svg"
                    alt="Solana"
                    width={40}
                    height={40}
                    className="mr-4"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Solana</h3>
                    <p className="text-sm text-gray-600">Free access to memecoins</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">FREE</div>
                  <div className="text-xs text-gray-500">No subscription required</div>
                </div>
              </div>
            </button>

            {/* Ethereum Option - Subscription */}
            <button
              onClick={() => handleChainSelection('ethereum')}
              className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedChain === 'ethereum'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image
                    src="/eth.svg"
                    alt="Ethereum"
                    width={40}
                    height={40}
                    className="mr-4"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Ethereum</h3>
                    <p className="text-sm text-gray-600">Premium access to memecoins</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">0.01 ETH</div>
                  <div className="text-xs text-gray-500">One-time payment</div>
                </div>
              </div>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {selectedChain && (
              <button
                onClick={() => handleChainSelection(selectedChain)}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-trendpup-orange hover:bg-trendpup-orange/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors shadow-lg flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue with {selectedChain === 'solana' ? 'Solana' : 'Ethereum'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Solana flow - Free access
  if (selectedChain === 'solana') {
    if (!isSolanaConnected) {
      return (
        <div className="min-h-screen dashboard-bg flex items-center justify-center">
          <div className="bg-white/95 rounded-3xl shadow-2xl border border-trendpup-brown/10 p-8 md:p-12 max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <Image 
                src="/trendpup-logo.png" 
                alt="TrendPup Logo" 
                width={150} 
                height={150}
                priority
                className="rounded-full"
              />
            </div>
            
            <h1 className="text-3xl font-bold text-trendpup-dark mb-2">Connect Solana Wallet</h1>
            <p className="text-gray-600 mb-6 text-sm">
              Connect your Solana wallet to access TrendPup for free.
            </p>
            
            <div className="flex items-center justify-center mb-6">
              <Image src="/sol.svg" alt="Solana" width={24} height={24} className="mr-2" />
              <span className="text-purple-600 font-medium">Free Access - No Subscription Required</span>
            </div>

            <div className="flex justify-center mb-4">
              <WalletMultiButton />
            </div>
            
            <button
              onClick={handleGoBackHome}
              className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors mt-4"
            >
              Go Back to Chain Selection
            </button>
          </div>
        </div>
      );
    }

    // Solana user is connected and has free access
    return children;
  }

  // Ethereum flow - Subscription required
  if (selectedChain === 'ethereum') {
    // Show wallet connection requirement for Ethereum
    if (!isEthConnected) {
      return (
        <div className="min-h-screen dashboard-bg flex items-center justify-center">
          <div className="bg-white/95 rounded-3xl shadow-2xl border border-trendpup-brown/10 p-8 md:p-12 max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <Image 
                src="/trendpup-logo.png" 
                alt="TrendPup Logo" 
                width={150} 
                height={150}
                priority
                className="rounded-full"
              />
            </div>
            
            <h1 className="text-3xl font-bold text-trendpup-dark mb-2">Connect Ethereum Wallet</h1>
            <p className="text-gray-600 mb-6 text-sm">
              Connect your Ethereum wallet to access TrendPup's premium features.
            </p>
            
            <div className="flex items-center justify-center mb-6">
              <Image src="/eth.svg" alt="Ethereum" width={24} height={24} className="mr-2" />
              <span className="text-blue-600 font-medium">Premium Access - 0.01 ETH Required</span>
            </div>

            <div className="flex justify-center mb-4">
              <ConnectButton />
            </div>
            
            <button
              onClick={handleGoBackHome}
              className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors mt-4"
            >
              Go Back to Chain Selection
            </button>
          </div>
        </div>
      );
    }

    // Check if user is on wrong chain
    if (chainId !== targetChainId) {
      return (
        <div className="min-h-screen dashboard-bg flex items-center justify-center">
          <div className="bg-white/95 rounded-3xl shadow-2xl border border-trendpup-brown/10 p-8 md:p-12 max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <Image 
                src="/trendpup-logo.png" 
                alt="TrendPup Logo" 
                width={150} 
                height={150}
                priority
                className="rounded-full"
              />
            </div>
            
            <h1 className="text-3xl font-bold text-trendpup-dark mb-2">Wrong Network</h1>
            <p className="text-gray-600 mb-6 text-sm">
              Please switch to Sepolia testnet to continue with your Ethereum subscription.
            </p>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-xl mb-6">
              <div className="flex items-center justify-center mb-4">
                <Image
                  src="/eth.svg"
                  alt="Ethereum"
                  width={32}
                  height={32}
                  className="mr-3"
                />
                <div className="text-left">
                  <div className="font-semibold text-blue-900">Sepolia Testnet</div>
                  <div className="text-sm text-blue-700">Chain ID: 11155111</div>
                </div>
              </div>
              
              <button
                onClick={() => switchChain?.({ chainId: targetChainId })}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors shadow-lg flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Switching...
                  </>
                ) : (
                  'Switch to Sepolia'
                )}
              </button>
            </div>
            
            <button
              onClick={handleGoBackHome}
              className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Go Back to Chain Selection
            </button>
          </div>
        </div>
      );
    }

    // Show payment requirement if user hasn't paid
    if (!hasAccess && !showPayment) {
      return (
        <div className="min-h-screen dashboard-bg flex items-center justify-center">
          <div className="bg-white/95 rounded-3xl shadow-2xl border border-trendpup-brown/10 p-8 md:p-12 max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <Image 
                src="/trendpup-logo.png" 
                alt="TrendPup Logo" 
                width={150} 
                height={150}
                priority
                className="rounded-full"
              />
            </div>
            
            <h1 className="text-3xl font-bold text-trendpup-dark mb-2">Premium Access Required</h1>
            <p className="text-gray-600 mb-6 text-sm">
              To access TrendPup's premium Ethereum features, please complete your subscription.
            </p>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-xl mb-6">
              <div className="flex items-center justify-center mb-4">
                <Image
                  src="/eth.svg"
                  alt="Ethereum"
                  width={32}
                  height={32}
                  className="mr-3"
                />
                <div className="text-left">
                  <div className="font-semibold text-blue-900">One-time Payment</div>
                  <div className="text-2xl font-bold text-blue-700">0.01 ETH</div>
                  <div className="text-sm text-blue-600">on Sepolia Testnet</div>
                </div>
              </div>
              
              <button
                onClick={handlePayment}
                disabled={isLoading || isPaymentPending || isConfirming}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors shadow-lg flex items-center justify-center"
              >
                {isLoading || isPaymentPending || isConfirming ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    {isPaymentPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Preparing...'}
                  </>
                ) : (
                  <>
                    <FaLock className="mr-2" />
                    Pay 0.01 ETH
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            
            <button
              onClick={handleGoBackHome}
              className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Go Back to Chain Selection
            </button>
          </div>
        </div>
      );
    }

    // User has paid - show access granted
    if (hasAccess) {
      return children;
    }
  }

  // Fallback
  return children;
}
