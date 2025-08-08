import express, { Application } from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { initOKXDexServer } from "./dex/server";
import { ENV } from "./shared/env";
import { initOKXBridgeServer } from "./bridge/server";
dotenv.config();



const app: Application = express();
export let transport: SSEServerTransport | null = null;
app.use(helmet());
app.use(express.urlencoded({ extended: true }));



app.get("/", (req, res) => {
  res.send("Hello, OKX MCP Server");
});



app.get("/sse/dex", (req, res) => {
  const server = initOKXDexServer();

  transport = new SSEServerTransport("/messages", res);

  server.connect(transport);
});



app.get("/sse/bridge", (req, res) => {
  const server = initOKXBridgeServer();

  transport = new SSEServerTransport("/messages", res);

  server.connect(transport);
});



app.post("/messages", (req, res) => {
  if (transport) {
    transport.handlePostMessage(req, res);
  }
});



app.listen(ENV.PORT, () => {
  console.log(`OKX MCP Server is running on port ${ENV.PORT}`);
});