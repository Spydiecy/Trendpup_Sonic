// Smart contract configuration for Ethereum and Solana chains

// Ethereum Sepolia contract configuration
export const ETHEREUM_CONTRACT = {
  address: '0x8D8c158a87D2722274F2Fa9339A13Bc8FB5Ebf18' as `0x${string}`,
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
  chainId: 11155111, // Sepolia testnet
} as const;

// Helper function to get contract config by chain
export const getContractByChain = (chainId: number) => {
  switch (chainId) {
    case 11155111: // Sepolia testnet
      return ETHEREUM_CONTRACT;
    default:
      return ETHEREUM_CONTRACT; // Default to Ethereum
  }
};

// Access fee amounts
export const ETHEREUM_FEE_AMOUNT = '10000000000000000'; // 0.01 ETH in wei (0.01 * 10^18)

// Helper function to get fee amount by chain
export const getFeeByChain = (chainId: number) => {
  switch (chainId) {
    case 11155111: // Sepolia testnet
      return ETHEREUM_FEE_AMOUNT;
    default:
      return ETHEREUM_FEE_AMOUNT; // Default to Ethereum
  }
};

// Backward compatibility - defaults to Ethereum fee
export const FEE_AMOUNT = ETHEREUM_FEE_AMOUNT;

// Chain configurations
export const SUPPORTED_CHAINS = {
  ETHEREUM: {
    name: 'Sepolia',
    chainId: 11155111,
    rpc: 'https://rpc.ankr.com/eth_sepolia/2bcd37b475fe8e8f8ef53b6dd6f6b3151859c4c825677067e55ab2e9e11a64aa',
    blockExplorer: 'https://sepolia.etherscan.io',
    currency: 'ETH',
    feeAmount: ETHEREUM_FEE_AMOUNT,
    feeAmountDisplay: '0.01 ETH',
  },
} as const;
