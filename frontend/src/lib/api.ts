import type {
  Integration,
  Project,
  ServerInfo,
  ToolDefinition,
} from "@/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = JSON.stringify(body.error ?? body);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type ToolInput = Omit<ToolDefinition, "id">;
export type IntegrationInput = Omit<Integration, "id">;

export const api = {
  // Project
  getProject: () => request<Project>("/project"),
  updateProject: (data: { name: string; description: string }) =>
    request<Project>("/project", { method: "PUT", body: JSON.stringify(data) }),
  importProject: (project: Project) =>
    request<Project>("/project/import", {
      method: "POST",
      body: JSON.stringify(project),
    }),

  // Tools
  getTools: () => request<ToolDefinition[]>("/tools"),
  createTool: (tool: ToolInput) =>
    request<ToolDefinition>("/tools", { method: "POST", body: JSON.stringify(tool) }),
  updateTool: (id: string, tool: ToolInput) =>
    request<ToolDefinition>(`/tools/${id}`, {
      method: "PUT",
      body: JSON.stringify(tool),
    }),
  deleteTool: (id: string) => request<void>(`/tools/${id}`, { method: "DELETE" }),

  // Integrations
  getIntegrations: () => request<Integration[]>("/integrations"),
  createIntegration: (integration: IntegrationInput) =>
    request<Integration>("/integrations", {
      method: "POST",
      body: JSON.stringify(integration),
    }),
  updateIntegration: (id: string, integration: IntegrationInput) =>
    request<Integration>(`/integrations/${id}`, {
      method: "PUT",
      body: JSON.stringify(integration),
    }),
  deleteIntegration: (id: string) =>
    request<void>(`/integrations/${id}`, { method: "DELETE" }),
  testIntegration: (id: string) =>
    request<{ ok: boolean; status?: number; message: string }>(
      `/integrations/${id}/test`,
      { method: "POST" }
    ),

  // Templates
  getTemplates: () => request<ServiceTemplate[]>("/templates"),

  // Tools – bulk
  createToolsBulk: (tools: ToolInput[]) =>
    request<ToolDefinition[]>("/tools/bulk", {
      method: "POST",
      body: JSON.stringify(tools),
    }),

  // Server (status only; the server.mjs is regenerated automatically on demand)
  getServerInfo: () => request<ServerInfo>("/server/info"),

  // Export
  getExportConfigs: () =>
    request<{ serverName: string; configs: Record<string, unknown> }>(
      "/export/configs"
    ),
  getInstallTargets: () =>
    request<InstallTargetStatus[]>("/export/install/targets"),
  installToClient: (target: string) =>
    request<InstallResult>(`/export/install/${target}`, { method: "POST" }),
};

export interface StarterTool {
  name: string;
  description: string;
  inputSchema: import("@/types").InputParameter[];
  executionType: import("@/types").ExecutionType;
  executionConfig: Record<string, unknown>;
}

export interface ServiceTemplate {
  type: import("@/types").IntegrationType;
  name: string;
  label: string;
  baseUrlHint: string;
  credentials: { key: string; label: string; secret?: boolean }[];
  starterTools: StarterTool[];
}

export interface InstallTargetStatus {
  target: "claude" | "copilot" | "cursor";
  label: string;
  detected: boolean;
}

export interface InstallResult {
  ok: boolean;
  detected: boolean;
  target: string;
  label: string;
  path: string;
  message: string;
}
