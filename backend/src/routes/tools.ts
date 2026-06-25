import { Router } from "express";
import { nanoid } from "nanoid";
import { store } from "../storage/activeStore.js";
import { toolInputSchema } from "../validation.js";
import type { ToolDefinition } from "../types.js";

export const toolsRouter = Router();

toolsRouter.get("/", async (_req, res) => {
  const project = await store.load();
  res.json(project.tools);
});

toolsRouter.post("/", async (req, res) => {
  const parsed = toolInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const tool: ToolDefinition = { id: nanoid(8), ...parsed.data };
  await store.update((p) => {
    p.tools.push(tool);
  });
  res.status(201).json(tool);
});

toolsRouter.put("/:id", async (req, res) => {
  const parsed = toolInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  let updated: ToolDefinition | null = null;
  await store.update((p) => {
    const idx = p.tools.findIndex((t) => t.id === req.params.id);
    if (idx >= 0) {
      updated = { ...p.tools[idx], ...parsed.data, id: p.tools[idx].id };
      p.tools[idx] = updated;
    }
  });
  if (!updated) return res.status(404).json({ error: "Tool not found" });
  res.json(updated);
});

toolsRouter.delete("/:id", async (req, res) => {
  let removed = false;
  await store.update((p) => {
    const before = p.tools.length;
    p.tools = p.tools.filter((t) => t.id !== req.params.id);
    removed = p.tools.length < before;
  });
  if (!removed) return res.status(404).json({ error: "Tool not found" });
  res.status(204).end();
});
