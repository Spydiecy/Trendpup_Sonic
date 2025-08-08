import { Tool } from "../../shared/types/tool";
import { z } from "zod";
import { get_tokens } from "../hooks";



export const getTokensToolParams = {
  chainId: z.string(),
  privateKey: z.string().optional(),
  searchTerm: z.string().optional(),
};



export const getTokensToolZodParams = z.object({
  ...getTokensToolParams,
});



export type GetTokensToolParamType = z.infer<typeof getTokensToolZodParams>;



export const getTokensTool: Tool<
  typeof getTokensToolParams,
  GetTokensToolParamType,
  string
> = {
  name: "OKX_DEX_GET_TOKENS",
  description: "Fetches a list of tokens, optionally filtered by search term (symbol, name, or contract address)",
  parameters: {
    ...getTokensToolParams,
  },
  callback: async (params: GetTokensToolParamType): Promise<string> => {
    return get_tokens(params.chainId, params.privateKey, params.searchTerm);
  },
};