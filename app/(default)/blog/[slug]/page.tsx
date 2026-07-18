import { notFound } from "next/navigation";
import Link from "next/link";
import BlogCard from "@/components/blog/blog-card";
import MarkdownContent, {
  getMarkdownHeadings,
} from "@/components/blog/markdown-content";
import NewsletterForm from "@/components/newsletter-form";
import AffiliateDisclosure from "@/components/affiliate/AffiliateDisclosure";
import ComparisonTable from "@/components/affiliate/ComparisonTable";
import ProductCard from "@/components/affiliate/ProductCard";
import { getAffiliateHref, getArticleProducts } from "@/lib/affiliate/server";
import {
  getAuthorById,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/blog/server";
import {
  estimateReadTime,
  formatPostDate,
  getPostCanonicalUrl,
  getPostCoverImageAlt,
  getPostMetaDescription,
  getPostSeoTitle,
  getBlogCategoryByName,
  type BlogFaqItem,
} from "@/lib/blog/types";
import {
  getAuthorUrl,
  SITE_LOGO_URL,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site/identity";

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

  const [relatedPosts, articleProducts, author, reviewer] = await Promise.all([
    getRelatedPosts(post.slug, post.category),
    getArticleProducts(post.id),
    getAuthorById(post.author_id),
    getAuthorById(post.reviewer_id),
  ]);
  const publishedDate = post.published_at ?? post.created_at;
  const canonicalUrl = getPostCanonicalUrl(post);
  const metaDescription = getPostMetaDescription(post);
  const coverImageAlt = getPostCoverImageAlt(post);
  const faqItems = getFaqItems(post.faq_items);
  const category = getBlogCategoryByName(post.category);
  const tableOfContents = getMarkdownHeadings(post.content);
  const lastReviewedDate =
    post.last_reviewed_at ?? post.reviewed_at ?? post.last_verified_at;
  const recommendationProducts = articleProducts.filter(
    (product) => product.placement === "recommendation",
  );
  const comparisonProducts = articleProducts.filter(
    (product) => product.placement === "comparison",
  );
  const alternativeProducts = articleProducts.filter(
    (product) => product.placement === "alternative",
  );
  const hasAffiliateLinks =
    articleProducts.length > 0 || /\{sponsored\}/i.test(post.content);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonicalUrl}#article`,
    headline: post.title,
    description: metaDescription,
    datePublished: publishedDate,
    dateModified: post.updated_at,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    author: author
      ? {
          "@type": "Person",
          name: author.name,
          url: getAuthorUrl(author.slug),
        }
      : { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    reviewedBy: reviewer
      ? {
          "@type": "Person",
          name: reviewer.name,
          url: getAuthorUrl(reviewer.slug),
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: SITE_LOGO_URL,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
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
        name: post.category,
        item: category
          ? `https://devicefield.com/category/${category.slug}`
          : "https://devicefield.com/blog",
      },
      {
        "@type": "ListItem",
        position: 4,
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
              {category ? (
                <Link
                  href={`/category/${category.slug}`}
                  className="rounded-full bg-lime-300 px-3 py-1 text-zinc-950 transition hover:bg-lime-200"
                >
                  {post.category}
                </Link>
              ) : (
                <span className="rounded-full bg-lime-300 px-3 py-1 text-zinc-950">
                  {post.category}
                </span>
              )}
              <time dateTime={publishedDate}>
                {formatPostDate(publishedDate)}
              </time>
              <span aria-hidden="true">/</span>
              <span>{estimateReadTime(post.content)} min read</span>
              {post.testing_status && (
                <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-zinc-700">
                  {post.testing_status.charAt(0).toUpperCase() +
                    post.testing_status.slice(1)}
                </span>
              )}
            </div>

            <h1 className="text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-7xl">
              {post.title}
            </h1>
            <p className="mt-6 text-xl leading-8 text-zinc-600">
              {post.excerpt}
            </p>
            {(author || reviewer || lastReviewedDate) && (
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-zinc-600">
                {author && (
                  <div>
                    <dt className="font-semibold text-zinc-950">Written by</dt>
                    <dd>
                      <Link
                        href={`/author/${author.slug}`}
                        className="underline decoration-lime-400 decoration-2 underline-offset-4"
                      >
                        {author.name}
                      </Link>
                    </dd>
                  </div>
                )}
                {reviewer && (
                  <div>
                    <dt className="font-semibold text-zinc-950">Reviewed by</dt>
                    <dd>
                      <Link
                        href={`/author/${reviewer.slug}`}
                        className="underline decoration-lime-400 decoration-2 underline-offset-4"
                      >
                        {reviewer.name}
                      </Link>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="font-semibold text-zinc-950">
                    Originally published
                  </dt>
                  <dd>{formatPostDate(publishedDate)}</dd>
                </div>
                {lastReviewedDate && (
                  <div>
                    <dt className="font-semibold text-zinc-950">
                      Last reviewed
                    </dt>
                    <dd>{formatPostDate(lastReviewedDate)}</dd>
                  </div>
                )}
              </dl>
            )}
            {hasAffiliateLinks && (
              <AffiliateDisclosure className="mt-5 max-w-2xl" />
            )}
          </header>

          {post.cover_image_url && (
            <div className="my-10 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-[0_20px_80px_rgba(24,24,27,0.07)]">
              <div className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.cover_image_url}
                  alt={coverImageAlt}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          {(post.quick_verdict.verdict ||
            post.quick_verdict.best_for ||
            post.quick_verdict.avoid_if) && (
            <section className="my-10 rounded-[1.75rem] border border-zinc-800 bg-zinc-950 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-300">
                Quick verdict
              </p>
              {post.quick_verdict.verdict && (
                <p className="mt-4 text-xl leading-8 text-zinc-100">
                  {post.quick_verdict.verdict}
                </p>
              )}
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {post.quick_verdict.best_for && (
                  <div className="rounded-2xl bg-white/[0.07] p-4">
                    <dt className="font-semibold text-lime-300">Best for</dt>
                    <dd className="mt-2 text-sm leading-6 text-zinc-300">
                      {post.quick_verdict.best_for}
                    </dd>
                  </div>
                )}
                {post.quick_verdict.avoid_if && (
                  <div className="rounded-2xl bg-white/[0.07] p-4">
                    <dt className="font-semibold text-amber-300">Avoid if</dt>
                    <dd className="mt-2 text-sm leading-6 text-zinc-300">
                      {post.quick_verdict.avoid_if}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {tableOfContents.length > 1 && (
            <nav
              aria-label="Table of contents"
              className="my-10 rounded-[1.5rem] border border-zinc-200 bg-white p-6"
            >
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                Table of contents
              </h2>
              <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                {tableOfContents.map((heading, index) => (
                  <li key={`${heading.id}-${index}`}>
                    <Link
                      href={`#${heading.id}`}
                      className="text-sm font-semibold text-zinc-600 underline decoration-lime-400 decoration-2 underline-offset-4 hover:text-zinc-950"
                    >
                      {heading.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <MarkdownContent content={post.content} />

          {(post.compatibility_notes ||
            post.testing_method ||
            post.limitations) && (
            <div className="mt-12 grid gap-5">
              {post.compatibility_notes && (
                <EditorialSection
                  eyebrow="Compatibility notes"
                  title="Systems, accessories, and constraints"
                  body={post.compatibility_notes}
                />
              )}
              {post.testing_method && (
                <EditorialSection
                  eyebrow="Testing methodology"
                  title="How this article was evaluated"
                  body={post.testing_method}
                />
              )}
              {post.limitations && (
                <EditorialSection
                  eyebrow="Known limitations"
                  title="What this guide could not verify"
                  body={post.limitations}
                />
              )}
            </div>
          )}

          {recommendationProducts.length > 0 && (
            <section className="mt-12">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                Product recommendations
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                Our picks for this guide
              </h2>
              <div className="mt-6 grid gap-5">
                {recommendationProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    name={product.product_name}
                    description={
                      product.verdict ??
                      "Review the current product details before purchasing."
                    }
                    href={getAffiliateHref(product.affiliate_links)}
                    ctaLabel={product.affiliate_links.label}
                    meta={product.award}
                    bestFor={product.best_for}
                    avoidIf={product.avoid_if}
                    pros={product.pros}
                    cons={product.cons}
                    placement={`recommendation-${product.display_order}`}
                    articleId={post.id}
                  />
                ))}
              </div>
            </section>
          )}

          {comparisonProducts.length > 0 && (
            <section className="mt-12">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                At a glance
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                Product comparison
              </h2>
              <div className="mt-6">
                <ComparisonTable
                  articleId={post.id}
                  rows={comparisonProducts.map((product) => ({
                    product: product.product_name,
                    award: product.award,
                    bestFor: product.best_for ?? "See verdict",
                    avoidIf: product.avoid_if,
                    notes: product.verdict ?? "See the full guide for details.",
                    href: getAffiliateHref(product.affiliate_links),
                    ctaLabel: product.affiliate_links.label,
                    placement: `comparison-${product.display_order}`,
                  }))}
                />
              </div>
            </section>
          )}

          {alternativeProducts.length > 0 && (
            <section className="mt-12">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                Alternatives
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                Other products to consider
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {alternativeProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    name={product.product_name}
                    description={
                      product.verdict ??
                      "Review the current product details before purchasing."
                    }
                    href={getAffiliateHref(product.affiliate_links)}
                    ctaLabel={product.affiliate_links.label}
                    meta={product.award}
                    bestFor={product.best_for}
                    avoidIf={product.avoid_if}
                    pros={product.pros}
                    cons={product.cons}
                    placement={`alternative-${product.display_order}`}
                    articleId={post.id}
                  />
                ))}
              </div>
            </section>
          )}

          {post.original_evidence.length > 0 && (
            <section className="mt-12 rounded-[1.5rem] border border-zinc-200 bg-white p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                Original evidence
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                Hands-on notes and artifacts
              </h2>
              <ul className="mt-5 space-y-3 text-zinc-600">
                {post.original_evidence.map((evidence, index) => (
                  <li
                    key={`${evidence.label}-${index}`}
                    className="rounded-2xl bg-zinc-100 p-4"
                  >
                    {evidence.url ? (
                      <Link
                        href={evidence.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-zinc-950 underline decoration-lime-400 decoration-2 underline-offset-4"
                      >
                        {evidence.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-zinc-950">
                        {evidence.label}
                      </span>
                    )}
                    {evidence.note && (
                      <p className="mt-1 text-sm leading-6">{evidence.note}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {post.sources.length > 0 && (
            <section className="mt-12 rounded-[1.5rem] border border-zinc-200 bg-white p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                Sources
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                Documentation and references
              </h2>
              <ol className="mt-5 space-y-3">
                {post.sources.map((source, index) => (
                  <li
                    key={`${source.url}-${index}`}
                    className="text-sm leading-6 text-zinc-600"
                  >
                    <Link
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-zinc-950 underline decoration-lime-400 decoration-2 underline-offset-4"
                    >
                      {source.title}
                    </Link>
                    {source.note && <span> - {source.note}</span>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="mt-12 grid gap-6 rounded-[1.75rem] bg-zinc-950 p-6 text-white sm:p-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-300">
                Devicefield checklist
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Make the next hardware decision with fewer surprises.
              </h2>
              <p className="mt-3 leading-7 text-zinc-300">
                Get practical buying notes, compatibility checks, and new
                troubleshooting guides.
              </p>
            </div>
            <NewsletterForm />
          </section>

          {faqItems.length > 0 && (
            <section className="mt-12 rounded-[1.5rem] border border-zinc-200 bg-white p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                Frequently asked questions
              </h2>
              <div className="mt-5 space-y-5">
                {faqItems.map((item) => (
                  <div key={item.question}>
                    <h3 className="font-semibold text-zinc-950">
                      {item.question}
                    </h3>
                    <p className="mt-2 leading-7 text-zinc-600">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
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

function EditorialSection({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-zinc-200 bg-white p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h2>
      <p className="mt-3 whitespace-pre-line leading-7 text-zinc-600">{body}</p>
    </section>
  );
}
