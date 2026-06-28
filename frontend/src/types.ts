export type ParameterType = "text" | "number" | "boolean" | "date" | "select";

export interface InputParameter {
  name: string;
  description: string;
  type: ParameterType;
  required: boolean;
  options?: string[];
}

export type ExecutionType = "http" | "javascript" | "python" | "integration";

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: InputParameter[];
  executionType: ExecutionType;
  executionConfig: Record<string, unknown>;
}

export type IntegrationType =
  | "jira"
  | "github"
  | "slack"
  | "notion"
  | "google-sheets"
  | "google-calendar"
  | "gmail"
  | "linear"
  | "confluence"
  | "ms-teams"
  | "airtable"
  | "discord"
  | "stripe"
  | "hubspot"
  | "zendesk"
  | "rest";

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  baseUrl?: string;
  credentials: Record<string, string>;
}

export interface Project {
  name: string;
  description: string;
  tools: ToolDefinition[];
  integrations: Integration[];
}

export interface ConnectionStatus {
  target: "claude" | "copilot" | "cursor";
  label: string;
  detected: boolean;
  connected: boolean;
}

export interface ServerInfo {
  built: boolean;
  serverName: string;
  toolCount: number;
  transport: string;
  connections: ConnectionStatus[];
}
