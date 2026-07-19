import { NextResponse, type NextRequest } from "next/server";
import {
  renderNewsletterCampaign,
  validateNewsletterCampaignDraft,
  type NewsletterAffiliateLink,
  type NewsletterArticle,
  type NewsletterCampaign,
  type NewsletterCampaignStatus,
} from "@/lib/newsletter/campaigns";
import {
  isNewsletterBroadcastConfigured,
  scheduleNewsletterBroadcast,
} from "@/lib/newsletter/provider";
import { hasAllowedRequestOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/server";

const ACTIONS = [
  "save_draft",
  "mark_ready",
  "return_to_draft",
  "approve",
  "schedule",
  "archive",
] as const;

type CampaignAction = (typeof ACTIONS)[number];

type CampaignRequest = {
  action?: unknown;
  campaignId?: unknown;
  campaign?: unknown;
  scheduledFor?: unknown;
};

function isAction(value: unknown): value is CampaignAction {
  return (
    typeof value === "string" && ACTIONS.includes(value as CampaignAction)
  );
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isMondaySixPmChicago(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return false;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return (
    part("weekday") === "Monday" &&
    part("hour") === "18" &&
    part("minute") === "00"
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required.", status: 401 } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return { error: "Admin access required.", status: 403 } as const;
  }

  return { supabase, user } as const;
}

async function resolveCampaignContent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  content: {
    featured_article_slug: string | null;
    supporting_article_slugs: string[];
    affiliate_link_slug: string | null;
  },
) {
  const articleSlugs = [
    content.featured_article_slug,
    ...content.supporting_article_slugs,
  ].filter((slug): slug is string => Boolean(slug));
  const { data: articleRows, error: articleError } = articleSlugs.length
    ? await supabase
        .from("blog_posts")
        .select(
          "id,title,slug,excerpt,category,cover_image_url,cover_image_alt,workflow_status,published_at",
        )
        .in("slug", articleSlugs)
    : { data: [], error: null };
  if (articleError) return { error: articleError.message } as const;

  const now = Date.now();
  const articles = (articleRows ?? []) as NewsletterArticle[];
  if (
    articleSlugs.length !== articles.length ||
    articles.some(
      (article) =>
        article.workflow_status !== "published" ||
        !article.published_at ||
        new Date(article.published_at).getTime() > now,
    )
  ) {
    return {
      error: "Newsletter articles must be currently published.",
    } as const;
  }

  let affiliateLinks: NewsletterAffiliateLink[] = [];
  if (content.affiliate_link_slug) {
    const { data, error } = await supabase
      .from("affiliate_links")
      .select(
        "id,slug,label,destination_url,use_redirect,active,affiliate_programs(name,status)",
      )
      .eq("slug", content.affiliate_link_slug)
      .maybeSingle();
    if (error) return { error: error.message } as const;

    const raw = data as unknown as
      | (Omit<NewsletterAffiliateLink, "affiliate_programs"> & {
          affiliate_programs?: NewsletterAffiliateLink["affiliate_programs"] | NewsletterAffiliateLink["affiliate_programs"][];
        })
      | null;
    const program = Array.isArray(raw?.affiliate_programs)
      ? raw.affiliate_programs[0]
      : raw?.affiliate_programs;
    if (!raw || !raw.active || program?.status !== "approved") {
      return {
        error: "Newsletter affiliate links must be active and approved.",
      } as const;
    }
    affiliateLinks = [{ ...raw, affiliate_programs: program ?? null }];
  }

  return { articles, affiliateLinks } as const;
}

export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json(
      { error: admin.error },
      { status: admin.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data, error } = await admin.supabase
    .from("newsletter_campaigns")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      campaigns: (data ?? []) as NewsletterCampaign[],
      broadcastConfigured: isNewsletterBroadcastConfigured(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (!hasAllowedRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Newsletter campaign request rejected." },
      { status: 403 },
    );
  }
  if (Number(request.headers.get("content-length") ?? 0) > 40_000) {
    return NextResponse.json(
      { error: "Newsletter campaign request is too large." },
      { status: 413 },
    );
  }

  let body: CampaignRequest;
  try {
    body = (await request.json()) as CampaignRequest;
  } catch {
    return NextResponse.json({ error: "Invalid campaign request." }, { status: 400 });
  }
  if (!isAction(body.action)) {
    return NextResponse.json({ error: "Invalid campaign action." }, { status: 400 });
  }

  const validation = validateNewsletterCampaignDraft(body.campaign);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const campaignId = isUuid(body.campaignId) ? body.campaignId : null;
  const { data: existing, error: existingError } = campaignId
    ? await admin.supabase
        .from("newsletter_campaigns")
        .select("*")
        .eq("id", campaignId)
        .maybeSingle()
    : { data: null, error: null };
  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  const current = existing as NewsletterCampaign | null;
  if (campaignId && !current) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }
  if (current && ["scheduled", "sent", "archived"].includes(current.status)) {
    return NextResponse.json(
      { error: "Scheduled, sent, and archived campaigns cannot be edited." },
      { status: 409 },
    );
  }

  const transitions: Record<CampaignAction, NewsletterCampaignStatus[]> = {
    save_draft: ["draft", "ready_for_review", "approved"],
    mark_ready: ["draft"],
    return_to_draft: ["ready_for_review", "approved"],
    approve: ["ready_for_review"],
    schedule: ["approved"],
    archive: ["draft", "ready_for_review", "approved"],
  };
  const currentStatus = current?.status ?? "draft";
  if (!transitions[body.action].includes(currentStatus)) {
    return NextResponse.json(
      { error: `Cannot ${body.action.replaceAll("_", " ")} from ${currentStatus}.` },
      { status: 409 },
    );
  }

  const needsCompleteContent = ["mark_ready", "approve", "schedule"].includes(
    body.action,
  );
  const resolved = needsCompleteContent
    ? await resolveCampaignContent(admin.supabase, validation.campaign.content)
    : { articles: [] as NewsletterArticle[], affiliateLinks: [] as NewsletterAffiliateLink[] };
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 409 });
  }
  if (needsCompleteContent && !validation.campaign.content.featured_article_slug) {
    return NextResponse.json(
      { error: "Select a published featured article before review." },
      { status: 409 },
    );
  }

  let nextStatus: NewsletterCampaignStatus = currentStatus;
  if (body.action === "save_draft" || body.action === "return_to_draft") {
    nextStatus = "draft";
  } else if (body.action === "mark_ready") {
    nextStatus = "ready_for_review";
  } else if (body.action === "approve") {
    nextStatus = "approved";
  } else if (body.action === "archive") {
    nextStatus = "archived";
  }

  let scheduledFor: string | null = current?.scheduled_for ?? null;
  let broadcastId: string | null = current?.resend_broadcast_id ?? null;
  let resendStatus: string | null = current?.resend_status ?? null;
  if (body.action === "schedule") {
    const requestedSchedule =
      typeof body.scheduledFor === "string" ? body.scheduledFor : "";
    if (!isMondaySixPmChicago(requestedSchedule)) {
      return NextResponse.json(
        { error: "Schedule the campaign for a future Monday at 6:00 PM Central." },
        { status: 409 },
      );
    }
    const rendered = renderNewsletterCampaign({
      campaign: validation.campaign,
      articles: resolved.articles,
      affiliateLinks: resolved.affiliateLinks,
    });
    if (rendered.warnings.length > 0) {
      return NextResponse.json(
        { error: rendered.warnings.join(" ") },
        { status: 409 },
      );
    }
    broadcastId = await scheduleNewsletterBroadcast({
      name: validation.campaign.name,
      subject: validation.campaign.subject,
      preheader: validation.campaign.preheader,
      html: rendered.html,
      text: rendered.text,
      scheduledAt: new Date(requestedSchedule).toISOString(),
    });
    if (!broadcastId) {
      return NextResponse.json(
        {
          error:
            "Resend scheduling failed. Confirm the API key, sender domain, and newsletter segment configuration.",
        },
        { status: 503 },
      );
    }
    nextStatus = "scheduled";
    scheduledFor = new Date(requestedSchedule).toISOString();
    resendStatus = "scheduled";
  }

  const record = {
    ...validation.campaign,
    status: nextStatus,
    scheduled_for: nextStatus === "scheduled" ? scheduledFor : null,
    approved_at:
      nextStatus === "approved" || nextStatus === "scheduled"
        ? current?.approved_at ?? new Date().toISOString()
        : null,
    resend_broadcast_id: broadcastId,
    resend_status: resendStatus,
    created_by: current?.created_by ?? admin.user.id,
  };
  const query = campaignId
    ? admin.supabase
        .from("newsletter_campaigns")
        .update(record)
        .eq("id", campaignId)
        .select("*")
        .single()
    : admin.supabase
        .from("newsletter_campaigns")
        .insert(record)
        .select("*")
        .single();
  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  return NextResponse.json(
    { campaign: data as NewsletterCampaign },
    { headers: { "Cache-Control": "no-store" } },
  );
}
