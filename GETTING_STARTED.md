# Getting Started

MyMCP lets you build your own AI tools (MCP servers) **without writing code**.

## One-click start

**Windows**

```
start.bat
```

**macOS / Linux**

```
./start.sh
```

The launcher will, on first run:

1. Install all dependencies (root, backend, frontend).
2. Start the backend on http://localhost:3001.
3. Start the web UI on http://localhost:5173.
4. Open your browser automatically.

> Requires [Node.js 18+](https://nodejs.org) (tested on Node 22).

## What you can do in the UI

| Screen          | What it's for                                                        |
| --------------- | -------------------------------------------------------------------- |
| **Dashboard**   | See your project, tools and MCP status. Import/export `project.json`. |
| **New tool**    | A step-by-step wizard: name → AI description → input fields → action. |
| **Integrations**| Connect Jira, GitHub, Slack, Notion or any REST API (with secrets).  |
| **MCP Server**  | Build, Start, Stop and Restart your generated server. View logs.     |
| **Connect to AI**| Copy ready-made config for Claude Desktop, Cursor, VS Code, etc.    |

## Tool actions

When you create a tool you pick what it does:

- **Call an API** — make an HTTP request. Insert field values with `{{fieldName}}`.
- **Use an integration** — reuse a saved connection (auth headers added for you).
- **Run a script** — JavaScript or Python (advanced). Your code gets a `params`
  object and returns the result.

## How your data is stored

Everything lives in a single, Git-friendly file:

```
projects/example-project/project.json
```

Export it from the Dashboard to back it up or share it.

## Connecting your AI assistant

Open the **Connect to AI** screen. There are two ways to connect:

### Automatic (recommended — no copying)

Under **Connect automatically**, MyMCP detects which apps are installed
(Claude Desktop, VS Code / Copilot, Cursor) and shows a **Connect** button. One
click writes the server straight into that app's config file — your existing
servers are kept and the old file is backed up first. Then just restart the app
(for VS Code, open Copilot Chat in Agent mode).

### Manual

Prefer to do it yourself? Pick the app's tab, click **Copy**, and paste the
snippet into its MCP config file.

The generated server is a standalone artifact in `generated/`. It already links to
the installed dependencies, so a connected client can launch it directly. To run it
on another machine, run `npm install` inside `generated/` first.

## Manual / developer commands

```bash
npm run install:all   # install everything
npm run dev           # run backend + frontend together
npm run build         # type-check & build both
```

- Backend: `backend/` — Node + TypeScript + Express + official MCP SDK.
- Frontend: `frontend/` — React + TypeScript + Vite + TailwindCSS.
- Generator: turns `project.json` into a self-contained MCP server (`generated/server.mjs`).
