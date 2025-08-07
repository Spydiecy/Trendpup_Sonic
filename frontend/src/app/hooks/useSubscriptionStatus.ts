'use client';

import { useAccount, useReadContract, useChainId } from 'wagmi';
import { getContractByChain } from '../config/contract';

export function useSubscriptionStatus() {
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const chainId = useChainId();
  
  // Get current chain configuration for Ethereum
  const targetChainId = 11155111; // Sepolia
  const currentContract = getContractByChain(targetChainId);
  
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
      enabled: !!ethAddress && hasValidContract && chainId === targetChainId,
    },
  });

  return {
    hasEthereumAccess: hasAccess,
    isCheckingEthereumAccess: isCheckingAccess,
    refetchEthereumAccess: refetchAccess,
    isEthereumConnected: isEthConnected,
    isCorrectChain: chainId === targetChainId
  };
}
