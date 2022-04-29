/**
 * Set this in the transform entrypoint to the file path of the current file:
 *
 *   import { globalForLogging } from "./logging";
 *
 *   export default function transformer(file: types.FileInfo, api: types.API) {
 *     globalForLogging.filepath = file.path;
 *     // ...
 *   }
 *
 */
export let globalForLogging = {
  filepath: "Filepath not set",
};

/**
 *
 */
export const consoleError = (...args: any[]) => {
  console.error(`ERROR ${globalForLogging.filepath}:`, ...args);
};

/**
 *
 */
export const consoleWarn = (...args: any[]) => {
  console.warn(`WARNING ${globalForLogging.filepath}:`, ...args);
};
