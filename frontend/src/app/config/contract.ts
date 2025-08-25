// Smart contract configuration for Sonic Network

// Sonic testnet contract configuration
export const SONIC_CONTRACT = {
  address: '0x6Fe73C7F8b428417596E4276899De8Bb7101dDef' as `0x${string}`,
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
  chainId: 1001, // Kaia Kairos testnet
} as const;

// Helper function to get contract config by chain
export const getContractByChain = (chainId: number) => {
  switch (chainId) {
    case 64165: // Sonic testnet
      return SONIC_CONTRACT;
    default:
      return SONIC_CONTRACT; // Default to Sonic
  }
};

// Access fee amounts
export const SONIC_FEE_AMOUNT = '1000000000000000000'; // 1 SONIC in wei (1 * 10^18)

// Helper function to get fee amount by chain
export const getFeeByChain = (chainId: number) => {
  switch (chainId) {
    case 64165: // Sonic testnet
      return SONIC_FEE_AMOUNT;
    default:
      return SONIC_FEE_AMOUNT; // Default to Sonic
  }
};

// Backward compatibility - defaults to Sonic fee
export const FEE_AMOUNT = SONIC_FEE_AMOUNT;

// Chain configurations
export const SUPPORTED_CHAINS = {
  SONIC: {
    name: 'Sonic Testnet',
    chainId: 64165,
    rpc: 'https://rpc.testnet.soniclabs.com',
    blockExplorer: 'https://testnet.soniclabs.com',
    currency: 'SONIC',
    feeAmount: SONIC_FEE_AMOUNT,
    feeAmountDisplay: '1 SONIC',
  },
} as const;
