#!/usr/bin/env node
// MyMCP one-command launcher.
// Runs backend + frontend inside THIS single window, waits until both are
// actually responding, opens the browser, and shuts everything down cleanly
// when you press Ctrl+C or close the window.
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

const BACKEND_HEALTH = "http://localhost:3001/api/health";
const FRONTEND_URL = "http://localhost:5173";

// --- tiny ANSI helpers -----------------------------------------------------
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const colors = { backend: 34, frontend: 35 }; // blue, magenta
const label = (name) => paint(colors[name] ?? 0, `[${name}]`);

const children = [];

function run(name, args, cwd) {
  const child = spawn(npm, args, { cwd, stdio: ["ignore", "pipe", "pipe"], shell: isWin });
  const prefix = (stream) => {
    let buf = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      buf += chunk;
      const lines = buf.split(/\r?\n/);
      buf = lines.pop(); // keep partial line
      for (const line of lines) process.stdout.write(`${label(name)} ${line}\n`);
    });
  };
  prefix(child.stdout);
  prefix(child.stderr);
  child.on("exit", (code) => {
    console.log(`${label(name)} exited with code ${code}`);
    // If one server dies, take the whole launcher down so it's never half-up.
    shutdown(code ?? 1);
  });
  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    if (child.exitCode === null && !child.killed) {
      if (isWin) {
        // Kill the whole process tree (npm -> tsx/vite -> node).
        spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
      } else {
        child.kill("SIGTERM");
      }
    }
  }
  process.exit(code);
}

async function ensureInstalled() {
  const needsInstall =
    !existsSync(join(root, "node_modules")) ||
    !existsSync(join(root, "backend", "node_modules")) ||
    !existsSync(join(root, "frontend", "node_modules"));
  if (!needsInstall) return;
  console.log("📦 Installing dependencies (first run only, this can take a minute)...");
  await new Promise((resolve, reject) => {
    const child = spawn(npm, ["run", "install:all"], { cwd: root, stdio: "inherit", shell: isWin });
    child.on("exit", (c) => (c === 0 ? resolve() : reject(new Error("dependency install failed"))));
  });
}

async function isUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.ok || res.status > 0; // any HTTP response means the server is listening
  } catch {
    return false;
  }
}

async function waitUntilReady() {
  const maxTries = 60; // ~60s
  for (let i = 0; i < maxTries; i++) {
    const [back, front] = await Promise.all([isUp(BACKEND_HEALTH), isUp(FRONTEND_URL)]);
    const b = back ? paint(32, "ready") : "...";
    const f = front ? paint(32, "ready") : "...";
    process.stdout.write(`\r⏳ backend: ${b}   web app: ${f}      `);
    if (back && front) {
      process.stdout.write("\n");
      return true;
    }
    await wait(1000);
  }
  process.stdout.write("\n");
  return false;
}

async function openBrowser(url) {
  const cmd = isWin ? "cmd" : process.platform === "darwin" ? "open" : "xdg-open";
  const args = isWin ? ["/c", "start", "", url] : [url];
  spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
}

async function main() {
  console.log("============================================");
  console.log("                  MyMCP");
  console.log("============================================\n");

  await ensureInstalled();

  console.log("🚀 Starting backend and web app...\n");
  run("backend", ["run", "dev"], join(root, "backend"));
  run("frontend", ["run", "dev"], join(root, "frontend"));

  const ready = await waitUntilReady();
  if (ready) {
    console.log(`\n🌐 Opening ${FRONTEND_URL}`);
  } else {
    console.log(`\n⚠️  Taking longer than expected — opening ${FRONTEND_URL} anyway.`);
  }
  await openBrowser(FRONTEND_URL);

  console.log("\n✅ MyMCP is running in this window. Press Ctrl+C to stop everything.\n");
}

process.on("SIGINT", () => {
  console.log("\n👋 Shutting down MyMCP...");
  shutdown(0);
});
process.on("SIGTERM", () => shutdown(0));

main().catch((err) => {
  console.error(err);
  shutdown(1);
});
