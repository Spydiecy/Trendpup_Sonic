import { type Hash, type Block } from 'viem';
import { getPublicClient } from './clients.js';



export async function getBlockNumber(network = "testnet"): Promise<bigint> {
  const client = getPublicClient(network);
  return await client.getBlockNumber();
}



export async function getBlockByNumber(
  blockNumber: number, 
  network = "testnet"
): Promise<Block> {
  const client = getPublicClient(network);
  return await client.getBlock({ blockNumber: BigInt(blockNumber) });
}



export async function getBlockByHash(
  blockHash: Hash, 
  network = "testnet"
): Promise<Block> {
  const client = getPublicClient(network);
  return await client.getBlock({ blockHash });
}



export async function getLatestBlock(network = "testnet"): Promise<Block> {
  const client = getPublicClient(network);
  return await client.getBlock();
} 