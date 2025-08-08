import { ENV } from "../../shared/env";
import { APIResponse, ChainData, OKXDexClient } from "@okx-dex/okx-dex-sdk";



export async function get_chain_data(chainId: string, privateKey?: string): Promise<string> {
  try {
    const client: OKXDexClient = new OKXDexClient({
      apiKey: ENV.OKX_API_KEY,
      secretKey: ENV.OKX_API_SECRET,
      apiPassphrase: ENV.OKX_PASSPHRASE,
      projectId: ENV.OKX_PROJECT_ID,
    });
    const chain_data: APIResponse<ChainData> = await client.dex.getChainData(
      chainId
    );
    return JSON.stringify({
      status: "success",
      data: chain_data,
      message: "OKX_DEX_GET_CHAIN_DATA_SUCCEEDED",
    });
  } catch (error: any) {
    return JSON.stringify({
      status: "error",
      error: error.message || error,
      message: "OKX_DEX_GET_CHAIN_DATA_ERROR",
    });
  }
}