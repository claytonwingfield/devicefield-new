"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./logo";

const navItems = [
  { href: "/blog", label: "Guides" },
  { href: "/blog/how-we-test-business-tools", label: "Testing Method" },
  { href: "/terms", label: "Disclosure" },
];

export default function Header() {
  const pathname = usePathname();

  const handleNewsletterClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return;

    const newsletter = document.getElementById("newsletter");
    if (!newsletter) return;

    event.preventDefault();
    newsletter.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.pushState(null, "", "#newsletter");
  };

  return (
    <header className="fixed left-0 top-0 z-50 w-full px-4 pt-4 sm:px-6">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full border border-zinc-200 bg-white/88 px-3 shadow-[0_12px_50px_rgba(24,24,27,0.08)] backdrop-blur-xl">
        <Link href="/" aria-label="Devicefield home" className="flex items-center">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/#newsletter"
          onClick={handleNewsletterClick}
          className="rounded-full bg-lime-300 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200"
        >
          Newsletter
        </Link>
      </div>
    </header>
  );
}
