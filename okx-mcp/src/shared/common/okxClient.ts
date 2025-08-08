import { OKXDexClient } from "@okx-dex/okx-dex-sdk";
import { ENV } from "../env";
import { BaseWallet } from "./wallet";



export const createOKXClient = (baseWallet: BaseWallet) => {
  const client: OKXDexClient = new OKXDexClient({
    apiKey: ENV.OKX_API_KEY,
    secretKey: ENV.OKX_API_SECRET,
    apiPassphrase: ENV.OKX_PASSPHRASE,
    projectId: ENV.OKX_PROJECT_ID,
    solana: {
      wallet: {
        publicKey: baseWallet.publicKey,
        connection: baseWallet.connection,
        signTransaction: baseWallet.signTransaction,
        signAllTransactions: baseWallet.signAllTransactions,
        signAndSendTransaction: baseWallet.signAndSendTransaction,
        signMessage: baseWallet.signMessage,
      },
    },
  });
  return client;
};