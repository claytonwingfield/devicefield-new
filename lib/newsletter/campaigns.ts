import type { AffiliateLink, AffiliateProgram } from "@/lib/affiliate/types";
import type { BlogPost } from "@/lib/blog/types";
import { getArticleUrl, SITE_URL } from "@/lib/site/identity";

export const NEWSLETTER_CAMPAIGN_STATUSES = [
  "draft",
  "ready_for_review",
  "approved",
  "scheduled",
  "sent",
  "archived",
] as const;

export type NewsletterCampaignStatus =
  (typeof NEWSLETTER_CAMPAIGN_STATUSES)[number];

export type NewsletterCampaignContent = {
  issue_label: string;
  lead_heading: string;
  lead_copy: string;
  practical_tip_heading: string;
  practical_tip_copy: string;
  closing_copy: string;
  featured_article_slug: string | null;
  supporting_article_slugs: string[];
  affiliate_link_slug: string | null;
  affiliate_heading: string;
  affiliate_copy: string;
  affiliate_cta_label: string;
};

export type NewsletterCampaign = {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  status: NewsletterCampaignStatus;
  content: NewsletterCampaignContent;
  scheduled_for: string | null;
  approved_at: string | null;
  sent_at: string | null;
  resend_broadcast_id: string | null;
  resend_status: string | null;
  source: "admin" | "codex";
  codex_run_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type NewsletterCampaignDraft = Pick<
  NewsletterCampaign,
  "name" | "subject" | "preheader" | "content"
>;

export type NewsletterArticle = Pick<
  BlogPost,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "category"
  | "cover_image_url"
  | "cover_image_alt"
  | "workflow_status"
  | "published_at"
>;

export type NewsletterAffiliateLink = Pick<
  AffiliateLink,
  | "id"
  | "slug"
  | "label"
  | "destination_url"
  | "use_redirect"
  | "active"
> & {
  affiliate_programs?: Pick<AffiliateProgram, "name" | "status"> | null;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cleanText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function cleanSlug(value: unknown) {
  return typeof value === "string" && SLUG_PATTERN.test(value) ? value : null;
}

export function createNewsletterCampaignContent(): NewsletterCampaignContent {
  return {
    issue_label: "Devicefield Field Notes",
    lead_heading: "What matters in business technology this week",
    lead_copy:
      "A short, practical briefing on the devices and systems that affect daily operations.",
    practical_tip_heading: "One practical check",
    practical_tip_copy:
      "Verify compatibility, required accessories, and subscription costs before standardizing a device across locations.",
    closing_copy:
      "Have a business technology question you want Devicefield to investigate? Reply to this email.",
    featured_article_slug: null,
    supporting_article_slugs: [],
    affiliate_link_slug: null,
    affiliate_heading: "Relevant tool",
    affiliate_copy: "",
    affiliate_cta_label: "View current pricing",
  };
}

export function createNewsletterCampaignDraft(
  now = new Date(),
): NewsletterCampaignDraft {
  const weekLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(now);

  return {
    name: `Field Notes - ${weekLabel}`,
    subject: "Devicefield Field Notes: this week's business technology brief",
    preheader:
      "One useful guide, practical operating advice, and the week's most relevant Devicefield updates.",
    content: createNewsletterCampaignContent(),
  };
}

export function validateNewsletterCampaignDraft(
  value: unknown,
): { ok: true; campaign: NewsletterCampaignDraft } | { ok: false; error: string } {
  if (!isRecord(value) || !isRecord(value.content)) {
    return { ok: false, error: "Campaign content is invalid." };
  }

  const name = cleanText(value.name, 120);
  const subject = cleanText(value.subject, 160);
  const preheader = cleanText(value.preheader, 220);
  const content = value.content;
  const supportingSlugs = Array.isArray(content.supporting_article_slugs)
    ? Array.from(
        new Set(content.supporting_article_slugs.map(cleanSlug).filter(Boolean)),
      ).slice(0, 3)
    : [];

  const campaign: NewsletterCampaignDraft = {
    name,
    subject,
    preheader,
    content: {
      issue_label: cleanText(content.issue_label, 80),
      lead_heading: cleanText(content.lead_heading, 160),
      lead_copy: cleanText(content.lead_copy, 1_200),
      practical_tip_heading: cleanText(
        content.practical_tip_heading,
        120,
      ),
      practical_tip_copy: cleanText(content.practical_tip_copy, 1_000),
      closing_copy: cleanText(content.closing_copy, 800),
      featured_article_slug: cleanSlug(content.featured_article_slug),
      supporting_article_slugs: supportingSlugs as string[],
      affiliate_link_slug: cleanSlug(content.affiliate_link_slug),
      affiliate_heading: cleanText(content.affiliate_heading, 120),
      affiliate_copy: cleanText(content.affiliate_copy, 800),
      affiliate_cta_label: cleanText(content.affiliate_cta_label, 80),
    },
  };

  if (
    name.length < 3 ||
    subject.length < 3 ||
    !campaign.content.issue_label ||
    !campaign.content.lead_heading ||
    !campaign.content.lead_copy ||
    !campaign.content.practical_tip_heading ||
    !campaign.content.practical_tip_copy
  ) {
    return { ok: false, error: "Complete the required campaign fields." };
  }

  if (
    campaign.content.featured_article_slug &&
    supportingSlugs.includes(campaign.content.featured_article_slug)
  ) {
    return {
      ok: false,
      error: "The featured article cannot also be a supporting article.",
    };
  }

  if (
    campaign.content.affiliate_link_slug &&
    (!campaign.content.affiliate_heading ||
      !campaign.content.affiliate_copy ||
      !campaign.content.affiliate_cta_label)
  ) {
    return {
      ok: false,
      error: "Complete the affiliate heading, context, and CTA label.",
    };
  }

  return { ok: true, campaign };
}

export function formatNewsletterCampaignStatus(
  value: NewsletterCampaignStatus,
) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getNextMondaySixPmLocal(now = new Date()) {
  const result = new Date(now);
  const daysUntilMonday = (8 - result.getDay()) % 7;
  result.setDate(result.getDate() + daysUntilMonday);
  result.setHours(18, 0, 0, 0);
  if (result.getTime() <= now.getTime()) result.setDate(result.getDate() + 7);
  result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
  return result.toISOString().slice(0, 16);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToHtml(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function safeImageUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function articleCard(article: NewsletterArticle, featured: boolean) {
  const imageUrl = safeImageUrl(article.cover_image_url);
  const title = escapeHtml(article.title);
  const href = getArticleUrl(article.slug);
  const image = imageUrl
    ? `<a href="${href}" style="text-decoration:none"><img src="${escapeHtml(imageUrl)}" width="560" alt="${escapeHtml(article.cover_image_alt || article.title)}" style="display:block;width:100%;height:auto;border:0;border-radius:18px 18px 0 0" /></a>`
    : "";
  const headingSize = featured ? 28 : 21;

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;border:1px solid #e4e4e7;border-radius:18px;background:#ffffff"><tr><td>${image}<div style="padding:${featured ? 24 : 20}px"><p style="margin:0 0 8px;color:#4d7c0f;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(article.category)}</p><h2 style="margin:0 0 12px;color:#09090b;font-size:${headingSize}px;line-height:1.2;letter-spacing:-.03em"><a href="${href}" style="color:#09090b;text-decoration:none">${title}</a></h2><p style="margin:0 0 18px;color:#52525b;font-size:15px;line-height:1.7">${escapeHtml(article.excerpt)}</p><a href="${href}" style="display:inline-block;border-radius:999px;background:#09090b;color:#ffffff;padding:11px 18px;text-decoration:none;font-size:14px;font-weight:700">Read the guide</a></div></td></tr></table>`;
}

export function renderNewsletterCampaign(input: {
  campaign: NewsletterCampaignDraft;
  articles: NewsletterArticle[];
  affiliateLinks: NewsletterAffiliateLink[];
}) {
  const { campaign } = input;
  const featured = input.articles.find(
    (article) => article.slug === campaign.content.featured_article_slug,
  );
  const supporting = campaign.content.supporting_article_slugs
    .map((slug) => input.articles.find((article) => article.slug === slug))
    .filter((article): article is NewsletterArticle => Boolean(article));
  const affiliate = input.affiliateLinks.find(
    (link) => link.slug === campaign.content.affiliate_link_slug,
  );
  const warnings: string[] = [];

  if (!featured) warnings.push("Select one published featured article.");
  if (
    campaign.content.affiliate_link_slug &&
    (!affiliate ||
      !affiliate.active ||
      affiliate.affiliate_programs?.status !== "approved")
  ) {
    warnings.push("The selected affiliate link is not approved and active.");
  }

  const affiliateIsValid = Boolean(
    affiliate &&
      affiliate.active &&
      affiliate.affiliate_programs?.status === "approved",
  );
  const affiliateUrl = affiliateIsValid && affiliate
    ? affiliate.use_redirect
      ? `${SITE_URL}/go/${encodeURIComponent(affiliate.slug)}?placement=newsletter`
      : affiliate.destination_url
    : null;
  const affiliateBlock =
    affiliate && affiliateUrl && affiliateIsValid
      ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;border:1px solid #bef264;border-radius:18px;background:#ecfccb"><tr><td style="padding:22px"><p style="margin:0 0 8px;color:#3f6212;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Partner recommendation</p><h2 style="margin:0 0 10px;color:#09090b;font-size:22px;line-height:1.25">${escapeHtml(campaign.content.affiliate_heading)}</h2><p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.65">${textToHtml(campaign.content.affiliate_copy)}</p><p style="margin:0 0 16px;color:#52525b;font-size:12px;line-height:1.55"><strong>Affiliate disclosure:</strong> Devicefield may earn a commission if you buy through this link. Recommendations remain based on fit, limitations, and verified information.</p><a href="${escapeHtml(affiliateUrl)}" target="_blank" rel="sponsored nofollow" style="display:inline-block;border-radius:999px;background:#09090b;color:#ffffff;padding:11px 18px;text-decoration:none;font-size:14px;font-weight:700">${escapeHtml(campaign.content.affiliate_cta_label)}</a></td></tr></table>`
      : "";
  const preheader = escapeHtml(campaign.preheader);
  const articleContent = featured
    ? articleCard(featured, true) +
      (supporting.length
        ? `<h2 style="margin:30px 0 14px;color:#09090b;font-size:22px;line-height:1.25">Also worth your time</h2>${supporting.map((article) => articleCard(article, false)).join("")}`
        : "")
    : `<div style="padding:24px;border:1px dashed #a1a1aa;border-radius:18px;color:#71717a;text-align:center">Select a published featured article to complete this issue.</div>`;

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(campaign.subject)}</title></head><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px"><tr><td style="padding:28px;border-radius:24px 24px 0 0;background:#09090b;color:#ffffff"><p style="margin:0 0 18px;color:#bef264;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">${escapeHtml(campaign.content.issue_label)}</p><h1 style="margin:0 0 14px;font-size:34px;line-height:1.12;letter-spacing:-.04em">${escapeHtml(campaign.content.lead_heading)}</h1><p style="margin:0;color:#d4d4d8;font-size:16px;line-height:1.7">${textToHtml(campaign.content.lead_copy)}</p></td></tr><tr><td style="padding:26px;background:#fafafa">${articleContent}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border-radius:18px;background:#18181b"><tr><td style="padding:22px"><p style="margin:0 0 8px;color:#bef264;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Operator note</p><h2 style="margin:0 0 10px;color:#ffffff;font-size:22px;line-height:1.25">${escapeHtml(campaign.content.practical_tip_heading)}</h2><p style="margin:0;color:#d4d4d8;font-size:15px;line-height:1.65">${textToHtml(campaign.content.practical_tip_copy)}</p></td></tr></table>${affiliateBlock}<p style="margin:28px 0 4px;color:#52525b;font-size:15px;line-height:1.7">${textToHtml(campaign.content.closing_copy)}</p></td></tr><tr><td style="padding:24px;border-radius:0 0 24px 24px;background:#09090b;color:#a1a1aa;text-align:center"><p style="margin:0 0 9px;color:#ffffff;font-size:14px;font-weight:700">Devicefield</p><p style="margin:0 0 9px;font-size:12px;line-height:1.6">Tested devices and systems for modern businesses.</p><p style="margin:0 0 9px;font-size:12px;line-height:1.6">3509 N Mueller Ave, Bethany, OK 73008</p><p style="margin:0;font-size:12px;line-height:1.6"><a href="${SITE_URL}/privacy" style="color:#d4d4d8">Privacy Policy</a> &nbsp;|&nbsp; <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#d4d4d8">Unsubscribe</a></p></td></tr></table></td></tr></table></body></html>`;

  const textParts = [
    campaign.content.issue_label,
    campaign.content.lead_heading,
    campaign.content.lead_copy,
    featured
      ? `${featured.title}\n${featured.excerpt}\n${getArticleUrl(featured.slug)}`
      : "Select a published featured article.",
    ...supporting.map(
      (article) =>
        `${article.title}\n${article.excerpt}\n${getArticleUrl(article.slug)}`,
    ),
    `${campaign.content.practical_tip_heading}\n${campaign.content.practical_tip_copy}`,
    affiliate && affiliateUrl && affiliateIsValid
      ? `${campaign.content.affiliate_heading}\n${campaign.content.affiliate_copy}\nAffiliate disclosure: Devicefield may earn a commission if you buy through this link.\n${affiliateUrl}`
      : "",
    campaign.content.closing_copy,
    "Devicefield\n3509 N Mueller Ave, Bethany, OK 73008",
    `Privacy: ${SITE_URL}/privacy`,
    "Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}",
  ].filter(Boolean);

  return { html, text: textParts.join("\n\n"), warnings };
}
