import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  CODEX_DRAFT_COVER_IMAGE_COUNT,
  CODEX_DRAFT_MAX_BODY_BYTES,
  CODEX_DRAFT_MAX_INLINE_IMAGES,
  consumeCodexDraftRateLimit,
  getCodexRequestFingerprint,
  hasValidCodexDraftToken,
  hashCodexDraftSubmission,
  isCodexDraftIngestConfigured,
  validateCodexDraftPayload,
  validateCodexBodyImage,
  validateCodexFeaturedImage,
  validateCodexRunId,
} from "@/lib/codex/draft-ingest";
import { withUploadedImageCleanup } from "@/lib/codex/upload-cleanup";

export const runtime = "nodejs";

const ARTICLE_IMAGE_BUCKET = "article-images";

class DraftIngestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function createDraftIngestClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseSecret) return null;

  return createClient(supabaseUrl, supabaseSecret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function mapDatabaseError(error: { code?: string; message: string }) {
  if (
    error.code === "23505" ||
    /already been submitted|slug already exists/i.test(error.message)
  ) {
    return new DraftIngestError("Run ID or article slug already exists.", 409);
  }
  if (/author was not found|reviewer was not found/i.test(error.message)) {
    return new DraftIngestError("Author or reviewer could not be resolved.", 422);
  }
  if (/affiliate link is unavailable/i.test(error.message)) {
    return new DraftIngestError(
      "One or more product recommendations are unavailable.",
      422,
    );
  }
  if (/invalid|not allowed|cannot/i.test(error.message)) {
    return new DraftIngestError("Draft failed database validation.", 422);
  }
  return new DraftIngestError("Draft could not be stored.", 503);
}

export async function POST(request: NextRequest) {
  if (!isCodexDraftIngestConfigured()) {
    return json({ error: "Draft ingestion is not configured." }, 503);
  }

  if (!consumeCodexDraftRateLimit(request)) {
    return json({ error: "Too many draft-ingestion attempts." }, 429);
  }

  if (!hasValidCodexDraftToken(request)) {
    return NextResponse.json(
      { error: "Unauthorized." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          "WWW-Authenticate": "Bearer",
        },
      },
    );
  }

  const runId = validateCodexRunId(
    request.headers.get("x-devicefield-run-id"),
  );
  if (!runId) return json({ error: "A valid run ID is required." }, 400);

  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    return json({ error: "Multipart form data is required." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    return json({ error: "Content-Length is required." }, 411);
  }
  if (contentLength > CODEX_DRAFT_MAX_BODY_BYTES) {
    return json({ error: "Draft submission is too large." }, 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "Draft submission is not valid multipart data." }, 400);
  }

  const formKeys = Array.from(new Set(formData.keys()));
  const coverImageEntries = formData.getAll("featured_image");
  const bodyImageEntries = formData.getAll("body_image");
  if (
    formKeys.some(
      (key) => !["payload", "featured_image", "body_image"].includes(key),
    ) ||
    formData.getAll("payload").length !== 1 ||
    coverImageEntries.length !== CODEX_DRAFT_COVER_IMAGE_COUNT ||
    bodyImageEntries.length > CODEX_DRAFT_MAX_INLINE_IMAGES
  ) {
    return json(
      {
        error: `Submit one payload, exactly ${CODEX_DRAFT_COVER_IMAGE_COUNT} cover images, and at most ${CODEX_DRAFT_MAX_INLINE_IMAGES} body images.`,
      },
      400,
    );
  }

  const payloadEntry = formData.get("payload");
  if (
    typeof payloadEntry !== "string" ||
    coverImageEntries.some((entry) => !(entry instanceof File)) ||
    bodyImageEntries.some((entry) => !(entry instanceof File))
  ) {
    return json(
      { error: "Submit JSON plus valid cover and body image files." },
      400,
    );
  }

  const coverImageFiles = coverImageEntries as File[];
  const bodyImageFiles = bodyImageEntries as File[];
  if (
    new TextEncoder().encode(payloadEntry).byteLength +
      coverImageFiles.reduce((total, file) => total + file.size, 0) +
      bodyImageFiles.reduce((total, file) => total + file.size, 0) >
    CODEX_DRAFT_MAX_BODY_BYTES
  ) {
    return json({ error: "Draft submission is too large." }, 413);
  }

  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(payloadEntry);
  } catch {
    return json({ error: "Draft payload must be valid JSON." }, 400);
  }

  const validation = validateCodexDraftPayload(rawPayload);
  if (!validation.ok) return json({ error: validation.error }, 400);

  const mismatchedCoverImage = coverImageFiles.find(
    (file, index) =>
      file.name !== validation.article.cover_images[index]?.file_name,
  );
  if (mismatchedCoverImage) {
    return json(
      { error: "Cover image file names must match the cover_images manifest." },
      400,
    );
  }

  if (bodyImageFiles.length !== validation.article.body_images.length) {
    return json(
      { error: "Submitted body images must match the body_images manifest." },
      400,
    );
  }
  const mismatchedBodyImage = bodyImageFiles.find(
    (file, index) =>
      file.name !== validation.article.body_images[index]?.file_name,
  );
  if (mismatchedBodyImage) {
    return json(
      { error: "Body image file names must match the body_images manifest." },
      400,
    );
  }

  const coverImageValidations = await Promise.all(
    coverImageFiles.map((file) => validateCodexFeaturedImage(file)),
  );
  const invalidCoverImage = coverImageValidations.find(
    (result) => !result.ok,
  );
  if (invalidCoverImage && !invalidCoverImage.ok) {
    return json({ error: invalidCoverImage.error }, 400);
  }
  const validCoverImages = coverImageValidations.filter(
    (result): result is Extract<typeof result, { ok: true }> => result.ok,
  );
  const bodyImageValidations = await Promise.all(
    bodyImageFiles.map((file) => validateCodexBodyImage(file)),
  );
  const invalidBodyImage = bodyImageValidations.find((result) => !result.ok);
  if (invalidBodyImage && !invalidBodyImage.ok) {
    return json({ error: invalidBodyImage.error }, 400);
  }
  const validBodyImages = bodyImageValidations.filter(
    (result): result is Extract<typeof result, { ok: true }> => result.ok,
  );

  const supabase = createDraftIngestClient();
  if (!supabase) {
    return json({ error: "Draft storage is not configured." }, 503);
  }

  const {
    cover_images: coverImageManifest,
    social_posts: socialPosts,
    body_images: bodyImageManifest,
    article_products: articleProducts,
    affiliate_suggestions: affiliateSuggestions,
    ...article
  } = validation.article;
  const coverImageUploads = validCoverImages.map((image, index) => {
    const manifest = coverImageManifest[index];
    const path = `covers/${article.slug}/${index + 1}-${randomUUID()}.${image.extension}`;
    const { data } = supabase.storage
      .from(ARTICLE_IMAGE_BUCKET)
      .getPublicUrl(path);
    return { ...image, ...manifest, path, publicUrl: data.publicUrl };
  });
  const bodyImageUploads = validBodyImages.map((image, index) => {
    const manifest = bodyImageManifest[index];
    const path = `body/${article.slug}/${manifest.id}-${randomUUID()}.${image.extension}`;
    const { data } = supabase.storage
      .from(ARTICLE_IMAGE_BUCKET)
      .getPublicUrl(path);
    return { ...image, ...manifest, path, publicUrl: data.publicUrl };
  });
  const resolvedContent = bodyImageUploads.reduce(
    (content, image) =>
      content.replace(
        `![${image.alt}](devicefield-body-image://${image.id})`,
        `![${image.alt}](${image.publicUrl})`,
      ),
    article.content,
  );
  const requestFingerprint = getCodexRequestFingerprint(request);
  const payloadHash = hashCodexDraftSubmission(
    payloadEntry,
    [
      ...validCoverImages.map((image) => image.bytes),
      ...validBodyImages.map((image) => image.bytes),
    ],
  );
  const uploadedImagePaths = [
    ...coverImageUploads.map((image) => image.path),
    ...bodyImageUploads.map((image) => image.path),
  ];

  try {
    const row = await withUploadedImageCleanup({
      upload: async () => {
        for (const coverImage of coverImageUploads) {
          const { error: coverImageError } = await supabase.storage
            .from(ARTICLE_IMAGE_BUCKET)
            .upload(coverImage.path, coverImage.bytes, {
              contentType: coverImage.contentType,
              cacheControl: "31536000",
              upsert: false,
            });
          if (coverImageError) {
            throw new DraftIngestError("Cover image could not be stored.", 503);
          }
        }
        for (const bodyImage of bodyImageUploads) {
          const { error: bodyImageError } = await supabase.storage
            .from(ARTICLE_IMAGE_BUCKET)
            .upload(bodyImage.path, bodyImage.bytes, {
              contentType: bodyImage.contentType,
              cacheControl: "31536000",
              upsert: false,
            });
          if (bodyImageError) {
            throw new DraftIngestError("Body image could not be stored.", 503);
          }
        }
      },
      operation: async () => {
        const { data, error } = await supabase.rpc(
          "create_codex_review_draft",
          {
            p_run_id: runId,
            p_payload_hash: payloadHash,
            p_request_fingerprint: requestFingerprint,
            p_article: {
              ...article,
              content: resolvedContent,
              cover_image_url: coverImageUploads[0].publicUrl,
              cover_image_alt: coverImageUploads[0].alt,
            },
            p_products: articleProducts,
            p_suggestions: affiliateSuggestions,
            p_cover_images: coverImageUploads.map((image, index) => ({
              image_url: image.publicUrl,
              image_alt: image.alt,
              label: image.label,
              display_order: index,
              selected: index === 0,
            })),
            p_social_posts: socialPosts,
          },
        );
        if (error) throw mapDatabaseError(error);
        const result = Array.isArray(data) ? data[0] : data;
        if (
          !result ||
          typeof result.id !== "string" ||
          result.workflow_status !== "ready_for_review"
        ) {
          throw new DraftIngestError(
            "Draft storage returned an invalid response.",
            503,
          );
        }
        return result;
      },
      cleanup: async () => {
        await supabase.storage
          .from(ARTICLE_IMAGE_BUCKET)
          .remove(uploadedImagePaths);
      },
    });

    return json(
      {
        id: row.id,
        slug: row.slug,
        workflow_status: "ready_for_review",
        cover_image_url: row.cover_image_url,
        cover_image_urls: coverImageUploads.map((image) => image.publicUrl),
        body_image_urls: bodyImageUploads.map((image) => image.publicUrl),
        social_post_count: socialPosts.length,
        created_at: row.created_at,
      },
      201,
    );
  } catch (error) {
    if (error instanceof DraftIngestError) {
      return json({ error: error.message }, error.status);
    }
    return json({ error: "Draft could not be stored." }, 503);
  }
}
