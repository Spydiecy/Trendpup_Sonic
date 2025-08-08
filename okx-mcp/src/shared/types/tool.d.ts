import { CrossChainQuoteParams ,QuoteParams, SwapParams } from "@okx-dex/okx-dex-sdk";



export type Tool<
  P = unknown,
  A =
    | unknown
    | string
    | { chainId: string }
    | { fromChainId: strign }
    | SwapParams
    | QuoteParams
    | CrossChainQuoteParams
    | CrossChainSwapParams,
  R = unknown | string
> = {
  name: string;
  description: string;
  parameters: P;
  callback: (input: A) => Promise<R>;
};