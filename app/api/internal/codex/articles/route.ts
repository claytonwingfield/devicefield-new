import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  consumeCodexDraftRateLimit,
  hasValidCodexDraftToken,
  isCodexDraftIngestConfigured,
} from "@/lib/codex/draft-ingest";

export const runtime = "nodejs";

const ARTICLE_INVENTORY_SELECT = [
  "id",
  "title",
  "slug",
  "focus_keyword",
  "category",
  "article_type",
  "testing_status",
  "workflow_status",
  "tags",
  "updated_at",
].join(",");
const ARTICLE_INVENTORY_PAGE_SIZE = 1_000;
const ARTICLE_INVENTORY_MAX_ROWS = 10_000;

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      Vary: "Authorization",
    },
  });
}

function createInventoryClient() {
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

export async function GET(request: NextRequest) {
  if (!isCodexDraftIngestConfigured()) {
    return json({ error: "Article inventory is not configured." }, 503);
  }

  if (!consumeCodexDraftRateLimit(request)) {
    return json({ error: "Too many article-inventory requests." }, 429);
  }

  if (!hasValidCodexDraftToken(request)) {
    return NextResponse.json(
      { error: "Unauthorized." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          "WWW-Authenticate": "Bearer",
          Vary: "Authorization",
        },
      },
    );
  }

  const supabase = createInventoryClient();
  if (!supabase) {
    return json({ error: "Article inventory storage is not configured." }, 503);
  }

  const articles: unknown[] = [];
  while (articles.length < ARTICLE_INVENTORY_MAX_ROWS) {
    const from = articles.length;
    const { data, error } = await supabase
      .from("blog_posts")
      .select(ARTICLE_INVENTORY_SELECT)
      .order("updated_at", { ascending: false })
      .range(from, from + ARTICLE_INVENTORY_PAGE_SIZE - 1);

    if (error) {
      return json({ error: "Article inventory could not be loaded." }, 503);
    }

    const page = data ?? [];
    articles.push(...page);
    if (page.length < ARTICLE_INVENTORY_PAGE_SIZE) {
      return json({ articles }, 200);
    }
  }

  return json({ error: "Article inventory exceeds the safe row limit." }, 503);
}
