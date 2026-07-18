import { getArticleUrl } from "@/lib/site/identity";

export const BLOG_CATEGORY_DETAILS = [
  {
    name: "Barcode & Inventory",
    slug: "barcode-inventory",
    description:
      "Explore barcode scanners, inventory workflows, SKU labeling, stock counting, compatibility, setup, and troubleshooting for businesses.",
  },
  {
    name: "Receipt & Label Printing",
    slug: "receipt-label-printing",
    description:
      "Explore receipt and label printer guides covering thermal media, drivers, POS compatibility, setup, maintenance, and replacement planning.",
  },
  {
    name: "POS Hardware",
    slug: "pos-hardware",
    description:
      "Compare POS terminals, tablets, cash drawers, stands, card readers, accessories, and complete retail counter setups for businesses.",
  },
  {
    name: "Networking & Uptime",
    slug: "networking-uptime",
    description:
      "Plan business routers, internet failover, backup power, Wi-Fi coverage, network recovery, and continuity equipment for reliable operations.",
  },
  {
    name: "Business Software",
    slug: "business-software",
    description:
      "Evaluate POS platforms, inventory applications, reporting tools, integrations, and connected operating systems for modern businesses.",
  },
  {
    name: "Troubleshooting",
    slug: "troubleshooting",
    description:
      "Find practical fixes for printer pairing, scanner setup, POS connections, network drops, device errors, and hardware compatibility problems.",
  },
] as const;

export const BLOG_CATEGORIES = BLOG_CATEGORY_DETAILS.map(
  (category) => category.name,
);

export type BlogCategory = (typeof BLOG_CATEGORY_DETAILS)[number]["name"];

export const ARTICLE_TYPES = [
  "buying_guide",
  "review",
  "comparison",
  "setup_guide",
  "compatibility_guide",
  "troubleshooting",
] as const;

export const TESTING_STATUSES = ["tested", "researched", "mixed"] as const;

export const ARTICLE_WORKFLOW_STATUSES = [
  "draft",
  "ready_for_review",
  "approved",
  "scheduled",
  "published",
  "archived",
] as const;

export const SOCIAL_PLATFORMS = ["x", "facebook", "instagram"] as const;

export const SOCIAL_PLATFORM_LIMITS = {
  x: 280,
  facebook: 5_000,
  instagram: 2_200,
} as const;

export type ArticleType = (typeof ARTICLE_TYPES)[number];
export type TestingStatus = (typeof TESTING_STATUSES)[number];
export type ArticleWorkflowStatus = (typeof ARTICLE_WORKFLOW_STATUSES)[number];
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type BlogPostStatus = "draft" | "published" | "archived";

export type BlogFaqItem = {
  question: string;
  answer: string;
};

export type ArticleSource = {
  title: string;
  url: string;
  note?: string;
};

export type ArticleClaim = {
  claim: string;
  source_url?: string;
  risk?: "low" | "medium" | "high";
  resolved?: boolean;
};

export type QuickVerdict = {
  verdict?: string;
  best_for?: string;
  avoid_if?: string;
};

export type OriginalEvidence = {
  label: string;
  url?: string;
  note?: string;
};

export type Author = {
  id: string;
  slug: string;
  name: string;
  job_title: string | null;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogPost = {
  id: string;
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
  faq_items: BlogFaqItem[];
  article_type: ArticleType;
  testing_status: TestingStatus | null;
  workflow_status: ArticleWorkflowStatus;
  author_id: string | null;
  reviewer_id: string | null;
  reviewed_at: string | null;
  last_verified_at: string | null;
  next_review_at: string | null;
  sources: ArticleSource[];
  claims: ArticleClaim[];
  quick_verdict: QuickVerdict;
  compatibility_notes: string | null;
  limitations: string | null;
  testing_method: string | null;
  original_evidence: OriginalEvidence[];
  approved_at: string | null;
  scheduled_for: string | null;
  last_reviewed_at: string | null;
  internal_notes: string | null;
  status: BlogPostStatus;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleCoverImage = {
  id: string;
  article_id: string;
  image_url: string;
  image_alt: string;
  label: string;
  display_order: number;
  selected: boolean;
  created_at: string;
  updated_at: string;
};

export type ArticleSocialPost = {
  id: string;
  article_id: string;
  platform: SocialPlatform;
  content: string;
  created_at: string;
  updated_at: string;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatArticleType(value: ArticleType) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatWorkflowStatus(value: ArticleWorkflowStatus) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getBlogCategoryBySlug(slug: string) {
  return (
    BLOG_CATEGORY_DETAILS.find((category) => category.slug === slug) ?? null
  );
}

export function getBlogCategoryByName(name: string) {
  return (
    BLOG_CATEGORY_DETAILS.find((category) => category.name === name) ?? null
  );
}

export function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function getPostSeoTitle(post: BlogPost) {
  return post.seo_title?.trim() || post.title;
}

export function getPostMetaDescription(post: BlogPost) {
  return post.meta_description?.trim() || post.excerpt;
}

export function getPostCanonicalUrl(post: BlogPost) {
  return getArticleUrl(post.slug);
}

export function getPostCoverImageAlt(post: BlogPost) {
  return post.cover_image_alt?.trim() || post.title;
}

export function formatPostDate(value: string | null) {
  if (!value) return "Draft";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
