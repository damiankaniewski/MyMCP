import { Router } from "express";
import { nanoid } from "nanoid";
import { store } from "../storage/activeStore.js";
import { integrationInputSchema } from "../validation.js";
import type { Integration } from "../types.js";

export const integrationsRouter = Router();

integrationsRouter.get("/", async (_req, res) => {
  const project = await store.load();
  res.json(project.integrations);
});

integrationsRouter.post("/", async (req, res) => {
  const parsed = integrationInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const integration: Integration = { id: nanoid(8), ...parsed.data };
  await store.update((p) => {
    p.integrations.push(integration);
  });
  res.status(201).json(integration);
});

integrationsRouter.put("/:id", async (req, res) => {
  const parsed = integrationInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  let updated: Integration | null = null;
  await store.update((p) => {
    const idx = p.integrations.findIndex((i) => i.id === req.params.id);
    if (idx >= 0) {
      updated = { ...p.integrations[idx], ...parsed.data, id: p.integrations[idx].id };
      p.integrations[idx] = updated;
    }
  });
  if (!updated) return res.status(404).json({ error: "Integration not found" });
  res.json(updated);
});

integrationsRouter.delete("/:id", async (req, res) => {
  let removed = false;
  await store.update((p) => {
    const before = p.integrations.length;
    p.integrations = p.integrations.filter((i) => i.id !== req.params.id);
    removed = p.integrations.length < before;
  });
  if (!removed) return res.status(404).json({ error: "Integration not found" });
  res.status(204).end();
});

// Lightweight "Test connection": a HEAD/GET against the base URL.
integrationsRouter.post("/:id/test", async (req, res) => {
  const project = await store.load();
  const integration = project.integrations.find((i) => i.id === req.params.id);
  if (!integration) return res.status(404).json({ error: "Integration not found" });
  if (!integration.baseUrl) {
    return res.json({ ok: false, message: "No base URL configured." });
  }
  try {
    const response = await fetch(integration.baseUrl, { method: "GET" });
    res.json({
      ok: response.ok,
      status: response.status,
      message: response.ok ? "Connection successful" : `Server replied ${response.status}`,
    });
  } catch (error) {
    res.json({ ok: false, message: (error as Error).message });
  }
});
