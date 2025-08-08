import { Tool } from "../../shared/types/tool";
import { QuoteParams } from "@okx-dex/okx-dex-sdk";
import { z } from "zod";
import { get_quote } from "../hooks";



export const getQuoteToolParams = {
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
  slippage: z.string(),
};



export const getQuoteToolZodParams = z.object({
  ...getQuoteToolParams,
});



export type GetQuoteToolParamType = z.infer<typeof getQuoteToolZodParams>;



export const getQuoteTool: Tool<
  typeof getQuoteToolParams,
  GetQuoteToolParamType,
  string
> = {
  name: "OKX_DEX_GET_QUOTE",
  description: "Get the best quote for a swap through OKX DEX.",
  parameters: {
    ...getQuoteToolParams,
  },
  callback: async (params: GetQuoteToolParamType): Promise<string> => {
    return get_quote(params as QuoteParams & { privateKey?: string });
  },
};