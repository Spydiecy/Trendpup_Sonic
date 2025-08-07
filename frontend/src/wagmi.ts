import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define Sepolia testnet chain for Ethereum subscriptions
export const sepolia = defineChain({
  id: 11155111, // Sepolia testnet chain ID
  name: 'Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'SepoliaETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.ankr.com/eth_sepolia/2bcd37b475fe8e8f8ef53b6dd6f6b3151859c4c825677067e55ab2e9e11a64aa'],
    },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'TrendPup',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID  
  chains: [sepolia],
  ssr: true,
});
