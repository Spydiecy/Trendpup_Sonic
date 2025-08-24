import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define Sei testnet chain
export const seiTestnet = defineChain({
  id: 1328, // Sei testnet chain ID
  name: 'Sei Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'SEI',
    symbol: 'SEI',
  },
  rpcUrls: {
    default: {
      http: ['https://evm-rpc-testnet.sei-apis.com'],
    },
  },
  blockExplorers: {
    default: { name: 'SeiTrace', url: 'https://seitrace.com' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'TrendPup',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID  
  chains: [seiTestnet],
  ssr: true,
});
