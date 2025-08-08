import { Tool } from "../../shared/types/tool";
import { CrossChainQuoteParams } from "@okx-dex/okx-dex-sdk";
import { z } from "zod";
import { get_cross_chain_quote } from "../hooks";



export const getCrossChainQuoteToolParams = {
  fromChainIndex: z.string(),
  toChainIndex: z.string(),
  fromChainId: z.string(),
  toChainId: z.string(),
  fromTokenAddress: z.string(),
  toTokenAddress: z.string(),
  amount: z.string(),
  slippage: z.string(),
  privateKey: z.string().optional(),
  sort: z.string().optional(),
  dexIds: z.string().optional(),
  allowBridge: z.string().optional(),
  denyBridge: z.string().optional(),
  priceImpactProtectionPercentage: z.string().optional(),
};



export const getCrossChainQuoteToolZodParams = z.object({
  ...getCrossChainQuoteToolParams,
});



export type GetCrossChainQuoteToolParamType = z.infer<
  typeof getCrossChainQuoteToolZodParams
>;



export const getCrossChainQuoteTool: Tool<
  typeof getCrossChainQuoteToolParams,
  GetCrossChainQuoteToolParamType,
  string
> = {
  name: "OKX_BRIDGE_GET_CROSS_CHAIN_QUOTE",
  description: "",
  parameters: {
    ...getCrossChainQuoteToolParams,
  },
  callback: async (params: GetCrossChainQuoteToolParamType) => {
    return get_cross_chain_quote({
      fromChainIndex: params.fromChainIndex,
      toChainIndex: params.toChainIndex,
      fromChainId: params.fromChainId,
      toChainId: params.toChainId,
      fromTokenAddress: params.fromTokenAddress,
      toTokenAddress: params.toTokenAddress,
      amount: params.amount,
      slippage: params.slippage,
      privateKey: params.privateKey,
      sort: params.sort,
      dexIds: params.dexIds,
      allowBridge: params.allowBridge,
      denyBridge: params.denyBridge,
      priceImpactProtectionPercentage: params.priceImpactProtectionPercentage,
    } as CrossChainQuoteParams & { privateKey?: string });
  },
};