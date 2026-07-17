import BlogCard from "@/components/blog/blog-card";
import { getPublishedPosts } from "@/lib/blog/server";
import { BLOG_CATEGORIES, slugify } from "@/lib/blog/types";
import { defaultSitePages, getSitePage, getString } from "@/lib/site/pages";

export const revalidate = 300;

type BlogIndexPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

function getCategorySlug(category: string) {
  return slugify(category);
}

function getSelectedCategory(value: string | undefined) {
  if (!value) return null;

  return (
    BLOG_CATEGORIES.find((category) => getCategorySlug(category) === value) ??
    null
  );
}

export async function generateMetadata({ searchParams }: BlogIndexPageProps) {
  const page = await getSitePage("blog");
  const selectedCategory = getSelectedCategory((await searchParams).category);
  const title = selectedCategory
    ? `${selectedCategory} Guides - Devicefield`
    : page.title;
  const description = selectedCategory
    ? `Browse Devicefield articles in ${selectedCategory}, including buying guides, reviews, setup notes, and troubleshooting resources.`
    : page.meta_description;
  const canonicalPath = selectedCategory
    ? `/blog?category=${getCategorySlug(selectedCategory)}`
    : "/blog";

  return {
    title,
    description,
    alternates: {
      canonical: `https://devicefield.com${canonicalPath}`,
    },
  };
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const [page, posts] = await Promise.all([getSitePage("blog"), getPublishedPosts()]);
  const defaults = defaultSitePages.blog.content;
  const selectedCategory = getSelectedCategory((await searchParams).category);
  const visiblePosts = selectedCategory
    ? posts.filter((post) => post.category === selectedCategory)
    : posts;

  return (
    <div className="bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="grid gap-10 border-b border-zinc-200 pb-12 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
              {getString(page.content, "eyebrow", getString(defaults, "eyebrow", ""))}
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-7xl">
              {getString(page.content, "heading", getString(defaults, "heading", ""))}
            </h1>
          </div>
          <p className="text-lg leading-8 text-zinc-600">
            {getString(page.content, "intro", getString(defaults, "intro", ""))}
          </p>
        </header>

        <nav aria-label="Blog categories" className="flex flex-wrap gap-3 py-8">
          <a
            href="/blog"
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              selectedCategory
                ? "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-950 hover:text-zinc-950"
                : "border-zinc-950 bg-zinc-950 text-white"
            }`}
          >
            All guides
          </a>
          {BLOG_CATEGORIES.map((category) => (
            <a
              key={category}
              href={`/blog?category=${getCategorySlug(category)}`}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                selectedCategory === category
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-950 hover:text-zinc-950"
              }`}
            >
              {category}
            </a>
          ))}
        </nav>

        {selectedCategory && (
          <section className="mb-8 rounded-[1.5rem] border border-zinc-200 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
              Category
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              {selectedCategory}
            </h2>
            <p className="mt-3 text-zinc-600">
              {visiblePosts.length} published{" "}
              {visiblePosts.length === 1 ? "guide" : "guides"} in this
              section.
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
              No articles in this category yet.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-zinc-600">
              This section is ready for future guides. Browse all published
              Devicefield articles while new category coverage is being added.
            </p>
            <a
              href="/blog"
              className="mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              View all guides
            </a>
          </section>
        )}

        <section className="mt-16 grid gap-4 lg:grid-cols-3">
          {BLOG_CATEGORIES.map((category) => (
            <a
              key={category}
              id={getCategorySlug(category)}
              href={`/blog?category=${getCategorySlug(category)}`}
              className="rounded-[1.5rem] border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-zinc-950 hover:shadow-[0_20px_70px_rgba(24,24,27,0.06)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Category
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                {category}
              </h2>
              <p className="mt-3 text-zinc-600">
                {posts.filter((post) => post.category === category).length} published
                guides in this section.
              </p>
              <span className="mt-5 inline-flex text-sm font-semibold text-zinc-950 underline decoration-lime-400 decoration-2 underline-offset-4">
                View articles
              </span>
            </a>
          ))}
        </section>
      </div>
    </div>
  );
}
