import HeaderClient from "./header-client";
import { getPublishedPosts } from "@/lib/blog/server";
import { getBlogCategoryBySlug } from "@/lib/blog/types";
import {
  defaultSitePages,
  getObjectArray,
  getSitePage,
  getString,
  type NavigationEntry,
} from "@/lib/site/pages";

export default async function Header() {
  const [page, posts] = await Promise.all([
    getSitePage("global"),
    getPublishedPosts(),
  ]);
  const defaults = defaultSitePages.global.content;
  const navItems = getObjectArray<NavigationEntry>(
    page.content,
    "navItems",
    getObjectArray<NavigationEntry>(
      defaults,
      "navItems",
      [],
      ["href", "label"],
    ),
    ["href", "label"],
  );
  const visibleNavItems = navItems.filter((item) => {
    const categoryMatch = item.href.match(/^\/category\/([^/?#]+)$/);
    if (!categoryMatch) return true;

    const category = getBlogCategoryBySlug(categoryMatch[1]);
    return Boolean(
      category && posts.some((post) => post.category === category.name),
    );
  });

  return (
    <HeaderClient
      navItems={visibleNavItems}
      searchDocuments={posts.map((post) => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        tags: post.tags,
        article_type: post.article_type,
      }))}
      newsletterLabel={getString(
        page.content,
        "newsletterLabel",
        getString(defaults, "newsletterLabel", "Newsletter"),
      )}
    />
  );
}
