// Smart contract configuration for Flow and Near chains

// Flow Testnet contract configuration
export const FLOW_CONTRACT = {
  address: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Update with actual Flow contract
  abi: [], // Will be populated with actual contract ABI
  chainId: 545, // Flow EVM Testnet
} as const;

// Near Aurora Testnet contract configuration  
export const NEAR_CONTRACT = {
  address: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Update with actual Near contract
  abi: [], // Will be populated with actual contract ABI
  chainId: 1313161555, // Near Aurora Testnet
} as const;

// Helper function to get contract config by chain
export const getContractByChain = (chainId: number) => {
  switch (chainId) {
    case 545: // Flow Testnet
      return FLOW_CONTRACT;
    case 1313161555: // Near Aurora Testnet
      return NEAR_CONTRACT;
    default:
      return FLOW_CONTRACT; // Default to Flow
  }
};

// Access fee amount - temporarily set to 0
export const FEE_AMOUNT = 0;

// Chain configurations
export const SUPPORTED_CHAINS = {
  FLOW: {
    name: 'Flow Testnet',
    chainId: 545,
    rpc: 'https://testnet.evm.nodes.onflow.org',
    blockExplorer: 'https://testnet.flowdiver.io/',
    currency: 'FLOW',
  },
  NEAR: {
    name: 'Near Aurora Testnet',
    chainId: 1313161555,
    rpc: 'https://testnet.aurora.dev',
    blockExplorer: 'https://explorer.testnet.aurora.dev/',
    currency: 'ETH',
  },
} as const;
