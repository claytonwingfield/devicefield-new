import Link from "next/link";
import type { ReactNode } from "react";

function headingId(value: string) {
  return value
    .toLowerCase()
    .replace(/\*\*/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getMarkdownHeadings(content: string) {
  return Array.from(content.matchAll(/^##\s+(.+)$/gm)).map((match) => ({
    title: match[1].replace(/\*\*/g, "").trim(),
    id: headingId(match[1]),
  }));
}

function renderInline(text: string) {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\*\*([^*]+)\*\*)|\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)(\{sponsored\})?/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      nodes.push(
        <strong
          key={`${match.index}-strong`}
          className="font-semibold text-zinc-950"
        >
          {match[2]}
        </strong>,
      );
    }

    if (match[3] && match[4]) {
      const href = match[4];
      const isExternal = href.startsWith("http");
      const isSponsored = Boolean(match[5]);

      nodes.push(
        <Link
          key={`${match.index}-link`}
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={
            isExternal
              ? `${isSponsored ? "sponsored nofollow " : ""}noopener noreferrer`
              : undefined
          }
          className="font-semibold text-zinc-950 underline decoration-lime-400 decoration-2 underline-offset-4 transition hover:text-lime-700"
        >
          {match[3]}
        </Link>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : text;
}

export default function MarkdownContent({ content }: { content: string }) {
  const blocks = content.trim().split(/\n{2,}/);

  return (
    <div className="space-y-7 text-lg leading-8 text-zinc-700">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        const imageMatch = trimmed.match(
          /^!\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)$/,
        );

        if (imageMatch) {
          const [, alt, src] = imageMatch;
          return (
            <figure
              key={index}
              className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                className="w-full rounded-[1.15rem] object-cover"
              />
              <figcaption className="px-2 pt-3 text-sm leading-6 text-zinc-500">
                {alt}
              </figcaption>
            </figure>
          );
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h3
              key={index}
              className="pt-3 text-2xl font-semibold tracking-tight text-zinc-950"
            >
              {renderInline(trimmed.replace(/^### /, ""))}
            </h3>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={index}
              id={headingId(trimmed.replace(/^## /, ""))}
              className="scroll-mt-28 pt-6 text-3xl font-semibold tracking-tight text-zinc-950"
            >
              {renderInline(trimmed.replace(/^## /, ""))}
            </h2>
          );
        }

        if (trimmed.startsWith("- ")) {
          return (
            <ul
              key={index}
              className="relative space-y-3 pl-8 before:absolute before:bottom-3 before:left-2 before:top-3 before:w-px before:bg-zinc-200"
            >
              {trimmed.split("\n").map((item) => (
                <li key={item} className="relative pl-1">
                  <span className="absolute -left-7 top-3 h-2 w-2 rounded-full bg-lime-400 ring-4 ring-white" />
                  {renderInline(item.replace(/^- /, ""))}
                </li>
              ))}
            </ul>
          );
        }

        if (/^\d+\. /.test(trimmed)) {
          return (
            <ol key={index} className="list-decimal space-y-3 pl-6">
              {trimmed.split("\n").map((item) => (
                <li key={item}>{renderInline(item.replace(/^\d+\. /, ""))}</li>
              ))}
            </ol>
          );
        }

        return <p key={index}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}
