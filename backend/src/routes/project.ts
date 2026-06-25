import { Router } from "express";
import { store } from "../storage/activeStore.js";
import { projectMetaSchema } from "../validation.js";
import type { Project } from "../types.js";

export const projectRouter = Router();

// Full project (used by import/export and the dashboard).
projectRouter.get("/", async (_req, res) => {
  const project = await store.load();
  res.json(project);
});

// Update project name/description.
projectRouter.put("/", async (req, res) => {
  const parsed = projectMetaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const project = await store.update((p) => {
    p.name = parsed.data.name;
    p.description = parsed.data.description;
  });
  res.json(project);
});

// Import a whole project.json (replaces current project).
projectRouter.post("/import", async (req, res) => {
  const incoming = req.body as Partial<Project>;
  if (!incoming || typeof incoming.name !== "string") {
    return res.status(400).json({ error: "Invalid project file" });
  }
  const project: Project = {
    name: incoming.name,
    description: incoming.description ?? "",
    tools: Array.isArray(incoming.tools) ? incoming.tools : [],
    integrations: Array.isArray(incoming.integrations) ? incoming.integrations : [],
  };
  await store.save(project);
  res.json(project);
});
