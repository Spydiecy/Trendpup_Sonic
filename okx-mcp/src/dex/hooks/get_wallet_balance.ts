import { ENV } from "../../shared/env";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { ethers } from "ethers";



export async function get_wallet_balance(
  walletAddress: string, 
  chainId: string, 
  tokenAddress?: string
): Promise<string> {
  try {
    if (chainId === "501") {
      return await getSolanaBalance(walletAddress, tokenAddress);
    } else if (chainId === "1") {
      return await getEthereumBalance(walletAddress, tokenAddress);
    } else {
      return JSON.stringify({
        status: "error",
        error: `Unsupported chain ID: ${chainId}. Supported chains: 501 (Solana), 1 (Ethereum)`,
        message: "GET_WALLET_BALANCE_UNSUPPORTED_CHAIN",
      });
    }
  } catch (error: any) {
    return JSON.stringify({
      status: "error",
      error: error.message || error,
      message: "GET_WALLET_BALANCE_ERROR",
    });
  }
}



async function getSolanaBalance(walletAddress: string, tokenAddress?: string): Promise<string> {
  try {
    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const publicKey = new PublicKey(walletAddress);
    if (!tokenAddress) {
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / 1e9;
      return JSON.stringify({
        status: "success",
        data: {
          wallet_address: walletAddress,
          chain_id: "501",
          chain_name: "Solana",
          native_balance: {
            token_symbol: "SOL",
            balance: solBalance.toString(),
            balance_raw: balance.toString(),
            decimals: 9
          }
        },
        message: "GET_SOLANA_BALANCE_SUCCEEDED",
      });
    } else {
      const { getAssociatedTokenAddress, getAccount } = await import("@solana/spl-token");
      try {
        const tokenMint = new PublicKey(tokenAddress);
        const associatedTokenAddress = await getAssociatedTokenAddress(tokenMint, publicKey);
        const tokenAccount = await getAccount(connection, associatedTokenAddress);
        const tokenInfo = await connection.getParsedAccountInfo(tokenMint);
        let decimals = 9;
        let symbol = "UNKNOWN";
        if (tokenInfo.value?.data && 'parsed' in tokenInfo.value.data) {
          decimals = tokenInfo.value.data.parsed.info.decimals;
        }
        const balance = Number(tokenAccount.amount) / Math.pow(10, decimals);
        return JSON.stringify({
          status: "success",
          data: {
            wallet_address: walletAddress,
            chain_id: "501",
            chain_name: "Solana",
            token_balance: {
              token_address: tokenAddress,
              token_symbol: symbol,
              balance: balance.toString(),
              balance_raw: tokenAccount.amount.toString(),
              decimals: decimals
            }
          },
          message: "GET_SOLANA_TOKEN_BALANCE_SUCCEEDED",
        });
      } catch (tokenError: any) {
        if (tokenError.message.includes("could not find account")) {
          return JSON.stringify({
            status: "success",
            data: {
              wallet_address: walletAddress,
              chain_id: "501",
              chain_name: "Solana",
              token_balance: {
                token_address: tokenAddress,
                balance: "0",
                balance_raw: "0",
                decimals: 9
              }
            },
            message: "GET_SOLANA_TOKEN_BALANCE_ZERO",
          });
        }
        throw tokenError;
      }
    }
  } catch (error: any) {
    return JSON.stringify({
      status: "error",
      error: `Solana balance check failed: ${error.message}`,
      message: "GET_SOLANA_BALANCE_ERROR",
    });
  }
}



async function getEthereumBalance(walletAddress: string, tokenAddress?: string): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
    if (!tokenAddress) {
      const balance = await provider.getBalance(walletAddress);
      const ethBalance = ethers.formatEther(balance);
      return JSON.stringify({
        status: "success",
        data: {
          wallet_address: walletAddress,
          chain_id: "1",
          chain_name: "Ethereum",
          native_balance: {
            token_symbol: "ETH",
            balance: ethBalance,
            balance_raw: balance.toString(),
            decimals: 18
          }
        },
        message: "GET_ETHEREUM_BALANCE_SUCCEEDED",
      });
    } else {
      const erc20Abi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)"
      ];
      const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
      const [balance, decimals, symbol] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals().catch(() => 18),
        contract.symbol().catch(() => "UNKNOWN")
      ]);
      const formattedBalance = ethers.formatUnits(balance, decimals);
      return JSON.stringify({
        status: "success",
        data: {
          wallet_address: walletAddress,
          chain_id: "1",
          chain_name: "Ethereum",
          token_balance: {
            token_address: tokenAddress,
            token_symbol: symbol,
            balance: formattedBalance,
            balance_raw: balance.toString(),
            decimals: decimals
          }
        },
        message: "GET_ETHEREUM_TOKEN_BALANCE_SUCCEEDED",
      });
    }
  } catch (error: any) {
    return JSON.stringify({
      status: "error",
      error: `Ethereum balance check failed: ${error.message}`,
      message: "GET_ETHEREUM_BALANCE_ERROR",
    });
  }
}