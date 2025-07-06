'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useDisconnect, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { getContractByChain, getFeeByChain, SUPPORTED_CHAINS } from '../config/contract';
import { FaLock, FaSpinner, FaCheckCircle, FaWallet } from 'react-icons/fa';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';

interface AccessControlProps {
  children: React.ReactNode;
}

export default function AccessControl({ children }: AccessControlProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedChain, setSelectedChain] = useState<'flow' | 'near'>('flow');
  const [chainSelected, setChainSelected] = useState(false);

  // Get current chain configuration based on selected chain (not wallet chain)
  const targetChainId = selectedChain === 'flow' ? 545 : 1313161555;
  const currentContract = getContractByChain(targetChainId);
  const currentFeeAmount = getFeeByChain(targetChainId);
  const currentChain = Object.values(SUPPORTED_CHAINS).find(chain => chain.chainId === targetChainId) || SUPPORTED_CHAINS.FLOW;
  
  // Check if current chain has a valid contract setup
  const hasValidContract = currentContract.address !== '0x0000000000000000000000000000000000000000' && 
                          currentContract.abi.length > 0;

  // Check if user has paid access fee (only after chain is selected and wallet is on correct chain)
  const { data: hasAccess, isLoading: isCheckingAccess, refetch: refetchAccess } = useReadContract({
    address: currentContract.address,
    abi: currentContract.abi,
    functionName: 'hasPaid',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && hasValidContract && chainSelected && chainId === targetChainId,
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
    if (!address || !hasValidContract) return;
    
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
    disconnect();
    window.location.href = '/';
  };

  // Handle chain selection and switching
  const handleChainSelection = async (chain: 'flow' | 'near') => {
    setSelectedChain(chain);
    const targetChainId = chain === 'flow' ? 545 : 1313161555;
    
    if (isConnected && switchChain) {
      try {
        await switchChain({ chainId: targetChainId });
        setChainSelected(true);
      } catch (error) {
        console.error('Failed to switch chain:', error);
        setError('Failed to switch chain. Please try switching manually in your wallet.');
      }
    } else {
      // If not connected, just mark as selected for when they do connect
      setChainSelected(true);
    }
  };

  // Show loading state while checking access
  if (isCheckingAccess) {
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

  // Show wallet connection requirement
  if (!isConnected) {
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
          
          <h1 className="text-3xl font-bold text-trendpup-dark mb-2">TrendPup AI</h1>
          <p className="text-gray-600 mb-6 text-sm">
            Connect your wallet to access TrendPup's premium memecoin intelligence.
          </p>
          
          <div className="flex items-center justify-center mb-6">
            <FaWallet className="text-trendpup-orange mr-2" />
            <span className="text-trendpup-dark font-medium">Wallet Connection Required</span>
          </div>

          <div className="flex justify-center">
            <ConnectButton />
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            After connecting, you'll choose your preferred chain
          </p>
        </div>
      </div>
    );
  }

  // Show chain selection after wallet is connected but before checking subscription
  if (isConnected && !chainSelected) {
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
          
          <h1 className="text-3xl font-bold text-trendpup-dark mb-2">Choose Your Chain</h1>
          <p className="text-gray-600 mb-6 text-sm">
            Select which blockchain you'd like to use for TrendPup access.
          </p>

          {/* Chain Selector */}
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleChainSelection('flow')}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                  selectedChain === 'flow'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Image
                  src="/flow.svg"
                  alt="Flow"
                  width={24}
                  height={24}
                  className="mr-2"
                />
                <div className="text-left">
                  <div className="font-semibold">Flow</div>
                  <div className="text-xs opacity-75">2 FLOW</div>
                </div>
              </button>
              <button
                onClick={() => handleChainSelection('near')}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                  selectedChain === 'near'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Image
                  src="/near.svg"
                  alt="Near"
                  width={24}
                  height={24}
                  className="mr-2"
                />
                <div className="text-left">
                  <div className="font-semibold">Near</div>
                  <div className="text-xs opacity-75">0.0001 ETH</div>
                </div>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {selectedChain === 'flow' 
                ? 'One-time fee: 2 FLOW on Flow EVM Testnet'
                : 'One-time fee: 0.0001 ETH on Near Aurora Testnet'
              }
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <button
              onClick={() => handleChainSelection(selectedChain)}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-trendpup-orange hover:bg-trendpup-orange/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors shadow-lg flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Switching Chain...
                </>
              ) : (
                <>
                  Continue with {selectedChain === 'flow' ? 'Flow' : 'Near'}
                </>
              )}
            </button>
            
            <button
              onClick={handleGoBackHome}
              className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Go Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show payment requirement if user hasn't paid
  if (chainSelected && !hasAccess && !showPayment) {
    // Check if user is on the wrong chain
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
            
            <h1 className="text-3xl font-bold text-trendpup-dark mb-2">Wrong Chain</h1>
            <p className="text-gray-600 mb-6 text-sm">
              Please switch to {currentChain.name} to continue with your {selectedChain === 'flow' ? 'Flow' : 'Near'} subscription.
            </p>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-6 rounded-xl mb-6">
              <div className="flex items-center justify-center mb-4">
                <Image
                  src={selectedChain === 'flow' ? '/flow.svg' : '/near.svg'}
                  alt={selectedChain === 'flow' ? 'Flow' : 'Near'}
                  width={32}
                  height={32}
                  className="mr-3"
                />
                <span className="text-xl font-bold text-orange-600">
                  {currentChain.name}
                </span>
              </div>
              <p className="text-sm text-orange-700 mb-2">Required chain for your subscription</p>
              <p className="text-xs text-orange-600">Chain ID: {targetChainId}</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleChainSelection(selectedChain)}
                className="w-full px-6 py-3 bg-trendpup-orange hover:bg-trendpup-orange/90 text-white rounded-lg font-semibold transition-colors shadow-lg"
              >
                Switch to {currentChain.name}
              </button>
              
              <button
                onClick={() => setChainSelected(false)}
                className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Choose Different Chain
              </button>
              
              <button
                onClick={handleGoBackHome}
                className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Go Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If current chain doesn't have a valid contract, show unsupported message
    if (!hasValidContract) {
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
            
            <h1 className="text-3xl font-bold text-trendpup-dark mb-2">Chain Not Ready</h1>
            <p className="text-gray-600 mb-6 text-sm">
              This chain is not yet ready for subscriptions. Please choose a different chain.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => setChainSelected(false)}
                className="w-full px-6 py-3 bg-trendpup-orange hover:bg-trendpup-orange/90 text-white rounded-lg font-semibold transition-colors shadow-lg"
              >
                Choose Different Chain
              </button>
              
              <button
                onClick={handleGoBackHome}
                className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Go Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

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
            TrendPup is a premium service that requires a one-time access fee to prevent spam and ensure quality.
          </p>
          
          <div className="bg-gradient-to-br from-trendpup-beige/50 to-trendpup-beige p-6 rounded-xl mb-6">
            <div className="flex items-center justify-center mb-4">
              <FaLock className="text-trendpup-orange mr-2 text-2xl" />
              <span className="text-xl font-bold text-trendpup-dark">
                {currentChain.feeAmountDisplay}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              One-time access fee on {currentChain.name}
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>✓ Lifetime access to TrendPup AI</p>
              <p>✓ Real-time memecoin tracking</p>
              <p>✓ AI-powered trend analysis</p>
              <p>✓ Premium dashboard features</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setShowPayment(true)}
              className="w-full px-6 py-3 bg-trendpup-orange hover:bg-trendpup-orange/90 text-white rounded-lg font-semibold transition-colors shadow-lg"
            >
              Pay Access Fee
            </button>
            
            <button
              onClick={handleGoBackHome}
              className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Go Back to Home
            </button>
            
            <p className="text-xs text-gray-500">
              This payment is processed on {currentChain.name}. Make sure you have sufficient {currentChain.currency} for the transaction.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show payment confirmation screen
  if (!hasAccess && showPayment) {
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
          
          <h1 className="text-3xl font-bold text-trendpup-dark mb-2">Confirm Payment</h1>
          <p className="text-gray-600 mb-6 text-sm">
            You're about to pay {currentChain.feeAmountDisplay} to gain lifetime access to TrendPup AI.
          </p>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-6 rounded-xl mb-6">
            <div className="flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-orange-600">
                {currentChain.feeAmountDisplay}
              </span>
            </div>
            <p className="text-sm text-orange-700 mb-2">One-time access fee</p>
            <div className="text-xs text-orange-600 space-y-1">
              <p>✓ Secure blockchain payment</p>
              <p>✓ Lifetime access guaranteed</p>
              <p>✓ No recurring charges</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handlePayment}
              disabled={isLoading || isPaymentPending || isConfirming}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors shadow-lg flex items-center justify-center"
            >
              {(isLoading || isPaymentPending || isConfirming) ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  {isPaymentPending ? 'Confirming Payment...' : isConfirming ? 'Processing...' : 'Preparing...'}
                </>
              ) : (
                <>
                  <FaCheckCircle className="mr-2" />
                  Pay {currentChain.feeAmountDisplay}
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowPayment(false)}
              disabled={isLoading || isPaymentPending || isConfirming}
              className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Back
            </button>

            <button
              onClick={handleGoBackHome}
              disabled={isLoading || isPaymentPending || isConfirming}
              className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Go Back to Home
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Your wallet will prompt you to confirm this transaction. The payment will be processed on the blockchain.
          </p>
        </div>
      </div>
    );
  }

  // User has access, render the main app
  if (hasAccess) {
    return <>{children}</>;
  }

  // Fallback loading state
  return (
    <div className="min-h-screen dashboard-bg flex items-center justify-center">
      <div className="bg-white/95 rounded-3xl shadow-2xl border border-trendpup-brown/10 p-8 max-w-md w-full text-center">
        <FaSpinner className="animate-spin text-4xl text-trendpup-orange mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-trendpup-dark mb-2">Loading...</h2>
        <p className="text-gray-600">Please wait while we load your dashboard.</p>
      </div>
    </div>
  );
}
