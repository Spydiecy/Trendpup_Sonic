import { Tool } from "../../shared/types/tool";
import { z } from "zod";
import { get_chain_data } from "../hooks";



export const getChainDataToolParams = {
  chainId: z.string(),
  privateKey: z.string().optional(),
};



export const getChainDataToolZodParams = z.object({
  ...getChainDataToolParams,
});



export type GetChainDataToolParamType = z.infer<
  typeof getChainDataToolZodParams
>;



export const getChainDataTool: Tool<
  typeof getChainDataToolParams,
  GetChainDataToolParamType,
  string
> = {
  name: "OKX_DEX_GET_CHAIN_DATA",
  description:
    "Retrieve information on chains supported for single-chain exchanges.",
  parameters: {
    ...getChainDataToolParams,
  },
  callback: async (params: GetChainDataToolParamType): Promise<string> => {
    return get_chain_data(params.chainId, params.privateKey);
  },
};