import type { MetadataRoute } from "next";
import { getAuthorById, getPublishedPosts } from "@/lib/blog/server";
import { BLOG_CATEGORY_DETAILS } from "@/lib/blog/types";
import { getSitePage, type SitePageSlug } from "@/lib/site/pages";

const siteUrl = "https://devicefield.com";
const publicPages: Array<{
  slug: Exclude<SitePageSlug, "global">;
  path: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
}> = [
  { slug: "home", path: "", frequency: "weekly", priority: 1 },
  { slug: "blog", path: "/blog", frequency: "daily", priority: 0.9 },
  { slug: "about", path: "/about", frequency: "monthly", priority: 0.7 },
  { slug: "contact", path: "/contact", frequency: "yearly", priority: 0.5 },
  {
    slug: "review-methodology",
    path: "/review-methodology",
    frequency: "monthly",
    priority: 0.7,
  },
  {
    slug: "editorial-policy",
    path: "/editorial-policy",
    frequency: "monthly",
    priority: 0.6,
  },
  {
    slug: "affiliate-disclosure",
    path: "/affiliate-disclosure",
    frequency: "monthly",
    priority: 0.5,
  },
  { slug: "privacy", path: "/privacy", frequency: "yearly", priority: 0.3 },
  { slug: "terms", path: "/terms", frequency: "yearly", priority: 0.3 },
];

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, pages] = await Promise.all([
    getPublishedPosts(),
    Promise.all(publicPages.map((page) => getSitePage(page.slug))),
  ]);
  const publishedCategories = BLOG_CATEGORY_DETAILS.filter((category) =>
    posts.some((post) => post.category === category.name),
  );
  const authorIds = Array.from(
    new Set(posts.map((post) => post.author_id).filter(Boolean)),
  ) as string[];
  const authors = (await Promise.all(authorIds.map(getAuthorById))).filter(
    (author) => author !== null,
  );

  return [
    ...publicPages.map((entry, index) => ({
      url: `${siteUrl}${entry.path}`,
      lastModified: pages[index].updated_at
        ? new Date(pages[index].updated_at)
        : new Date(0),
      changeFrequency: entry.frequency,
      priority: entry.priority,
    })),
    {
      url: `${siteUrl}/feed.xml`,
      lastModified: posts[0]?.updated_at
        ? new Date(posts[0].updated_at)
        : new Date(0),
      changeFrequency: "daily" as const,
      priority: 0.4,
    },
    ...publishedCategories.map((category) => ({
      url: `${siteUrl}/category/${category.slug}`,
      lastModified: new Date(
        Math.max(
          ...posts
            .filter((post) => post.category === category.name)
            .map((post) => new Date(post.updated_at).getTime()),
        ),
      ),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...authors.map((author) => ({
      url: `${siteUrl}/authors/${author.slug}`,
      lastModified: new Date(author.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "weekly" as const,
      priority: post.featured ? 0.85 : 0.75,
    })),
  ];
}
