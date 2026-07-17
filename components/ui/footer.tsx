import Link from "next/link";
import NewsletterForm from "@/components/newsletter-form";
import Logo from "./logo";

const footerLinks = [
  { href: "/blog", label: "All guides" },
  { href: "/blog/how-we-test-business-tools", label: "How we test" },
  { href: "/terms", label: "Terms & disclosure" },
];

const topics = [
  "Business systems",
  "Security",
  "AI tools",
  "Web infrastructure",
  "Operations",
  "Buying guides",
];

export default function Footer({ border = false }: { border?: boolean }) {
  return (
    <footer className="bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className={`grid gap-10 py-12 lg:grid-cols-[1fr_0.7fr_0.8fr_1.1fr] ${
            border ? "border-t border-white/10" : ""
          }`}
        >
          <div className="space-y-5">
            <Link href="/" aria-label="Devicefield home" className="inline-flex">
              <Logo />
            </Link>
            <p className="max-w-sm text-sm leading-6 text-zinc-400">
              Devicefield publishes tested devices, software systems, and operating
              guides for modern businesses.
            </p>
            <p className="text-xs leading-5 text-zinc-500">
              Affiliate disclosure: Devicefield may earn commissions from qualifying
              purchases made through links on this site.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Navigation
            </h2>
            <ul className="mt-4 space-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link className="text-sm text-zinc-300 transition hover:text-white" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Topics
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {topics.map((topic) => (
                <span key={topic} className="rounded-full border border-white/10 px-3 py-1 text-sm text-zinc-300">
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div id="newsletter" className="scroll-mt-28">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-300">
              Newsletter
            </h2>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Get new buying guides, tested tools, and business systems notes when
              they publish.
            </p>
            <div className="mt-5">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-white/10 py-6 text-xs text-zinc-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Devicefield.com. All rights reserved.</p>
          <p>Tested devices and systems for modern businesses.</p>
        </div>
      </div>
    </footer>
  );
}
