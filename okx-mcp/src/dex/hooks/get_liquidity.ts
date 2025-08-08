import { createOKXClient } from "../../shared/common/okxClient";
import { BaseWallet } from "../../shared/common/wallet";
import { getRpcEndpoint } from "../../shared/constants";
import { APIResponse, OKXDexClient, QuoteData } from "@okx-dex/okx-dex-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";



export async function get_liquidity(chainId: string, privateKey?: string): Promise<string> {
  try {
    const rpcEndpoint = getRpcEndpoint(chainId);
    const connection = new Connection(rpcEndpoint);
    const walletPrivateKey = privateKey;
    if (!walletPrivateKey) {
      throw new Error("Private key is required");
    }
    const keypair = Keypair.fromSecretKey(bs58.decode(walletPrivateKey));
    const baseWallet = new BaseWallet(keypair, connection);
    const client: OKXDexClient = createOKXClient(baseWallet);
    const liquidity: APIResponse<QuoteData> = await client.dex.getLiquidity(
      chainId
    );
    return JSON.stringify({
      status: "success",
      data: liquidity,
      message: "OKX_DEX_GET_LIQUIDITY_SUCCEEDED",
    });
  } catch (error: any) {
    return JSON.stringify({
      status: "error",
      error,
      message: "OKX_DEX_GET_LIQUIDITY_ERROR",
    });
  }
}