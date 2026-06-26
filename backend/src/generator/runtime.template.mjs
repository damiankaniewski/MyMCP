// ─────────────────────────────────────────────────────────────────────────────
// MyMCP runtime.
// This file is auto-generated. Do not edit by hand — change your tools in the
// MyMCP UI and re-export instead.
//
// The generator prepends three constants above this block:
//   const SERVER_NAME = "...";
//   const TOOLS = [ ... ];
//   const INTEGRATIONS = [ ... ];
// ─────────────────────────────────────────────────────────────────────────────
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "node:child_process";

// ── Placeholder interpolation ───────────────────────────────────────────────
// Replaces {{param}} and {{secrets.KEY}} tokens inside strings.
function interpolate(template, params, secrets) {
  if (typeof template !== "string") return template;
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key) => {
    if (key.startsWith("secrets.")) {
      const k = key.slice("secrets.".length);
      return secrets?.[k] ?? "";
    }
    const value = params?.[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

function interpolateObject(obj, params, secrets) {
  if (!obj) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = interpolate(v, params, secrets);
  }
  return out;
}

// ── Zod schema from the no-code parameter list ──────────────────────────────
function buildSchema(inputSchema) {
  const shape = {};
  for (const p of inputSchema ?? []) {
    let field;
    switch (p.type) {
      case "number":
        field = z.coerce.number();
        break;
      case "boolean":
        field = z.coerce.boolean();
        break;
      case "select":
        field = p.options?.length ? z.enum(p.options) : z.string();
        break;
      case "date":
      case "text":
      default:
        field = z.string();
        break;
    }
    if (p.description) field = field.describe(p.description);
    if (!p.required) field = field.optional();
    shape[p.name] = field;
  }
  return shape;
}

// ── Execution backends (plugin-style dispatch) ──────────────────────────────
async function runHttp(config, params) {
  const url = interpolate(config.url, params);
  const headers = interpolateObject(config.headers ?? {}, params);
  const init = { method: config.method ?? "GET", headers };
  if (config.body && init.method !== "GET" && init.method !== "DELETE") {
    init.body = interpolate(config.body, params);
  }
  const res = await fetch(url, init);
  const text = await res.text();
  return `HTTP ${res.status} ${res.statusText}\n\n${text}`;
}

async function runIntegration(config, params) {
  const integration = INTEGRATIONS.find((i) => i.id === config.integrationId);
  if (!integration) throw new Error(`Unknown integration: ${config.integrationId}`);
  const secrets = integration.credentials ?? {};
  const base = (integration.baseUrl ?? "").replace(/\/$/, "");
  const path = interpolate(config.path ?? "", params, secrets);
  const url = path.startsWith("http") ? path : `${base}${path}`;

  const headers = { "Content-Type": "application/json" };
  switch (integration.type) {
    case "github":
      if (secrets.token) headers.Authorization = `Bearer ${secrets.token}`;
      headers.Accept = "application/vnd.github+json";
      break;
    case "jira":
      if (secrets.email && secrets.apiToken) {
        const basic = Buffer.from(`${secrets.email}:${secrets.apiToken}`).toString("base64");
        headers.Authorization = `Basic ${basic}`;
      }
      break;
    case "slack":
    case "notion":
      if (secrets.token) headers.Authorization = `Bearer ${secrets.token}`;
      if (integration.type === "notion") headers["Notion-Version"] = "2022-06-28";
      break;
    case "google-sheets":
    case "google-calendar":
    case "gmail":
      if (secrets.accessToken) headers.Authorization = `Bearer ${secrets.accessToken}`;
      break;
    case "rest":
    default:
      if (secrets.apiKey) headers.Authorization = `Bearer ${secrets.apiKey}`;
      break;
  }

  const init = { method: config.method ?? "GET", headers };
  if (config.body && init.method !== "GET" && init.method !== "DELETE") {
    init.body = interpolate(config.body, params, secrets);
  }
  const res = await fetch(url, init);
  const text = await res.text();
  return `HTTP ${res.status} ${res.statusText}\n\n${text}`;
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

async function runJavaScript(config, params) {
  const fn = new AsyncFunction("params", "fetch", config.code);
  const result = await fn(params, fetch);
  return typeof result === "string" ? result : JSON.stringify(result, null, 2);
}

function runPython(config, params) {
  return new Promise((resolve, reject) => {
    const py = process.platform === "win32" ? "python" : "python3";
    const wrapper = [
      "import sys, json",
      "params = json.loads(sys.argv[1])",
      "def __run(params):",
      ...config.code.split("\n").map((l) => "    " + l),
      "result = __run(params)",
      "sys.stdout.write(result if isinstance(result, str) else json.dumps(result))",
    ].join("\n");
    const child = spawn(py, ["-c", wrapper, JSON.stringify(params)]);
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(err || `python exited with code ${code}`));
    });
  });
}

async function execute(tool, params) {
  switch (tool.executionType) {
    case "http":
      return runHttp(tool.executionConfig, params);
    case "integration":
      return runIntegration(tool.executionConfig, params);
    case "javascript":
      return runJavaScript(tool.executionConfig, params);
    case "python":
      return runPython(tool.executionConfig, params);
    default:
      throw new Error(`Unsupported execution type: ${tool.executionType}`);
  }
}

// ── Server bootstrap ────────────────────────────────────────────────────────
const server = new McpServer({ name: SERVER_NAME, version: "1.0.0" });

for (const tool of TOOLS) {
  server.tool(tool.name, tool.description, buildSchema(tool.inputSchema), async (params) => {
    try {
      const text = await execute(tool, params);
      return { content: [{ type: "text", text }] };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error running "${tool.name}": ${error.message}` }],
      };
    }
  });
}

const transport = new StdioServerTransport();
await server.connect(transport);
