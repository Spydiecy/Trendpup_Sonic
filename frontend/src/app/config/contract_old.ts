// Smart contract configuration - Temporarily disabled for Flow/Near migration
// Will be updated with Flow testnet and Near testnet contracts when ready

export const ACCESS_FEE_CONTRACT = {
  // Placeholder - will be updated with actual Flow contract
  address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  abi: [], // Will be populated with actual contract ABI
} as const;

// Access fee amount - will be updated for new chains
export const FEE_AMOUNT = 0; // Temporarily set to 0

// Chain configurations
export const SUPPORTED_CHAINS = {
  FLOW: {
    name: 'Flow Testnet',
    chainId: 'flow-testnet', // Will be updated with actual chain ID
    rpc: '', // Will be updated with actual RPC URL
    blockExplorer: 'https://testnet.flowdiver.io/',
  },
  NEAR: {
    name: 'Near Testnet',
    chainId: 'near-testnet',
    rpc: 'https://rpc.testnet.near.org',
    blockExplorer: 'https://explorer.testnet.near.org/',
  },
} as const;
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
    },
    {
      "inputs": [],
      "name": "pay",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;

// Fee amount constant (0.2 AVAX in wei)
export const FEE_AMOUNT = '200000000000000000'; // 0.2 AVAX
