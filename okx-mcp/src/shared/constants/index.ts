export const OKX_DEX_SERVER = "OKX_DEX_SERVER";
export const OKX_BRIDGE_SERVER = "OKX_BRIDGE_SERVER";



export const RPC_ENDPOINTS = {
  ethereum: "https://eth.llamarpc.com",
  solana: "https://api.mainnet-beta.solana.com",
  "1": "https://eth.llamarpc.com",
  "501": "https://api.mainnet-beta.solana.com",
} as const;



export function getRpcEndpoint(chainId: string): string {
  const endpoint = RPC_ENDPOINTS[chainId as keyof typeof RPC_ENDPOINTS];
  if (!endpoint) {
    if (chainId === "1") {
      return RPC_ENDPOINTS.ethereum;
    } else if (chainId === "501") {
      return RPC_ENDPOINTS.solana;
    }
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return endpoint;
}