import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import {
  CODEX_DRAFT_MAX_BODY_BYTES,
  consumeCodexDraftRateLimit,
  getCodexRequestFingerprint,
  hasValidCodexDraftToken,
  hashCodexDraftSubmission,
  isCodexDraftIngestConfigured,
  validateCodexDraftPayload,
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
  if (
    formKeys.some((key) => !["payload", "featured_image"].includes(key)) ||
    formData.getAll("payload").length !== 1 ||
    formData.getAll("featured_image").length !== 1
  ) {
    return json(
      { error: "Submit one payload and one featured image." },
      400,
    );
  }

  const payloadEntry = formData.get("payload");
  const imageEntry = formData.get("featured_image");
  if (typeof payloadEntry !== "string" || !(imageEntry instanceof File)) {
    return json(
      { error: "Submit one JSON payload and one featured image." },
      400,
    );
  }

  if (
    new TextEncoder().encode(payloadEntry).byteLength + imageEntry.size >
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

  const imageValidation = await validateCodexFeaturedImage(imageEntry);
  if (!imageValidation.ok) {
    return json({ error: imageValidation.error }, 400);
  }

  let webpImage: Buffer;
  try {
    webpImage = await sharp(imageValidation.bytes, {
      failOn: "error",
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize(1600, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer();
  } catch {
    return json({ error: "Featured image could not be processed." }, 400);
  }

  const supabase = createDraftIngestClient();
  if (!supabase) {
    return json({ error: "Draft storage is not configured." }, 503);
  }

  const { article_products: articleProducts, ...article } = validation.article;
  const imagePath = `covers/${article.slug}/${randomUUID()}.webp`;
  const { data: publicImage } = supabase.storage
    .from(ARTICLE_IMAGE_BUCKET)
    .getPublicUrl(imagePath);
  const requestFingerprint = getCodexRequestFingerprint(request);
  const payloadHash = hashCodexDraftSubmission(
    payloadEntry,
    imageValidation.bytes,
  );

  try {
    const row = await withUploadedImageCleanup({
      upload: async () => {
        const { error } = await supabase.storage
          .from(ARTICLE_IMAGE_BUCKET)
          .upload(imagePath, webpImage, {
            contentType: "image/webp",
            upsert: false,
          });
        if (error) {
          throw new DraftIngestError("Featured image could not be stored.", 503);
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
              cover_image_url: publicImage.publicUrl,
            },
            p_products: articleProducts,
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
        await supabase.storage.from(ARTICLE_IMAGE_BUCKET).remove([imagePath]);
      },
    });

    return json(
      {
        id: row.id,
        slug: row.slug,
        workflow_status: "ready_for_review",
        cover_image_url: row.cover_image_url,
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
