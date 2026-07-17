import Link from "next/link";
import {
  defaultSitePages,
  getPolicyPageSections,
  getSitePage,
  getString,
  type SitePageSlug,
} from "@/lib/site/pages";

type PolicyPageSlug = Extract<
  SitePageSlug,
  "contact" | "review-methodology" | "editorial-policy" | "affiliate-disclosure"
>;

export default async function PolicyPage({ slug }: { slug: PolicyPageSlug }) {
  const page = await getSitePage(slug);
  const defaults = defaultSitePages[slug].content;
  const sections = getPolicyPageSections(slug, page.content);

  return (
    <section className="bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="grid gap-8 border-b border-zinc-200 pb-12 lg:grid-cols-[1fr_0.7fr] lg:items-end">
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

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {sections.map((section, index) => (
            <article
              key={section.title}
              className={`rounded-[1.75rem] p-6 ${
                index === 0
                  ? "bg-zinc-950 text-white"
                  : "border border-zinc-200 bg-white text-zinc-950"
              }`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                  index === 0 ? "text-lime-300" : "text-lime-700"
                }`}
              >
                0{index + 1}
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                {section.title}
              </h2>
              <p
                className={`mt-3 leading-7 ${
                  index === 0 ? "text-zinc-300" : "text-zinc-600"
                }`}
              >
                {section.body}
              </p>
            </article>
          ))}
        </div>

        {slug === "contact" && (
          <div className="mt-8 rounded-[1.75rem] border border-lime-300 bg-lime-100 p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Contact Devicefield
            </h2>
            <p className="mt-2 leading-7 text-zinc-700">
              Include a relevant article URL and supporting source when
              reporting a correction.
            </p>
            <Link
              href="mailto:contact@devicefield.com"
              className="mt-5 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white"
            >
              contact@devicefield.com
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
