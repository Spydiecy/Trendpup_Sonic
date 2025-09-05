import { type Chain } from 'viem';
import { sonic } from 'viem/chains';

// Custom Sonic Blaze Testnet definition with new chain ID and RPC
const sonicBlazeTestnet: Chain = {
  id: 14601,
  name: 'Sonic Blaze Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'S',
    symbol: 'S',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.soniclabs.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Sonic Explorer',
      url: 'https://explorer.soniclabs.com',
    },
  },
  testnet: true,
};

export const DEFAULT_RPC_URL = process.env.SONIC_RPC_URL || 'https://rpc.testnet.soniclabs.com';

export function getDefaultChainId(): number {
  return 14601; // Sonic Blaze Testnet - updated chain ID
}



export const DEFAULT_CHAIN_ID = getDefaultChainId();

export const chainMap: Record<number, Chain> = {
  146: sonic,
  14601: sonicBlazeTestnet,
};

function getNetworkNameMap(): Record<string, number> {
  return {
    'mainnet': 146,
    'testnet': 14601,
  };
}



export const rpcUrlMap: Record<number, string> = {
  146: process.env.SONIC_RPC_URL || 'https://rpc.soniclabs.com',
  14601: process.env.SONIC_RPC_URL || 'https://rpc.testnet.soniclabs.com',
};



/**
 * @param chainIdentifier
 * @returns
 * @throws
 */



export function resolveChainId(chainIdentifier: number | string): number {
  if (typeof chainIdentifier === 'number') {
    if (!(chainIdentifier in chainMap)) {
      throw new Error(`Unsupported chain ID. Supported chains: ${Object.keys(chainMap).join(', ')}. Requested: ${chainIdentifier}`);
    }
    return chainIdentifier;
  }
  const networkName = chainIdentifier.toLowerCase();
  const networkNameMap = getNetworkNameMap();
  if (networkName in networkNameMap) {
    return networkNameMap[networkName];
  }
  const parsedId = parseInt(networkName);
  if (!isNaN(parsedId)) {
    if (!(parsedId in chainMap)) {
      throw new Error(`Unsupported chain ID. Supported chains: ${Object.keys(chainMap).join(', ')}. Requested: ${parsedId}`);
    }
    return parsedId;
  }
  throw new Error(`Unsupported network. Supported networks: ${Object.keys(networkNameMap).join(', ')}. Requested: ${chainIdentifier}`);
}



/**
 * @param chainIdentifier
 * @returns
 * @throws
 */



export function getChain(chainIdentifier: number | string = DEFAULT_CHAIN_ID): Chain {
  const chainId = resolveChainId(chainIdentifier);
  return chainMap[chainId];
}



/**
 * @param chainIdentifier
 * @returns
 * @throws
 */



export function getRpcUrl(chainIdentifier: number | string = DEFAULT_CHAIN_ID): string {
  const chainId = resolveChainId(chainIdentifier);
  return process.env.SONIC_RPC_URL || rpcUrlMap[chainId];
}



/**
 * @returns
 */



export function getSupportedNetworks(): string[] {
  return Object.keys(getNetworkNameMap());
} 