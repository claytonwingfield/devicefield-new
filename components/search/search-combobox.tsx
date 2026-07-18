"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  findSearchSuggestions,
  type BlogSearchSuggestion,
} from "@/lib/blog/search";
import { formatArticleType } from "@/lib/blog/types";

export default function SearchCombobox({
  documents,
  onNavigate,
}: {
  documents: BlogSearchSuggestion[];
  onNavigate: () => void;
}) {
  const router = useRouter();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = findSearchSuggestions(documents, query);

  const selectSuggestion = (index: number) => {
    const suggestion = suggestions[index];
    if (!suggestion) return;

    setExpanded(false);
    onNavigate();
    router.push(`/blog/${suggestion.slug}`);
  };

  return (
    <div
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setExpanded(false);
        }
      }}
    >
      <form action="/search" method="get" className="flex gap-2">
        <label htmlFor="site-search" className="sr-only">
          Search Devicefield articles
        </label>
        <input
          id="site-search"
          name="q"
          type="search"
          autoFocus
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={expanded && Boolean(query.trim())}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
            setExpanded(true);
          }}
          onFocus={() => setExpanded(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && suggestions.length > 0) {
              event.preventDefault();
              setExpanded(true);
              setActiveIndex((current) =>
                current >= suggestions.length - 1 ? 0 : current + 1,
              );
            } else if (event.key === "ArrowUp" && suggestions.length > 0) {
              event.preventDefault();
              setExpanded(true);
              setActiveIndex((current) =>
                current <= 0 ? suggestions.length - 1 : current - 1,
              );
            } else if (event.key === "Enter" && activeIndex >= 0) {
              event.preventDefault();
              selectSuggestion(activeIndex);
            } else if (event.key === "Escape") {
              setExpanded(false);
              setActiveIndex(-1);
            }
          }}
          placeholder="Search guides, devices, and systems"
          className="min-w-0 flex-1 rounded-full border border-white/80 bg-white/80 px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-lime-300"
        />
        <button
          type="submit"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white transition hover:bg-zinc-800"
          aria-label="View search results"
        >
          <SearchIcon />
        </button>
      </form>

      {expanded && query.trim() && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Article suggestions"
          className="mt-3 overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/90 shadow-[0_20px_50px_rgba(24,24,27,0.12)]"
        >
          {suggestions.map((suggestion, index) => (
            <Link
              key={suggestion.slug}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              href={`/blog/${suggestion.slug}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                setExpanded(false);
                onNavigate();
              }}
              className={`block border-b border-zinc-200/80 px-4 py-3 transition last:border-0 ${
                activeIndex === index
                  ? "bg-lime-100 text-zinc-950"
                  : "text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <span className="block text-sm font-semibold">
                {suggestion.title}
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                {suggestion.category} / {formatArticleType(suggestion.article_type)}
              </span>
            </Link>
          ))}

          <Link
            href={`/search?q=${encodeURIComponent(query.trim())}`}
            onClick={() => {
              setExpanded(false);
              onNavigate();
            }}
            className="flex items-center justify-between gap-4 bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            <span>
              {suggestions.length > 0
                ? `See all results for "${query.trim()}"`
                : `Search Devicefield for "${query.trim()}"`}
            </span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      )}
    </div>
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
