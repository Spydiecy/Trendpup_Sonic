import { createOKXClient } from "../../shared/common/okxClient";
import { BaseWallet } from "../../shared/common/wallet";
import { getRpcEndpoint } from "../../shared/constants";
import { OKXDexClient } from "@okx-dex/okx-dex-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";



export async function get_bridge_token_pairs(fromChainId: string, privateKey?: string) {
  try {
    const rpcEndpoint = getRpcEndpoint(fromChainId);
    const connection = new Connection(rpcEndpoint);
    const walletPrivateKey = privateKey;
    if (!walletPrivateKey) {
      throw new Error("Private key is required");
    }
    const keypair = Keypair.fromSecretKey(bs58.decode(walletPrivateKey));
    const baseWallet = new BaseWallet(keypair, connection);
    const client: OKXDexClient = createOKXClient(baseWallet);
    const pairs = await client.bridge.getBridgeTokenPairs(fromChainId);
    return JSON.stringify({
      status: "success",
      data: pairs,
      message: "OKX_BRIDGE_GET_BRIDGE_TOKEN_PAIRS_SUCCEEDED",
    });
  } catch (error) {
    return JSON.stringify({
      status: "error",
      error,
      message: "OKX_BRIDGE_GET_BRIDGE_TOKEN_PAIRS_ERROR",
    });
  }
}
