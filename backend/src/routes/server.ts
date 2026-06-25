import { Router } from "express";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ACTIVE_PROJECT_ID, GENERATED_DIR } from "../config.js";
import { store } from "../storage/activeStore.js";
import { generateServer } from "../generator/generateServer.js";
import { connectionStatus } from "../generator/installers.js";
import { testServer } from "../mcp/tester.js";

export const serverRouter = Router();

const SERVER_FILE = join(GENERATED_DIR, "server.mjs");

// Real status for a stdio MCP server: is it built, and which agents use it.
// (There is no long-running process — clients launch the server on demand.)
serverRouter.get("/info", async (_req, res) => {
  const project = await store.load();
  const { serverName } = await generateServer(project, ACTIVE_PROJECT_ID);
  res.json({
    built: existsSync(SERVER_FILE),
    serverName,
    toolCount: project.tools.length,
    transport: "stdio",
    connections: connectionStatus(serverName),
  });
});

// (Re)generate the standalone MCP server from the current project.
serverRouter.post("/generate", async (_req, res) => {
  const project = await store.load();
  const result = await generateServer(project, ACTIVE_PROJECT_ID);
  res.json({ ok: true, ...result });
});

// Health check: spawn the server, do the MCP handshake, list tools, shut down.
serverRouter.post("/test", async (_req, res) => {
  const project = await store.load();
  await generateServer(project, ACTIVE_PROJECT_ID);
  const result = await testServer();
  res.json(result);
});
