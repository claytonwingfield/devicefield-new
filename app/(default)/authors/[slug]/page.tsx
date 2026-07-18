import { notFound } from "next/navigation";
import BlogCard from "@/components/blog/blog-card";
import { getAuthorBySlug, getPublishedPosts } from "@/lib/blog/server";

export const revalidate = 300;

type AuthorPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: AuthorPageProps) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author)
    return {
      title: "Author not found - Devicefield",
      robots: { index: false },
    };

  return {
    title: `${author.name} - Devicefield`,
    description:
      author.bio ??
      `Articles written or reviewed by ${author.name} for Devicefield.`,
    alternates: { canonical: `https://devicefield.com/authors/${author.slug}` },
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const [author, posts] = await Promise.all([
    getAuthorBySlug(slug),
    getPublishedPosts(),
  ]);
  if (!author) notFound();

  const authoredPosts = posts.filter((post) => post.author_id === author.id);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    jobTitle: author.job_title ?? undefined,
    description: author.bio ?? undefined,
    image: author.avatar_url ?? undefined,
    url: `https://devicefield.com/authors/${author.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <section className="bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="grid gap-8 border-b border-zinc-200 pb-12 lg:grid-cols-[0.7fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                Author
              </p>
              <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-7xl">
                {author.name}
              </h1>
              {author.job_title && (
                <p className="mt-4 font-semibold text-zinc-500">
                  {author.job_title}
                </p>
              )}
            </div>
            <p className="text-lg leading-8 text-zinc-600">
              {author.bio ?? "Devicefield author and reviewer profile."}
            </p>
          </header>
          {authoredPosts.length > 0 && (
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {authoredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
