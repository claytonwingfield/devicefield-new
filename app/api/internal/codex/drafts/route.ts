import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  hasValidCodexDraftToken,
  isCodexDraftIngestConfigured,
  validateCodexDraftPayload,
} from "@/lib/codex/draft-ingest";

export const runtime = "nodejs";

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

export async function POST(request: NextRequest) {
  if (!isCodexDraftIngestConfigured()) {
    return json({ error: "Draft ingestion is not configured." }, 503);
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

  if (Number(request.headers.get("content-length") ?? 0) > 250_000) {
    return json({ error: "Draft payload is too large." }, 413);
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return json({ error: "Draft payload must be valid JSON." }, 400);
  }

  if (body.length > 250_000) {
    return json({ error: "Draft payload is too large." }, 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return json({ error: "Draft payload must be valid JSON." }, 400);
  }

  const validation = validateCodexDraftPayload(payload);
  if (!validation.ok) return json({ error: validation.error }, 400);

  const supabase = createDraftIngestClient();
  if (!supabase) {
    return json({ error: "Draft storage is not configured." }, 503);
  }

  const { data, error } = await supabase.rpc("ingest_codex_draft", {
    p_article: validation.article,
  });
  if (error) {
    const conflict = error.message.includes("only draft articles");
    return json(
      {
        error: conflict
          ? "The matching article is no longer an editable draft."
          : "Draft could not be stored.",
      },
      conflict ? 409 : 500,
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.article_id !== "string") {
    return json({ error: "Draft storage returned an invalid response." }, 500);
  }

  return json(
    {
      id: row.article_id,
      slug: row.article_slug,
      workflowStatus: row.workflow_status,
      created: row.was_created,
      updatedAt: row.article_updated_at,
    },
    row.was_created ? 201 : 200,
  );
}
