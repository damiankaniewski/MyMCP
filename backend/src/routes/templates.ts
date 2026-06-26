import { Router } from "express";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { TEMPLATES_DIR } from "../config.js";

export const templatesRouter = Router();

templatesRouter.get("/", async (_req, res) => {
  try {
    const entries = await readdir(TEMPLATES_DIR, { withFileTypes: true });
    const templates = await Promise.all(
      entries
        .filter((e) => e.isDirectory())
        .map(async (e) => {
          const file = join(TEMPLATES_DIR, e.name, "template.json");
          const raw = await readFile(file, "utf-8");
          return JSON.parse(raw);
        })
    );
    res.json(templates);
  } catch {
    res.json([]);
  }
});
