import { notFound } from "next/navigation";
import Link from "next/link";
import BlogCard from "@/components/blog/blog-card";
import MarkdownContent from "@/components/blog/markdown-content";
import { getPostBySlug, getRelatedPosts } from "@/lib/blog/server";
import {
  estimateReadTime,
  formatPostDate,
  getPostCanonicalUrl,
  getPostCoverImageAlt,
  getPostMetaDescription,
  getPostSeoTitle,
  type BlogFaqItem,
} from "@/lib/blog/types";

export const revalidate = 300;

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Article not found - Devicefield",
    };
  }

  const seoTitle = getPostSeoTitle(post);
  const metaDescription = getPostMetaDescription(post);
  const canonicalUrl = getPostCanonicalUrl(post);
  const image = post.cover_image_url
    ? {
        url: post.cover_image_url,
        alt: getPostCoverImageAlt(post),
      }
    : undefined;

  return {
    title: seoTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoTitle,
      description: metaDescription,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      url: canonicalUrl,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: seoTitle,
      description: metaDescription,
      images: image ? [image.url] : undefined,
    },
  };
}

function getFaqItems(value: BlogFaqItem[]) {
  return value.filter(
    (item) =>
      item &&
      typeof item.question === "string" &&
      item.question.trim().length > 0 &&
      typeof item.answer === "string" &&
      item.answer.trim().length > 0,
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.slug, post.category);
  const publishedDate = post.published_at ?? post.created_at;
  const canonicalUrl = getPostCanonicalUrl(post);
  const metaDescription = getPostMetaDescription(post);
  const coverImageAlt = getPostCoverImageAlt(post);
  const faqItems = getFaqItems(post.faq_items);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: getPostSeoTitle(post),
    description: metaDescription,
    datePublished: publishedDate,
    dateModified: post.updated_at,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    author: {
      "@type": "Organization",
      name: "Devicefield",
    },
    publisher: {
      "@type": "Organization",
      name: "Devicefield",
      url: "https://devicefield.com",
    },
    mainEntityOfPage: canonicalUrl,
  };
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
        name: "Blog",
        item: "https://devicefield.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: canonicalUrl,
      },
    ],
  };
  const faqJsonLd =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;
  const structuredData = faqJsonLd
    ? [articleJsonLd, breadcrumbJsonLd, faqJsonLd]
    : [articleJsonLd, breadcrumbJsonLd];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <article className="bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/blog"
            className="text-sm font-semibold text-zinc-700 underline decoration-lime-400 decoration-2 underline-offset-4 transition hover:text-zinc-950"
          >
            Back to all guides
          </Link>

          <header className="mt-10 border-b border-zinc-200 pb-10">
            <div className="mb-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-zinc-500">
              <span className="rounded-full bg-lime-300 px-3 py-1 text-zinc-950">
                {post.category}
              </span>
              <time dateTime={publishedDate}>{formatPostDate(publishedDate)}</time>
              <span aria-hidden="true">/</span>
              <span>{estimateReadTime(post.content)} min read</span>
            </div>

            <h1 className="text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-7xl">
              {post.title}
            </h1>
            <p className="mt-6 text-xl leading-8 text-zinc-600">{post.excerpt}</p>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-500">
              Disclosure: Some links may be partner links. We may earn a
              commission at no extra cost to you.
            </p>
          </header>

          <div className="my-10 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-[0_20px_80px_rgba(24,24,27,0.07)]">
            <div className="relative aspect-[16/8] overflow-hidden rounded-[1.5rem] bg-zinc-950">
              {post.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.cover_image_url}
                  alt={coverImageAlt}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(190,242,100,0.9),transparent_30%),radial-gradient(circle_at_82%_15%,rgba(250,204,21,0.55),transparent_26%),linear-gradient(135deg,#18181b,#52525b)]" />
              )}
            </div>
          </div>

          <MarkdownContent content={post.content} />

          {faqItems.length > 0 && (
            <section className="mt-12 rounded-[1.5rem] border border-zinc-200 bg-white p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                Frequently asked questions
              </h2>
              <div className="mt-5 space-y-5">
                {faqItems.map((item) => (
                  <div key={item.question}>
                    <h3 className="font-semibold text-zinc-950">{item.question}</h3>
                    <p className="mt-2 leading-7 text-zinc-600">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {post.affiliate_programs.length > 0 && (
            <aside className="mt-12 rounded-[1.5rem] border border-zinc-200 bg-white p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Mentioned programs
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.affiliate_programs.map((program) => (
                  <span key={program} className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-700">
                    {program}
                  </span>
                ))}
              </div>
            </aside>
          )}
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
              Keep reading
            </p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
              Related guides
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <BlogCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
