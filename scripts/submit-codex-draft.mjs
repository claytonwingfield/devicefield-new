import { createHash } from "node:crypto";
import { access, readFile, stat } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";

const [submissionArgument, imageArgument] = process.argv.slice(2);
const ingestUrl = process.env.CODEX_DRAFT_INGEST_URL;
const ingestToken = process.env.CODEX_DRAFT_INGEST_TOKEN;

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function validRunId(value) {
  return typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(value.trim())
    ? value.trim()
    : null;
}

async function getRunId(payload, submissionPath, submissionBytes, imageBytes) {
  const payloadRunId = validRunId(payload.run_id);
  if (payloadRunId) return payloadRunId;

  try {
    const runLog = await readFile(join(dirname(submissionPath), "run-log.md"), "utf8");
    const runLogId = runLog.match(
      /(?:^|\n)\s*Run ID\s*:?[ \t]*`?([A-Za-z0-9][A-Za-z0-9._:-]{7,127})`?/i,
    )?.[1];
    const normalized = validRunId(runLogId);
    if (normalized) return normalized;
  } catch {
    // A deterministic content ID keeps retries idempotent when no run log exists.
  }

  return `codex-${createHash("sha256")
    .update(submissionBytes)
    .update("\0")
    .update(imageBytes)
    .digest("hex")
    .slice(0, 32)}`;
}

async function main() {
  if (!submissionArgument || !imageArgument) {
    throw new Error(
      "Usage: node scripts/submit-codex-draft.mjs <submission.json> <featured-image.webp>",
    );
  }
  if (!ingestUrl || !ingestToken) {
    throw new Error(
      "Missing CODEX_DRAFT_INGEST_URL or CODEX_DRAFT_INGEST_TOKEN.",
    );
  }
  if (ingestToken.length < 32) {
    throw new Error("CODEX_DRAFT_INGEST_TOKEN is not configured correctly.");
  }

  const endpoint = new URL(ingestUrl);
  if (
    endpoint.protocol !== "https:" &&
    !(endpoint.protocol === "http:" && ["localhost", "127.0.0.1"].includes(endpoint.hostname))
  ) {
    throw new Error("CODEX_DRAFT_INGEST_URL must use HTTPS.");
  }

  const submissionPath = resolve(submissionArgument);
  const imagePath = resolve(imageArgument);
  await Promise.all([access(submissionPath), access(imagePath)]);
  const [submissionInfo, imageInfo] = await Promise.all([
    stat(submissionPath),
    stat(imagePath),
  ]);
  if (!submissionInfo.isFile() || !imageInfo.isFile()) {
    throw new Error("Submission and featured image paths must be files.");
  }

  const extension = extname(imagePath).toLowerCase();
  const imageType =
    extension === ".webp"
      ? "image/webp"
      : extension === ".png"
        ? "image/png"
        : null;
  if (!imageType) throw new Error("Featured image must be a WebP or PNG file.");

  const [submissionBytes, imageBytes] = await Promise.all([
    readFile(submissionPath),
    readFile(imagePath),
  ]);
  let payload;
  try {
    payload = JSON.parse(submissionBytes.toString("utf8"));
  } catch {
    throw new Error("Submission file must contain valid JSON.");
  }
  if (!isRecord(payload)) {
    throw new Error("Submission payload must be a JSON object.");
  }

  const runId = await getRunId(
    payload,
    submissionPath,
    submissionBytes,
    imageBytes,
  );
  const article = { ...payload };
  delete article.run_id;
  const formData = new FormData();
  formData.set("payload", JSON.stringify(article));
  formData.set(
    "featured_image",
    new Blob([imageBytes], { type: imageType }),
    basename(imagePath),
  );

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ingestToken}`,
        "X-Devicefield-Run-ID": runId,
      },
      body: formData,
    });
  } catch {
    throw new Error("Draft submission could not reach the ingestion endpoint.");
  }

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      isRecord(result) && typeof result.error === "string"
        ? result.error
        : `Draft submission failed (${response.status}).`,
    );
  }
  if (
    !isRecord(result) ||
    typeof result.id !== "string" ||
    typeof result.slug !== "string" ||
    result.workflow_status !== "ready_for_review" ||
    typeof result.cover_image_url !== "string" ||
    typeof result.created_at !== "string"
  ) {
    throw new Error("Draft endpoint returned an invalid response.");
  }

  console.log(
    JSON.stringify(
      {
        id: result.id,
        slug: result.slug,
        workflow_status: result.workflow_status,
        cover_image_url: result.cover_image_url,
        created_at: result.created_at,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : "Draft submission failed.");
});
