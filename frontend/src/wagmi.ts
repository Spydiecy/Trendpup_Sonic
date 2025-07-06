import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains'; // Temporarily using mainnet as placeholder

// Temporarily disabled for Flow/Near migration
// Will be updated with Flow and Near chain configurations
export const config = getDefaultConfig({
  appName: 'TrendPup',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID  
  chains: [mainnet], // Placeholder - will be updated with Flow/Near chains
  ssr: true,
});

// Export chains (will be updated for Flow/Near)
export { mainnet };
