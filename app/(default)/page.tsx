import Link from "next/link";
import BlogCard from "@/components/blog/blog-card";
import NewsletterForm from "@/components/newsletter-form";
import { getAuthorBySlug, getPublishedPosts } from "@/lib/blog/server";
import { getBlogCategoryByName } from "@/lib/blog/types";
import {
  getAuthorUrl,
  getValidProfileUrls,
  PRIMARY_AUTHOR_NAME,
  PRIMARY_AUTHOR_SLUG,
  SITE_DESCRIPTION,
  SITE_LOGO_URL,
  SITE_NAME,
  SITE_SOCIAL_IMAGE_URL,
  SITE_URL,
} from "@/lib/site/identity";
import {
  defaultSitePages,
  getObjectArray,
  getSitePage,
  getString,
  getStringArray,
  type HomeCategoryEntry,
  type HeroEvaluationItem,
  type NavigationEntry,
} from "@/lib/site/pages";

export const revalidate = 300;

export async function generateMetadata() {
  const page = await getSitePage("home");

  return {
    title: page.title,
    description: page.meta_description,
    alternates: {
      canonical: "https://devicefield.com",
    },
    openGraph: {
      title: page.title,
      description: page.meta_description,
      url: SITE_URL,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: SITE_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: "Devicefield business technology publication",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.meta_description,
      images: [SITE_SOCIAL_IMAGE_URL],
    },
  };
}

export default async function Home() {
  const [page, globalPage, publishedPosts, founder] = await Promise.all([
    getSitePage("home"),
    getSitePage("global"),
    getPublishedPosts(),
    getAuthorBySlug(PRIMARY_AUTHOR_SLUG),
  ]);
  const featuredPosts = publishedPosts
    .filter((post) => post.featured && Boolean(post.cover_image_url))
    .slice(0, 3);
  const latestPosts = publishedPosts.slice(0, 6);
  const defaults = defaultSitePages.home.content;
  const heroEvaluation = getObjectArray(
    page.content,
    "heroEvaluation",
    getObjectArray<HeroEvaluationItem>(
      defaults,
      "heroEvaluation",
      [],
      ["title", "description"],
    ),
    ["title", "description"],
  );
  const trustStrip = getStringArray(
    page.content,
    "trustStrip",
    getStringArray(defaults, "trustStrip", []),
  );
  const heroSteps = getStringArray(
    page.content,
    "heroSteps",
    getStringArray(defaults, "heroSteps", []),
  );
  const evaluationFactors = getObjectArray(
    page.content,
    "evaluationFactors",
    getObjectArray<HeroEvaluationItem>(
      defaults,
      "evaluationFactors",
      [],
      ["title", "description"],
    ),
    ["title", "description"],
  );
  const categoryEntries = getObjectArray(
    page.content,
    "categoryEntries",
    getObjectArray<HomeCategoryEntry>(
      defaults,
      "categoryEntries",
      [],
      ["title", "description"],
    ),
    ["title", "description"],
  );
  const visibleCategoryEntries = categoryEntries.flatMap((category) => {
    const details = getBlogCategoryByName(category.title);
    const hasPublishedPosts = publishedPosts.some(
      (post) => post.category === category.title,
    );

    return details && hasPublishedPosts
      ? [{ ...category, slug: details.slug }]
      : [];
  });

  const socialProfiles = getObjectArray<NavigationEntry>(
    globalPage.content,
    "socialProfiles",
    [],
    ["href", "label"],
  );
  const sameAs = getValidProfileUrls(
    socialProfiles.map((profile) => profile.href),
  );
  const organizationId = `${SITE_URL}/#organization`;
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: page.meta_description,
    publisher: { "@id": organizationId },
  };
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: SITE_LOGO_URL,
      width: 2048,
      height: 2048,
    },
    description: SITE_DESCRIPTION,
    founder: {
      "@type": "Person",
      name: founder?.name ?? PRIMARY_AUTHOR_NAME,
      url: getAuthorUrl(founder?.slug ?? PRIMARY_AUTHOR_SLUG),
    },
    sameAs,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([websiteJsonLd, organizationJsonLd]),
        }}
      />

      <section className="relative isolate overflow-hidden px-4 pb-16 pt-32 sm:px-6 lg:pb-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_15%,rgba(190,242,100,0.45),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(250,204,21,0.28),transparent_24%),linear-gradient(180deg,#fafafa,#f4f4f5)]" />
        <div className="absolute left-1/2 top-24 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-zinc-200/80" />

        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-zinc-950 sm:text-7xl lg:text-8xl">
                {getString(
                  page.content,
                  "heading",
                  getString(defaults, "heading", ""),
                )}
              </h1>
              <p className="max-w-2xl text-xl leading-8 text-zinc-600">
                {getString(
                  page.content,
                  "intro",
                  getString(defaults, "intro", ""),
                )}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/blog"
                className="rounded-full bg-zinc-950 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                {getString(
                  page.content,
                  "primaryCta",
                  getString(defaults, "primaryCta", ""),
                )}
              </Link>
              <Link
                href="/review-methodology"
                className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-center text-sm font-semibold text-zinc-950 transition hover:border-zinc-950"
              >
                {getString(
                  page.content,
                  "secondaryCta",
                  getString(defaults, "secondaryCta", ""),
                )}
              </Link>
            </div>
          </div>

          <div className="relative hidden min-h-[34rem] lg:block">
            <div className="absolute inset-0 rounded-full bg-lime-300/30 blur-3xl" />
            <div className="hero-orbit absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-300/70 sm:h-[28rem] sm:w-[28rem]" />
            <div className="hero-orbit-reverse absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-zinc-300 sm:h-72 sm:w-72" />

            <div className="absolute left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[2.25rem] border border-zinc-200 bg-white/80 p-5 shadow-[0_30px_100px_rgba(24,24,27,0.12)] backdrop-blur">
              <div className="rounded-[1.75rem] bg-zinc-950 p-5 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">
                    {getString(
                      page.content,
                      "heroEvaluationLabel",
                      getString(defaults, "heroEvaluationLabel", ""),
                    )}
                  </h2>
                  <span className="h-2.5 w-2.5 rounded-full bg-lime-300 shadow-[0_0_28px_rgba(190,242,100,0.95)]" />
                </div>
                <div className="mt-8 grid gap-3">
                  {heroEvaluation.map((item, index) => (
                    <div
                      key={item.title}
                      className="hero-signal-row rounded-2xl border border-white/10 bg-white/[0.06] p-4"
                      style={{ animationDelay: `${index * 0.18}s` }}
                    >
                      <div className="flex gap-3">
                        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime-300 text-xs font-semibold text-zinc-950">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="text-base font-semibold tracking-tight text-white">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-zinc-300">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {heroSteps.map((step, index) => (
                  <div
                    key={step}
                    className="hero-float rounded-2xl border border-zinc-200 bg-white p-4 text-center text-sm font-semibold text-zinc-700 shadow-sm"
                    style={{ animationDelay: `${index * 0.22}s` }}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 sm:justify-between">
          {trustStrip.map((item) => (
            <span
              key={item}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      {visibleCategoryEntries.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 grid gap-6 lg:grid-cols-[0.75fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                {getString(
                  page.content,
                  "categoryEyebrow",
                  getString(defaults, "categoryEyebrow", ""),
                )}
              </p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
                {getString(
                  page.content,
                  "categoryHeading",
                  getString(defaults, "categoryHeading", ""),
                )}
              </h2>
            </div>
            <p className="text-lg leading-8 text-zinc-600">
              {getString(
                page.content,
                "categoryIntro",
                getString(defaults, "categoryIntro", ""),
              )}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleCategoryEntries.map((category, index) => (
              <Link
                key={category.title}
                href={`/category/${category.slug}`}
                className="group relative overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-zinc-950 hover:shadow-[0_24px_80px_rgba(24,24,27,0.08)]"
              >
                <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-lime-300 text-sm font-semibold text-zinc-950 transition group-hover:scale-110">
                  {index + 1}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Category
                </p>
                <h3 className="mt-4 max-w-[13rem] text-2xl font-semibold tracking-tight text-zinc-950">
                  {category.title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-zinc-600">
                  {category.description}
                </p>
                <span className="mt-6 inline-flex text-sm font-semibold text-zinc-950 underline decoration-lime-400 decoration-2 underline-offset-4">
                  Browse articles
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featuredPosts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                {getString(
                  page.content,
                  "featuredEyebrow",
                  getString(defaults, "featuredEyebrow", ""),
                )}
              </p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
                {getString(
                  page.content,
                  "featuredHeading",
                  getString(defaults, "featuredHeading", ""),
                )}
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-sm font-semibold text-zinc-950 underline decoration-lime-400 decoration-2 underline-offset-4"
            >
              View all articles
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {featuredPosts.map((post, index) => (
              <BlogCard key={post.id} post={post} priority={index === 0} />
            ))}
          </div>
        </section>
      )}

      <section className="border-y border-zinc-200 bg-zinc-950 px-4 py-16 text-white sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-300">
              {getString(
                page.content,
                "evaluationEyebrow",
                getString(defaults, "evaluationEyebrow", ""),
              )}
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              {getString(
                page.content,
                "evaluationHeading",
                getString(defaults, "evaluationHeading", ""),
              )}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-300">
              {getString(
                page.content,
                "evaluationIntro",
                getString(defaults, "evaluationIntro", ""),
              )}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {evaluationFactors.map(({ title, description }) => (
              <div
                key={title}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 transition hover:border-lime-300/60 hover:bg-white/[0.09]"
              >
                <h3 className="text-xl font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
            {getString(
              page.content,
              "latestEyebrow",
              getString(defaults, "latestEyebrow", ""),
            )}
          </p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
            {getString(
              page.content,
              "latestHeading",
              getString(defaults, "latestHeading", ""),
            )}
          </h2>
        </div>
        {latestPosts.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {latestPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group rounded-[1.5rem] border border-zinc-200 bg-white p-6 transition hover:border-zinc-950"
              >
                <p className="text-sm font-semibold text-lime-700">
                  {post.category}
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 group-hover:text-lime-700">
                  {post.title}
                </h3>
                <p className="mt-3 line-clamp-2 text-zinc-600">
                  {post.excerpt}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-white p-8">
            <h3 className="text-2xl font-semibold tracking-tight text-zinc-950">
              New guides are in editorial review.
            </h3>
            <p className="mt-3 max-w-2xl leading-7 text-zinc-600">
              Devicefield publishes articles only after their evidence, testing
              label, and recommendations are reviewed.
            </p>
          </div>
        )}
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 text-white shadow-[0_30px_100px_rgba(24,24,27,0.16)] sm:p-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-300">
              {getString(
                page.content,
                "newsletterEyebrow",
                getString(defaults, "newsletterEyebrow", ""),
              )}
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {getString(
                page.content,
                "newsletterHeading",
                getString(defaults, "newsletterHeading", ""),
              )}
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
              {getString(
                page.content,
                "newsletterIntro",
                getString(defaults, "newsletterIntro", ""),
              )}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <NewsletterForm />
            <p className="mt-4 text-xs leading-5 text-zinc-400">
              No spam. New guides, corrections, and practical buying notes only.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
