import { Tool } from "../../shared/types/tool";
import { z } from "zod";
import { get_wallet_balance } from "../hooks";



export const getWalletBalanceToolParams = {
  walletAddress: z.string(),
  chainId: z.string(),
  tokenAddress: z.string().optional(),
};



export const getWalletBalanceToolZodParams = z.object({
  ...getWalletBalanceToolParams,
});



export type GetWalletBalanceToolParamType = z.infer<typeof getWalletBalanceToolZodParams>;



export const getWalletBalanceTool: Tool<
  typeof getWalletBalanceToolParams,
  GetWalletBalanceToolParamType,
  string
> = {
  name: "OKX_DEX_GET_WALLET_BALANCE",
  description: "Get wallet balance for native tokens (SOL/ETH) or specific token balances on Solana and Ethereum chains",
  parameters: {
    ...getWalletBalanceToolParams,
  },
  callback: async (params: GetWalletBalanceToolParamType): Promise<string> => {
    return get_wallet_balance(params.walletAddress, params.chainId, params.tokenAddress);
  },
};