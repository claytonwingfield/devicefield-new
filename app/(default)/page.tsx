import Link from "next/link";
import BlogCard from "@/components/blog/blog-card";
import { getFeaturedPosts, getPublishedPosts } from "@/lib/blog/server";
import {
  defaultSitePages,
  getSitePage,
  getString,
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
  };
}

export default async function Home() {
  const [page, featuredPosts, latestPosts] = await Promise.all([
    getSitePage("home"),
    getFeaturedPosts(3),
    getPublishedPosts(6),
  ]);
  const defaults = defaultSitePages.home.content;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Devicefield",
    url: "https://devicefield.com",
    description: page.meta_description,
    publisher: {
      "@type": "Organization",
      name: "Devicefield",
      url: "https://devicefield.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative isolate overflow-hidden px-4 pb-16 pt-32 sm:px-6 lg:pb-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_15%,rgba(190,242,100,0.45),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(250,204,21,0.28),transparent_24%),linear-gradient(180deg,#fafafa,#f4f4f5)]" />
        <div className="absolute left-1/2 top-24 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-zinc-200/80" />

        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-zinc-950 sm:text-7xl lg:text-8xl">
                {getString(page.content, "heading", getString(defaults, "heading", ""))}
              </h1>
              <p className="max-w-2xl text-xl leading-8 text-zinc-600">
                {getString(page.content, "intro", getString(defaults, "intro", ""))}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/blog"
                className="rounded-full bg-zinc-950 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                {getString(page.content, "primaryCta", getString(defaults, "primaryCta", ""))}
              </Link>
              <Link
                href="/blog/how-we-test-business-tools"
                className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-center text-sm font-semibold text-zinc-950 transition hover:border-zinc-950"
              >
                {getString(page.content, "secondaryCta", getString(defaults, "secondaryCta", ""))}
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
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">
                    Ranking system
                  </p>
                  <span className="h-2.5 w-2.5 rounded-full bg-lime-300 shadow-[0_0_28px_rgba(190,242,100,0.95)]" />
                </div>
                <div className="mt-8 space-y-3">
                  {[
                    ["Reviews", "94"],
                    ["Comparisons", "88"],
                    ["Guides", "82"],
                  ].map(([label, score], index) => (
                    <div
                      key={label}
                      className="hero-signal-row rounded-2xl border border-white/10 bg-white/[0.06] p-4"
                      style={{ animationDelay: `${index * 0.18}s` }}
                    >
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>{label}</span>
                        <span className="text-lime-300">{score}</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="hero-signal-bar h-full rounded-full bg-lime-300"
                          style={{ width: `${score}%`, animationDelay: `${index * 0.2}s` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {["Test", "Score", "Publish"].map((step, index) => (
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

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
              {getString(page.content, "featuredEyebrow", getString(defaults, "featuredEyebrow", ""))}
            </p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
              {getString(page.content, "featuredHeading", getString(defaults, "featuredHeading", ""))}
            </h2>
          </div>
          <Link href="/blog" className="text-sm font-semibold text-zinc-950 underline decoration-lime-400 decoration-2 underline-offset-4">
            View all articles
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {featuredPosts.map((post, index) => (
            <BlogCard key={post.id} post={post} priority={index === 0} />
          ))}
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-zinc-950 px-4 py-16 text-white sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-300">
              Evaluation system
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              Built for operators who need the right tool, not another tab to manage.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-300">
              Every guide is shaped around setup effort, long-term cost,
              security posture, switching risk, and the workflows a team
              actually has to run.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Setup time", "How quickly a team can get value."],
              ["Total cost", "What the tool costs after the intro offer."],
              ["Security fit", "Access, data, recovery, and admin controls."],
              ["Workflow impact", "Whether it removes work or adds another system."],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 transition hover:border-lime-300/60 hover:bg-white/[0.09]"
              >
                <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
            {getString(page.content, "latestEyebrow", getString(defaults, "latestEyebrow", ""))}
          </p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
            {getString(page.content, "latestHeading", getString(defaults, "latestHeading", ""))}
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {latestPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group rounded-[1.5rem] border border-zinc-200 bg-white p-6 transition hover:border-zinc-950"
            >
              <p className="text-sm font-semibold text-lime-700">{post.category}</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 group-hover:text-lime-700">
                {post.title}
              </h3>
              <p className="mt-3 line-clamp-2 text-zinc-600">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <p className="border-t border-zinc-200 pt-5 text-sm leading-6 text-zinc-500">
          {getString(page.content, "disclosureEyebrow", getString(defaults, "disclosureEyebrow", ""))}:{" "}
          {getString(page.content, "disclosureText", getString(defaults, "disclosureText", ""))}
        </p>
      </section>
    </>
  );
}
