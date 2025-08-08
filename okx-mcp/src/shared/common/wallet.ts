import { Keypair, PublicKey, Transaction, VersionedTransaction, SendOptions, TransactionSignature, Connection } from "@solana/web3.js";



export interface IBaseWallet {
  readonly publicKey: PublicKey;
  readonly connection: Connection;
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]>;
  signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions
  ): Promise<{
    signature: TransactionSignature;
  }>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
}



export class BaseWallet implements IBaseWallet {
  readonly publicKey: PublicKey;
  readonly connection: Connection;
  private readonly payer: Keypair;
  constructor(keypair: Keypair, connection: Connection) {
    this.payer = keypair;
    this.publicKey = keypair.publicKey;
    this.connection = connection;
  }



  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    if (transaction instanceof Transaction) {
      transaction.sign(this.payer);
    } else if (transaction instanceof VersionedTransaction) {
      transaction.sign([this.payer]);
    }
    return transaction;
  }



  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    return Promise.all(
      transactions.map((transaction) => this.signTransaction(transaction))
    );
  }



  async signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions
  ): Promise<{
    signature: TransactionSignature;
  }> {
    const signedTransaction = await this.signTransaction(transaction);
    let signature: TransactionSignature;
    if (signedTransaction instanceof Transaction) {
      signature = await this.connection.sendTransaction(signedTransaction, [this.payer], options);
    } else {
      signature = await this.connection.sendTransaction(signedTransaction, options);
    }
    return { signature };
  }



  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    return this.payer.secretKey.slice(0, 32);
  }
}
