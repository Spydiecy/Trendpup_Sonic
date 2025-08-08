import { Tool } from "../../shared/types/tool";
import { SwapParams } from "@okx-dex/okx-dex-sdk";
import { z } from "zod";
import { get_swap_data } from "../hooks";



export const getSwapDataToolParams = {
  chainId: z.string(),
  chainIndex: z.string().optional(),
  fromTokenAddress: z.string(),
  toTokenAddress: z.string(),
  amount: z.string(),
  userWalletAddress: z.string().optional(),
  privateKey: z.string().optional(),
  dexIds: z.string().optional(),
  directRoute: z.boolean().optional(),
  priceImpactProtectionPercentage: z.string().optional(),
  feePercent: z.string().optional(),
  slippage: z.string().optional(),
  autoSlippage: z.boolean().optional(),
  maxAutoSlippage: z.string().optional(),
  swapReceiverAddress: z.string().optional(),
  fromTokenReferrerWalletAddress: z.string().optional(),
  toTokenReferrerWalletAddress: z.string().optional(),
  positiveSlippagePercent: z.string().optional(),
  gasLimit: z.string().optional(),
  gasLevel: z.string().optional(),
  computeUnitPrice: z.string().optional(),
  callDataMemo: z.string().optional(),
};



export const getSwapDataToolZodParams = z.object({
  ...getSwapDataToolParams,
});



export type GetSwapDataToolParamsType = z.infer<
  typeof getSwapDataToolZodParams
>;



export const getSwapDataTool: Tool<
  typeof getSwapDataToolParams,
  GetSwapDataToolParamsType,
  string
> = {
  name: "OKX_DEX_GET_SWAP_DATA",
  description:
    "Obtain transaction instruction data for redemption or custom assembly in Solana.",
  parameters: {
    ...getSwapDataToolParams,
  },
  callback: async (params: GetSwapDataToolParamsType): Promise<string> => {
    return get_swap_data(params as SwapParams & { privateKey?: string });
  },
};