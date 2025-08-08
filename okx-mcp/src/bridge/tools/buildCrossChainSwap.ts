import { Tool } from "../../shared/types/tool";
import { CrossChainSwapParams } from "@okx-dex/okx-dex-sdk";
import { z } from "zod";
import { build_cross_chain_swap } from "../hooks";



export const buildCrossChainSwapToolParams = {
  fromChainIndex: z.string(),
  toChainIndex: z.string(),
  fromChainId: z.string(),
  toChainId: z.string(),
  fromTokenAddress: z.string(),
  toTokenAddress: z.string(),
  amount: z.string(),
  slippage: z.string(),
  userWalletAddress: z.string(),
  privateKey: z.string().optional(),
  sort: z.string().optional(),
  dexIds: z.string().optional(),
  allowBridge: z.string().optional(),
  denyBridge: z.string().optional(),
  priceImpactProtectionPercentage: z.string().optional(),
  receiveAddress: z.string().optional(),
  referrerAddress: z.string().optional(),
  feePercent: z.string().optional(),
  onlyBridge: z.string().optional(),
  memo: z.string().optional(),
};



export const buildCrossChainSwapToolZodParams = z.object({
  ...buildCrossChainSwapToolParams,
});



export type BuildCrossChainSwapToolParamType = z.infer<
  typeof buildCrossChainSwapToolZodParams
>;



export const buildCrossChainSwapTool: Tool<
  typeof buildCrossChainSwapToolParams,
  BuildCrossChainSwapToolParamType,
  string
> = {
  name: "OKX_BRIDGE_BUILD_CROSS_CHAIN_SWAP",
  description: "Generate the data to execute a cross-chain swap.",
  parameters: {
    ...buildCrossChainSwapToolParams,
  },
  callback: async (params: BuildCrossChainSwapToolParamType) => {
    return build_cross_chain_swap(params as CrossChainSwapParams);
  },
};