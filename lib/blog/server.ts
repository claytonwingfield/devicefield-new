import { createClient } from "@supabase/supabase-js";
import { samplePosts } from "./sample-posts";
import type { BlogPost } from "./types";

const BASE_POST_SELECT =
  "id,title,slug,excerpt,content,category,tags,affiliate_programs,cover_image_url,status,featured,published_at,created_at,updated_at";
const SEO_POST_SELECT =
  "id,title,slug,excerpt,content,category,tags,affiliate_programs,cover_image_url,cover_image_alt,focus_keyword,seo_title,meta_description,canonical_url,faq_items,status,featured,published_at,created_at,updated_at";

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

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

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

function isMissingSeoColumnError(message: string) {
  return (
    message.includes("cover_image_alt") ||
    message.includes("focus_keyword") ||
    message.includes("seo_title") ||
    message.includes("meta_description") ||
    message.includes("canonical_url") ||
    message.includes("faq_items")
  );
}

function normalizePost(post: Partial<BlogPost>) {
  return {
    ...(post as BlogPost),
    cover_image_alt: post.cover_image_alt ?? null,
    focus_keyword: post.focus_keyword ?? null,
    seo_title: post.seo_title ?? null,
    meta_description: post.meta_description ?? null,
    canonical_url: post.canonical_url ?? null,
    faq_items: Array.isArray(post.faq_items) ? post.faq_items : [],
  };
}

export async function getPublishedPosts(limit?: number) {
  if (!hasSupabaseConfig()) {
    return sortByPublishedAt(samplePosts).slice(0, limit);
  }

  try {
    const supabase = createPublicBlogClient();
    if (!supabase) return sortByPublishedAt(samplePosts).slice(0, limit);

    const runQuery = async (select: string) => {
      const query = supabase
        .from("blog_posts")
        .select(select)
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      return typeof limit === "number" ? await query.limit(limit) : await query;
    };

    let { data, error } = await runQuery(SEO_POST_SELECT);
    if (error && isMissingSeoColumnError(error.message)) {
      const fallback = await runQuery(BASE_POST_SELECT);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.warn("Unable to load blog posts from Supabase:", error.message);
      return sortByPublishedAt(samplePosts).slice(0, limit);
    }

    if (!data || data.length === 0) {
      return sortByPublishedAt(samplePosts).slice(0, limit);
    }

    return (data as Partial<BlogPost>[]).map(normalizePost);
  } catch (error) {
    console.warn("Unable to load blog posts:", error);
    return sortByPublishedAt(samplePosts).slice(0, limit);
  }
}

export async function getFeaturedPosts(limit = 3) {
  const posts = await getPublishedPosts();
  const featured = posts.filter((post) => post.featured);
  return (featured.length > 0 ? featured : posts).slice(0, limit);
}

export async function getPostBySlug(slug: string) {
  if (!hasSupabaseConfig()) {
    return samplePosts.find((post) => post.slug === slug) ?? null;
  }

  try {
    const supabase = createPublicBlogClient();
    if (!supabase) return samplePosts.find((post) => post.slug === slug) ?? null;

    const runQuery = async (select: string) =>
      supabase
        .from("blog_posts")
        .select(select)
        .eq("slug", slug)
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .maybeSingle();

    let { data, error } = await runQuery(SEO_POST_SELECT);
    if (error && isMissingSeoColumnError(error.message)) {
      const fallback = await runQuery(BASE_POST_SELECT);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.warn("Unable to load blog post from Supabase:", error.message);
    }

    return data
      ? normalizePost(data as Partial<BlogPost>)
      : samplePosts.find((post) => post.slug === slug) ?? null;
  } catch (error) {
    console.warn("Unable to load blog post:", error);
    return samplePosts.find((post) => post.slug === slug) ?? null;
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
