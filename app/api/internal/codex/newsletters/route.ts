import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  consumeCodexDraftRateLimit,
  hasValidCodexDraftToken,
  isCodexDraftIngestConfigured,
  validateCodexRunId,
} from "@/lib/codex/draft-ingest";
import { validateNewsletterCampaignDraft } from "@/lib/newsletter/campaigns";

export const runtime = "nodejs";

const CAMPAIGN_FIELDS = new Set(["name", "subject", "preheader", "content"]);
const CONTENT_FIELDS = new Set([
  "issue_label",
  "lead_heading",
  "lead_copy",
  "practical_tip_heading",
  "practical_tip_copy",
  "closing_copy",
  "featured_article_slug",
  "supporting_article_slugs",
  "affiliate_link_slug",
  "affiliate_heading",
  "affiliate_copy",
  "affiliate_cta_label",
]);

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", Vary: "Authorization" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function createCodexNewsletterClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return null;
  return createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function authorize(request: NextRequest) {
  if (!isCodexDraftIngestConfigured()) {
    return json({ error: "Newsletter ingestion is not configured." }, 503);
  }
  if (!consumeCodexDraftRateLimit(request)) {
    return json({ error: "Too many newsletter-ingestion requests." }, 429);
  }
  if (!hasValidCodexDraftToken(request)) {
    return NextResponse.json(
      { error: "Unauthorized." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          Vary: "Authorization",
          "WWW-Authenticate": "Bearer",
        },
      },
    );
  }
  return null;
}

export async function GET(request: NextRequest) {
  const authorizationError = authorize(request);
  if (authorizationError) return authorizationError;
  const supabase = createCodexNewsletterClient();
  if (!supabase) return json({ error: "Newsletter storage is unavailable." }, 503);

  const [campaignResult, articleResult, affiliateResult] = await Promise.all([
    supabase
      .from("newsletter_campaigns")
      .select("id,name,subject,status,content,updated_at")
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,category,published_at,updated_at")
      .eq("workflow_status", "published")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(500),
    supabase
      .from("affiliate_links")
      .select("slug,label,affiliate_programs!inner(name,network,status)")
      .eq("active", true)
      .eq("affiliate_programs.status", "approved")
      .order("label", { ascending: true })
      .limit(500),
  ]);
  if (campaignResult.error || articleResult.error || affiliateResult.error) {
    return json({ error: "Newsletter inventory could not be loaded." }, 503);
  }

  const campaigns = (campaignResult.data ?? []).map((campaign) => {
    const content = isRecord(campaign.content) ? campaign.content : {};
    return {
      id: campaign.id,
      name: campaign.name,
      subject: campaign.subject,
      status: campaign.status,
      featured_article_slug:
        typeof content.featured_article_slug === "string"
          ? content.featured_article_slug
          : null,
      supporting_article_slugs: Array.isArray(
        content.supporting_article_slugs,
      )
        ? content.supporting_article_slugs.filter(
            (slug): slug is string => typeof slug === "string",
          )
        : [],
      updated_at: campaign.updated_at,
    };
  });
  const affiliateLinks = (affiliateResult.data ?? []).flatMap((link) => {
    const rawProgram = link.affiliate_programs as unknown;
    const program = Array.isArray(rawProgram) ? rawProgram[0] : rawProgram;
    if (!isRecord(program) || program.status !== "approved") return [];
    return [
      {
        slug: link.slug,
        label: link.label,
        program_name: program.name,
        network: program.network,
      },
    ];
  });

  return json(
    {
      campaigns,
      articles: articleResult.data ?? [],
      affiliate_links: affiliateLinks,
    },
    200,
  );
}

export async function POST(request: NextRequest) {
  const authorizationError = authorize(request);
  if (authorizationError) return authorizationError;
  const runId = validateCodexRunId(request.headers.get("x-devicefield-run-id"));
  if (!runId) return json({ error: "A valid run ID is required." }, 400);
  if (Number(request.headers.get("content-length") ?? 0) > 40_000) {
    return json({ error: "Newsletter draft is too large." }, 413);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Newsletter draft must be valid JSON." }, 400);
  }
  if (
    !isRecord(payload) ||
    Object.keys(payload).some((field) => !CAMPAIGN_FIELDS.has(field)) ||
    !isRecord(payload.content) ||
    Object.keys(payload.content).some((field) => !CONTENT_FIELDS.has(field))
  ) {
    return json({ error: "Newsletter draft contains unsupported fields." }, 400);
  }

  const validation = validateNewsletterCampaignDraft(payload);
  if (!validation.ok) return json({ error: validation.error }, 400);
  if (!validation.campaign.content.featured_article_slug) {
    return json({ error: "A featured article is required." }, 400);
  }

  const supabase = createCodexNewsletterClient();
  if (!supabase) return json({ error: "Newsletter storage is unavailable." }, 503);
  const articleSlugs = [
    validation.campaign.content.featured_article_slug,
    ...validation.campaign.content.supporting_article_slugs,
  ];
  const { data: articles, error: articleError } = await supabase
    .from("blog_posts")
    .select("slug")
    .in("slug", articleSlugs)
    .eq("workflow_status", "published")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString());
  if (articleError || (articles ?? []).length !== articleSlugs.length) {
    return json(
      { error: "Every newsletter article must be currently published." },
      409,
    );
  }

  const affiliateSlug = validation.campaign.content.affiliate_link_slug;
  if (affiliateSlug) {
    const { data: affiliate, error: affiliateError } = await supabase
      .from("affiliate_links")
      .select("slug,affiliate_programs!inner(status)")
      .eq("slug", affiliateSlug)
      .eq("active", true)
      .eq("affiliate_programs.status", "approved")
      .maybeSingle();
    if (affiliateError || !affiliate) {
      return json(
        { error: "Affiliate recommendation must use an approved active link." },
        409,
      );
    }
  }

  const { data, error } = await supabase
    .from("newsletter_campaigns")
    .insert({
      ...validation.campaign,
      status: "ready_for_review",
      source: "codex",
      codex_run_id: runId,
      created_by: null,
    })
    .select("id,name,status,created_at")
    .single();
  if (error) {
    if (error.code === "23505") {
      return json({ error: "This newsletter run has already been submitted." }, 409);
    }
    return json({ error: "Newsletter draft could not be stored." }, 503);
  }

  return json({ campaign: data }, 201);
}
