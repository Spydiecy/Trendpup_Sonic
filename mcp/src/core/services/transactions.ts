import { type Address, type Hash, type TransactionReceipt, type EstimateGasParameters } from 'viem';
import { getPublicClient } from './clients.js';



export async function getTransaction(hash: Hash, network = "testnet") {
  const client = getPublicClient(network);
  return await client.getTransaction({ hash });
}



export async function getTransactionReceipt(hash: Hash, network = "testnet"): Promise<TransactionReceipt> {
  const client = getPublicClient(network);
  return await client.getTransactionReceipt({ hash });
}



export async function getTransactionCount(address: Address, network = "testnet"): Promise<number> {
  const client = getPublicClient(network);
  const count = await client.getTransactionCount({ address });
  return Number(count);
}



export async function estimateGas(params: EstimateGasParameters, network = "testnet"): Promise<bigint> {
  const client = getPublicClient(network);
  return await client.estimateGas(params);
}



export async function getChainId(network = "testnet"): Promise<number> {
  const client = getPublicClient(network);
  const chainId = await client.getChainId();
  return Number(chainId);
} 