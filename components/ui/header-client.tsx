"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NavigationEntry } from "@/lib/site/pages";
import Logo from "./logo";

export default function HeaderClient({
  navItems,
  newsletterLabel,
}: {
  navItems: NavigationEntry[];
  newsletterLabel: string;
}) {
  const pathname = usePathname();
  const [openPanel, setOpenPanel] = useState<"menu" | "search" | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPanel(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleNewsletterClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    if (pathname !== "/") return;
    const newsletter = document.getElementById("newsletter");
    if (!newsletter) return;
    event.preventDefault();
    newsletter.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.pushState(null, "", "#newsletter");
  };

  return (
    <header className="fixed left-0 top-0 z-50 w-full px-4 pt-4 sm:px-6">
      <div className="relative mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between rounded-full border border-white/70 bg-white/65 px-3 shadow-[0_12px_50px_rgba(24,24,27,0.10)] backdrop-blur-2xl backdrop-saturate-150">
          <Link
            href="/"
            aria-label="Devicefield home"
            className="flex shrink-0 items-center"
            onClick={() => setOpenPanel(null)}
          >
            <Logo showWordmark />
          </Link>

          <nav
            className="hidden items-center gap-0.5 lg:flex"
            aria-label="Primary navigation"
          >
            {navItems.map((item) => {
              const isActive =
                item.href === "/blog"
                  ? pathname === "/blog" || pathname.startsWith("/category")
                  : pathname === item.href.split("?")[0];
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-700 hover:bg-white/80 hover:text-zinc-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              aria-label="Search Devicefield"
              aria-expanded={openPanel === "search"}
              onClick={() =>
                setOpenPanel((current) =>
                  current === "search" ? null : "search",
                )
              }
              className="inline-flex size-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-white/80 hover:text-zinc-950"
            >
              <SearchIcon />
            </button>
          </nav>

          <div className="flex items-center gap-1.5">
            <Link
              href="/#newsletter"
              onClick={(event) => {
                setOpenPanel(null);
                handleNewsletterClick(event);
              }}
              className="rounded-full bg-lime-300 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200 sm:px-4"
            >
              {newsletterLabel}
            </Link>
            <button
              type="button"
              aria-label={
                openPanel === "menu"
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={openPanel === "menu"}
              aria-controls="mobile-navigation"
              onClick={() =>
                setOpenPanel((current) => (current === "menu" ? null : "menu"))
              }
              className="inline-flex size-10 items-center justify-center rounded-full border border-white/80 bg-white/45 text-zinc-950 transition hover:bg-white/80 lg:hidden"
            >
              {openPanel === "menu" ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {openPanel === "menu" && (
          <div
            id="mobile-navigation"
            className="absolute left-0 right-0 top-20 overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/75 p-3 shadow-[0_24px_80px_rgba(24,24,27,0.16)] backdrop-blur-2xl backdrop-saturate-150 lg:hidden"
          >
            <nav aria-label="Mobile navigation" className="grid gap-1">
              {navItems.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={() => setOpenPanel(null)}
                  className="rounded-2xl px-4 py-3 text-base font-semibold text-zinc-800 transition hover:bg-white/80 hover:text-zinc-950"
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setOpenPanel("search")}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-semibold text-zinc-800 transition hover:bg-white/80 hover:text-zinc-950"
              >
                <SearchIcon /> Search
              </button>
            </nav>
          </div>
        )}

        {openPanel === "search" && (
          <div
            role="search"
            className="absolute left-0 right-0 top-20 rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-[0_24px_80px_rgba(24,24,27,0.16)] backdrop-blur-2xl backdrop-saturate-150 sm:left-auto sm:w-[30rem]"
          >
            <form action="/blog" className="flex gap-2">
              <label htmlFor="site-search" className="sr-only">
                Search Devicefield articles
              </label>
              <input
                id="site-search"
                name="q"
                type="search"
                autoFocus
                placeholder="Search guides, devices, and systems"
                className="min-w-0 flex-1 rounded-full border border-white/80 bg-white/80 px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-lime-300"
              />
              <button
                type="submit"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white transition hover:bg-zinc-800"
                aria-label="Submit search"
              >
                <SearchIcon />
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
      <path
        d="m20 20-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
