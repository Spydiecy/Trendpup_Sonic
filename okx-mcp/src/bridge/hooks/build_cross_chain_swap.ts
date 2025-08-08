import { createOKXClient } from "../../shared/common/okxClient";
import { BaseWallet } from "../../shared/common/wallet";
import { CrossChainSwapParams, OKXDexClient } from "@okx-dex/okx-dex-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { getRpcEndpoint } from "../../shared/constants";



export async function build_cross_chain_swap(params: CrossChainSwapParams & { privateKey?: string }) {
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
    const { privateKey: _, ...swapParams } = params;
    const data = await client.bridge.buildCrossChainSwap(swapParams);
    return JSON.stringify({
      status: "success",
      data,
      message: "OKX_BRIDGE_BUILD_CROSS_CHAIN_SWAP_SUCCEEDED",
    });
  } catch (error) {
    return JSON.stringify({
      status: "error",
      error,
      message: "OKX_BRIDGE_BUILD_CROSS_CHAIN_SWAP_ERROR",
    });
  }
}