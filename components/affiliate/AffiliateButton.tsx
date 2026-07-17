import Link from "next/link";

export default function AffiliateButton({
  href,
  label,
  placement,
  articleId,
  className = "",
}: {
  href: string;
  label: "Check price" | "View current pricing" | "See deal" | "Visit site" | string;
  placement?: string;
  articleId?: string;
  className?: string;
}) {
  const url = new URL(href, "https://devicefield.com");
  if (href.startsWith("/go/")) {
    if (placement) url.searchParams.set("placement", placement);
    if (articleId) url.searchParams.set("articleId", articleId);
  }

  return (
    <Link
      href={href.startsWith("/go/") ? `${url.pathname}${url.search}` : href}
      target="_blank"
      rel="sponsored nofollow"
      className={`inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 ${className}`}
    >
      {label}
    </Link>
  );
}

