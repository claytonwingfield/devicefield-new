import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCard from "@/components/blog/blog-card";
import { getPublishedPosts } from "@/lib/blog/server";
import { getBlogCategoryBySlug } from "@/lib/blog/types";

export const revalidate = 300;

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getBlogCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category not found - Devicefield",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const hasPublishedPosts = (await getPublishedPosts()).some(
    (post) => post.category === category.name,
  );

  if (!hasPublishedPosts) {
    return {
      title: `${category.name} Guides - Devicefield`,
      description: category.description,
      alternates: {
        canonical: `https://devicefield.com/category/${category.slug}`,
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  return {
    title: `${category.name} Guides - Devicefield`,
    description: category.description,
    alternates: {
      canonical: `https://devicefield.com/category/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getBlogCategoryBySlug(slug);

  if (!category) notFound();

  const posts = (await getPublishedPosts()).filter(
    (post) => post.category === category.name,
  );

  const canonicalUrl = `https://devicefield.com/category/${category.slug}`;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://devicefield.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: "https://devicefield.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-sm text-zinc-500"
          >
            <Link href="/" className="transition hover:text-zinc-950">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/blog" className="transition hover:text-zinc-950">
              Guides
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-zinc-950">
              {category.name}
            </span>
          </nav>

          <header className="mt-8 grid gap-8 border-b border-zinc-200 pb-12 lg:grid-cols-[1fr_0.75fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                Category
              </p>
              <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-7xl">
                {category.name}
              </h1>
            </div>
            <div>
              <p className="text-lg leading-8 text-zinc-600">
                {category.description}
              </p>
              <p className="mt-4 text-sm font-semibold text-zinc-500">
                {posts.length} published{" "}
                {posts.length === 1 ? "guide" : "guides"}
              </p>
            </div>
          </header>

          {posts.length > 0 ? (
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {posts.map((post, index) => (
                <BlogCard key={post.id} post={post} priority={index === 0} />
              ))}
            </div>
          ) : (
            <section className="mt-10 rounded-[2rem] border border-zinc-200 bg-white px-6 py-12 sm:px-10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                Coverage in progress
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl">
                No published guides in this category yet.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
                This is an active Devicefield coverage area. New articles will
                appear here after they complete editorial review.
              </p>
              <Link
                href="/blog"
                className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Browse published guides
              </Link>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
