import Link from "next/link";
import type { Metadata } from "next";
import BlogCard from "@/components/blog/blog-card";
import { getPublishedPosts } from "@/lib/blog/server";
import {
  BLOG_SEARCH_SORTS,
  searchPublishedPosts,
  type BlogSearchSort,
} from "@/lib/blog/search";
import {
  ARTICLE_TYPES,
  BLOG_CATEGORY_DETAILS,
  TESTING_STATUSES,
  formatArticleType,
  getBlogCategoryBySlug,
  type ArticleType,
  type TestingStatus,
} from "@/lib/blog/types";
import { defaultSitePages, getSitePage, getString } from "@/lib/site/pages";

export const revalidate = 300;

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    type?: string;
    testing?: string;
    sort?: string;
  }>;
};

const sortLabels: Record<BlogSearchSort, string> = {
  relevance: "Most relevant",
  newest: "Newest published",
  updated: "Recently updated",
  title: "Title A-Z",
};

function getArticleType(value: string | undefined): ArticleType | undefined {
  return ARTICLE_TYPES.find((type) => type === value);
}

function getTestingStatus(
  value: string | undefined,
): TestingStatus | undefined {
  return TESTING_STATUSES.find((status) => status === value);
}

function getSort(value: string | undefined, hasQuery: boolean): BlogSearchSort {
  return (
    BLOG_SEARCH_SORTS.find((sort) => sort === value) ??
    (hasQuery ? "relevance" : "newest")
  );
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const [page, params] = await Promise.all([
    getSitePage("search"),
    searchParams,
  ]);
  const query = params.q?.trim();

  return {
    title: query ? `Search results for ${query} - Devicefield` : page.title,
    description: page.meta_description,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const [page, posts, params] = await Promise.all([
    getSitePage("search"),
    getPublishedPosts(),
    searchParams,
  ]);
  const defaults = defaultSitePages.search.content;
  const query = params.q?.trim() ?? "";
  const selectedCategory = params.category
    ? getBlogCategoryBySlug(params.category)
    : null;
  const selectedArticleType = getArticleType(params.type);
  const selectedTestingStatus = getTestingStatus(params.testing);
  const selectedSort = getSort(params.sort, Boolean(query));
  const publishedCategories = BLOG_CATEGORY_DETAILS.filter((category) =>
    posts.some((post) => post.category === category.name),
  );
  const results = searchPublishedPosts(posts, {
    query,
    categorySlug: selectedCategory?.slug,
    articleType: selectedArticleType,
    testingStatus: selectedTestingStatus,
    sort: selectedSort,
  });
  const activeFilters = [
    selectedCategory?.name,
    selectedArticleType ? formatArticleType(selectedArticleType) : null,
    selectedTestingStatus
      ? `${selectedTestingStatus.charAt(0).toUpperCase()}${selectedTestingStatus.slice(1)}`
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="overflow-hidden rounded-[2.25rem] bg-zinc-950 px-6 py-10 text-white sm:px-10 lg:grid lg:grid-cols-[1fr_0.7fr] lg:items-end lg:gap-12 lg:px-12 lg:py-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-300">
              {getString(
                page.content,
                "eyebrow",
                getString(defaults, "eyebrow", "Search Devicefield"),
              )}
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-0.05em] sm:text-7xl">
              {getString(
                page.content,
                "heading",
                getString(defaults, "heading", "Find the right field note."),
              )}
            </h1>
          </div>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300 lg:mt-0">
            {getString(
              page.content,
              "intro",
              getString(defaults, "intro", "Search Devicefield articles."),
            )}
          </p>
        </header>

        <form
          action="/search"
          method="get"
          className="relative -mt-5 mx-3 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-[0_24px_80px_rgba(24,24,27,0.10)] sm:mx-8 sm:p-6"
        >
          <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
            <label className="block lg:col-span-5">
              <span className="mb-2 block text-sm font-semibold text-zinc-800">
                Search
              </span>
              <input
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Product, problem, system, or workflow"
                className="form-input w-full rounded-2xl border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 focus:border-zinc-950 focus:ring-lime-300"
              />
            </label>

            <label className="block lg:col-span-3">
              <span className="mb-2 block text-sm font-semibold text-zinc-800">
                Category
              </span>
              <select
                name="category"
                defaultValue={selectedCategory?.slug ?? ""}
                className="form-select w-full rounded-2xl border-zinc-200 bg-zinc-50 py-3"
              >
                <option value="">All categories</option>
                {publishedCategories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-zinc-800">
                Article type
              </span>
              <select
                name="type"
                defaultValue={selectedArticleType ?? ""}
                className="form-select w-full rounded-2xl border-zinc-200 bg-zinc-50 py-3"
              >
                <option value="">All types</option>
                {ARTICLE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatArticleType(type)}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="rounded-2xl bg-lime-300 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-lime-200 lg:col-span-2"
            >
              Search
            </button>
          </div>

          <div className="mt-4 grid gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <label className="block lg:col-span-1">
              <span className="mb-2 block text-sm font-semibold text-zinc-800">
                Evidence status
              </span>
              <select
                name="testing"
                defaultValue={selectedTestingStatus ?? ""}
                className="form-select w-full rounded-2xl border-zinc-200 bg-zinc-50 py-3"
              >
                <option value="">All evidence labels</option>
                {TESTING_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block lg:col-span-1">
              <span className="mb-2 block text-sm font-semibold text-zinc-800">
                Sort by
              </span>
              <select
                name="sort"
                defaultValue={selectedSort}
                className="form-select w-full rounded-2xl border-zinc-200 bg-zinc-50 py-3"
              >
                {BLOG_SEARCH_SORTS.map((sort) => (
                  <option key={sort} value={sort}>
                    {sortLabels[sort]}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-3 lg:col-span-2 lg:justify-end">
              <p className="text-sm text-zinc-500">
                Search titles, tags, categories, summaries, and article text.
              </p>
              <Link
                href="/search"
                className="shrink-0 text-sm font-semibold text-zinc-950 underline decoration-lime-400 decoration-2 underline-offset-4"
              >
                Clear
              </Link>
            </div>
          </div>
        </form>

        <section className="mt-12">
          <div className="flex flex-col justify-between gap-5 border-b border-zinc-200 pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                {getString(
                  page.content,
                  "resultsEyebrow",
                  getString(defaults, "resultsEyebrow", "Published coverage"),
                )}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-4xl">
                {query ? `Results for "${query}"` : "Browse all published articles"}
              </h2>
              <p className="mt-3 text-zinc-600">
                {results.length} {results.length === 1 ? "article" : "articles"} found
              </p>
            </div>

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2" aria-label="Active filters">
                {activeFilters.map((filter) => (
                  <span
                    key={filter}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700"
                  >
                    {filter}
                  </span>
                ))}
              </div>
            )}
          </div>

          {results.length > 0 ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {results.map((post, index) => (
                <BlogCard key={post.id} post={post} priority={index === 0} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[2rem] border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                No matches
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                {getString(
                  page.content,
                  "emptyHeading",
                  getString(defaults, "emptyHeading", "Try a broader search."),
                )}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl leading-7 text-zinc-600">
                {getString(
                  page.content,
                  "emptyIntro",
                  getString(
                    defaults,
                    "emptyIntro",
                    "Remove one or more filters, check the spelling, or browse all guides.",
                  ),
                )}
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/search"
                  className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Reset search
                </Link>
                <Link
                  href="/blog"
                  className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:border-zinc-950"
                >
                  Browse guides
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
