<div align="center">

# MyMCP

**Build your own MCP servers — no code required.**

A local, no-code builder for [Model Context Protocol (MCP)](https://modelcontextprotocol.io) servers. Assemble your own AI tools and connect them to Claude, Cursor, VS Code Copilot, and any other MCP-compatible assistant — without writing a single line of code.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.x-7C3AED)](https://github.com/modelcontextprotocol)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Quick Start](#quick-start) · [Features](#features) · [How it works](#how-it-works) · [Connect your AI](#connect-your-ai-assistant) · [Architecture](#architecture) · [Contributing](#contributing)

</div>

---

## What is MyMCP?

The **Model Context Protocol (MCP)** is the open standard that lets AI assistants such as Claude securely call external tools and APIs. Building an MCP server normally means writing TypeScript or Python, defining JSON schemas, and wiring up a runtime.

MyMCP removes the code. It is a local web app where you:

1. Describe a tool in plain language.
2. Add the input fields your tool needs.
3. Point it at an API, an integration, or a script.
4. Click **Connect** — and your AI assistant can use it.

It is built for people who know what they want their AI to do, but would rather not become backend engineers to make it happen: manual testers, product and project managers, business analysts, team leads, and AI power users.

Everything runs locally. No accounts, no cloud, no SaaS — your tools and secrets never leave your machine.

---

## Features

- **No-code Tool Wizard.** Create AI tools step by step: name, AI-facing description, input fields, action. The JSON Schema is generated for you.
- **Three ways to power a tool.** Call any REST API, reuse a saved integration, or run a JavaScript / Python script for advanced cases.
- **Built-in integrations.** Jira, GitHub, Slack, Notion, and generic REST, with stored credentials and connection testing.
- **One-click connect.** MyMCP detects installed clients (Claude Desktop, Cursor, VS Code / Copilot) and writes the config for you. Existing servers are preserved and the previous config is backed up first.
- **Manual export.** Copy ready-to-paste config snippets for any MCP client.
- **Git-friendly projects.** Your entire setup is a single `project.json` file you can version, share, and import.
- **Local and private by design.** No sign-up, no telemetry, no cloud. Secrets stay on your machine.
- **One command to launch.** `start.bat` / `start.sh` installs everything, boots the server and UI, and opens your browser.

---

## Quick Start

> **Prerequisite:** [Node.js 18+](https://nodejs.org) (tested on Node 22).

### 1. Clone the repository

```bash
git clone https://github.com/damiankaniewski/MyMCP.git
cd MyMCP
```

### 2. Run the launcher

**Windows**

```bat
start.bat
```

**macOS / Linux**

```bash
./start.sh
```

On first run the launcher will:

1. Install all dependencies (root, backend, frontend).
2. Start the backend on `http://localhost:3001`.
3. Start the web UI on `http://localhost:5173`.
4. Open your browser automatically.

---

## How it works

MyMCP provides a small set of focused screens:

| Screen            | Purpose                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| **Dashboard**     | See your project, tools, and MCP status. Import / export `project.json`.    |
| **New tool**      | A step-by-step wizard: name, AI description, input fields, action.          |
| **Integrations**  | Connect Jira, GitHub, Slack, Notion, or any REST API (with secrets).        |
| **MCP Server**    | Build, start, stop, and restart your generated server. View logs.           |
| **Connect to AI** | Copy ready-made config, or auto-connect to Claude Desktop, Cursor, VS Code. |

### Tool actions

When you create a tool, you choose what it does:

- **Call an API** — make an HTTP request. Insert field values with `{{fieldName}}` and secrets with `{{secrets.KEY}}`.
- **Use an integration** — reuse a saved connection; auth headers are added for you.
- **Run a script** — JavaScript or Python (advanced). Your code receives a `params` object and returns the result.

### Example tool

A "Get Public Holidays" tool, built entirely in the UI, compiles down to this in your `project.json`:

```json
{
  "name": "get_public_holidays",
  "description": "Returns public holidays for a given country and year.",
  "inputSchema": [
    { "name": "country", "type": "text",   "required": true, "description": "Two-letter code, e.g. PL" },
    { "name": "year",    "type": "number", "required": true, "description": "Year, e.g. 2026" }
  ],
  "executionType": "http",
  "executionConfig": {
    "method": "GET",
    "url": "https://date.nager.at/api/v3/PublicHolidays/{{year}}/{{country}}"
  }
}
```

Your AI assistant now has a `get_public_holidays` tool it can call on its own.

---

## Connect your AI assistant

Open the **Connect to AI** screen. There are two ways to connect.

### Automatic (recommended)

MyMCP detects which apps are installed and shows a **Connect** button. One click writes the server straight into that app's MCP config — your existing servers are kept and the previous file is backed up first. Then restart the app (for VS Code, open Copilot Chat in Agent mode).

### Manual

Pick the app's tab, click **Copy**, and paste the snippet into its MCP config file:

```json
{
  "mcpServers": {
    "my-mcp": {
      "command": "node",
      "args": ["generated/server.mjs"]
    }
  }
}
```

Supported clients: Claude Desktop, Cursor, VS Code / Copilot, and any client that speaks MCP over stdio.

---

## Architecture

```text
mymcp/
├── frontend/        React + TypeScript + Vite + TailwindCSS web UI
├── backend/         Node + TypeScript + Express + official MCP SDK
│   └── src/
│       ├── generator/   turns project.json into a standalone MCP server
│       ├── routes/      project · tools · integrations · server · export
│       └── storage/     project persistence
├── projects/        your project.json lives here (Git-friendly)
├── templates/       starter integration templates (Jira, GitHub, Slack)
├── generated/       the compiled MCP server artifact (generated/server.mjs)
├── start.bat        one-click launcher (Windows)
└── start.sh         one-click launcher (macOS / Linux)
```

### Tech stack

| Layer         | Technologies                                                             |
| ------------- | ------------------------------------------------------------------------ |
| **Frontend**  | React 18 · TypeScript · Vite · TailwindCSS · React Router · lucide-react  |
| **Backend**   | Node.js · TypeScript · Express · `@modelcontextprotocol/sdk` · Zod       |
| **Generator** | Compiles `project.json` into a self-contained `server.mjs` (stdio)        |

### Data storage

Everything lives in a single, Git-friendly file:

```text
projects/example-project/project.json
```

Export it from the Dashboard to back it up or share it. Local secrets are kept in a separate `secrets.json` that is git-ignored by default.

---

## Developer commands

```bash
npm run install:all   # install everything (root + backend + frontend)
npm run dev           # run backend + frontend together with live reload
npm run build         # type-check and build both
```

- **Backend** — `backend/` (Node + TypeScript + Express + official MCP SDK).
- **Frontend** — `frontend/` (React + TypeScript + Vite + TailwindCSS).
- **Generator** — turns `project.json` into a self-contained MCP server at `generated/server.mjs`.

The generated server links to the installed dependencies, so a connected client can launch it directly. To run it on another machine, run `npm install` inside `generated/` first.

---

## Roadmap

- [x] No-code Tool Wizard (HTTP, script, integration)
- [x] One-click connect for Claude Desktop, Cursor, VS Code
- [x] Project import / export
- [ ] Expanded built-in integrations (Notion, Google Sheets)
- [ ] Marketplace of ready-made tool templates
- [ ] Python script execution out of the box

Have an idea? [Open an issue](../../issues).

---

## Contributing

Contributions, bug reports, and feature requests are welcome.

1. Fork the repository and create your branch: `git checkout -b feature/my-feature`
2. Make your changes and run `npm run build` to type-check.
3. Commit, push, and open a pull request.

The codebase favors modular, well-typed, feature-based code and a plugin-style architecture, so new integrations require minimal changes elsewhere.

### Contributors

- **Damian Kaniewski** — [@damiankaniewski](https://github.com/damiankaniewski)

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
