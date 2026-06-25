#!/usr/bin/env node
// One-command launcher: starts backend + frontend, opens the browser.
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

const FRONTEND_URL = "http://localhost:5173";

function run(name, color, args, cwd) {
  const child = spawn(npm, args, { cwd, stdio: "inherit", shell: isWin });
  child.on("exit", (code) => {
    console.log(`[${name}] exited with code ${code}`);
  });
  return child;
}

async function ensureInstalled() {
  const needsInstall =
    !existsSync(join(root, "node_modules")) ||
    !existsSync(join(root, "backend", "node_modules")) ||
    !existsSync(join(root, "frontend", "node_modules"));
  if (needsInstall) {
    console.log("📦 Installing dependencies (first run only)...");
    await new Promise((resolve, reject) => {
      const child = spawn(npm, ["run", "install:all"], {
        cwd: root,
        stdio: "inherit",
        shell: isWin,
      });
      child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("install failed"))));
    });
  }
}

async function openBrowser(url) {
  const cmd = isWin ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
  const args = isWin ? ["", url] : [url];
  spawn(cmd, args, { shell: true, stdio: "ignore", detached: true });
}

async function main() {
  await ensureInstalled();
  console.log("🚀 Starting MyMCP...");
  run("backend", "blue", ["run", "dev"], join(root, "backend"));
  run("frontend", "magenta", ["run", "dev"], join(root, "frontend"));
  await wait(4000);
  console.log(`🌐 Opening ${FRONTEND_URL}`);
  await openBrowser(FRONTEND_URL);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
