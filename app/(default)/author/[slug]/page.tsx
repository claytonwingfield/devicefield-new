import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCard from "@/components/blog/blog-card";
import { getAuthorBySlug, getPublishedPosts } from "@/lib/blog/server";
import { getPostCanonicalUrl } from "@/lib/blog/types";
import {
  getAuthorUrl,
  getValidProfileUrls,
  PRIMARY_AUTHOR_EXPERTISE,
  PRIMARY_AUTHOR_SLUG,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site/identity";

export const revalidate = 300;

type AuthorPageProps = { params: Promise<{ slug: string }> };

function getAuthorDescription(slug: string, bio: string | null) {
  if (bio) return bio;
  if (slug === PRIMARY_AUTHOR_SLUG) {
    return "Clayton Wingfield writes about retail systems, business automation, and the operational technology modern businesses depend on.";
  }
  return "Devicefield author and reviewer profile.";
}

function getAuthorMetaDescription(slug: string, name: string) {
  if (slug === PRIMARY_AUTHOR_SLUG) {
    return "Meet Clayton Wingfield, Devicefield founder and editor covering retail systems, POS infrastructure, business automation, and operational technology.";
  }
  return `Read ${name}'s Devicefield profile, areas of expertise, published business technology guides, and independent product coverage.`;
}

function getAuthorJobTitle(slug: string, jobTitle: string | null) {
  if (jobTitle) return jobTitle;
  return slug === PRIMARY_AUTHOR_SLUG
    ? "Founder and editor, Devicefield"
    : "Devicefield contributor";
}

export async function generateMetadata({ params }: AuthorPageProps) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) {
    return {
      title: "Author not found - Devicefield",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = getAuthorUrl(author.slug);
  const description = getAuthorMetaDescription(author.slug, author.name);

  return {
    title: `${author.name} - Devicefield`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "profile",
      title: `${author.name} - Devicefield`,
      description,
      url: canonicalUrl,
      images: author.avatar_url
        ? [{ url: author.avatar_url, alt: author.name }]
        : undefined,
    },
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
  const authorUrl = getAuthorUrl(author.slug);
  const authorId = `${authorUrl}#person`;
  const description = getAuthorDescription(author.slug, author.bio);
  const jobTitle = getAuthorJobTitle(author.slug, author.job_title);
  const expertise =
    author.slug === PRIMARY_AUTHOR_SLUG ? [...PRIMARY_AUTHOR_EXPERTISE] : [];
  const profileUrls = getValidProfileUrls(
    author.website_url ? [author.website_url] : [],
  );
  const profilePageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${authorUrl}#profile-page`,
    url: authorUrl,
    name: `${author.name} - ${SITE_NAME}`,
    dateCreated: author.created_at,
    dateModified: author.updated_at,
    mainEntity: {
      "@type": "Person",
      "@id": authorId,
      name: author.name,
      jobTitle,
      description,
      image: author.avatar_url ?? undefined,
      url: authorUrl,
      sameAs: profileUrls,
      knowsAbout: expertise.length > 0 ? expertise : undefined,
      worksFor: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
    hasPart: authoredPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: getPostCanonicalUrl(post),
      datePublished: post.published_at,
      author: { "@id": authorId },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd) }}
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
              <p className="mt-4 font-semibold text-zinc-500">{jobTitle}</p>
            </div>
            <p className="text-lg leading-8 text-zinc-600">{description}</p>
          </header>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {expertise.length > 0 && (
              <section className="rounded-[1.5rem] border border-zinc-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-700">
                  Areas of expertise
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {expertise.map((area) => (
                    <li
                      key={area}
                      className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
                    >
                      {area}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {profileUrls.length > 0 && (
              <section className="rounded-[1.5rem] border border-zinc-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-700">
                  Professional profile
                </p>
                {profileUrls.map((url) => (
                  <Link
                    key={url}
                    href={url}
                    target="_blank"
                    rel="me noopener noreferrer"
                    className="mt-4 inline-flex font-semibold text-zinc-950 underline decoration-lime-400 decoration-2 underline-offset-4"
                  >
                    View external profile
                  </Link>
                ))}
              </section>
            )}
          </div>

          <section className="mt-12">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
              Devicefield articles
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Articles by {author.name}
            </h2>
            {authoredPosts.length > 0 ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {authoredPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-[1.5rem] border border-zinc-200 bg-white p-6 text-zinc-600">
                No published articles are currently assigned to this author.
              </p>
            )}
          </section>
        </div>
      </section>
    </>
  );
}
