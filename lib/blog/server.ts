import { createClient } from "@supabase/supabase-js";
import { samplePosts } from "./sample-posts";
import type {
  ArticleClaim,
  ArticleSource,
  Author,
  BlogFaqItem,
  BlogPost,
  OriginalEvidence,
  QuickVerdict,
} from "./types";

const PUBLIC_POST_SELECT = [
  "id",
  "title",
  "slug",
  "excerpt",
  "content",
  "category",
  "tags",
  "cover_image_url",
  "cover_image_alt",
  "focus_keyword",
  "seo_title",
  "meta_description",
  "canonical_url",
  "faq_items",
  "article_type",
  "testing_status",
  "workflow_status",
  "author_id",
  "reviewer_id",
  "reviewed_at",
  "last_verified_at",
  "next_review_at",
  "sources",
  "claims",
  "quick_verdict",
  "compatibility_notes",
  "limitations",
  "testing_method",
  "original_evidence",
  "approved_at",
  "scheduled_for",
  "last_reviewed_at",
  "status",
  "featured",
  "published_at",
  "created_at",
  "updated_at",
].join(",");

const AUTHOR_SELECT =
  "id,slug,name,job_title,bio,avatar_url,website_url,created_at,updated_at";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

function createPublicBlogClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function sortByPublishedAt(posts: BlogPost[]) {
  return [...posts].sort((a, b) => {
    const left = new Date(a.published_at ?? a.created_at).getTime();
    const right = new Date(b.published_at ?? b.created_at).getTime();
    return right - left;
  });
}

function developmentPosts(limit?: number) {
  if (isProduction()) return [];
  return sortByPublishedAt(samplePosts).slice(0, limit);
}

function developmentPost(slug: string) {
  if (isProduction()) return null;
  return samplePosts.find((post) => post.slug === slug) ?? null;
}

function reportContentError(message: string, error?: unknown) {
  if (isProduction()) {
    console.error(message, error);
  } else {
    console.warn(message, error);
  }
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizePost(post: Partial<BlogPost>): BlogPost {
  return {
    ...(post as BlogPost),
    tags: asArray<string>(post.tags),
    cover_image_url: post.cover_image_url ?? null,
    cover_image_alt: post.cover_image_alt ?? null,
    focus_keyword: post.focus_keyword ?? null,
    seo_title: post.seo_title ?? null,
    meta_description: post.meta_description ?? null,
    canonical_url: post.canonical_url ?? null,
    faq_items: asArray<BlogFaqItem>(post.faq_items),
    article_type: post.article_type ?? "buying_guide",
    testing_status: post.testing_status ?? null,
    workflow_status: post.workflow_status ?? "draft",
    author_id: post.author_id ?? null,
    reviewer_id: post.reviewer_id ?? null,
    reviewed_at: post.reviewed_at ?? null,
    last_verified_at: post.last_verified_at ?? null,
    next_review_at: post.next_review_at ?? null,
    sources: asArray<ArticleSource>(post.sources),
    claims: asArray<ArticleClaim>(post.claims),
    quick_verdict:
      post.quick_verdict && typeof post.quick_verdict === "object"
        ? (post.quick_verdict as QuickVerdict)
        : {},
    compatibility_notes: post.compatibility_notes ?? null,
    limitations: post.limitations ?? null,
    testing_method: post.testing_method ?? null,
    original_evidence: asArray<OriginalEvidence>(post.original_evidence),
    approved_at: post.approved_at ?? null,
    scheduled_for: post.scheduled_for ?? null,
    last_reviewed_at: post.last_reviewed_at ?? null,
    internal_notes: null,
  };
}

export async function getPublishedPosts(limit?: number) {
  if (!hasSupabaseConfig()) {
    reportContentError(
      "Supabase configuration is missing; blog content is unavailable.",
    );
    return developmentPosts(limit);
  }

  try {
    const supabase = createPublicBlogClient();
    if (!supabase) return developmentPosts(limit);

    let query = supabase
      .from("blog_posts")
      .select(PUBLIC_POST_SELECT)
      .eq("workflow_status", "published")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (typeof limit === "number") query = query.limit(limit);
    const { data, error } = await query;

    if (error) {
      reportContentError(
        "Unable to load published blog posts from Supabase.",
        error.message,
      );
      return developmentPosts(limit);
    }

    if (!data || data.length === 0) return developmentPosts(limit);
    return (data as Partial<BlogPost>[]).map(normalizePost);
  } catch (error) {
    reportContentError("Unable to load published blog posts.", error);
    return developmentPosts(limit);
  }
}

export async function getFeaturedPosts(limit = 3) {
  const posts = await getPublishedPosts();
  return posts
    .filter((post) => post.featured && Boolean(post.cover_image_url))
    .slice(0, limit);
}

export async function getPostBySlug(slug: string) {
  if (!hasSupabaseConfig()) {
    reportContentError(
      "Supabase configuration is missing; article content is unavailable.",
    );
    return developmentPost(slug);
  }

  try {
    const supabase = createPublicBlogClient();
    if (!supabase) return developmentPost(slug);

    const { data, error } = await supabase
      .from("blog_posts")
      .select(PUBLIC_POST_SELECT)
      .eq("slug", slug)
      .eq("workflow_status", "published")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .maybeSingle();

    if (error) {
      reportContentError(
        "Unable to load published blog post from Supabase.",
        error.message,
      );
      return developmentPost(slug);
    }

    return data
      ? normalizePost(data as Partial<BlogPost>)
      : developmentPost(slug);
  } catch (error) {
    reportContentError("Unable to load published blog post.", error);
    return developmentPost(slug);
  }
}

export async function getRelatedPosts(currentSlug: string, category: string) {
  const posts = await getPublishedPosts();
  const related = posts.filter(
    (post) => post.slug !== currentSlug && post.category === category,
  );
  const fallback = posts.filter((post) => post.slug !== currentSlug);
  return (related.length > 0 ? related : fallback).slice(0, 3);
}

export async function getAuthorById(id: string | null) {
  if (!id) return null;
  const supabase = createPublicBlogClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("authors")
    .select(AUTHOR_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    reportContentError("Unable to load author profile.", error.message);
    return null;
  }

  return data as Author | null;
}

export async function getAuthorBySlug(slug: string) {
  const supabase = createPublicBlogClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("authors")
    .select(AUTHOR_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    reportContentError("Unable to load author profile.", error.message);
    return null;
  }

  return data as Author | null;
}
