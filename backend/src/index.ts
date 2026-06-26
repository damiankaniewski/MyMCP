import express from "express";
import cors from "cors";
import { PORT } from "./config.js";
import { projectRouter } from "./routes/project.js";
import { toolsRouter } from "./routes/tools.js";
import { integrationsRouter } from "./routes/integrations.js";
import { templatesRouter } from "./routes/templates.js";
import { serverRouter } from "./routes/server.js";
import { exportRouter } from "./routes/export.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/project", projectRouter);
app.use("/api/tools", toolsRouter);
app.use("/api/integrations", integrationsRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/server", serverRouter);
app.use("/api/export", exportRouter);

app.listen(PORT, () => {
  console.log(`🛠️  MyMCP backend on http://localhost:${PORT}`);
});
