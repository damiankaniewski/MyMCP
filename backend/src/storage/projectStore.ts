import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PROJECTS_DIR } from "../config.js";
import { EMPTY_PROJECT, type Project } from "../types.js";

/**
 * File-backed project storage. Each project is a single `project.json`
 * inside `projects/<id>/`, which is easy to version in Git (README).
 */
export class ProjectStore {
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  private get dir(): string {
    return join(PROJECTS_DIR, this.projectId);
  }

  private get file(): string {
    return join(this.dir, "project.json");
  }

  async load(): Promise<Project> {
    if (!existsSync(this.file)) {
      const fresh: Project = { ...EMPTY_PROJECT };
      await this.save(fresh);
      return fresh;
    }
    const raw = await readFile(this.file, "utf-8");
    return JSON.parse(raw) as Project;
  }

  async save(project: Project): Promise<Project> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(this.file, JSON.stringify(project, null, 2), "utf-8");
    return project;
  }

  /** Read-modify-write helper to keep mutations atomic-ish for a single user. */
  async update(mutator: (project: Project) => void): Promise<Project> {
    const project = await this.load();
    mutator(project);
    return this.save(project);
  }
}
