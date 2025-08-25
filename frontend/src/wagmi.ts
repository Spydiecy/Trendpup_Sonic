import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define Sonic Testnet chain
export const sonicTestnet = defineChain({
  id: 14601, // Sonic Testnet chain ID
  name: 'Sonic Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.soniclabs.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Sonic Explorer', url: 'https://testnet.soniclabs.com' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'TrendPup',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID  
  chains: [sonicTestnet],
  ssr: true,
});
