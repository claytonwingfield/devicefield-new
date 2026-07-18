import { createHash, timingSafeEqual } from "node:crypto";
import {
  AFFILIATE_NETWORKS,
  AFFILIATE_SUGGESTION_PLACEMENTS,
  ARTICLE_PRODUCT_PLACEMENTS,
  type AffiliateNetwork,
  type AffiliateSuggestionPlacement,
  type ArticleProductPlacement,
} from "../affiliate/types";
import {
  ARTICLE_TYPES,
  BLOG_CATEGORIES,
  TESTING_STATUSES,
  type ArticleType,
  type TestingStatus,
} from "../blog/types";

type JsonRecord = Record<string, unknown>;

type CodexSource = {
  title: string;
  url: string;
  note?: string;
};

type CodexClaim = {
  claim: string;
  source_url: string;
  risk: "low" | "medium" | "high";
  resolved: boolean;
};

type CodexOriginalEvidence = {
  label: string;
  url?: string;
  note?: string;
};

export type CodexArticleProduct = {
  affiliate_link_slug: string | null;
  product_name: string;
  award: string | null;
  best_for: string | null;
  avoid_if: string | null;
  verdict: string | null;
  pros: string[];
  cons: string[];
  placement: ArticleProductPlacement;
  display_order: number;
};

export type CodexAffiliateSuggestion = {
  program_name: string;
  network: AffiliateNetwork;
  program_url: string;
  product_name: string | null;
  evidence_url: string;
  evidence_checked_at: string;
  rationale: string;
  target_heading: string;
  suggested_placement: AffiliateSuggestionPlacement;
  insertion_note: string;
  suggested_cta: string | null;
  display_order: number;
};

export type CodexBodyImage = {
  id: string;
  file_name: string;
  alt: string;
};

export type CodexReviewDraftPayload = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  cover_image_alt: string;
  focus_keyword: string;
  seo_title: string;
  meta_description: string;
  canonical_url: string;
  faq_items: Array<{ question: string; answer: string }>;
  article_type: ArticleType;
  testing_status: TestingStatus;
  author_slug: string;
  reviewer_slug: string;
  last_verified_at: string;
  next_review_at: string;
  sources: CodexSource[];
  claims: CodexClaim[];
  quick_verdict: {
    verdict?: string;
    best_for?: string;
    avoid_if?: string;
  };
  compatibility_notes: string;
  limitations: string;
  testing_method: string;
  original_evidence: CodexOriginalEvidence[];
  internal_notes: string | null;
  featured: false;
  body_images: CodexBodyImage[];
  article_products: CodexArticleProduct[];
  affiliate_suggestions: CodexAffiliateSuggestion[];
};

type DraftValidationResult =
  | { ok: true; article: CodexReviewDraftPayload }
  | { ok: false; error: string };

type ImageLike = {
  name?: string;
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export const CODEX_DRAFT_MAX_BODY_BYTES = 24 * 1024 * 1024;
export const CODEX_DRAFT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const CODEX_DRAFT_MAX_INLINE_IMAGE_BYTES = 5 * 1024 * 1024;
export const CODEX_DRAFT_MAX_INLINE_IMAGES = 4;
export const CODEX_DRAFT_RATE_LIMIT = 12;
export const CODEX_DRAFT_RATE_WINDOW_MS = 60_000;
export const CODEX_FEATURED_IMAGE_WIDTH = 1600;
export const CODEX_FEATURED_IMAGE_HEIGHT = 800;

const PLACEHOLDER_PATTERN =
  /\b(?:TODO|TBD|TK)\b|needs\s+source|\[citation\s+needed\]/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BODY_IMAGE_FILE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:png|webp)$/;
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const rateLimitBuckets = new Map<string, RateLimitBucket>();

const PROHIBITED_FIELDS = [
  "workflow_status",
  "status",
  "approved_at",
  "scheduled_for",
  "published_at",
  "archived_at",
  "created_by",
  "author_id",
  "reviewer_id",
  "reviewed_at",
  "last_reviewed_at",
] as const;

const ALLOWED_FIELDS = new Set([
  "title",
  "slug",
  "excerpt",
  "content",
  "category",
  "tags",
  "cover_image_alt",
  "focus_keyword",
  "seo_title",
  "meta_description",
  "canonical_url",
  "faq_items",
  "article_type",
  "testing_status",
  "author_slug",
  "reviewer_slug",
  "last_verified_at",
  "next_review_at",
  "sources",
  "claims",
  "quick_verdict",
  "compatibility_notes",
  "limitations",
  "testing_method",
  "original_evidence",
  "internal_notes",
  "featured",
  "body_images",
  "article_products",
  "affiliate_suggestions",
]);

const ALLOWED_PRODUCT_FIELDS = new Set([
  "affiliate_link_slug",
  "product_name",
  "award",
  "best_for",
  "avoid_if",
  "verdict",
  "pros",
  "cons",
  "placement",
  "display_order",
]);

const ALLOWED_AFFILIATE_SUGGESTION_FIELDS = new Set([
  "program_name",
  "network",
  "program_url",
  "product_name",
  "evidence_url",
  "evidence_checked_at",
  "rationale",
  "target_heading",
  "suggested_placement",
  "insertion_note",
  "suggested_cta",
  "display_order",
]);

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function containsPlaceholder(value: unknown): boolean {
  if (typeof value === "string") return PLACEHOLDER_PATTERN.test(value);
  if (Array.isArray(value)) return value.some(containsPlaceholder);
  if (isRecord(value)) return Object.values(value).some(containsPlaceholder);
  return false;
}

function hash(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
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

function requiredUrl(value: unknown, label: string) {
  const normalized = requiredString(value, label, 2_000);
  try {
    const url = new URL(normalized);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${label} must be a valid HTTP or HTTPS URL.`);
  }
}

function optionalUrl(value: unknown, label: string) {
  const normalized = optionalString(value, label, 2_000);
  return normalized ? requiredUrl(normalized, label) : null;
}

function requiredIsoDate(value: unknown, label: string) {
  const normalized = requiredString(value, label, 100);
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} must be a valid ISO date.`);
  }
  return date.toISOString();
}

function stringArray(value: unknown, label: string, maximumItems: number) {
  if (!Array.isArray(value) || value.length > maximumItems) {
    throw new Error(`${label} must be an array with at most ${maximumItems} items.`);
  }
  return Array.from(
    new Set(value.map((item) => requiredString(item, `${label} item`, 200))),
  );
}

function faqItems(value: unknown) {
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

function sourceItems(value: unknown, minimumItems: number) {
  if (
    !Array.isArray(value) ||
    value.length < minimumItems ||
    value.length > 100
  ) {
    throw new Error(
      `Sources must contain between ${minimumItems} and 100 items.`,
    );
  }
  return value.map((item) => {
    if (!isRecord(item)) throw new Error("Each source must be an object.");
    const note = optionalString(item.note, "Source note", 2_000);
    return {
      title: requiredString(item.title, "Source title", 500),
      url: requiredUrl(item.url, "Source URL"),
      ...(note ? { note } : {}),
    };
  });
}

function claimItems(value: unknown) {
  if (!Array.isArray(value) || value.length > 200) {
    throw new Error("Claims must be an array with at most 200 items.");
  }
  return value.map((item) => {
    if (!isRecord(item)) throw new Error("Each claim must be an object.");
    const risk = item.risk ?? "medium";
    if (!['low', 'medium', 'high'].includes(String(risk))) {
      throw new Error("Claim risk must be low, medium, or high.");
    }
    if (typeof item.resolved !== "boolean") {
      throw new Error("Claim resolved must be true or false.");
    }
    if (risk === "high" && item.resolved !== true) {
      throw new Error("Unresolved high-risk claims are not allowed.");
    }
    return {
      claim: requiredString(item.claim, "Claim", 4_000),
      source_url: requiredUrl(item.source_url, "Claim source URL"),
      risk: risk as "low" | "medium" | "high",
      resolved: item.resolved,
    };
  });
}

function quickVerdict(value: unknown) {
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

function originalEvidenceItems(value: unknown) {
  if (!Array.isArray(value) || value.length > 50) {
    throw new Error("Original evidence must be an array with at most 50 items.");
  }
  return value.map((item) => {
    if (!isRecord(item)) {
      throw new Error("Each original evidence item must be an object.");
    }
    const url = optionalUrl(item.url, "Original evidence URL");
    const note = optionalString(item.note, "Original evidence note", 2_000);
    return {
      label: requiredString(item.label, "Original evidence label", 500),
      ...(url ? { url } : {}),
      ...(note ? { note } : {}),
    };
  });
}

function articleProducts(value: unknown) {
  if (!Array.isArray(value) || value.length > 50) {
    throw new Error("Article products must be an array with at most 50 items.");
  }
  return value.map((item) => {
    if (!isRecord(item)) throw new Error("Each article product must be an object.");
    const unknownField = Object.keys(item).find(
      (field) => !ALLOWED_PRODUCT_FIELDS.has(field),
    );
    if (unknownField) {
      throw new Error(`Article product cannot set ${unknownField}.`);
    }
    const affiliateLinkSlug = optionalString(
      item.affiliate_link_slug,
      "Affiliate link slug",
      160,
    );
    if (affiliateLinkSlug && !SLUG_PATTERN.test(affiliateLinkSlug)) {
      throw new Error("Affiliate link slug is invalid.");
    }
    const placement = item.placement ?? "recommendation";
    if (!ARTICLE_PRODUCT_PLACEMENTS.includes(placement as ArticleProductPlacement)) {
      throw new Error("Article product placement is invalid.");
    }
    const displayOrder = item.display_order ?? 0;
    if (
      typeof displayOrder !== "number" ||
      !Number.isInteger(displayOrder) ||
      displayOrder < 0 ||
      displayOrder > 10_000
    ) {
      throw new Error("Article product display order is invalid.");
    }
    return {
      affiliate_link_slug: affiliateLinkSlug,
      product_name: requiredString(item.product_name, "Product name", 500),
      award: optionalString(item.award, "Product award", 500),
      best_for: optionalString(item.best_for, "Product best for", 2_000),
      avoid_if: optionalString(item.avoid_if, "Product avoid if", 2_000),
      verdict: optionalString(item.verdict, "Product verdict", 4_000),
      pros: stringArray(item.pros ?? [], "Product pros", 20),
      cons: stringArray(item.cons ?? [], "Product cons", 20),
      placement: placement as ArticleProductPlacement,
      display_order: displayOrder,
    };
  });
}

function getArticleHeadings(content: string) {
  return new Set(
    Array.from(content.matchAll(/^#{2,3}\s+(.+?)\s*$/gm), (match) =>
      match[1].trim(),
    ),
  );
}

function validateBodyImageAltText(content: string) {
  const images = Array.from(content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g));
  const invalid = images.find((match) => match[1].trim().length < 8);
  if (invalid) {
    throw new Error(
      "Every inline body image must have descriptive alt text of at least 8 characters.",
    );
  }
}

function bodyImages(value: unknown, content: string) {
  if (!Array.isArray(value) || value.length > CODEX_DRAFT_MAX_INLINE_IMAGES) {
    throw new Error(
      `Body images must be an array with at most ${CODEX_DRAFT_MAX_INLINE_IMAGES} items.`,
    );
  }

  const seenIds = new Set<string>();
  const seenFiles = new Set<string>();
  const images = value.map((item) => {
    if (!isRecord(item)) throw new Error("Each body image must be an object.");
    const unknownField = Object.keys(item).find(
      (field) => !["id", "file_name", "alt"].includes(field),
    );
    if (unknownField) throw new Error(`Body image cannot set ${unknownField}.`);

    const id = requiredString(item.id, "Body image ID", 80);
    if (!SLUG_PATTERN.test(id) || seenIds.has(id)) {
      throw new Error("Body image IDs must be unique lowercase slugs.");
    }
    seenIds.add(id);

    const fileName = requiredString(item.file_name, "Body image file name", 100);
    if (!BODY_IMAGE_FILE_PATTERN.test(fileName) || seenFiles.has(fileName)) {
      throw new Error(
        "Body image file names must be unique lowercase PNG or WebP names.",
      );
    }
    seenFiles.add(fileName);

    const alt = requiredString(item.alt, "Body image alt text", 500);
    if (alt.length < 8 || /[\]\r\n]/.test(alt)) {
      throw new Error(
        "Body image alt text must be descriptive and safe for Markdown.",
      );
    }

    const markdown = `![${alt}](devicefield-body-image://${id})`;
    if (content.split(markdown).length !== 2) {
      throw new Error(
        "Each body image must appear exactly once in the article with matching alt text.",
      );
    }

    return { id, file_name: fileName, alt };
  });

  const placeholderIds = Array.from(
    content.matchAll(/devicefield-body-image:\/\/([a-z0-9-]+)/g),
    (match) => match[1],
  );
  if (
    placeholderIds.length !== images.length ||
    placeholderIds.some((id) => !seenIds.has(id))
  ) {
    throw new Error(
      "Article body-image placeholders must match the body_images manifest.",
    );
  }

  return images;
}

function affiliateSuggestions(value: unknown, content: string) {
  if (!Array.isArray(value) || value.length > 10) {
    throw new Error(
      "Affiliate suggestions must be an array with at most 10 items.",
    );
  }

  const headings = getArticleHeadings(content);
  const seen = new Set<string>();

  return value.map((item) => {
    if (!isRecord(item)) {
      throw new Error("Each affiliate suggestion must be an object.");
    }
    const unknownField = Object.keys(item).find(
      (field) => !ALLOWED_AFFILIATE_SUGGESTION_FIELDS.has(field),
    );
    if (unknownField) {
      throw new Error(`Affiliate suggestion cannot set ${unknownField}.`);
    }

    const network = requiredString(
      item.network,
      "Affiliate suggestion network",
      40,
    );
    if (!AFFILIATE_NETWORKS.includes(network as AffiliateNetwork)) {
      throw new Error("Affiliate suggestion network is invalid.");
    }

    const suggestedPlacement = requiredString(
      item.suggested_placement,
      "Affiliate suggestion placement",
      80,
    );
    if (
      !AFFILIATE_SUGGESTION_PLACEMENTS.includes(
        suggestedPlacement as AffiliateSuggestionPlacement,
      )
    ) {
      throw new Error("Affiliate suggestion placement is invalid.");
    }

    const targetHeading = requiredString(
      item.target_heading,
      "Affiliate suggestion target heading",
      500,
    );
    if (!headings.has(targetHeading)) {
      throw new Error(
        "Affiliate suggestion target heading must exactly match an article H2 or H3.",
      );
    }

    const programName = requiredString(
      item.program_name,
      "Affiliate suggestion program name",
      300,
    );
    const duplicateKey = `${programName.toLowerCase()}\n${targetHeading.toLowerCase()}`;
    if (seen.has(duplicateKey)) {
      throw new Error("Affiliate suggestions cannot repeat a program and heading.");
    }
    seen.add(duplicateKey);

    const displayOrder = item.display_order ?? 0;
    if (
      typeof displayOrder !== "number" ||
      !Number.isInteger(displayOrder) ||
      displayOrder < 0 ||
      displayOrder > 10_000
    ) {
      throw new Error("Affiliate suggestion display order is invalid.");
    }

    const evidenceCheckedAt = requiredIsoDate(
      item.evidence_checked_at,
      "Affiliate suggestion evidence date",
    );
    if (new Date(evidenceCheckedAt).getTime() > Date.now() + 86_400_000) {
      throw new Error("Affiliate suggestion evidence date cannot be in the future.");
    }

    return {
      program_name: programName,
      network: network as AffiliateNetwork,
      program_url: requiredUrl(
        item.program_url,
        "Affiliate suggestion program URL",
      ),
      product_name: optionalString(
        item.product_name,
        "Affiliate suggestion product name",
        500,
      ),
      evidence_url: requiredUrl(
        item.evidence_url,
        "Affiliate suggestion evidence URL",
      ),
      evidence_checked_at: evidenceCheckedAt,
      rationale: requiredString(
        item.rationale,
        "Affiliate suggestion rationale",
        4_000,
      ),
      target_heading: targetHeading,
      suggested_placement:
        suggestedPlacement as AffiliateSuggestionPlacement,
      insertion_note: requiredString(
        item.insertion_note,
        "Affiliate suggestion insertion note",
        4_000,
      ),
      suggested_cta: optionalString(
        item.suggested_cta,
        "Affiliate suggestion CTA",
        160,
      ),
      display_order: displayOrder,
    };
  });
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
  const supplied = authorization?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
  if (!expected || expected.length < 32 || !supplied) return false;

  const expectedHash = createHash("sha256").update(expected).digest();
  const suppliedHash = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(expectedHash, suppliedHash);
}

export function getCodexRequestFingerprint(request: Request) {
  return hash(
    [
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
      request.headers.get("user-agent") ?? "",
      request.headers.get("accept-language") ?? "",
    ].join("\n"),
  );
}

function consumeRateLimitBucket(key: string, now: number) {
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + CODEX_DRAFT_RATE_WINDOW_MS,
    });
    return true;
  }
  if (bucket.count >= CODEX_DRAFT_RATE_LIMIT) return false;
  bucket.count += 1;
  return true;
}

export function consumeCodexDraftRateLimit(
  request: Request,
  now = Date.now(),
) {
  if (rateLimitBuckets.size > 2_000) {
    rateLimitBuckets.forEach((bucket, key) => {
      if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
    });
  }
  const authorization = request.headers.get("authorization") ?? "missing";
  const fingerprint = getCodexRequestFingerprint(request);
  const tokenAllowed = consumeRateLimitBucket(
    `token:${hash(authorization)}`,
    now,
  );
  const fingerprintAllowed = consumeRateLimitBucket(
    `fingerprint:${fingerprint}`,
    now,
  );
  return tokenAllowed && fingerprintAllowed;
}

export function resetCodexDraftRateLimitForTests() {
  rateLimitBuckets.clear();
}

export function validateCodexRunId(value: string | null) {
  const normalized = value?.trim() ?? "";
  return RUN_ID_PATTERN.test(normalized) ? normalized : null;
}

export function hashCodexDraftSubmission(
  payload: string,
  images: readonly Uint8Array[],
) {
  const digest = createHash("sha256").update(payload);
  for (const image of images) digest.update("\0").update(image);
  return digest.digest("hex");
}

function matchesBytes(
  bytes: Uint8Array,
  offset: number,
  expected: readonly number[],
) {
  return expected.every((value, index) => bytes[offset + index] === value);
}

function readAscii(bytes: Uint8Array, offset: number, length: number) {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(bytes[offset + index]);
  }
  return value;
}

function getPngDimensions(bytes: Uint8Array) {
  if (
    bytes.length < 45 ||
    !matchesBytes(bytes, 0, [137, 80, 78, 71, 13, 10, 26, 10])
  ) {
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  let width = 0;
  let height = 0;
  let sawImageData = false;

  while (offset + 12 <= bytes.length) {
    const chunkLength = view.getUint32(offset);
    const chunkType = readAscii(bytes, offset + 4, 4);
    const dataOffset = offset + 8;
    const nextOffset = dataOffset + chunkLength + 4;
    if (nextOffset > bytes.length) return null;

    if (offset === 8) {
      if (chunkType !== "IHDR" || chunkLength !== 13) return null;
      width = view.getUint32(dataOffset);
      height = view.getUint32(dataOffset + 4);
      if (width === 0 || height === 0) return null;
    } else if (chunkType === "IHDR") {
      return null;
    }

    if (chunkType === "IDAT" && chunkLength > 0) sawImageData = true;
    if (chunkType === "IEND") {
      return chunkLength === 0 && sawImageData && nextOffset === bytes.length
        ? { width, height }
        : null;
    }

    offset = nextOffset;
  }

  return null;
}

function readUint24Le(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function getWebpDimensions(bytes: Uint8Array) {
  if (
    bytes.length < 30 ||
    readAscii(bytes, 0, 4) !== "RIFF" ||
    readAscii(bytes, 8, 4) !== "WEBP"
  ) {
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(4, true) + 8 !== bytes.length) return null;

  let offset = 12;
  let canvas: { width: number; height: number } | null = null;
  let image: { width: number; height: number } | null = null;
  let sawImageData = false;

  while (offset + 8 <= bytes.length) {
    const chunkType = readAscii(bytes, offset, 4);
    const chunkLength = view.getUint32(offset + 4, true);
    const dataOffset = offset + 8;
    const dataEnd = dataOffset + chunkLength;
    const nextOffset = dataEnd + (chunkLength % 2);
    if (dataEnd > bytes.length || nextOffset > bytes.length) return null;

    if (chunkType === "VP8X") {
      if (chunkLength < 10) return null;
      canvas = {
        width: readUint24Le(bytes, dataOffset + 4) + 1,
        height: readUint24Le(bytes, dataOffset + 7) + 1,
      };
    } else if (chunkType === "VP8 ") {
      if (
        chunkLength < 10 ||
        !matchesBytes(bytes, dataOffset + 3, [157, 1, 42])
      ) {
        return null;
      }
      image = {
        width: view.getUint16(dataOffset + 6, true) & 0x3fff,
        height: view.getUint16(dataOffset + 8, true) & 0x3fff,
      };
      sawImageData = true;
    } else if (chunkType === "VP8L") {
      if (chunkLength < 5 || bytes[dataOffset] !== 47) return null;
      const dimensions = view.getUint32(dataOffset + 1, true);
      image = {
        width: (dimensions & 0x3fff) + 1,
        height: ((dimensions >>> 14) & 0x3fff) + 1,
      };
      sawImageData = true;
    } else if (chunkType === "ANMF") {
      if (chunkLength < 16) return null;
      sawImageData = true;
    }

    offset = nextOffset;
  }

  if (offset !== bytes.length || !sawImageData) return null;
  const dimensions = canvas ?? image;
  return dimensions?.width && dimensions.height ? dimensions : null;
}

export async function validateCodexFeaturedImage(file: ImageLike) {
  if (file.size <= 0 || file.size > CODEX_DRAFT_MAX_IMAGE_BYTES) {
    return { ok: false as const, error: "Featured image size is invalid." };
  }
  if (!["image/png", "image/webp"].includes(file.type)) {
    return { ok: false as const, error: "Featured image must be PNG or WebP." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length !== file.size) {
    return { ok: false as const, error: "Featured image size is invalid." };
  }

  const dimensions =
    file.type === "image/png"
      ? getPngDimensions(bytes)
      : getWebpDimensions(bytes);
  if (!dimensions) {
    return {
      ok: false as const,
      error: "Featured image content is invalid or does not match its media type.",
    };
  }
  if (
    dimensions.width !== CODEX_FEATURED_IMAGE_WIDTH ||
    dimensions.height !== CODEX_FEATURED_IMAGE_HEIGHT
  ) {
    return {
      ok: false as const,
      error: `Featured image must be exactly ${CODEX_FEATURED_IMAGE_WIDTH} x ${CODEX_FEATURED_IMAGE_HEIGHT} pixels.`,
    };
  }

  return {
    ok: true as const,
    bytes,
    width: dimensions.width,
    height: dimensions.height,
    contentType: file.type as "image/png" | "image/webp",
    extension: file.type === "image/png" ? ("png" as const) : ("webp" as const),
  };
}

export async function validateCodexBodyImage(file: ImageLike) {
  if (file.size <= 0 || file.size > CODEX_DRAFT_MAX_INLINE_IMAGE_BYTES) {
    return { ok: false as const, error: "Body image size is invalid." };
  }
  if (!["image/png", "image/webp"].includes(file.type)) {
    return { ok: false as const, error: "Body images must be PNG or WebP." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length !== file.size) {
    return { ok: false as const, error: "Body image size is invalid." };
  }

  const dimensions =
    file.type === "image/png"
      ? getPngDimensions(bytes)
      : getWebpDimensions(bytes);
  if (!dimensions) {
    return {
      ok: false as const,
      error: "Body image content is invalid or does not match its media type.",
    };
  }
  if (
    dimensions.width < 800 ||
    dimensions.height < 400 ||
    dimensions.width > 3_200 ||
    dimensions.height > 3_200
  ) {
    return {
      ok: false as const,
      error: "Body images must be between 800 x 400 and 3200 x 3200 pixels.",
    };
  }

  return {
    ok: true as const,
    bytes,
    width: dimensions.width,
    height: dimensions.height,
    contentType: file.type as "image/png" | "image/webp",
    extension: file.type === "image/png" ? ("png" as const) : ("webp" as const),
  };
}

export function validateCodexDraftPayload(value: unknown): DraftValidationResult {
  if (!isRecord(value)) {
    return { ok: false, error: "Draft payload must be a JSON object." };
  }

  try {
    const prohibited = PROHIBITED_FIELDS.find((field) => field in value);
    if (prohibited) {
      throw new Error(`Draft payload cannot set ${prohibited}.`);
    }
    const unknownField = Object.keys(value).find(
      (field) => !ALLOWED_FIELDS.has(field),
    );
    if (unknownField) {
      throw new Error(`Draft payload cannot set ${unknownField}.`);
    }
    if (value.featured !== undefined && value.featured !== false) {
      throw new Error("Codex drafts cannot be featured.");
    }
    if (containsPlaceholder(value)) {
      throw new Error("Draft payload contains an unresolved placeholder.");
    }

    const slug = requiredString(value.slug, "Slug", 160);
    if (!SLUG_PATTERN.test(slug)) throw new Error("Slug is invalid.");

    const category = requiredString(value.category, "Category", 120);
    if (!BLOG_CATEGORIES.includes(category as (typeof BLOG_CATEGORIES)[number])) {
      throw new Error("Category is not a supported Devicefield category.");
    }

    const articleType = requiredString(value.article_type, "Article type", 80);
    if (!ARTICLE_TYPES.includes(articleType as ArticleType)) {
      throw new Error("Article type is invalid.");
    }

    const testingStatus = requiredString(
      value.testing_status,
      "Testing status",
      40,
    );
    if (!TESTING_STATUSES.includes(testingStatus as TestingStatus)) {
      throw new Error("Testing status is invalid.");
    }

    const evidence = originalEvidenceItems(value.original_evidence);
    if (['tested', 'mixed'].includes(testingStatus) && evidence.length === 0) {
      throw new Error("Tested or mixed drafts require original evidence.");
    }

    const authorSlug = requiredString(value.author_slug, "Author slug", 160);
    const reviewerSlug = requiredString(
      value.reviewer_slug,
      "Reviewer slug",
      160,
    );
    if (!SLUG_PATTERN.test(authorSlug) || !SLUG_PATTERN.test(reviewerSlug)) {
      throw new Error("Author and reviewer slugs are invalid.");
    }

    const canonicalUrl = requiredUrl(value.canonical_url, "Canonical URL");
    const canonical = new URL(canonicalUrl);
    if (
      canonical.protocol !== "https:" ||
      canonical.hostname !== "devicefield.com" ||
      canonical.pathname !== `/blog/${slug}`
    ) {
      throw new Error("Canonical URL must match the Devicefield article slug.");
    }

    const lastVerifiedAt = requiredIsoDate(
      value.last_verified_at,
      "Last verified date",
    );
    const nextReviewAt = requiredIsoDate(value.next_review_at, "Next review date");
    if (new Date(nextReviewAt) <= new Date(lastVerifiedAt)) {
      throw new Error("Next review date must be after the last verified date.");
    }

    const minimumSources = ['buying_guide', 'review', 'comparison'].includes(
      articleType,
    )
      ? 5
      : 3;
    const content = requiredString(value.content, "Content", 200_000);
    validateBodyImageAltText(content);
    const normalizedBodyImages = bodyImages(value.body_images ?? [], content);

    return {
      ok: true,
      article: {
        title: requiredString(value.title, "Title", 300),
        slug,
        excerpt: requiredString(value.excerpt, "Excerpt", 1_000),
        content,
        category,
        tags: stringArray(value.tags, "Tags", 30),
        cover_image_alt: requiredString(
          value.cover_image_alt,
          "Cover image alt text",
          500,
        ),
        focus_keyword: requiredString(
          value.focus_keyword,
          "Focus keyword",
          200,
        ),
        seo_title: requiredString(value.seo_title, "SEO title", 300),
        meta_description: requiredString(
          value.meta_description,
          "Meta description",
          1_000,
        ),
        canonical_url: canonicalUrl,
        faq_items: faqItems(value.faq_items),
        article_type: articleType as ArticleType,
        testing_status: testingStatus as TestingStatus,
        author_slug: authorSlug,
        reviewer_slug: reviewerSlug,
        last_verified_at: lastVerifiedAt,
        next_review_at: nextReviewAt,
        sources: sourceItems(value.sources, minimumSources),
        claims: claimItems(value.claims),
        quick_verdict: quickVerdict(value.quick_verdict),
        compatibility_notes: requiredString(
          value.compatibility_notes,
          "Compatibility notes",
          20_000,
        ),
        limitations: requiredString(value.limitations, "Limitations", 20_000),
        testing_method: requiredString(
          value.testing_method,
          "Testing method",
          20_000,
        ),
        original_evidence: evidence,
        internal_notes: optionalString(
          value.internal_notes,
          "Internal notes",
          10_000,
        ),
        featured: false,
        body_images: normalizedBodyImages,
        article_products: articleProducts(value.article_products),
        affiliate_suggestions: affiliateSuggestions(
          value.affiliate_suggestions ?? [],
          content,
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
