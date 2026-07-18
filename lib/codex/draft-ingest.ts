import { createHash, timingSafeEqual } from "node:crypto";
import {
  ARTICLE_TYPES,
  BLOG_CATEGORIES,
  slugify,
  type ArticleType,
} from "../blog/types";

type JsonRecord = Record<string, unknown>;

export type CodexDraftPayload = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  cover_image_url: string | null;
  cover_image_alt: string | null;
  focus_keyword: string | null;
  seo_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  faq_items: Array<{ question: string; answer: string }>;
  article_type: ArticleType;
  testing_status: "researched";
  sources: Array<{ title: string; url: string; note?: string }>;
  claims: Array<{
    claim: string;
    source_url?: string;
    risk?: "low" | "medium" | "high";
    resolved?: boolean;
  }>;
  quick_verdict: {
    verdict?: string;
    best_for?: string;
    avoid_if?: string;
  };
  compatibility_notes: string | null;
  limitations: string | null;
  testing_method: string | null;
  original_evidence: [];
  internal_notes: string | null;
};

type DraftValidationResult =
  | { ok: true; article: CodexDraftPayload }
  | { ok: false; error: string };

const PROHIBITED_FIELDS = [
  "workflow_status",
  "status",
  "approved_at",
  "scheduled_for",
  "published_at",
  "featured",
  "author_id",
  "reviewer_id",
  "reviewed_at",
] as const;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function requiredString(
  value: unknown,
  label: string,
  maximumLength: number,
) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
  const normalized = value.trim();
  if (normalized.length > maximumLength) {
    throw new Error(`${label} is too long.`);
  }
  return normalized;
}

function optionalString(value: unknown, label: string, maximumLength: number) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${label} must be text.`);
  const normalized = value.trim();
  if (normalized.length > maximumLength) {
    throw new Error(`${label} is too long.`);
  }
  return normalized || null;
}

function optionalUrl(value: unknown, label: string) {
  const normalized = optionalString(value, label, 2_000);
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${label} must be a valid HTTP or HTTPS URL.`);
  }
}

function stringArray(value: unknown, label: string, maximumItems: number) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > maximumItems) {
    throw new Error(`${label} must be an array with at most ${maximumItems} items.`);
  }

  return Array.from(
    new Set(
      value.map((item) => requiredString(item, `${label} item`, 120)),
    ),
  );
}

function faqItems(value: unknown) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 30) {
    throw new Error("FAQ items must be an array with at most 30 items.");
  }

  return value.map((item) => {
    if (!isRecord(item)) throw new Error("Each FAQ item must be an object.");
    return {
      question: requiredString(item.question, "FAQ question", 300),
      answer: requiredString(item.answer, "FAQ answer", 4_000),
    };
  });
}

function sourceItems(value: unknown) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 100) {
    throw new Error("Sources must be an array with at most 100 items.");
  }

  return value.map((item) => {
    if (!isRecord(item)) throw new Error("Each source must be an object.");
    const note = optionalString(item.note, "Source note", 2_000);
    const url = optionalUrl(item.url, "Source URL");
    if (!url) throw new Error("Source URL is required.");
    return {
      title: requiredString(item.title, "Source title", 500),
      url,
      ...(note ? { note } : {}),
    };
  });
}

function claimItems(value: unknown) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 200) {
    throw new Error("Claims must be an array with at most 200 items.");
  }

  return value.map((item) => {
    if (!isRecord(item)) throw new Error("Each claim must be an object.");
    const sourceUrl = optionalUrl(item.source_url, "Claim source URL");
    const risk = item.risk;
    if (
      risk !== undefined &&
      !["low", "medium", "high"].includes(String(risk))
    ) {
      throw new Error("Claim risk must be low, medium, or high.");
    }
    if (item.resolved !== undefined && typeof item.resolved !== "boolean") {
      throw new Error("Claim resolved must be true or false.");
    }
    return {
      claim: requiredString(item.claim, "Claim", 4_000),
      ...(sourceUrl ? { source_url: sourceUrl } : {}),
      ...(risk ? { risk: risk as "low" | "medium" | "high" } : {}),
      ...(typeof item.resolved === "boolean"
        ? { resolved: item.resolved }
        : {}),
    };
  });
}

function quickVerdict(value: unknown) {
  if (value === undefined || value === null) return {};
  if (!isRecord(value)) throw new Error("Quick verdict must be an object.");

  const verdict = optionalString(value.verdict, "Quick verdict", 4_000);
  const bestFor = optionalString(value.best_for, "Best for", 2_000);
  const avoidIf = optionalString(value.avoid_if, "Avoid if", 2_000);
  return {
    ...(verdict ? { verdict } : {}),
    ...(bestFor ? { best_for: bestFor } : {}),
    ...(avoidIf ? { avoid_if: avoidIf } : {}),
  };
}

export function isCodexDraftIngestConfigured() {
  return Boolean(
    process.env.CODEX_DRAFT_INGEST_TOKEN &&
      process.env.CODEX_DRAFT_INGEST_TOKEN.length >= 32,
  );
}

export function hasValidCodexDraftToken(request: Request) {
  const expected = process.env.CODEX_DRAFT_INGEST_TOKEN;
  const authorization = request.headers.get("authorization");
  const supplied = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!expected || expected.length < 32 || !supplied) return false;

  const expectedHash = createHash("sha256").update(expected).digest();
  const suppliedHash = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(expectedHash, suppliedHash);
}

export function validateCodexDraftPayload(value: unknown): DraftValidationResult {
  const input = isRecord(value) && isRecord(value.article) ? value.article : value;
  if (!isRecord(input)) {
    return { ok: false, error: "Draft payload must be a JSON object." };
  }

  try {
    const prohibited = PROHIBITED_FIELDS.find((field) => field in input);
    if (prohibited) {
      throw new Error(`Draft payload cannot set ${prohibited}.`);
    }
    if (
      input.testing_status !== undefined &&
      input.testing_status !== "researched"
    ) {
      throw new Error("Codex drafts must use researched testing status.");
    }
    if (
      input.original_evidence !== undefined &&
      (!Array.isArray(input.original_evidence) ||
        input.original_evidence.length > 0)
    ) {
      throw new Error("Codex drafts cannot claim original testing evidence.");
    }

    const title = requiredString(input.title, "Title", 300);
    const slug = slugify(
      optionalString(input.slug, "Slug", 160) ?? title,
    );
    if (!slug || slug.length > 160) throw new Error("Slug is invalid.");

    const category = requiredString(input.category, "Category", 120);
    if (!BLOG_CATEGORIES.includes(category as (typeof BLOG_CATEGORIES)[number])) {
      throw new Error("Category is not a supported Devicefield category.");
    }

    const articleType = input.article_type ?? "buying_guide";
    if (!ARTICLE_TYPES.includes(articleType as ArticleType)) {
      throw new Error("Article type is invalid.");
    }

    return {
      ok: true,
      article: {
        title,
        slug,
        excerpt: requiredString(input.excerpt, "Excerpt", 1_000),
        content: requiredString(input.content, "Content", 200_000),
        category,
        tags: stringArray(input.tags, "Tags", 30),
        cover_image_url: optionalUrl(input.cover_image_url, "Cover image URL"),
        cover_image_alt: optionalString(
          input.cover_image_alt,
          "Cover image alt text",
          500,
        ),
        focus_keyword: optionalString(
          input.focus_keyword,
          "Focus keyword",
          200,
        ),
        seo_title: optionalString(input.seo_title, "SEO title", 300),
        meta_description: optionalString(
          input.meta_description,
          "Meta description",
          1_000,
        ),
        canonical_url: optionalUrl(input.canonical_url, "Canonical URL"),
        faq_items: faqItems(input.faq_items),
        article_type: articleType as ArticleType,
        testing_status: "researched",
        sources: sourceItems(input.sources),
        claims: claimItems(input.claims),
        quick_verdict: quickVerdict(input.quick_verdict),
        compatibility_notes: optionalString(
          input.compatibility_notes,
          "Compatibility notes",
          20_000,
        ),
        limitations: optionalString(input.limitations, "Limitations", 20_000),
        testing_method: optionalString(
          input.testing_method,
          "Testing method",
          20_000,
        ),
        original_evidence: [],
        internal_notes: optionalString(
          input.internal_notes,
          "Internal notes",
          10_000,
        ),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Draft payload is invalid.",
    };
  }
}
