import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

export interface ImportedProviderConfig {
  qwenKey?: string;
  qwenHost?: string;
  qwenBaseUrl?: string;
}

export const IMPORTED_QWEN_DEFAULT_MODEL = "qwen3.7-flash";

const ASSETS_DIR = join(process.cwd(), "attached_assets");
const IMPORT_FILE_PREFIX =
  "Pasted--qwen3-5-122b-a10b-1-000-000-qwen-vl-ocr-2025-11-20-1-0_";

function findImportFile(): string | undefined {
  if (!existsSync(ASSETS_DIR)) return undefined;

  return readdirSync(ASSETS_DIR)
    .filter(
      (name) =>
        name.startsWith(IMPORT_FILE_PREFIX) && name.endsWith(".txt"),
    )
    .sort()
    .map((name) => join(ASSETS_DIR, name))
    .find((file) => existsSync(file));
}

/**
 * Reads the provider export imported with the project.
 *
 * The file is intentionally parsed only on the server. Its apiKey value is
 * never returned to the client, logged, or included in an error message.
 */
export function loadImportedProviderConfig(): ImportedProviderConfig {
  const file = findImportFile();
  if (!file) return {};

  try {
    const values = new Map<string, string>();
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const separator = line.indexOf(",");
      if (separator <= 0) continue;

      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      if (key && value) values.set(key, value);
    }

    return {
      qwenKey: values.get("apiKey"),
      qwenHost: values.get("apiHost"),
      qwenBaseUrl: values.get("openAiCompatible"),
    };
  } catch {
    return {};
  }
}