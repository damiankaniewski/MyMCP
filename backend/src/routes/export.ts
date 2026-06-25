import { Router } from "express";
import { ACTIVE_PROJECT_ID } from "../config.js";
import { store } from "../storage/activeStore.js";
import { generateServer } from "../generator/generateServer.js";
import { buildExport, type ExportTarget } from "../generator/exports.js";
import {
  ALL_TARGETS,
  detectTargets,
  installToClient,
  type InstallTarget,
} from "../generator/installers.js";

export const exportRouter = Router();

// The manual snippet tabs mirror the three supported agents.
const TARGETS: ExportTarget[] = ["claude", "copilot", "cursor"];

// Returns ready-to-paste client configs for every supported target.
exportRouter.get("/configs", async (_req, res) => {
  const project = await store.load();
  const { serverName } = await generateServer(project, ACTIVE_PROJECT_ID);
  const configs: Record<string, unknown> = {};
  for (const target of TARGETS) {
    configs[target] = buildExport(target, serverName);
  }
  res.json({ serverName, configs });
});

// Which clients we can auto-configure, and whether they're installed here.
exportRouter.get("/install/targets", (_req, res) => {
  res.json(detectTargets());
});

// One-click: write the generated server straight into a client's config file.
exportRouter.post("/install/:target", async (req, res) => {
  const target = req.params.target as InstallTarget;
  if (!ALL_TARGETS.includes(target)) {
    return res.status(400).json({ error: "Unknown target" });
  }
  const project = await store.load();
  const { serverName } = await generateServer(project, ACTIVE_PROJECT_ID);
  const result = await installToClient(target, serverName);
  res.json(result);
});

// Raw project.json download (for import elsewhere / version control).
exportRouter.get("/project.json", async (_req, res) => {
  const project = await store.load();
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="project.json"'
  );
  res.send(JSON.stringify(project, null, 2));
});
