import { join } from "node:path";
import { GENERATED_DIR } from "../config.js";

const SERVER_FILE = join(GENERATED_DIR, "server.mjs");

/** Build the command/args a client uses to launch the generated server. */
function launchSpec() {
  return { command: "node", args: [SERVER_FILE] };
}

export function claudeDesktopConfig(serverName: string) {
  return {
    mcpServers: {
      [serverName]: launchSpec(),
    },
  };
}

export function cursorConfig(serverName: string) {
  // Cursor uses the same shape as Claude Desktop in ~/.cursor/mcp.json
  return {
    mcpServers: {
      [serverName]: launchSpec(),
    },
  };
}

export function copilotConfig(serverName: string) {
  // GitHub Copilot reads MCP servers from VS Code's mcp.json: a "servers" map
  // where each entry declares its transport type.
  return {
    servers: {
      [serverName]: {
        type: "stdio",
        ...launchSpec(),
      },
    },
  };
}

export function genericConfig(serverName: string) {
  return {
    name: serverName,
    transport: "stdio",
    ...launchSpec(),
  };
}

export type ExportTarget = "claude" | "copilot" | "cursor" | "generic";

export function buildExport(target: ExportTarget, serverName: string) {
  switch (target) {
    case "claude":
      return claudeDesktopConfig(serverName);
    case "copilot":
      return copilotConfig(serverName);
    case "cursor":
      return cursorConfig(serverName);
    case "generic":
    default:
      return genericConfig(serverName);
  }
}
