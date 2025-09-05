import { createPublicClient, createWalletClient, http, type PublicClient, type WalletClient, type Hex, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getChain, getRpcUrl } from '../chains.js';
const clientCache = new Map<string, PublicClient>();



export function getPublicClient(network = "testnet"): PublicClient {
  const cacheKey = String(network);
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }
  const chain = getChain(network);
  const rpcUrl = getRpcUrl(network);
  const client = createPublicClient({
    chain,
    transport: http(rpcUrl)
  });
  clientCache.set(cacheKey, client);
  return client;
}



export function getWalletClient(privateKey: Hex, network = "testnet"): WalletClient {
  const chain = getChain(network);
  const rpcUrl = getRpcUrl(network);
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl)
  });
}



/**
 * @param privateKey
 * @returns
 */



export function getAddressFromPrivateKey(privateKey: Hex): Address {
  const account = privateKeyToAccount(privateKey);
  return account.address;
} 