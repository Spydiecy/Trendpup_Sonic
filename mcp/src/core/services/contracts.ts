import { type Hash, type Hex, type ReadContractParameters, type GetLogsParameters, type Log } from 'viem';
import { getPublicClient, getWalletClient } from './clients.js';
import { resolveAddress } from './utils.js';



export async function readContract(params: ReadContractParameters, network = "testnet") {
  const client = getPublicClient(network);
  return await client.readContract(params);
}



export async function writeContract(
  privateKey: Hex, 
  params: Record<string, any>, 
  network = "testnet"
): Promise<Hash> {
  const client = getWalletClient(privateKey, network);
  return await client.writeContract(params as any);
}



export async function getLogs(params: GetLogsParameters, network = "testnet"): Promise<Log[]> {
  const client = getPublicClient(network);
  return await client.getLogs(params);
}



/**
 * @param addressOrEns
 * @param network
 * @returns
 */



export async function isContract(addressOrEns: string, network = "testnet"): Promise<boolean> {
  const address = await resolveAddress(addressOrEns, network);
  const client = getPublicClient(network);
  const code = await client.getBytecode({ address });
  return code !== undefined && code !== '0x';
} 