// Sonic testnet configuration for swap testing
export const SONIC_TESTNET_CONFIG = {
  // Common Uniswap V2 router addresses (these may need to be updated for actual Sonic testnet)
  DEX_ROUTERS: {
    // Placeholder addresses - these would need to be actual deployed router contracts on Sonic testnet
    UNISWAP_V2: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Standard Uniswap V2 router
    SUSHISWAP: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    // Add more DEX routers as they become available on Sonic testnet
  },
  
  // Test tokens for Sonic testnet
  TEST_TOKENS: {
    // Native token
    S: '0x0000000000000000000000000000000000000000', // Native S token
    
    // Mock ERC20 tokens for testing (these would need to be actual deployed tokens)
    USDC: '0xa0b86a33e6b3c4de4f6fe12e3c8d1d1c3b9d2e8f', // Mock USDC
    USDT: '0xb1c86b33e6b3c4de4f6fe12e3c8d1d1c3b9d2e8f', // Mock USDT
    WETH: '0xc2d96c33e6b3c4de4f6fe12e3c8d1d1c3b9d2e8f', // Mock WETH
  },
  
  // Factory addresses for different DEXs
  FACTORIES: {
    UNISWAP_V2: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  },
  
  // Common token pairs for testing
  COMMON_PAIRS: [
    { tokenA: 'S', tokenB: 'USDC' },
    { tokenA: 'S', tokenB: 'USDT' },
    { tokenA: 'S', tokenB: 'WETH' },
    { tokenA: 'USDC', tokenB: 'USDT' },
  ],
};

// Helper function to get token address
export function getTokenAddress(symbol: string): string {
  return SONIC_TESTNET_CONFIG.TEST_TOKENS[symbol as keyof typeof SONIC_TESTNET_CONFIG.TEST_TOKENS] || symbol;
}

// Helper function to check if address is native token
export function isNativeToken(address: string): boolean {
  return address === SONIC_TESTNET_CONFIG.TEST_TOKENS.S || address.toLowerCase() === '0x0000000000000000000000000000000000000000';
}

// Get available DEX routers
export function getAvailableRouters() {
  return Object.entries(SONIC_TESTNET_CONFIG.DEX_ROUTERS);
}
