import { Tool } from "../../shared/types/tool";
import { SwapParams } from "@okx-dex/okx-dex-sdk";
import { z } from "zod";
import { execute_swap } from "../hooks";



export const executeSwapToolParams = {
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



export const executeSwapToolZodParams = z.object({
  ...executeSwapToolParams,
});



export type ExecuteSwapToolParamType = z.infer<typeof executeSwapToolZodParams>;



export const executeSwapTool: Tool<
  typeof executeSwapToolParams,
  ExecuteSwapToolParamType,
  string
> = {
  name: "OKX_DEX_EXECUTE_SWAP",
  description:
    "Generate the data to call the OKX DEX router to execute a swap.",
  parameters: {
    ...executeSwapToolParams,
  },
  callback: async (params: ExecuteSwapToolParamType): Promise<string> => {
    return execute_swap(params as SwapParams);
  },
};