import { createOKXClient } from "../../shared/common/okxClient";
import { BaseWallet } from "../../shared/common/wallet";
import { getRpcEndpoint } from "../../shared/constants";
import { APIResponse, OKXDexClient, QuoteData, QuoteParams } from "@okx-dex/okx-dex-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";



export async function get_quote(params: QuoteParams & { privateKey?: string }): Promise<string> {
  try {
    const rpcEndpoint = getRpcEndpoint(params.chainId);
    const connection = new Connection(rpcEndpoint);
    const privateKey = params.privateKey;
    if (!privateKey) {
      throw new Error("Private key is required");
    }
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    const baseWallet = new BaseWallet(keypair, connection);
    const client: OKXDexClient = createOKXClient(baseWallet);
    const { privateKey: _, ...quoteParams } = params;
    const quotes: APIResponse<QuoteData> = await client.dex.getQuote(quoteParams);
    return JSON.stringify({
      status: "success",
      data: quotes,
      message: "OKX_DEX_GET_SWAP_DATA_SUCCEEDED",
    });
  } catch (error: any) {
    return JSON.stringify({
      status: "error",
      error,
      message: "OKX_DEX_GET_SWAP_DATA_ERROR",
    });
  }
}