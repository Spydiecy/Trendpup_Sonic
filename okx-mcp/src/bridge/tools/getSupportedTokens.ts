import { Tool } from "../../shared/types/tool";
import { z } from "zod";
import { get_supported_tokens } from "../hooks";



export const getSupportedTokensToolParams = {
  chainId: z.string(),
  privateKey: z.string().optional(),
};



export const getSupportedTokensToolZodParams = z.object({
  ...getSupportedTokensToolParams,
});



export type GetSupportedTokensToolParamType = z.infer<
  typeof getSupportedTokensToolZodParams
>;



export const getSupportedTokensTool: Tool<
  typeof getSupportedTokensToolParams,
  GetSupportedTokensToolParamType,
  string
> = {
  name: "OKX_BRIDGE_GET_SUPPORTED_TOKENS",
  description:
    "List of tokens available for trading directly across the cross-chain bridge.",
  parameters: {
    ...getSupportedTokensToolParams,
  },
  callback: async (params: GetSupportedTokensToolParamType) => {
    return get_supported_tokens(params.chainId, params.privateKey);
  },
};