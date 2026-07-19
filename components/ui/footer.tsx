import Link from "next/link";
import NewsletterForm from "@/components/newsletter-form";
import { getPublishedPosts } from "@/lib/blog/server";
import { BLOG_CATEGORY_DETAILS } from "@/lib/blog/types";
import {
  defaultSitePages,
  getObjectArray,
  getSitePage,
  getString,
  type NavigationEntry,
} from "@/lib/site/pages";
import Logo from "./logo";
import SocialLinks from "./social-links";

export default async function Footer({ border = false }: { border?: boolean }) {
  const [page, posts] = await Promise.all([
    getSitePage("global"),
    getPublishedPosts(),
  ]);
  const defaults = defaultSitePages.global.content;
  const publicationLinks = getObjectArray<NavigationEntry>(
    page.content,
    "footerPublicationLinks",
    getObjectArray<NavigationEntry>(
      defaults,
      "footerPublicationLinks",
      [],
      ["href", "label"],
    ),
    ["href", "label"],
  );
  const policyLinks = getObjectArray<NavigationEntry>(
    page.content,
    "footerPolicyLinks",
    getObjectArray<NavigationEntry>(
      defaults,
      "footerPolicyLinks",
      [],
      ["href", "label"],
    ),
    ["href", "label"],
  );
  const socialProfiles = getObjectArray<NavigationEntry>(
    page.content,
    "socialProfiles",
    getObjectArray<NavigationEntry>(
      defaults,
      "socialProfiles",
      [],
      ["href", "label"],
    ),
    ["href", "label"],
  );
  const publishedTopics = BLOG_CATEGORY_DETAILS.filter((topic) =>
    posts.some((post) => post.category === topic.name),
  );

  return (
    <footer className="bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={`grid gap-10 py-12 md:grid-cols-2 xl:grid-cols-[1.15fr_0.7fr_0.7fr_1fr_1.15fr] ${
            border ? "border-t border-white/10" : ""
          }`}
        >
          <div className="space-y-5">
            <Link
              href="/"
              aria-label="Devicefield home"
              className="inline-flex"
            >
              <Logo showWordmark inverse />
            </Link>
            <p className="max-w-sm text-sm leading-6 text-zinc-400">
              {getString(
                page.content,
                "footerDescription",
                getString(defaults, "footerDescription", ""),
              )}
            </p>
            <p className="text-xs leading-5 text-zinc-500">
              {getString(
                page.content,
                "footerDisclosure",
                getString(defaults, "footerDisclosure", ""),
              )}
            </p>
            {socialProfiles.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Follow Devicefield
                </p>
                <SocialLinks profiles={socialProfiles} inverse />
              </div>
            )}
          </div>

          <FooterList title="Publication" links={publicationLinks} />
          <FooterList title="Policies" links={policyLinks} />

          {publishedTopics.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Topics
              </h2>
              <ul className="mt-4 space-y-3">
                {publishedTopics.map((topic) => (
                  <li key={topic.slug}>
                    <Link
                      href={`/category/${topic.slug}`}
                      className="text-sm text-zinc-300 transition hover:text-white"
                    >
                      {topic.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div id="newsletter" className="scroll-mt-28">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-300">
              {getString(
                page.content,
                "footerNewsletterHeading",
                getString(defaults, "footerNewsletterHeading", "Newsletter"),
              )}
            </h2>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              {getString(
                page.content,
                "footerNewsletterText",
                getString(defaults, "footerNewsletterText", ""),
              )}
            </p>
            <div className="mt-5">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-white/10 py-6 text-xs text-zinc-500 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} Devicefield.com. All rights
            reserved.
          </p>
          <p>
            {getString(
              page.content,
              "footerTagline",
              getString(defaults, "footerTagline", ""),
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterList({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              className="text-sm text-zinc-300 transition hover:text-white"
              href={link.href}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
