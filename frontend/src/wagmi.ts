import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define Kaia Kairos testnet chain
export const kaiaTestnet = defineChain({
  id: 1001, // Kaia Kairos testnet chain ID
  name: 'Kaia Kairos Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'KAIA',
    symbol: 'KAIA',
  },
  rpcUrls: {
    default: {
      http: ['https://public-en-kairos.node.kaia.io'],
    },
  },
  blockExplorers: {
    default: { name: 'KaiaScope', url: 'https://kairos.kaiascope.com' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'TrendPup',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID  
  chains: [kaiaTestnet],
  ssr: true,
});
