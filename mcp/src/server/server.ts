import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSonicResources } from "../core/resources.js";
import { registerSonicTools } from "../core/tools.js";
import { getSupportedNetworks } from "../core/chains.js";



async function startServer() {
  try {
    const server = new McpServer({
      name: "Sonic-Server",
      version: "1.0.0"
    });
    registerSonicResources(server);
    registerSonicTools(server);
    console.error(`Sonic MCP Server initialized`);
    console.error(`Supported networks: ${getSupportedNetworks().join(", ")}`);
    console.error("Server is ready to handle requests");
    return server;
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}


export default startServer; 