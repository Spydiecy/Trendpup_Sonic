import { parseEther, formatEther, type Address } from 'viem';



export async function resolveAddress(
  addressOrEns: string,
  network = "testnet"
): Promise<Address> {
  if (/^0x[a-fA-F0-9]{40}$/.test(addressOrEns)) {
    return addressOrEns as Address;
  }
  throw new Error(`Invalid address format: ${addressOrEns}. Sonic doesn't support ENS names.`);
}



export const utils = {
  parseEther,
  formatEther,
  formatBigInt: (value: bigint): string => value.toString(),
  formatJson: (obj: unknown): string => JSON.stringify(obj, (_, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2),
  formatNumber: (value: number | string): string => {
    return Number(value).toLocaleString();
  },
  hexToNumber: (hex: string): number => {
    return parseInt(hex, 16);
  },
  numberToHex: (num: number): string => {
    return '0x' + num.toString(16);
  }
}; 