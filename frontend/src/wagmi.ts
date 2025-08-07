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
      http: ['https://sepolia.infura.io/v3/'],
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
