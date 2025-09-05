import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSupportedNetworks, getRpcUrl } from "./chains.js";
import * as services from "./services/index.js";
import type { Address, Hash } from "viem";



/**
 * @param server
 */



export function registerSonicResources(server: McpServer) {


  server.resource(
    "chain_info_by_network", 
    new ResourceTemplate("sonic://{network}/chain", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const chainId = await services.getChainId(network);
        const blockNumber = await services.getBlockNumber(network);
        const rpcUrl = getRpcUrl(network);
        return {
          contents: [{
            uri: uri.href,
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
          contents: [{
            uri: uri.href,
            text: `Error fetching chain info: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );



  server.resource(
    "sonic_chain_info", 
    "sonic://chain",
    async (uri) => {
      try {
        const network = "sonic";
        const chainId = await services.getChainId(network);
        const blockNumber = await services.getBlockNumber(network);
        const rpcUrl = getRpcUrl(network);
        return {
          contents: [{
            uri: uri.href,
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
          contents: [{
            uri: uri.href,
            text: `Error fetching chain info: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );



  server.resource(
    "sonic_block_by_number",
    new ResourceTemplate("sonic://{network}/block/{blockNumber}", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const blockNumber = params.blockNumber as string;
        const block = await services.getBlockByNumber(parseInt(blockNumber), network);
        return {
          contents: [{
            uri: uri.href,
            text: services.helpers.formatJson(block)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching block: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );



  server.resource(
    "block_by_hash",
    new ResourceTemplate("sonic://{network}/block/hash/{blockHash}", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const blockHash = params.blockHash as string;
        const block = await services.getBlockByHash(blockHash as Hash, network);
        return {
          contents: [{
            uri: uri.href,
            text: services.helpers.formatJson(block)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching block with hash: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );



  server.resource(
    "sonic_latest_block",
    new ResourceTemplate("sonic://{network}/block/latest", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const block = await services.getLatestBlock(network);
        return {
          contents: [{
            uri: uri.href,
            text: services.helpers.formatJson(block)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching latest block: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );



  server.resource(
    "default_latest_block",
    "sonic://block/latest",
    async (uri) => {
      try {
        const network = "sonic";
        const block = await services.getLatestBlock(network);
        return {
          contents: [{
            uri: uri.href,
            text: services.helpers.formatJson(block)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching latest block: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );



  server.resource(
    "sonic_address_native_balance",
    new ResourceTemplate("sonic://{network}/address/{address}/balance", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const address = params.address as string;
        const balance = await services.getNativeBalance(address as Address, network);
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              network,
              address,
              balance: {
                wei: balance.wei.toString(),
                sonic: balance.formatted
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching Sonic balance: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );



  server.resource(
    "default_sonic_balance",
    new ResourceTemplate("sonic://address/{address}/sonic-balance", { list: undefined }),
    async (uri, params) => {
      try {
        const network = "blaze"; // Use Sonic Blaze Testnet as default
        const address = params.address as string;
        const balance = await services.getNativeBalance(address as Address, network);
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              network,
              address,
              balance: {
                wei: balance.wei.toString(),
                sonic: balance.formatted
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching Sonic balance: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );



  server.resource(
    "erc20_balance",
    new ResourceTemplate("sonic://{network}/address/{address}/token/{tokenAddress}/balance", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const address = params.address as string;
        const tokenAddress = params.tokenAddress as string;
        
        const balance = await services.getERC20Balance(
          tokenAddress as Address,
          address as Address,
          network
        );
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              network,
              address,
              tokenAddress,
              balance: {
                raw: balance.raw.toString(),
                formatted: balance.formatted,
                decimals: balance.token.decimals
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching ERC20 balance: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );



  server.resource(
    "default_erc20_balance",
    new ResourceTemplate("sonic://address/{address}/token/{tokenAddress}/balance", { list: undefined }),
    async (uri, params) => {
      try {
        const network = "sonic";
        const address = params.address as string;
        const tokenAddress = params.tokenAddress as string;
        const balance = await services.getERC20Balance(
          tokenAddress as Address,
          address as Address,
          network
        );
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              network,
              address,
              tokenAddress,
              balance: {
                raw: balance.raw.toString(),
                formatted: balance.formatted,
                decimals: balance.token.decimals
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching ERC20 balance: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );



  server.resource(
    "sonic_transaction_details",
    new ResourceTemplate("sonic://{network}/tx/{txHash}", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const txHash = params.txHash as string;
        const tx = await services.getTransaction(txHash as Hash, network);
        return {
          contents: [{
            uri: uri.href,
            text: services.helpers.formatJson(tx)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching transaction: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );



  server.resource(
    "default_transaction_by_hash",
    new ResourceTemplate("sonic://tx/{txHash}", { list: undefined }),
    async (uri, params) => {
      try {
        const network = "sonic";
        const txHash = params.txHash as string;
        const tx = await services.getTransaction(txHash as Hash, network);
        return {
          contents: [{
            uri: uri.href,
            text: services.helpers.formatJson(tx)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching transaction: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );



  server.resource(
    "supported_networks",
    "sonic://networks",
    async (uri) => {
      try {
        const networks = getSupportedNetworks();
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              supportedNetworks: networks
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching supported networks: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );



  server.resource(
    "erc20_token_details",
    new ResourceTemplate("sonic://{network}/token/{tokenAddress}", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const tokenAddress = params.tokenAddress as Address;
        const tokenInfo = await services.getERC20TokenInfo(tokenAddress, network);
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              address: tokenAddress,
              network,
              ...tokenInfo
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching ERC20 token info: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );



  server.resource(
    "erc20_token_address_balance",
    new ResourceTemplate("sonic://{network}/token/{tokenAddress}/balanceOf/{address}", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const tokenAddress = params.tokenAddress as Address;
        const address = params.address as Address;
        const balance = await services.getERC20Balance(tokenAddress, address, network);
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              tokenAddress,
              owner: address,
              network,
              raw: balance.raw.toString(),
              formatted: balance.formatted,
              symbol: balance.token.symbol,
              decimals: balance.token.decimals
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching ERC20 token balance: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
} 