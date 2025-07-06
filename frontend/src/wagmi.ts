import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define Flow Testnet chain
export const flowTestnet = defineChain({
  id: 545, // Flow EVM Testnet chain ID
  name: 'Flow Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Flow',
    symbol: 'FLOW',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.evm.nodes.onflow.org'],
    },
  },
  blockExplorers: {
    default: { name: 'FlowDiver', url: 'https://testnet.flowdiver.io' },
  },
  testnet: true,
});

// Define Near testnet (for EVM compatibility layer if available)
export const nearTestnet = defineChain({
  id: 1313161555, // Near Aurora Testnet
  name: 'Near Aurora Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.aurora.dev'],
    },
  },
  blockExplorers: {
    default: { name: 'Aurora Explorer', url: 'https://explorer.testnet.aurora.dev' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'TrendPup',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID  
  chains: [flowTestnet, nearTestnet],
  ssr: true,
});
