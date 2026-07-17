import AffiliateButton from "./AffiliateButton";

export default function ProductCard({
  name,
  description,
  href,
  ctaLabel = "View current pricing",
  imageUrl,
  imageAlt,
  meta,
  placement,
  articleId,
}: {
  name: string;
  description: string;
  href: string;
  ctaLabel?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  meta?: string;
  placement?: string;
  articleId?: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={imageAlt ?? name}
          className="mb-5 aspect-[16/9] w-full rounded-[1rem] object-cover"
        />
      )}
      {meta && (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-700">
          {meta}
        </p>
      )}
      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
        {name}
      </h3>
      <p className="mt-3 leading-7 text-zinc-600">{description}</p>
      <AffiliateButton
        href={href}
        label={ctaLabel}
        placement={placement}
        articleId={articleId}
        className="mt-5"
      />
    </article>
  );
}

