import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupportedNetworks, getRpcUrl } from "./chains.js";
import * as services from "./services/index.js";
import { type Address, type Hex, type Hash } from 'viem';



/**
 * @param server
 */



export function registerSonicTools(server: McpServer) {


  server.tool(
    "get_chain_info",
    "Get information about the Sonic network",
    {
      network: z.string().optional().describe("Network name ('blaze', 'sonic', 'testnet') or chain ID (57054, 146, 64165). Sonic Blaze Testnet is default.")
    },
    async ({ network = "testnet" }) => {
      try {
        const chainId = await services.getChainId(network);
        const blockNumber = await services.getBlockNumber(network);
        const rpcUrl = getRpcUrl(network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              network,
              chainId,
              blockNumber: blockNumber.toString(),
              rpcUrl
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching chain info: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "get_supported_networks",
    "Get a list of supported Sonic networks",
    {},
    async () => {
      try {
        const networks = getSupportedNetworks();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              supportedNetworks: networks
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching supported networks: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "get_block_by_number",
    "Get a block by its block number",
    {
      blockNumber: z.number().describe("The block number to fetch"),
      network: z.string().optional().describe("Network name or chain ID. Defaults to Sonic Blaze Testnet.")
    },
    async ({ blockNumber, network = "testnet" }) => {
      try {
        const block = await services.getBlockByNumber(blockNumber, network);
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson(block)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching block ${blockNumber}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "get_latest_block",
    "Get the latest block from the Sonic blockchain",
    {
      network: z.string().optional().describe("Network name or chain ID. Defaults to Sonic Blaze Testnet.")
    },
    async ({ network = "testnet" }) => {
      try {
        const block = await services.getLatestBlock(network);
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson(block)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching latest block: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "get_balance",
    "Get the native token balance (S) for an address", 
    {
      address: z.string().describe("The wallet address (e.g., '0x1234...') to check the balance for"),
      network: z.string().optional().describe("Network name. Defaults to Sonic Blaze Testnet.")
    },
    async ({ address, network = "testnet" }) => {
      try {
        const balance = await services.getNativeBalance(address, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              address,
              network,
              wei: balance.wei.toString(),
              sonic: balance.formatted
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching balance: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "get_erc20_balance",
    "Get the ERC20 token balance of a Sonic address",
    {
      tokenAddress: z.string().describe("The ERC20 token contract address"),
      holderAddress: z.string().describe("The Sonic address to check balance for"),
      network: z.string().optional().describe("Network name or chain ID. Defaults to Sonic Blaze Testnet.")
    },
    async ({ tokenAddress, holderAddress, network = "testnet" }) => {
      try {
        const balance = await services.getERC20Balance(
          tokenAddress,
          holderAddress,
          network
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              holderAddress,
              tokenAddress,
              network,
              balance: {
                raw: balance.raw.toString(),
                formatted: balance.formatted,
                symbol: balance.token.symbol,
                decimals: balance.token.decimals
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching ERC20 balance for ${holderAddress}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "get_token_balance",
    "Get the balance of an ERC20 token for an address",
    {
      tokenAddress: z.string().describe("The contract address or ENS name of the ERC20 token (e.g., Sonic token contract address)"),
      ownerAddress: z.string().describe("The wallet address or ENS name to check the balance for (e.g., '0x1234...' or 'example.eth')"),
      network: z.string().optional().describe("Network name ('blaze') or chain ID (5545). Only Sonic network is supported. Defaults to Sonic mainnet.")
    },
    async ({ tokenAddress, ownerAddress, network = "testnet" }) => {
      try {
        const balance = await services.getERC20Balance(tokenAddress, ownerAddress, network);
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson({
              tokenAddress,
              owner: ownerAddress,
              network,
              raw: balance.raw.toString(),
              formatted: balance.formatted,
              symbol: balance.token.symbol,
              decimals: balance.token.decimals
            })
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching token balance: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "get_transaction",
    "Get detailed information about a specific transaction by its hash. Includes sender, recipient, value, data, and more.",
    {
      hash: z.string().describe("The transaction hash to look up (e.g., '0x1234...')"),
      network: z.string().optional().describe("Network name ('blaze') or chain ID (5545). Only Sonic network is supported. Defaults to Sonic mainnet.")
    },
    async ({ hash, network = "testnet" }) => {
      try {
        const tx = await services.getTransaction(hash as Hash, network);
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson(tx)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching transaction ${hash}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "get_transaction_receipt",
    "Get a transaction receipt by its hash",
    {
      hash: z.string().describe("The transaction hash to look up"),
      network: z.string().optional().describe("Network name ('blaze') or chain ID (5545). Only Sonic network is supported. Defaults to Sonic mainnet.")
    },
    async ({ hash, network = "testnet" }) => {
      try {
        const receipt = await services.getTransactionReceipt(hash as Hash, network);
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson(receipt)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching transaction receipt ${hash}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "estimate_gas",
    "Estimate the gas cost for a transaction",
    {
      to: z.string().describe("The recipient address"),
      value: z.string().optional().describe("The amount of S to send in blaze (e.g., '0.1')"),
      data: z.string().optional().describe("The transaction data as a hex string"),
      network: z.string().optional().describe("Network name or chain ID. Defaults to Sonic mainnet.")
    },
    async ({ to, value, data, network = "testnet" }) => {
      try {
        const params: any = { to: to as Address };
        if (value) {
          params.value = services.helpers.parseEther(value);
        }
        if (data) {
          params.data = data as `0x${string}`;
        }
        const gas = await services.estimateGas(params, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              network,
              estimatedGas: gas.toString()
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error estimating gas: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "transfer_native",
    "Transfer native tokens (S) to an address",
    {
      privateKey: z.string().optional().describe("Private key of the sender account in hex format (with or without 0x prefix). If not provided, reads from WALLET_PRIVATE_KEY environment variable. SECURITY: This is used only for transaction signing and is not stored."),
      to: z.string().describe("The recipient address or ENS name (e.g., '0x1234...' or 'example.blaze')"),
      amount: z.string().describe("Amount to send in S, as a string (e.g., '0.1')"),
      network: z.string().optional().describe("Network name ('blaze') or chain ID (57054). Only Sonic network is supported. Defaults to Sonic Blaze Testnet.")
    },
    async ({ privateKey, to, amount, network = "testnet" }) => {
      try {
        const key = privateKey || process.env.WALLET_PRIVATE_KEY;
        if (!key) {
          throw new Error("Private key not provided and WALLET_PRIVATE_KEY environment variable not set");
        }
        const txHash = await services.transferNative(key, to, amount, network);
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson({
              success: true,
              txHash,
              to,
              amount,
              network
            })
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error transferring S: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "transfer_erc20",
    "Transfer ERC20 tokens to another address",
    {
      privateKey: z.string().optional().describe("Private key of the sending account (this is used for signing and is never stored). If not provided, reads from WALLET_PRIVATE_KEY environment variable."),
      tokenAddress: z.string().describe("The address of the ERC20 token contract"),
      toAddress: z.string().describe("The recipient address"),
      amount: z.string().describe("The amount of tokens to send (in token units, e.g., '10' for 10 tokens)"),
      network: z.string().optional().describe("Network name ('blaze') or chain ID (5545). Only Sonic network is supported. Defaults to Sonic mainnet.")
    },
    async ({ privateKey, tokenAddress, toAddress, amount, network = "testnet" }) => {
      try {
        const key = privateKey || process.env.WALLET_PRIVATE_KEY;
        if (!key) {
          throw new Error("Private key not provided and WALLET_PRIVATE_KEY environment variable not set");
        }
        const formattedKey = key.startsWith('0x') 
          ? key as `0x${string}` 
          : `0x${key}` as `0x${string}`;
        const result = await services.transferERC20(
          tokenAddress as Address, 
          toAddress as Address, 
          amount,
          formattedKey,
          network
        );
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson({
              success: true,
              txHash: result.txHash,
              network,
              tokenAddress,
              recipient: toAddress,
              amount: result.amount.formatted,
              symbol: result.token.symbol
            })
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error transferring ERC20 tokens: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "approve_token_spending",
    "Approve another address (like a DeFi protocol or exchange) to spend your ERC20 tokens. This is often required before interacting with DeFi protocols.",
    {
      privateKey: z.string().describe("Private key of the token owner account in hex format (with or without 0x prefix). SECURITY: This is used only for transaction signing and is not stored."),
      tokenAddress: z.string().describe("The contract address of the ERC20 token to approve for spending (e.g., Sonic token contract address)"),
      spenderAddress: z.string().describe("The contract address being approved to spend your tokens (e.g., a DEX or lending protocol)"),
      amount: z.string().describe("The amount of tokens to approve in token units, not wei (e.g., '1000' to approve spending 1000 tokens). Use a very large number for unlimited approval."),
      network: z.string().optional().describe("Network name ('blaze') or chain ID (5545). Only Sonic network is supported. Defaults to Sonic mainnet.")
    },
    async ({ privateKey, tokenAddress, spenderAddress, amount, network = "testnet" }) => {
      try {
        const formattedKey = privateKey.startsWith('0x') 
          ? privateKey as `0x${string}` 
          : `0x${privateKey}` as `0x${string}`;
        const result = await services.approveERC20(
          tokenAddress as Address, 
          spenderAddress as Address, 
          amount,
          formattedKey,
          network
        );
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson({
              success: true,
              txHash: result.txHash,
              network,
              tokenAddress,
              spender: spenderAddress,
              amount: result.amount.formatted,
              symbol: result.token.symbol
            })
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error approving token spending: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "transfer_token",
    "Transfer ERC20 tokens to an address",
    {
      privateKey: z.string().describe("Private key of the sender account in hex format (with or without 0x prefix). SECURITY: This is used only for transaction signing and is not stored."),
      tokenAddress: z.string().describe("The contract address or ENS name of the ERC20 token to transfer (e.g., Sonic token contract address)"),
      toAddress: z.string().describe("The recipient address or ENS name that will receive the tokens (e.g., '0x1234...' or 'example.blaze')"),
      amount: z.string().describe("Amount of tokens to send as a string (e.g., '100' for 100 tokens). This will be adjusted for the token's decimals."),
      network: z.string().optional().describe("Network name ('blaze') or chain ID (5545). Only Sonic network is supported. Defaults to Sonic mainnet.")
    },
    async ({ privateKey, tokenAddress, toAddress, amount, network = "testnet" }) => {
      try {
        const result = await services.transferERC20(
          tokenAddress,
          toAddress,
          amount,
          privateKey,
          network
        );
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson({
              success: true,
              txHash: result.txHash,
              tokenAddress,
              toAddress,
              amount: result.amount.formatted,
              symbol: result.token.symbol,
              network
            })
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error transferring tokens: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "read_contract",
    "Read data from a smart contract by calling a view/pure function. This doesn't modify blockchain state and doesn't require gas or signing.",
    {
      contractAddress: z.string().describe("The address of the smart contract to interact with"),
      abi: z.array(z.any()).describe("The ABI (Application Binary Interface) of the smart contract function, as a JSON array"),
      functionName: z.string().describe("The name of the function to call on the contract (e.g., 'balanceOf')"),
      args: z.array(z.any()).optional().describe("The arguments to pass to the function, as an array (e.g., ['0x1234...'])"),
      network: z.string().optional().describe("Network name ('blaze') or chain ID (5545). Only Sonic network is supported. Defaults to Sonic mainnet.")
    },
    async ({ contractAddress, abi, functionName, args = [], network = "testnet" }) => {
      try {
        const parsedAbi = typeof abi === 'string' ? JSON.parse(abi) : abi;
        const client = services.getPublicClient(network);
        const result = await client.readContract({
          address: contractAddress as Address,
          abi: parsedAbi,
          functionName,
          args
        });
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson(result)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error reading contract: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "write_contract",
    "Write data to a smart contract by calling a state-changing function. This modifies blockchain state and requires gas payment and transaction signing.",
    {
      contractAddress: z.string().describe("The address of the smart contract to interact with"),
      abi: z.array(z.any()).describe("The ABI (Application Binary Interface) of the smart contract function, as a JSON array"),
      functionName: z.string().describe("The name of the function to call on the contract (e.g., 'transfer')"),
      args: z.array(z.any()).describe("The arguments to pass to the function, as an array (e.g., ['0x1234...', '1000000000000000000'])"),
      privateKey: z.string().describe("Private key of the sending account in hex format (with or without 0x prefix). SECURITY: This is used only for transaction signing and is not stored."),
      network: z.string().optional().describe("Network name ('blaze') or chain ID (5545). Only Sonic network is supported. Defaults to Sonic mainnet.")
    },
    async ({ contractAddress, abi, functionName, args, privateKey, network = "testnet" }) => {
      try {
        const parsedAbi = typeof abi === 'string' ? JSON.parse(abi) : abi;
        const contractParams: Record<string, any> = {
          address: contractAddress as Address,
          abi: parsedAbi,
          functionName,
          args
        };
        const txHash = await services.writeContract(
          privateKey as Hex, 
          contractParams, 
          network
        );
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson({
              network,
              transactionHash: txHash,
              message: "Contract write transaction sent successfully"
            })
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error writing to contract: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "is_contract",
    "Check if an address is a smart contract or an externally owned account (EOA)",
    {
      address: z.string().describe("The wallet or contract address or ENS name to check (e.g., '0x1234...' or 'example.blaze')"),
      network: z.string().optional().describe("Network name. Only supports Sonic mainnet. Defaults to Sonic mainnet.")
    },
    async ({ address, network = "testnet" }) => {
      try {
        const isContract = await services.isContract(address, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              address,
              network,
              isContract,
              type: isContract ? "Contract" : "Externally Owned Account (EOA)"
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error checking if address is a contract: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "get_token_info",
    "Get comprehensive information about an ERC20 token including name, symbol, decimals, total supply, and other metadata. Use this to analyze any token on Sonic blockchain.",
    {
      tokenAddress: z.string().describe("The contract address of the ERC20 token (e.g., Sonic token contract address)"),
      network: z.string().optional().describe("Network name ('blaze') or chain ID (5545). Only Sonic network is supported. Defaults to Sonic mainnet.")
    },
    async ({ tokenAddress, network = "testnet" }) => {
      try {
        const tokenInfo = await services.getERC20TokenInfo(tokenAddress as Address, network);
        
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson({
              address: tokenAddress,
              network,
              ...tokenInfo
            })
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching token info: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "get_token_balance_erc20",
    "Get ERC20 token balance for an address",
    {
      tokenAddress: z.string().describe("The ERC20 token contract address"),
      ownerAddress: z.string().describe("The address to check balance for"),
      network: z.string().optional().describe("Network name or chain ID. Defaults to Sonic mainnet.")
    },
    async ({ tokenAddress, ownerAddress, network = "testnet" }) => {
      try {
        const balance = await services.getERC20Balance(
          tokenAddress,
          ownerAddress,
          network
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              ownerAddress,
              tokenAddress,
              network,
              balance: {
                raw: balance.raw.toString(),
                formatted: balance.formatted,
                symbol: balance.token.symbol,
                decimals: balance.token.decimals
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching ERC20 balance for ${ownerAddress}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "get_address_from_private_key",
    "Get the Sonic address derived from a private key",
    {
      privateKey: z.string().optional().describe("Private key in hex format (with or without 0x prefix). If not provided, reads from WALLET_PRIVATE_KEY environment variable. SECURITY: This is used only for address derivation and is not stored.")
    },
    async ({ privateKey }) => {
      try {
        const key = privateKey || process.env.WALLET_PRIVATE_KEY;
        
        if (!key) {
          throw new Error("Private key not provided and WALLET_PRIVATE_KEY environment variable not set");
        }
        const formattedKey = key.startsWith('0x') ? key as Hex : `0x${key}` as Hex;
        const address = services.getAddressFromPrivateKey(formattedKey);
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson({
              address,
              privateKey: "0x" + key.replace(/^0x/, '')
            })
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error deriving address from private key: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // ===== DEX/SWAP TOOLS =====

  server.tool(
    "get_swap_quote",
    "Get a quote for swapping tokens on Sonic DEXs. Shows expected output amount and price impact.",
    {
      tokenIn: z.string().describe("Address of the input token (use WETH address for native S tokens)"),
      tokenOut: z.string().describe("Address of the output token (use WETH address for native S tokens)"),
      amountIn: z.string().describe("Amount of input tokens to swap (in human readable format, e.g., '1.5')"),
      dexRouter: z.string().optional().describe("DEX router contract address. Uses default if not specified."),
      network: z.string().optional().describe("Network name or chain ID. Defaults to testnet.")
    },
    async ({ tokenIn, tokenOut, amountIn, dexRouter, network = "testnet" }) => {
      try {
        const quote = await services.getSwapQuote(
          tokenIn as Address,
          tokenOut as Address,
          amountIn,
          dexRouter as Address,
          network
        );
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson({
              quote,
              path: quote.path,
              dex: quote.dex,
              priceImpact: quote.priceImpact
            })
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error getting swap quote: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "get_best_swap_quote",
    "Get the best swap quote across multiple DEXs on Sonic. Compares prices to find the best rate.",
    {
      tokenIn: z.string().describe("Address of the input token (use WETH address for native S tokens)"),
      tokenOut: z.string().describe("Address of the output token (use WETH address for native S tokens)"),
      amountIn: z.string().describe("Amount of input tokens to swap (in human readable format, e.g., '1.5')"),
      network: z.string().optional().describe("Network name or chain ID. Defaults to testnet.")
    },
    async ({ tokenIn, tokenOut, amountIn, network = "testnet" }) => {
      try {
        const bestQuote = await services.getBestSwapQuote(
          tokenIn as Address,
          tokenOut as Address,
          amountIn,
          network
        );
        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson({
              bestQuote,
              recommendedDex: bestQuote.dex,
              path: bestQuote.path,
              priceImpact: bestQuote.priceImpact
            })
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error getting best swap quote: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "execute_swap",
    "Execute a token swap on Sonic DEXs. Requires private key for transaction signing.",
    {
      privateKey: z.string().optional().describe("Private key in hex format. If not provided, uses WALLET_PRIVATE_KEY environment variable."),
      tokenIn: z.string().describe("Address of the input token (use WETH address for native S tokens)"),
      tokenOut: z.string().describe("Address of the output token (use WETH address for native S tokens)"),
      amountIn: z.string().describe("Amount of input tokens to swap (in human readable format, e.g., '1.5')"),
      slippageTolerance: z.number().optional().describe("Maximum slippage tolerance in percentage (e.g., 0.5 for 0.5%). Defaults to 0.5%."),
      deadline: z.number().optional().describe("Transaction deadline in minutes from now. Defaults to 20 minutes."),
      dexRouter: z.string().optional().describe("DEX router contract address. Uses default if not specified."),
      network: z.string().optional().describe("Network name or chain ID. Defaults to testnet.")
    },
    async ({ privateKey, tokenIn, tokenOut, amountIn, slippageTolerance = 0.5, deadline = 20, dexRouter, network = "testnet" }) => {
      try {
        const key = privateKey || process.env.WALLET_PRIVATE_KEY;
        if (!key) {
          throw new Error("Private key not provided and WALLET_PRIVATE_KEY environment variable not set");
        }
        
        const formattedKey = key.startsWith('0x') ? key as Hex : `0x${key}` as Hex;
        
        const result = await services.executeSwap({
          privateKey: formattedKey,
          tokenIn: tokenIn as Address,
          tokenOut: tokenOut as Address,
          amountIn,
          slippageTolerance,
          deadline,
          dexRouter: dexRouter as Address,
          network
        });

        if (result.success) {
          return {
            content: [{
              type: "text",
              text: services.helpers.formatJson({
                success: true,
                txHash: result.txHash,
                quote: result.quote,
                slippageTolerance: `${slippageTolerance}%`,
                deadline: `${deadline} minutes`,
                network
              })
            }]
          };
        } else {
          return {
            content: [{
              type: "text",
              text: `Swap failed: ${result.error}`
            }],
            isError: true
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error executing swap: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "test_swap",
    "Test the swap service configuration and verify it's ready for Sonic testnet.",
    {},
    async (args) => {
      try {
        const { testTokenSwap } = await import('./services/swap.js');
        const result = await testTokenSwap();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }],
          isError: !result.success
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error testing swap service: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );
} 