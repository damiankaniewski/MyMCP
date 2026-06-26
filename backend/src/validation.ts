import { z } from "zod";

export const parameterSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Use letters, numbers and underscores only"),
  description: z.string().default(""),
  type: z.enum(["text", "number", "boolean", "date", "select"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

export const toolInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  inputSchema: z.array(parameterSchema).default([]),
  executionType: z.enum(["http", "javascript", "python", "integration"]),
  executionConfig: z.record(z.unknown()).default({}),
});

export const integrationInputSchema = z.object({
  type: z.enum(["jira", "github", "slack", "notion", "google-sheets", "google-calendar", "gmail", "rest"]),
  name: z.string().min(1, "Name is required"),
  baseUrl: z.string().optional(),
  credentials: z.record(z.string()).default({}),
});

export const projectMetaSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
});

export type ToolInput = z.infer<typeof toolInputSchema>;
export type IntegrationInput = z.infer<typeof integrationInputSchema>;
