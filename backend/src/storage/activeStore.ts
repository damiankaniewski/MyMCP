import { ACTIVE_PROJECT_ID } from "../config.js";
import { ProjectStore } from "./projectStore.js";

/** The single active project store for this local instance. */
export const store = new ProjectStore(ACTIVE_PROJECT_ID);
