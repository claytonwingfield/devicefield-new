import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import BlogCard from "@/components/blog/blog-card";
import { getPublishedPosts } from "@/lib/blog/server";
import { BLOG_CATEGORY_DETAILS, getBlogCategoryBySlug } from "@/lib/blog/types";
import { createPublicPageMetadata } from "@/lib/site/metadata";
import { defaultSitePages, getSitePage, getString } from "@/lib/site/pages";

export const revalidate = 300;

type BlogIndexPageProps = {
  searchParams: Promise<{
    category?: string;
    type?: string;
    q?: string;
  }>;
};

type EditorialType = "reviews" | "comparisons";

function getSelectedType(value: string | undefined): EditorialType | null {
  return value === "reviews" || value === "comparisons" ? value : null;
}

function matchesEditorialType(
  post: Awaited<ReturnType<typeof getPublishedPosts>>[number],
  type: EditorialType,
) {
  return type === "reviews"
    ? post.article_type === "review"
    : post.article_type === "comparison";
}

export async function generateMetadata({ searchParams }: BlogIndexPageProps) {
  const page = await getSitePage("blog");
  const params = await searchParams;
  const selectedCategory = params.category
    ? getBlogCategoryBySlug(params.category)
    : null;
  const selectedType = getSelectedType(params.type);
  const searchQuery = params.q?.trim() ?? "";
  const title = selectedCategory
    ? `${selectedCategory.name} Guides - Devicefield`
    : selectedType
      ? `${selectedType === "reviews" ? "Product Reviews" : "Product Comparisons"} - Devicefield`
      : searchQuery
        ? `Search results for ${searchQuery} - Devicefield`
        : page.title;
  const description = selectedCategory
    ? selectedCategory.description
    : selectedType
      ? `Browse independent Devicefield ${selectedType} for business devices, software, and operating systems.`
      : searchQuery
        ? `Search Devicefield guides, reviews, comparisons, and troubleshooting articles for ${searchQuery}.`
        : page.meta_description;
  const canonicalPath = selectedCategory
    ? `/category/${selectedCategory.slug}`
    : "/blog";
  const hasFilterParameters = Boolean(selectedType || searchQuery);

  return createPublicPageMetadata({
    title,
    description,
    canonicalUrl: `https://devicefield.com${canonicalPath}`,
    robots: hasFilterParameters ? { index: false, follow: true } : undefined,
  });
}

export default async function BlogIndexPage({
  searchParams,
}: BlogIndexPageProps) {
  const [page, posts] = await Promise.all([
    getSitePage("blog"),
    getPublishedPosts(),
  ]);
  const defaults = defaultSitePages.blog.content;
  const params = await searchParams;
  if (params.category) {
    const category = getBlogCategoryBySlug(params.category);
    permanentRedirect(category ? `/category/${category.slug}` : "/blog");
  }
  if (params.q !== undefined) {
    const search = new URLSearchParams();
    if (params.q.trim()) search.set("q", params.q.trim());
    const articleType = getSelectedType(params.type);
    if (articleType) {
      search.set("type", articleType === "reviews" ? "review" : "comparison");
    }
    permanentRedirect(`/search${search.size > 0 ? `?${search}` : ""}`);
  }

  const selectedType = getSelectedType(params.type);
  const visiblePosts = posts.filter((post) => {
    return !selectedType || matchesEditorialType(post, selectedType);
  });
  const publishedCategories = BLOG_CATEGORY_DETAILS.flatMap((category) => {
    const count = posts.filter(
      (post) => post.category === category.name,
    ).length;
    return count > 0 ? [{ ...category, count }] : [];
  });
  const filterHeading =
    selectedType === "reviews"
      ? "Reviews"
      : selectedType === "comparisons"
        ? "Comparisons"
        : null;

  return (
    <div className="bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="grid gap-10 border-b border-zinc-200 pb-12 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
              {getString(
                page.content,
                "eyebrow",
                getString(defaults, "eyebrow", ""),
              )}
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-7xl">
              {getString(
                page.content,
                "heading",
                getString(defaults, "heading", ""),
              )}
            </h1>
          </div>
          <p className="text-lg leading-8 text-zinc-600">
            {getString(page.content, "intro", getString(defaults, "intro", ""))}
          </p>
        </header>

        <nav aria-label="Blog categories" className="flex flex-wrap gap-3 py-8">
          <Link
            href="/blog"
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              selectedType
                ? "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-950 hover:text-zinc-950"
                : "border-zinc-950 bg-zinc-950 text-white"
            }`}
          >
            All guides
          </Link>
          {publishedCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        {filterHeading && (
          <section className="mb-8 rounded-[1.5rem] border border-zinc-200 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
              Article type
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              {filterHeading}
            </h2>
            <p className="mt-3 text-zinc-600">
              {visiblePosts.length} published{" "}
              {visiblePosts.length === 1 ? "article" : "articles"} found.
            </p>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {visiblePosts.map((post, index) => (
            <BlogCard key={post.id} post={post} priority={index === 0} />
          ))}
        </div>

        {visiblePosts.length === 0 && (
          <section className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-white p-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
              {filterHeading
                ? "No matching articles yet."
                : "No guides are currently published."}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-zinc-600">
              {filterHeading
                ? "Try another search or browse all currently published Devicefield guides."
                : "Published articles will appear here after they are available from the Devicefield CMS."}
            </p>
            <Link
              href="/blog"
              className="mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              View all guides
            </Link>
          </section>
        )}

        {publishedCategories.length > 0 && (
          <section className="mt-16 grid gap-4 lg:grid-cols-3">
            {publishedCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="rounded-[1.5rem] border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-zinc-950 hover:shadow-[0_20px_70px_rgba(24,24,27,0.06)]"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Category
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                  {category.name}
                </h2>
                <p className="mt-3 text-zinc-600">
                  {category.count} published{" "}
                  {category.count === 1 ? "guide" : "guides"} in this section.
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  {category.description}
                </p>
                <span className="mt-5 inline-flex text-sm font-semibold text-zinc-950 underline decoration-lime-400 decoration-2 underline-offset-4">
                  View articles
                </span>
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
