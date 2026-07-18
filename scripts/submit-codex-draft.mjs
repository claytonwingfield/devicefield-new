import { createHash } from "node:crypto";
import { access, readFile, stat } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";

const [submissionArgument, ...imageArguments] = process.argv.slice(2);
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
  if (!submissionArgument || imageArguments.length !== 3) {
    throw new Error(
      "Usage: node scripts/submit-codex-draft.mjs <submission.json> <cover-option-1.webp> <cover-option-2.webp> <cover-option-3.webp>",
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
  const imagePaths = imageArguments.map((argument) => resolve(argument));
  await Promise.all([
    access(submissionPath),
    ...imagePaths.map((path) => access(path)),
  ]);
  const [submissionInfo, ...imageInfos] = await Promise.all([
    stat(submissionPath),
    ...imagePaths.map((path) => stat(path)),
  ]);
  if (!submissionInfo.isFile() || imageInfos.some((info) => !info.isFile())) {
    throw new Error("Submission and cover image paths must be files.");
  }

  const imageTypes = imagePaths.map((path) => getImageType(path));
  if (imageTypes.some((type) => !type)) {
    throw new Error("Cover images must be WebP or PNG files.");
  }

  const [submissionBytes, ...imageBytes] = await Promise.all([
    readFile(submissionPath),
    ...imagePaths.map((path) => readFile(path)),
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
  if (!Array.isArray(payload.cover_images) || payload.cover_images.length !== 3) {
    throw new Error("Submission cover_images must contain exactly three items.");
  }
  const mismatchedCover = payload.cover_images.find(
    (item, index) =>
      !isRecord(item) || item.file_name !== basename(imagePaths[index]),
  );
  if (mismatchedCover) {
    throw new Error(
      "Cover image arguments must match the ordered cover_images manifest.",
    );
  }
  const socialPlatforms = ["x", "facebook", "instagram"];
  const socialLimits = { x: 280, facebook: 5_000, instagram: 2_200 };
  if (!Array.isArray(payload.social_posts) || payload.social_posts.length !== 3) {
    throw new Error("Submission social_posts must contain exactly three items.");
  }
  payload.social_posts.forEach((item, index) => {
    const platform = socialPlatforms[index];
    if (
      !isRecord(item) ||
      item.platform !== platform ||
      typeof item.content !== "string" ||
      !item.content.trim() ||
      item.content.trim().length > socialLimits[platform]
    ) {
      throw new Error(
        "Social drafts must be valid and ordered as X, Facebook, and Instagram.",
      );
    }
    if (
      typeof payload.canonical_url !== "string" ||
      !item.content.includes(payload.canonical_url)
    ) {
      throw new Error("Every social draft must include the canonical article URL.");
    }
  });
  const bodyImages = await getBodyImages(payload, submissionPath);

  const runId = await getRunId(
    payload,
    submissionPath,
    submissionBytes,
    [...imageBytes, ...bodyImages.map((image) => image.bytes)],
  );
  const article = { ...payload };
  delete article.run_id;
  const formData = new FormData();
  formData.set("payload", JSON.stringify(article));
  imageBytes.forEach((bytes, index) => {
    formData.append(
      "featured_image",
      new Blob([bytes], { type: imageTypes[index] }),
      basename(imagePaths[index]),
    );
  });
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
    !Array.isArray(result.cover_image_urls) ||
    result.cover_image_urls.length !== 3 ||
    result.cover_image_urls.some((url) => typeof url !== "string") ||
    result.social_post_count !== 3 ||
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
        cover_image_urls: result.cover_image_urls,
        social_post_count: result.social_post_count,
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
