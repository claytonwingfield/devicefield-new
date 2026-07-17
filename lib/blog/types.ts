export const BLOG_CATEGORIES = [
  "Buying Guides",
  "Business Systems",
  "AI Tools",
  "Security",
  "Web Infrastructure",
  "Operations",
] as const;

export const AFFILIATE_PROGRAMS = [
  "Semrush",
  "WP Engine",
  "Shopify",
  "NordVPN",
  "Beehiiv",
  "Bluehost",
  "Frase",
  "Murf AI",
  "Writesonic",
  "Pictory AI",
  "HubSpot",
  "Fiverr",
  "MailerLite",
  "SurferSEO",
  "Adobe Creative Cloud",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type BlogPostStatus = "draft" | "published" | "archived";

export type BlogFaqItem = {
  question: string;
  answer: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  affiliate_programs: string[];
  cover_image_url: string | null;
  cover_image_alt: string | null;
  focus_keyword: string | null;
  seo_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  faq_items: BlogFaqItem[];
  status: BlogPostStatus;
  featured: boolean;
  published_at: string | null;
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
  return post.canonical_url?.trim() || `https://devicefield.com/blog/${post.slug}`;
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
