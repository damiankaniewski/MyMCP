import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Repository root (two levels up from backend/src). */
export const ROOT_DIR = join(__dirname, "..", "..");

export const PROJECTS_DIR = join(ROOT_DIR, "projects");
export const GENERATED_DIR = join(ROOT_DIR, "generated");
export const TEMPLATES_DIR = join(ROOT_DIR, "templates");

/** Single active project for the MVP (single-user, local). */
export const ACTIVE_PROJECT_ID = "example-project";

export const PORT = Number(process.env.PORT ?? 3001);