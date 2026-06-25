// Domain model shared across the backend. Mirrors README "Model danych".

export type ParameterType = "text" | "number" | "boolean" | "date" | "select";

export interface InputParameter {
  name: string;
  description: string;
  type: ParameterType;
  required: boolean;
  options?: string[];
}

export type ExecutionType = "http" | "javascript" | "python" | "integration";

export interface HttpExecutionConfig {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** URL may contain {{paramName}} placeholders. */
  url: string;
  /** Header values may contain {{paramName}} and {{secrets.KEY}} placeholders. */
  headers?: Record<string, string>;
  /** Raw body string; supports {{paramName}} placeholders. */
  body?: string;
}

export interface ScriptExecutionConfig {
  /** User code. Receives `params` (object) and must return a value. */
  code: string;
}

export interface IntegrationExecutionConfig {
  integrationId: string;
  /** Relative path appended to the integration base URL; supports placeholders. */
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
}

export type ExecutionConfig =
  | HttpExecutionConfig
  | ScriptExecutionConfig
  | IntegrationExecutionConfig;

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: InputParameter[];
  executionType: ExecutionType;
  /** Shape depends on executionType (see *ExecutionConfig interfaces above). */
  executionConfig: ExecutionConfig | Record<string, unknown>;
}

export type IntegrationType = "jira" | "github" | "slack" | "notion" | "rest";

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  /** Base URL for the integration, when applicable. */
  baseUrl?: string;
  credentials: Record<string, string>;
}

export interface Project {
  name: string;
  description: string;
  tools: ToolDefinition[];
  integrations: Integration[];
}

export const EMPTY_PROJECT: Project = {
  name: "My MCP Server",
  description: "Tools for my AI assistant",
  tools: [],
  integrations: [],
};
