import { CrossChainQuoteParams } from "@okx-dex/okx-dex-sdk";
import { createOKXClient } from "../../shared/common/okxClient";
import { BaseWallet } from "../../shared/common/wallet";
import { getRpcEndpoint } from "../../shared/constants";
import { OKXDexClient } from "@okx-dex/okx-dex-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";



export async function get_cross_chain_quote(params: CrossChainQuoteParams & { privateKey?: string }) {
  try {
    const rpcEndpoint = getRpcEndpoint(params.fromChainId);
    const connection = new Connection(rpcEndpoint);
    const privateKey = params.privateKey;
    if (!privateKey) {
      throw new Error("Private key is required");
    }
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    const baseWallet = new BaseWallet(keypair, connection);
    const client: OKXDexClient = createOKXClient(baseWallet);
    const { privateKey: _, ...quoteParams } = params;
    const quote = await client.bridge.getCrossChainQuote(quoteParams);
    return JSON.stringify({
      status: "success",
      data: quote,
      message: "OKX_BRIDGE_GET_CROSS_CHAIN_QUOTE_SUCCEEDED",
    });
  } catch (error) {
    return JSON.stringify({
      status: "error",
      error,
      message: "OKX_BRIDGE_GET_CROSS_CHAIN_QUOTE_ERROR",
    });
  }
}