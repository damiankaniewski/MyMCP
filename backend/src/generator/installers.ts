import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { GENERATED_DIR } from "../config.js";

const SERVER_FILE = join(GENERATED_DIR, "server.mjs");

/** The three AI agents we support auto-configuration for. */
export type InstallTarget = "claude" | "copilot" | "cursor";

export const ALL_TARGETS: InstallTarget[] = ["claude", "copilot", "cursor"];

/** A single config file we may write a server entry into. */
interface ConfigFile {
  label: string;
  path: string;
  /** Top-level key holding the server map. */
  rootKey: "mcpServers" | "servers";
  /** Whether each entry should carry "type": "stdio". */
  includeType: boolean;
}

interface TargetPlan {
  label: string;
  /** True when the agent is installed on this machine. */
  detected: boolean;
  /** Config files to write (only those whose app is present). */
  files: ConfigFile[];
}

function appData(): string {
  return process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
}

function claudeDesktopDir(): string {
  const home = homedir();
  if (process.platform === "win32") return join(appData(), "Claude");
  if (process.platform === "darwin")
    return join(home, "Library", "Application Support", "Claude");
  return join(home, ".config", "Claude");
}

function vsCodeUserDir(): string {
  const home = homedir();
  if (process.platform === "win32") return join(appData(), "Code", "User");
  if (process.platform === "darwin")
    return join(home, "Library", "Application Support", "Code", "User");
  return join(home, ".config", "Code", "User");
}

/** Build the per-machine plan (which files exist / should be written) for a target. */
function planFor(target: InstallTarget): TargetPlan {
  const home = homedir();

  if (target === "claude") {
    const files: ConfigFile[] = [];

    // Claude Desktop
    const desktopDir = claudeDesktopDir();
    if (existsSync(desktopDir)) {
      files.push({
        label: "Claude Desktop",
        path: join(desktopDir, "claude_desktop_config.json"),
        rootKey: "mcpServers",
        includeType: false,
      });
    }

    // Claude CLI (Claude Code) — user-scoped servers live in ~/.claude.json
    const cliFile = join(home, ".claude.json");
    if (existsSync(cliFile) || existsSync(join(home, ".claude"))) {
      files.push({
        label: "Claude CLI",
        path: cliFile,
        rootKey: "mcpServers",
        includeType: true,
      });
    }

    return { label: "Claude (Desktop or CLI)", detected: files.length > 0, files };
  }

  if (target === "copilot") {
    const userDir = vsCodeUserDir();
    // GitHub Copilot's MCP servers are configured through VS Code's mcp.json.
    const detected = existsSync(dirname(userDir));
    return {
      label: "GitHub Copilot",
      detected,
      files: detected
        ? [
            {
              label: "GitHub Copilot",
              path: join(userDir, "mcp.json"),
              rootKey: "servers",
              includeType: true,
            },
          ]
        : [],
    };
  }

  // cursor
  const dir = join(home, ".cursor");
  const detected = existsSync(dir);
  return {
    label: "Cursor",
    detected,
    files: detected
      ? [
          {
            label: "Cursor",
            path: join(dir, "mcp.json"),
            rootKey: "mcpServers",
            includeType: false,
          },
        ]
      : [],
  };
}

/** Tolerant JSON parse: accepts whole-line // comments and trailing commas. */
function parseJsonc(text: string): Record<string, unknown> {
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    const stripped = text
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/,(\s*[}\]])/g, "$1");
    return JSON.parse(stripped);
  }
}

function restartHint(target: InstallTarget): string {
  switch (target) {
    case "claude":
      return "Fully quit and reopen Claude Desktop; the CLI picks it up on its next run.";
    case "copilot":
      return "Open Copilot Chat in Agent mode (reload the VS Code window if needed).";
    case "cursor":
      return "Restart Cursor to load your tools.";
  }
}

export interface TargetStatus {
  target: InstallTarget;
  label: string;
  detected: boolean;
}

export function detectTargets(): TargetStatus[] {
  return ALL_TARGETS.map((target) => {
    const plan = planFor(target);
    return { target, label: plan.label, detected: plan.detected };
  });
}

export interface ConnectionStatus {
  target: InstallTarget;
  label: string;
  /** The agent is installed on this machine. */
  detected: boolean;
  /** Our server is already present in the agent's config. */
  connected: boolean;
}

/** For each agent, report whether our server is already wired into its config. */
export function connectionStatus(serverName: string): ConnectionStatus[] {
  return ALL_TARGETS.map((target) => {
    const plan = planFor(target);
    let connected = false;
    for (const file of plan.files) {
      if (!existsSync(file.path)) continue;
      try {
        const json = parseJsonc(readFileSync(file.path, "utf-8"));
        const map = json[file.rootKey];
        if (map && typeof map === "object" && serverName in (map as object)) {
          connected = true;
        }
      } catch {
        /* unreadable config — treat as not connected */
      }
    }
    return { target, label: plan.label, detected: plan.detected, connected };
  });
}

export interface InstallResult {
  ok: boolean;
  detected: boolean;
  target: InstallTarget;
  label: string;
  message: string;
}

/** Merge one server entry into a single config file (with backup). */
async function writeConfigFile(
  file: ConfigFile,
  serverName: string
): Promise<{ ok: boolean; label: string }> {
  await mkdir(dirname(file.path), { recursive: true });

  let current: Record<string, unknown> = {};
  if (existsSync(file.path)) {
    const raw = await readFile(file.path, "utf-8");
    try {
      current = parseJsonc(raw) ?? {};
    } catch {
      return { ok: false, label: file.label };
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await copyFile(file.path, `${file.path}.bak-${stamp}`);
  }

  const entry = file.includeType
    ? { type: "stdio", command: "node", args: [SERVER_FILE] }
    : { command: "node", args: [SERVER_FILE] };

  const servers = (current[file.rootKey] as Record<string, unknown>) ?? {};
  servers[serverName] = entry;
  current[file.rootKey] = servers;

  await writeFile(file.path, JSON.stringify(current, null, 2), "utf-8");
  return { ok: true, label: file.label };
}

/**
 * Auto-configures one of the supported agents by writing the generated server
 * into its config file(s). Existing servers are preserved and the previous file
 * is backed up first. For Claude, both Desktop and CLI are configured if present.
 */
export async function installToClient(
  target: InstallTarget,
  serverName: string
): Promise<InstallResult> {
  const plan = planFor(target);

  if (!plan.detected || plan.files.length === 0) {
    return {
      ok: false,
      detected: false,
      target,
      label: plan.label,
      message: `${plan.label} was not found on this computer.`,
    };
  }

  const written: string[] = [];
  const failed: string[] = [];
  for (const file of plan.files) {
    const res = await writeConfigFile(file, serverName);
    (res.ok ? written : failed).push(res.label);
  }

  if (written.length === 0) {
    return {
      ok: false,
      detected: true,
      target,
      label: plan.label,
      message: `Could not safely update ${failed.join(
        ", "
      )}. Please add the server manually from the snippet below.`,
    };
  }

  let message = `Added to ${written.join(" and ")}. ${restartHint(target)}`;
  if (failed.length > 0) {
    message += ` (Couldn't update ${failed.join(", ")} — add it manually.)`;
  }

  return { ok: true, detected: true, target, label: plan.label, message };
}
