import { formatUnits, parseUnits, parseEther, Address, Hex } from 'viem';
import { getPublicClient, getWalletClient } from './clients.js';
import { getChain } from '../chains.js';
import { SONIC_TESTNET_CONFIG, getTokenAddress, isNativeToken, getAvailableRouters } from '../config/sonic-config.js';

// Standard Uniswap V2 Router ABI (commonly used across DEXs)
const uniswapV2RouterAbi = [
  {
    inputs: [
      { type: 'uint256', name: 'amountIn' },
      { type: 'uint256', name: 'amountOutMin' },
      { type: 'address[]', name: 'path' },
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'deadline' }
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ type: 'uint256[]', name: 'amounts' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { type: 'uint256', name: 'amountOutMin' },
      { type: 'address[]', name: 'path' },
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'deadline' }
    ],
    name: 'swapExactETHForTokens',
    outputs: [{ type: 'uint256[]', name: 'amounts' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { type: 'uint256', name: 'amountIn' },
      { type: 'uint256', name: 'amountOutMin' },
      { type: 'address[]', name: 'path' },
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'deadline' }
    ],
    name: 'swapExactTokensForETH',
    outputs: [{ type: 'uint256[]', name: 'amounts' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { type: 'uint256', name: 'amountIn' },
      { type: 'address[]', name: 'path' }
    ],
    name: 'getAmountsOut',
    outputs: [{ type: 'uint256[]', name: 'amounts' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'WETH',
    outputs: [{ type: 'address', name: '' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Popular DEX router addresses (using Sonic testnet configuration)
const DEX_ROUTERS = {
  uniswap: SONIC_TESTNET_CONFIG.DEX_ROUTERS.UNISWAP_V2 as Address,
  sushiswap: SONIC_TESTNET_CONFIG.DEX_ROUTERS.SUSHISWAP as Address,
  // Add more Sonic-specific DEXs here when available
};

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  amountOutMin: string;
  path: Address[];
  priceImpact: string;
  dex: string;
}

export interface SwapParams {
  privateKey: Hex;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  slippageTolerance: number; // in percentage (e.g., 0.5 for 0.5%)
  deadline?: number; // in minutes from now
  dexRouter?: Address;
  network?: string;
}

/**
 * Get a quote for swapping tokens
 */
export async function getSwapQuote(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: string,
  dexRouter: Address = DEX_ROUTERS.uniswap,
  network: string = 'testnet'
): Promise<SwapQuote> {
  const publicClient = getPublicClient(network);
  
  // Get WETH address
  const wethAddress = await publicClient.readContract({
    address: dexRouter,
    abi: uniswapV2RouterAbi,
    functionName: 'WETH'
  });

  // Build path (direct or through WETH)
  let path: Address[];
  if (tokenIn === wethAddress || tokenOut === wethAddress) {
    path = [tokenIn, tokenOut];
  } else {
    path = [tokenIn, wethAddress, tokenOut];
  }

  // Get amounts out
  const amountInWei = parseUnits(amountIn, 18); // Assuming 18 decimals
  const amounts = await publicClient.readContract({
    address: dexRouter,
    abi: uniswapV2RouterAbi,
    functionName: 'getAmountsOut',
    args: [amountInWei, path]
  });

  const amountOut = amounts[amounts.length - 1];
  const amountOutFormatted = formatUnits(amountOut, 18);

  // Calculate price impact (simplified)
  const priceImpact = "0.1"; // You'd calculate this properly in production

  return {
    amountIn,
    amountOut: amountOutFormatted,
    amountOutMin: amountOutFormatted, // Will be adjusted for slippage
    path,
    priceImpact,
    dex: 'uniswap'
  };
}

/**
 * Execute a token swap
 */
export async function executeSwap({
  privateKey,
  tokenIn,
  tokenOut,
  amountIn,
  slippageTolerance,
  deadline = 20,
  dexRouter = DEX_ROUTERS.uniswap,
  network = 'testnet'
}: SwapParams): Promise<{
  success: boolean;
  txHash?: Hex;
  error?: string;
  quote?: SwapQuote;
}> {
  try {
    const walletClient = getWalletClient(privateKey, network);
    const publicClient = getPublicClient(network);
    const chain = getChain(network);
    
    if (!walletClient.account) {
      throw new Error('Wallet client account not available');
    }
    
    // Get quote first
    const quote = await getSwapQuote(tokenIn, tokenOut, amountIn, dexRouter, network);
    
    // Calculate minimum amount out with slippage
    const amountOutMin = parseUnits(quote.amountOut, 18) * BigInt(100 - Math.floor(slippageTolerance * 100)) / BigInt(100);
    
    // Calculate deadline (current time + deadline in minutes)
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
    
    const amountInWei = parseUnits(amountIn, 18);
    
    // Get WETH address to determine if this is a native token swap
    const wethAddress = await publicClient.readContract({
      address: dexRouter,
      abi: uniswapV2RouterAbi,
      functionName: 'WETH'
    });

    let txHash: Hex;

    if (tokenIn === wethAddress) {
      // ETH/S to Token swap
      txHash = await walletClient.writeContract({
        address: dexRouter,
        abi: uniswapV2RouterAbi,
        functionName: 'swapExactETHForTokens',
        args: [amountOutMin, quote.path, walletClient.account.address, BigInt(deadlineTimestamp)],
        value: amountInWei,
        chain,
        account: walletClient.account
      });
    } else if (tokenOut === wethAddress) {
      // Token to ETH/S swap
      txHash = await walletClient.writeContract({
        address: dexRouter,
        abi: uniswapV2RouterAbi,
        functionName: 'swapExactTokensForETH',
        args: [amountInWei, amountOutMin, quote.path, walletClient.account.address, BigInt(deadlineTimestamp)],
        chain,
        account: walletClient.account
      });
    } else {
      // Token to Token swap
      txHash = await walletClient.writeContract({
        address: dexRouter,
        abi: uniswapV2RouterAbi,
        functionName: 'swapExactTokensForTokens',
        args: [amountInWei, amountOutMin, quote.path, walletClient.account.address, BigInt(deadlineTimestamp)],
        chain,
        account: walletClient.account
      });
    }

    return {
      success: true,
      txHash,
      quote
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get the best quote across multiple DEXs
 */
export async function getBestSwapQuote(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: string,
  network: string = 'testnet'
): Promise<SwapQuote & { dex: string }> {
  const quotes = await Promise.allSettled([
    getSwapQuote(tokenIn, tokenOut, amountIn, DEX_ROUTERS.uniswap, network).then(q => ({ ...q, dex: 'uniswap' })),
    getSwapQuote(tokenIn, tokenOut, amountIn, DEX_ROUTERS.sushiswap, network).then(q => ({ ...q, dex: 'sushiswap' })),
    // Add more DEX quotes here
  ]);

  const successfulQuotes = quotes
    .filter((result): result is PromiseFulfilledResult<SwapQuote & { dex: string }> => result.status === 'fulfilled')
    .map(result => result.value);

  if (successfulQuotes.length === 0) {
    throw new Error('No DEX quotes available');
  }

  // Return the quote with the highest amount out
  return successfulQuotes.reduce((best, current) => 
    parseFloat(current.amountOut) > parseFloat(best.amountOut) ? current : best
  );
}

// Test token swap - simple function to verify basic functionality
export async function testTokenSwap(): Promise<{ success: boolean; message: string; config?: any }> {
  try {
    // Return configuration info for testing
    const config = {
      routers: getAvailableRouters(),
      testTokens: SONIC_TESTNET_CONFIG.TEST_TOKENS,
      commonPairs: SONIC_TESTNET_CONFIG.COMMON_PAIRS,
      network: 'Sonic Testnet (Chain ID: 14601)',
    };

    // Test basic address validation
    const testAddresses = {
      sToken: getTokenAddress('S'),
      usdcToken: getTokenAddress('USDC'),
      isNativeS: isNativeToken(SONIC_TESTNET_CONFIG.TEST_TOKENS.S),
    };

    return {
      success: true,
      message: `Swap service configured for Sonic testnet. Ready for testing with ${Object.keys(SONIC_TESTNET_CONFIG.DEX_ROUTERS).length} DEX routers.`,
      config: { ...config, testAddresses },
    };
  } catch (error) {
    return {
      success: false,
      message: `Configuration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
