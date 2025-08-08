import { Tool } from "../../shared/types/tool";
import { z } from "zod";
import { get_liquidity } from "../hooks";



export const getLiquidityToolParams = {
  chainId: z.string(),
  privateKey: z.string().optional(),
};



export const getLiquidityToolZodParams = z.object({
  ...getLiquidityToolParams,
});



export type GetLiquidityToolParamType = z.infer<
  typeof getLiquidityToolZodParams
>;



export const getLiquidityTool: Tool<
  typeof getLiquidityToolParams,
  GetLiquidityToolParamType,
  string
> = {
  name: "OKX_DEX_GET_LIQUIDITY",
  description:
    "Get a list of liquidity that are available for swap in the OKX aggregation protocol.",
  parameters: {
    ...getLiquidityToolParams,
  },
  callback: async (params: GetLiquidityToolParamType): Promise<string> => {
    return get_liquidity(params.chainId, params.privateKey);
  },
};