// Smart contract configuration for Sei Network

// Sei testnet contract configuration
export const SEI_CONTRACT = {
  address: '0x34c124f69e4ABd3D6C88F6f190b8e2f336084779' as `0x${string}`,
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
  chainId: 1328, // Sei testnet
} as const;

// Helper function to get contract config by chain
export const getContractByChain = (chainId: number) => {
  switch (chainId) {
    case 1328: // Sei testnet
      return SEI_CONTRACT;
    default:
      return SEI_CONTRACT; // Default to Sei
  }
};

// Access fee amounts
export const SEI_FEE_AMOUNT = '100000000000000000'; // 0.1 SEI in wei (0.1 * 10^18)

// Helper function to get fee amount by chain
export const getFeeByChain = (chainId: number) => {
  switch (chainId) {
    case 1328: // Sei testnet
      return SEI_FEE_AMOUNT;
    default:
      return SEI_FEE_AMOUNT; // Default to Sei
  }
};

// Backward compatibility - defaults to Sei fee
export const FEE_AMOUNT = SEI_FEE_AMOUNT;

// Chain configurations
export const SUPPORTED_CHAINS = {
  SEI: {
    name: 'Sei Testnet',
    chainId: 1328,
    rpc: 'https://evm-rpc-testnet.sei-apis.com',
    blockExplorer: 'https://seitrace.com',
    currency: 'SEI',
    feeAmount: SEI_FEE_AMOUNT,
    feeAmountDisplay: '0.1 SEI',
  },
} as const;
