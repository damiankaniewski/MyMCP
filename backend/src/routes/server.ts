import { Router } from "express";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ACTIVE_PROJECT_ID, GENERATED_DIR } from "../config.js";
import { store } from "../storage/activeStore.js";
import { generateServer } from "../generator/generateServer.js";
import { connectionStatus } from "../generator/installers.js";

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
