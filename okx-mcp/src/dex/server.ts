import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OKX_DEX_SERVER } from "../shared/constants";
import { executeSwapTool, getTokensTool, getLiquidityTool, getChainDataTool, getSwapDataTool, getQuoteTool, getWalletBalanceTool, ExecuteSwapToolParamType, GetQuoteToolParamType, GetSwapDataToolParamsType, GetWalletBalanceToolParamType } from "./tools";



export const initOKXDexServer = () => {
  const server = new McpServer({
    name: OKX_DEX_SERVER,
    version: "0.0.1",
  });
  server.tool(
    executeSwapTool.name,
    executeSwapTool.description,
    executeSwapTool.parameters,
    async (args: ExecuteSwapToolParamType, extra) => {
      const result = await executeSwapTool.callback(args);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }
  );
  server.tool(
    getTokensTool.name,
    getTokensTool.description,
    getTokensTool.parameters,
    async ({ chainId }: { chainId: string }) => {
      const result = await getTokensTool.callback({ chainId });
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }
  );
  server.tool(
    getLiquidityTool.name,
    getLiquidityTool.description,
    getLiquidityTool.parameters,
    async ({ chainId }: { chainId: string }) => {
      const result = await getLiquidityTool.callback({ chainId });
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }
  );
  server.tool(
    getQuoteTool.name,
    getQuoteTool.description,
    getQuoteTool.parameters,
    async (args: GetQuoteToolParamType, extra) => {
      const result = await getQuoteTool.callback(args);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }
  );
  server.tool(
    getSwapDataTool.name,
    getSwapDataTool.description,
    getSwapDataTool.parameters,
    async (args: GetSwapDataToolParamsType, extra) => {
      const result = await getSwapDataTool.callback(args);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }
  );
  server.tool(
    getChainDataTool.name,
    getChainDataTool.description,
    getChainDataTool.parameters,
    async ({ chainId }: { chainId: string }) => {
      const result = await getChainDataTool.callback({ chainId });
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }
  );
  server.tool(
    getWalletBalanceTool.name,
    getWalletBalanceTool.description,
    getWalletBalanceTool.parameters,
    async (args: GetWalletBalanceToolParamType, extra) => {
      const result = await getWalletBalanceTool.callback(args);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }
  );
  return server;
};