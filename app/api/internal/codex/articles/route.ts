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
const APPROVED_AFFILIATE_LINK_LIMIT = 1_000;

type AffiliateInventoryRow = {
  slug?: unknown;
  label?: unknown;
  affiliate_programs?:
    | { name?: unknown; network?: unknown; status?: unknown }
    | Array<{ name?: unknown; network?: unknown; status?: unknown }>
    | null;
};

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
  let articleInventoryComplete = false;
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
      articleInventoryComplete = true;
      break;
    }
  }

  if (!articleInventoryComplete) {
    return json({ error: "Article inventory exceeds the safe row limit." }, 503);
  }

  const { data: affiliateRows, error: affiliateError } = await supabase
    .from("affiliate_links")
    .select(
      "slug,label,affiliate_programs!inner(name,network,status)",
    )
    .eq("active", true)
    .eq("affiliate_programs.status", "approved")
    .order("label", { ascending: true })
    .limit(APPROVED_AFFILIATE_LINK_LIMIT);

  if (affiliateError) {
    return json({ error: "Affiliate-link inventory could not be loaded." }, 503);
  }

  const affiliateLinks = (
    (affiliateRows ?? []) as unknown as AffiliateInventoryRow[]
  ).flatMap((row) => {
    const program = Array.isArray(row.affiliate_programs)
      ? row.affiliate_programs[0]
      : row.affiliate_programs;
    if (
      typeof row.slug !== "string" ||
      typeof row.label !== "string" ||
      !program ||
      typeof program.name !== "string" ||
      typeof program.network !== "string" ||
      program.status !== "approved"
    ) {
      return [];
    }

    return [
      {
        slug: row.slug,
        label: row.label,
        program_name: program.name,
        network: program.network,
      },
    ];
  });

  return json({ articles, affiliate_links: affiliateLinks }, 200);
}
