import { existsSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { GENERATED_DIR } from "../config.js";

const SERVER_FILE = join(GENERATED_DIR, "server.mjs");

export interface TestResult {
  ok: boolean;
  toolCount: number;
  tools: string[];
  error?: string;
}

/**
 * Health check for a stdio MCP server: spawn it, perform the MCP handshake,
 * list its tools, then shut it down. This is the meaningful "is it working?"
 * signal — stdio servers don't run continuously, clients launch them on demand.
 */
export async function testServer(): Promise<TestResult> {
  if (!existsSync(SERVER_FILE)) {
    return { ok: false, toolCount: 0, tools: [], error: "Server not built yet." };
  }

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_FILE],
    cwd: GENERATED_DIR,
  });
  const client = new Client({ name: "mymcp-health", version: "1.0.0" });

  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    return { ok: true, toolCount: tools.length, tools: tools.map((t) => t.name) };
  } catch (error) {
    return {
      ok: false,
      toolCount: 0,
      tools: [],
      error: (error as Error).message,
    };
  } finally {
    try {
      await client.close();
    } catch {
      /* already gone */
    }
  }
}
