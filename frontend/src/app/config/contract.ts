// Smart contract configuration for Sonic Network

// Sonic Testnet contract configuration
export const SONIC_CONTRACT = {
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
  chainId: 14601, // Sonic Testnet
} as const;

// Helper function to get contract config by chain
export function getContractAddress(chainId: number): string {
  // Only Sonic Testnet is supported
  return SONIC_CONTRACT.address;
}

// Access fee amounts
export const SONIC_FEE_AMOUNT = '1000000000000000000'; // 1 SONIC in wei (1 * 10^18)

// Helper function to get fee amount by chain
export function getFeeAmount(chainId: number): string {
  // Only Sonic Testnet is supported  
  return SONIC_FEE_AMOUNT;
}

// Backward compatibility - defaults to Sonic fee
export const FEE_AMOUNT = SONIC_FEE_AMOUNT;

// Chain configurations
export const SUPPORTED_CHAINS = {
  SONIC: {
    name: 'Sonic Testnet',
    chainId: 14601,
    rpc: 'https://rpc.testnet.soniclabs.com',
    blockExplorer: 'https://testnet.soniclabs.com',
    currency: 'S',
    feeAmount: SONIC_FEE_AMOUNT,
    feeAmountDisplay: '1 SONIC',
  },
} as const;
