import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const packagePath = process.argv[2];
const endpoint = process.env.CODEX_DRAFT_INGEST_URL;
const token = process.env.CODEX_DRAFT_INGEST_TOKEN;

if (!packagePath) {
  throw new Error("Usage: npm run draft:ingest -- path/to/article.json");
}
if (!endpoint || !token) {
  throw new Error(
    "CODEX_DRAFT_INGEST_URL and CODEX_DRAFT_INGEST_TOKEN are required.",
  );
}

const articlePackage = JSON.parse(await readFile(resolve(packagePath), "utf8"));
const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(articlePackage),
});
const result = await response.json().catch(() => null);

if (!response.ok) {
  throw new Error(result?.error ?? `Draft ingestion failed (${response.status}).`);
}

console.log(
  JSON.stringify(
    {
      id: result.id,
      slug: result.slug,
      workflowStatus: result.workflowStatus,
      created: result.created,
    },
    null,
    2,
  ),
);
