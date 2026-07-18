import { defaultSitePages, getSitePage, getString } from "@/lib/site/pages";
import { createPublicPageMetadata } from "@/lib/site/metadata";

export const revalidate = 300;

export async function generateMetadata() {
  const page = await getSitePage("about");

  return createPublicPageMetadata({
    title: page.title,
    description: page.meta_description,
    canonicalUrl: "https://devicefield.com/about",
  });
}

export default async function AboutPage() {
  const page = await getSitePage("about");
  const defaults = defaultSitePages.about.content;
  const sections = [
    ["missionHeading", "missionBody"],
    ["standardsHeading", "standardsBody"],
    ["independenceHeading", "independenceBody"],
  ] as const;

  return (
    <section className="bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="grid gap-8 border-b border-zinc-200 pb-12 lg:grid-cols-[1fr_0.72fr] lg:items-end">
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

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {sections.map(([headingKey, bodyKey], index) => (
            <article
              key={headingKey}
              className={`rounded-[1.75rem] p-6 ${
                index === 1
                  ? "bg-zinc-950 text-white"
                  : "border border-zinc-200 bg-white text-zinc-950"
              }`}
            >
              <span
                className={`text-sm font-semibold ${index === 1 ? "text-lime-300" : "text-lime-700"}`}
              >
                0{index + 1}
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                {getString(
                  page.content,
                  headingKey,
                  getString(defaults, headingKey, ""),
                )}
              </h2>
              <p
                className={`mt-4 leading-7 ${index === 1 ? "text-zinc-300" : "text-zinc-600"}`}
              >
                {getString(
                  page.content,
                  bodyKey,
                  getString(defaults, bodyKey, ""),
                )}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
