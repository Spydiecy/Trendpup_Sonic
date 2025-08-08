import { ENV } from "../../shared/env";
import { APIResponse, OKXDexClient, QuoteData } from "@okx-dex/okx-dex-sdk";



export async function get_tokens(chainId: string, privateKey?: string, searchTerm?: string): Promise<string> {
  try {
    const client: OKXDexClient = new OKXDexClient({
      apiKey: ENV.OKX_API_KEY,
      secretKey: ENV.OKX_API_SECRET,
      apiPassphrase: ENV.OKX_PASSPHRASE,
      projectId: ENV.OKX_PROJECT_ID,
    });
    const tokens: APIResponse<QuoteData> = await client.dex.getTokens(chainId);
    let filteredData = tokens;
    if (searchTerm && tokens.data && Array.isArray(tokens.data)) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = {
        ...tokens,
        data: tokens.data.filter((token: any) => 
          token.tokenSymbol?.toLowerCase().includes(searchLower) ||
          token.tokenName?.toLowerCase().includes(searchLower) ||
          token.tokenContractAddress?.toLowerCase().includes(searchLower)
        )
      };
    }
    return JSON.stringify({
      status: "success",
      data: filteredData,
      searchTerm: searchTerm || null,
      message: "OKX_DEX_GET_TOKENS_SUCCEEDED",
    });
  } catch (error: any) {
    return JSON.stringify({
      status: "error",
      error: error.message || error,
      message: "OKX_DEX_GET_TOKENS_ERROR",
    });
  }
}