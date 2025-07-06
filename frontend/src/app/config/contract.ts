// Smart contract configuration for Flow and Near chains

// Flow Testnet contract configuration
export const FLOW_CONTRACT = {
  address: '0xCA04a78187FdeD8416b4C3c35E3aca185b739c24' as `0x${string}`,
  abi: [
    {
      "inputs": [],
      "name": "pay",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
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
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "paid",
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

// Access fee amounts
export const FLOW_FEE_AMOUNT = '2000000000000000000'; // 2 FLOW tokens in wei (2 * 10^18)
export const NEAR_FEE_AMOUNT = 0; // Will be updated when Near contract is provided

// Helper function to get fee amount by chain
export const getFeeByChain = (chainId: number) => {
  switch (chainId) {
    case 545: // Flow Testnet
      return FLOW_FEE_AMOUNT;
    case 1313161555: // Near Aurora Testnet
      return NEAR_FEE_AMOUNT;
    default:
      return FLOW_FEE_AMOUNT; // Default to Flow
  }
};

// Backward compatibility - defaults to Flow fee
export const FEE_AMOUNT = FLOW_FEE_AMOUNT;

// Chain configurations
export const SUPPORTED_CHAINS = {
  FLOW: {
    name: 'Flow Testnet',
    chainId: 545,
    rpc: 'https://testnet.evm.nodes.onflow.org',
    blockExplorer: 'https://testnet.flowdiver.io/',
    currency: 'FLOW',
    feeAmount: FLOW_FEE_AMOUNT,
    feeAmountDisplay: '2 FLOW',
  },
  NEAR: {
    name: 'Near Aurora Testnet',
    chainId: 1313161555,
    rpc: 'https://testnet.aurora.dev',
    blockExplorer: 'https://explorer.testnet.aurora.dev/',
    currency: 'ETH',
    feeAmount: NEAR_FEE_AMOUNT,
    feeAmountDisplay: 'TBD', // To be determined when Near contract is provided
  },
} as const;
