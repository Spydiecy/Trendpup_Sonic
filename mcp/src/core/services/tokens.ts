import { type Address, formatUnits } from 'viem';
import { getPublicClient } from './clients.js';



const erc20Abi = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;



export async function getERC20TokenInfo(
  tokenAddress: Address,
  network: string = 'blaze'
): Promise<{
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  formattedTotalSupply: string;
}> {
  const publicClient = getPublicClient(network);
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'name'
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'symbol'
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals'
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'totalSupply'
    })
  ]);
  return {
    name,
    symbol,
    decimals,
    totalSupply,
    formattedTotalSupply: formatUnits(totalSupply, decimals)
  };
}