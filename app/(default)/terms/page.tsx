import {
  defaultSitePages,
  getSitePage,
  getString,
  getTermsSections,
} from "@/lib/site/pages";

export const revalidate = 300;

export async function generateMetadata() {
  const page = await getSitePage("terms");

  return {
    title: page.title,
    description: page.meta_description,
    alternates: {
      canonical: "https://devicefield.com/terms",
    },
  };
}

export default async function TermsPage() {
  const page = await getSitePage("terms");
  const defaults = defaultSitePages.terms.content;
  const sections = getTermsSections(page.content);

  return (
    <section className="bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-zinc-200 pb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
            {getString(page.content, "eyebrow", getString(defaults, "eyebrow", ""))}
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-7xl">
            {getString(page.content, "heading", getString(defaults, "heading", ""))}
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            {getString(page.content, "intro", getString(defaults, "intro", ""))}
          </p>
        </header>

        <div className="mt-10 space-y-5">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[1.5rem] border border-zinc-200 bg-white p-6"
            >
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                {section.title}
              </h2>
              <p className="mt-3 leading-7 text-zinc-600">{section.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
