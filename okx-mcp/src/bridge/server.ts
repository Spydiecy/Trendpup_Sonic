import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OKX_BRIDGE_SERVER } from "../shared/constants";
import { buildCrossChainSwapTool, BuildCrossChainSwapToolParamType, getBridgeTokenPairsTool, getCrossChainQuoteTool, GetCrossChainQuoteToolParamType, getSupportedBridgesTool, getSupportedTokensTool } from "./tools";



export const initOKXBridgeServer = () => {
  const server = new McpServer({
    name: OKX_BRIDGE_SERVER,
    version: "0.0.1",
  });
  server.tool(
    buildCrossChainSwapTool.name,
    buildCrossChainSwapTool.description,
    buildCrossChainSwapTool.parameters,
    async (args: BuildCrossChainSwapToolParamType, extra) => {
      const result = await buildCrossChainSwapTool.callback(args);
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
    getBridgeTokenPairsTool.name,
    getBridgeTokenPairsTool.description,
    getBridgeTokenPairsTool.parameters,
    async ({ fromChainId }: { fromChainId: string }) => {
      const result = await getBridgeTokenPairsTool.callback({ fromChainId });
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
    getSupportedBridgesTool.name,
    getSupportedBridgesTool.description,
    getSupportedBridgesTool.parameters,
    async ({ chainId }: { chainId: string }) => {
      const result = await getSupportedBridgesTool.callback({ chainId });
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
    getSupportedTokensTool.name,
    getSupportedTokensTool.description,
    getSupportedTokensTool.parameters,
    async ({ chainId }: { chainId: string }) => {
      const result = await getSupportedTokensTool.callback({ chainId });

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
    getCrossChainQuoteTool.name,
    getCrossChainQuoteTool.description,
    getCrossChainQuoteTool.parameters,
    async (args: GetCrossChainQuoteToolParamType, extra) => {
      const result = await getCrossChainQuoteTool.callback(args);

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