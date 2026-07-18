import { createHash } from "node:crypto";
import { access, readFile, stat } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";

const [submissionArgument, imageArgument] = process.argv.slice(2);
const ingestUrl = process.env.CODEX_DRAFT_INGEST_URL;
const ingestToken =
  process.env.DEVICEFIELD_INGEST_AUTH ??
  process.env.CODEX_DRAFT_INGEST_TOKEN;

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
    .update(Buffer.concat(imageBytes))
    .digest("hex")
    .slice(0, 32)}`;
}

function getImageType(fileName) {
  const extension = extname(fileName).toLowerCase();
  if (extension === ".webp") return "image/webp";
  if (extension === ".png") return "image/png";
  return null;
}

async function getBodyImages(payload, submissionPath) {
  const manifest = payload.body_images ?? [];
  if (!Array.isArray(manifest) || manifest.length > 4) {
    throw new Error("body_images must contain at most four items.");
  }

  return Promise.all(
    manifest.map(async (item) => {
      if (
        !isRecord(item) ||
        typeof item.file_name !== "string" ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:png|webp)$/.test(item.file_name)
      ) {
        throw new Error("Each body image must have a safe PNG or WebP file name.");
      }
      const type = getImageType(item.file_name);
      const path = resolve(dirname(submissionPath), "body-images", item.file_name);
      const expectedDirectory = resolve(dirname(submissionPath), "body-images");
      if (dirname(path) !== expectedDirectory || !type) {
        throw new Error("Body images must be stored in the article body-images folder.");
      }
      await access(path);
      const info = await stat(path);
      if (!info.isFile()) throw new Error("Body image paths must be files.");
      return { bytes: await readFile(path), fileName: item.file_name, type };
    }),
  );
}

async function main() {
  if (!submissionArgument || !imageArgument) {
    throw new Error(
      "Usage: node scripts/submit-codex-draft.mjs <submission.json> <featured-image.webp>",
    );
  }
  if (!ingestUrl || !ingestToken) {
    throw new Error(
      "Missing CODEX_DRAFT_INGEST_URL or Devicefield ingest authorization.",
    );
  }

  if (ingestToken.length < 32) {
    throw new Error(
      "Devicefield ingest authorization is not configured correctly.",
    );
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

  const imageType = getImageType(imagePath);
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
  const bodyImages = await getBodyImages(payload, submissionPath);

  const runId = await getRunId(
    payload,
    submissionPath,
    submissionBytes,
    [imageBytes, ...bodyImages.map((image) => image.bytes)],
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
  for (const bodyImage of bodyImages) {
    formData.append(
      "body_image",
      new Blob([bodyImage.bytes], { type: bodyImage.type }),
      bodyImage.fileName,
    );
  }

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
