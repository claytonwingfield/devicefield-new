import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const [submissionArgument, runIdArgument] = process.argv.slice(2);
const ingestUrl = process.env.CODEX_DRAFT_INGEST_URL;
const ingestToken =
  process.env.DEVICEFIELD_INGEST_AUTH ??
  process.env.CODEX_DRAFT_INGEST_TOKEN;

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function validRunId(value) {
  return typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(value.trim())
    ? value.trim()
    : null;
}

async function main() {
  if (!submissionArgument) {
    throw new Error(
      "Usage: node scripts/submit-codex-newsletter-draft.mjs <newsletter.json> [run-id]",
    );
  }
  if (!ingestUrl || !ingestToken || ingestToken.length < 32) {
    throw new Error(
      "Missing CODEX_DRAFT_INGEST_URL or Devicefield ingest authorization.",
    );
  }

  const base = new URL(ingestUrl);
  if (
    base.protocol !== "https:" &&
    !(base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname))
  ) {
    throw new Error("CODEX_DRAFT_INGEST_URL must use HTTPS.");
  }

  const bytes = await readFile(resolve(submissionArgument));
  if (bytes.byteLength > 40_000) {
    throw new Error("Newsletter draft is too large.");
  }
  let payload;
  try {
    payload = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error("Newsletter submission must contain valid JSON.");
  }
  if (!isRecord(payload)) {
    throw new Error("Newsletter submission must be a JSON object.");
  }

  const runId =
    validRunId(runIdArgument) ??
    `newsletter-${createHash("sha256").update(bytes).digest("hex").slice(0, 32)}`;
  const endpoint = new URL("/api/internal/codex/newsletters", base.origin);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ingestToken}`,
      "Content-Type": "application/json",
      "X-Devicefield-Run-Id": runId,
    },
    body: bytes,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      isRecord(result) && typeof result.error === "string"
        ? result.error
        : `Newsletter submission failed (${response.status}).`,
    );
  }
  if (
    !isRecord(result) ||
    !isRecord(result.campaign) ||
    typeof result.campaign.id !== "string" ||
    result.campaign.status !== "ready_for_review"
  ) {
    throw new Error("Newsletter endpoint returned an invalid response.");
  }

  console.log(
    JSON.stringify(
      {
        id: result.campaign.id,
        name: result.campaign.name,
        status: result.campaign.status,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Newsletter submission failed.",
  );
  process.exitCode = 1;
});
