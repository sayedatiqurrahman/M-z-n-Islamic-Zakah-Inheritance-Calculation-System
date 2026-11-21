import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

export {
  DOCS,
  getDocBySlug,
  githubDocUrl,
  extractToc,
  type DocItem,
  type TocHeading,
} from "./docs-config";

async function readLocalDoc(file: string): Promise<string | null> {
  try {
    const fullPath = path.join(process.cwd(), "docs", file);
    return await readFile(fullPath, "utf8");
  } catch {
    return null;
  }
}

export async function getDocContent(file: string): Promise<{ content: string; source: "local" } | null> {
  const local = await readLocalDoc(file);
  if (local) return { content: local, source: "local" };
  return null;
}
