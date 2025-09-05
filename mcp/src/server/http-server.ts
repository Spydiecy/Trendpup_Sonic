import startServer from "./server.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Request, Response } from "express";



dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
const PORT = 3002;
const HOST = '0.0.0.0';
console.error(`Configured to listen on ${HOST}:${PORT}`);



const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Content-Type', 'Access-Control-Allow-Origin']
}));
app.options('*', cors());



let server: McpServer | null = null;
startServer().then(s => {
  server = s;
  console.error("Sonic MCP Server initialized successfully");
  console.error("Inspecting server structure...");
  const serverAny = s as any;
  console.error("Server keys:", Object.keys(serverAny));
  for (const key of Object.keys(serverAny)) {
    if (key.toLowerCase().includes('tool') || key.toLowerCase().includes('handler')) {
      console.error(`Found ${key}:`, typeof serverAny[key], serverAny[key] instanceof Map ? 'Map' : 'Object');
      if (serverAny[key] instanceof Map) {
        console.error(`${key} size:`, serverAny[key].size);
        console.error(`${key} keys:`, Array.from(serverAny[key].keys()));
      }
    }
  }
}).catch(error => {
  console.error("Failed to initialize server:", error);
  process.exit(1);
});



app.post("/api", async (req: Request, res: Response) => {
  console.error(`Received API request: ${JSON.stringify(req.body)}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (!server) {
    console.error("Server not initialized yet");
    return res.status(503).json({ error: "Server not initialized" });
  }
  try {
    const request = req.body;
    if (!request.jsonrpc || !request.method || request.id === undefined) {
      return res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32600,
          message: "Invalid Request - Missing required fields: jsonrpc, method, or id"
        },
        id: request.id || null
      });
    }
    let result;
    


    switch (request.method) {
      case 'initialize':
        result = {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
            resources: {},
            prompts: {}
          },
          serverInfo: {
            name: "Sonic MCP Server",
            version: "1.0.0"
          }
        };
        break;



      case 'tools/list':
        const tools: any[] = [];
        const serverAny = server as any;
        console.error("Looking for tools in server...");
        console.error("_registeredTools:", typeof serverAny._registeredTools, serverAny._registeredTools);
        if (serverAny._registeredTools && typeof serverAny._registeredTools === 'object') {
          const toolsObj = serverAny._registeredTools;
          console.error("_registeredTools keys:", Object.keys(toolsObj));
          for (const [name, tool] of Object.entries(toolsObj)) {
            console.error(`Processing tool: ${name}`, tool);
            tools.push({
              name: name,
              description: (tool as any).description || "",
              inputSchema: (tool as any).inputSchema || (tool as any).schema || {}
            });
          }
        }
        console.error(`Found ${tools.length} tools`);
        result = { tools };
        break;


        
      case 'tools/call':
        if (!request.params || !request.params.name) {
          return res.status(400).json({
            jsonrpc: "2.0",
            error: {
              code: -32602,
              message: "Invalid params - Missing tool name"
            },
            id: request.id
          });
        }
        const toolName = request.params.name;
        const toolArgs = request.params.arguments || {};
        console.error(`Executing tool: ${toolName} with args:`, toolArgs);
        try {
          const serverAny = server as any;
          if (!serverAny._registeredTools || !serverAny._registeredTools[toolName]) {
            return res.status(404).json({
              jsonrpc: "2.0",
              error: {
                code: -32601,
                message: `Tool '${toolName}' not found`
              },
              id: request.id
            });
          }
          const tool = serverAny._registeredTools[toolName];
          console.error(`Found tool:`, { name: toolName, hasCallback: !!tool.callback });
          if (tool.callback && typeof tool.callback === 'function') {
            const toolResult = await tool.callback(toolArgs);
            console.error(`Tool execution result:`, toolResult);
            result = {
              content: toolResult.content || [{ type: "text", text: JSON.stringify(toolResult) }],
              isError: toolResult.isError || false
            };
          } else {
            return res.status(500).json({
              jsonrpc: "2.0",
              error: {
                code: -32603,
                message: `Tool '${toolName}' has no valid callback function`
              },
              id: request.id
            });
          }
        } catch (error) {
          console.error(`Tool execution error:`, error);
          return res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
            },
            id: request.id
          });
        }
        break;
      default:
        return res.status(404).json({
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`
          },
          id: request.id
        });
    }
    res.json({
      jsonrpc: "2.0",
      result: result,
      id: request.id
    });
  } catch (error: any) {
    console.error("Request processing error:", error);
    res.status(500).json({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      },
      id: req.body.id || null
    });
  }
});



app.get("/health", (req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    server: "Sonic MCP Server",
    timestamp: new Date().toISOString()
  });
});



app.get("/", (req: Request, res: Response) => {
  res.json({
    name: "Sonic MCP Server",
    version: "1.0.0",
    description: "MCP Server for Sonic blockchain interactions",
    endpoints: {
      api: "/api",
      health: "/health"
    }
  });
});



app.listen(PORT, HOST, () => {
  console.error(`Sonic MCP Server listening on ${HOST}:${PORT}`);
}).on('error', (error: any) => {
  console.error('Server error:', error);
});
