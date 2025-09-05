import { parseEther, parseUnits, type Address, type Hash, type Hex } from 'viem';
import { getPublicClient, getWalletClient } from './clients.js';
import { resolveAddress } from './utils.js';



const erc20TransferAbi = [
  {
    inputs: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'amount' }
    ],
    name: 'transfer',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { type: 'address', name: 'spender' },
      { type: 'uint256', name: 'amount' }
    ],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
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
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;



/**
 * @param privateKey
 * @param toAddressOrEns
 * @param amount
 * @param network
 * @returns
 */



export async function transferNative(
  privateKey: string | Hex,
  toAddressOrEns: string,
  amount: string,
  network = "testnet"
): Promise<Hash> {
  const toAddress = await resolveAddress(toAddressOrEns, network);
  const formattedKey = typeof privateKey === 'string' && !privateKey.startsWith('0x')
    ? `0x${privateKey}` as Hex
    : privateKey as Hex;
  const client = getWalletClient(formattedKey, network);
  const amountWei = parseEther(amount);
  if (!client.account) {
    throw new Error('Wallet client account not available');
  }
  return client.sendTransaction({
    to: toAddress,
    value: amountWei,
    account: client.account,
    chain: client.chain
  });
}



/**
 * @param tokenAddressOrEns
 * @param toAddressOrEns
 * @param amount
 * @param privateKey
 * @param network
 * @returns
 */



export async function transferERC20(
  tokenAddressOrEns: string,
  toAddressOrEns: string,
  amount: string,
  privateKey: string | `0x${string}`,
  network: string = 'blaze'
): Promise<{
  txHash: Hash;
  amount: {
    raw: bigint;
    formatted: string;
  };
  token: {
    symbol: string;
    decimals: number;
  };
}> {
  const tokenAddress = await resolveAddress(tokenAddressOrEns, network) as Address;
  const toAddress = await resolveAddress(toAddressOrEns, network) as Address;
  const formattedKey = typeof privateKey === 'string' && !privateKey.startsWith('0x')
    ? `0x${privateKey}` as `0x${string}`
    : privateKey as `0x${string}`;
  const publicClient = getPublicClient(network);
  const [decimals, symbol] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20TransferAbi,
      functionName: 'decimals'
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20TransferAbi,
      functionName: 'symbol'
    })
  ]);
  const rawAmount = parseUnits(amount, decimals);
  const walletClient = getWalletClient(formattedKey, network);
  if (!walletClient.account) {
    throw new Error('Wallet client account not available');
  }
  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20TransferAbi,
    functionName: 'transfer',
    args: [toAddress, rawAmount],
    account: walletClient.account,
    chain: walletClient.chain
  });
  return {
    txHash: hash,
    amount: {
      raw: rawAmount,
      formatted: amount
    },
    token: {
      symbol,
      decimals
    }
  };
}



/**
 * @param tokenAddressOrEns
 * @param spenderAddressOrEns
 * @param amount
 * @param privateKey
 * @param network
 * @returns
 */



export async function approveERC20(
  tokenAddressOrEns: string,
  spenderAddressOrEns: string,
  amount: string,
  privateKey: string | `0x${string}`,
  network: string = 'blaze'
): Promise<{
  txHash: Hash;
  amount: {
    raw: bigint;
    formatted: string;
  };
  token: {
    symbol: string;
    decimals: number;
  };
}> {
  const tokenAddress = await resolveAddress(tokenAddressOrEns, network) as Address;
  const spenderAddress = await resolveAddress(spenderAddressOrEns, network) as Address;
  const formattedKey = typeof privateKey === 'string' && !privateKey.startsWith('0x')
    ? `0x${privateKey}` as `0x${string}`
    : privateKey as `0x${string}`;
  const publicClient = getPublicClient(network);
  const [decimals, symbol] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20TransferAbi,
      functionName: 'decimals'
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20TransferAbi,
      functionName: 'symbol'
    })
  ]);
  const rawAmount = parseUnits(amount, decimals);
  const walletClient = getWalletClient(formattedKey, network);
  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20TransferAbi,
    functionName: 'approve',
    args: [spenderAddress, rawAmount],
    account: walletClient.account!,
    chain: walletClient.chain
  });
  return {
    txHash: hash,
    amount: {
      raw: rawAmount,
      formatted: amount
    },
    token: {
      symbol,
      decimals
    }
  };
}