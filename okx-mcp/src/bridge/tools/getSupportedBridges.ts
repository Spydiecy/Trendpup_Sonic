import { Tool } from "../../shared/types/tool";
import { z } from "zod";
import { get_supported_bridges } from "../hooks";



export const getSupportedBridgesToolParams = {
  chainId: z.string(),
  privateKey: z.string().optional(),
};



export const getSupportedBridgesToolZodParams = z.object({
  ...getSupportedBridgesToolParams,
});



export type GetSupportedBridgesToolParamType = z.infer<
  typeof getSupportedBridgesToolZodParams
>;



export const getSupportedBridgesTool: Tool<
  typeof getSupportedBridgesToolParams,
  GetSupportedBridgesToolParamType,
  string
> = {
  name: "OKX_BRIDGE_GET_SUPPORTED_BRIDGES",
  description:
    "Get information of the cross-chain bridges supported by OKX’s DEX cross-chain aggregator protocol.",
  parameters: {
    ...getSupportedBridgesToolParams,
  },
  callback: async (params: GetSupportedBridgesToolParamType) => {
    return get_supported_bridges(params.chainId, params.privateKey);
  },
};