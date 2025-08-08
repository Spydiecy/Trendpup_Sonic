import { Tool } from "../../shared/types/tool";
import { z } from "zod";
import { get_bridge_token_pairs } from "../hooks";



export const getBridgeTokenPairsToolParams = {
  fromChainId: z.string(),
  privateKey: z.string().optional(),
};



export const getBridgeTokenPairsToolZodParams = z.object({
  ...getBridgeTokenPairsToolParams,
});



export type GetBridgeTokenPairsToolParamType = z.infer<
  typeof getBridgeTokenPairsToolZodParams
>;



export const getBridgeTokenPairsTool: Tool<
  typeof getBridgeTokenPairsToolParams,
  GetBridgeTokenPairsToolParamType,
  string
> = {
  name: "OKX_BRIDGE_GET_BRIDGE_TOKEN_PAIRS",
  description:
    "List of tokens pairs available for trading directly across the cross-chain bridge.",
  parameters: {
    ...getBridgeTokenPairsToolParams,
  },
  callback: async (params: GetBridgeTokenPairsToolParamType) => {
    return get_bridge_token_pairs(params.fromChainId, params.privateKey);
  },
};