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
  bestFor,
  avoidIf,
  pros = [],
  cons = [],
}: {
  name: string;
  description: string;
  href?: string | null;
  ctaLabel?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  meta?: string | null;
  placement?: string;
  articleId?: string;
  bestFor?: string | null;
  avoidIf?: string | null;
  pros?: string[];
  cons?: string[];
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
      {(bestFor || avoidIf) && (
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          {bestFor && (
            <div className="rounded-2xl bg-lime-50 p-4">
              <dt className="font-semibold text-zinc-950">Best for</dt>
              <dd className="mt-1 leading-6 text-zinc-600">{bestFor}</dd>
            </div>
          )}
          {avoidIf && (
            <div className="rounded-2xl bg-amber-50 p-4">
              <dt className="font-semibold text-zinc-950">Avoid if</dt>
              <dd className="mt-1 leading-6 text-zinc-600">{avoidIf}</dd>
            </div>
          )}
        </dl>
      )}
      {(pros.length > 0 || cons.length > 0) && (
        <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          {pros.length > 0 && (
            <div>
              <p className="font-semibold text-zinc-950">Pros</p>
              <ul className="mt-2 space-y-2 text-zinc-600">
                {pros.map((pro) => (
                  <li key={pro}>+ {pro}</li>
                ))}
              </ul>
            </div>
          )}
          {cons.length > 0 && (
            <div>
              <p className="font-semibold text-zinc-950">Cons</p>
              <ul className="mt-2 space-y-2 text-zinc-600">
                {cons.map((con) => (
                  <li key={con}>- {con}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {href && (
        <AffiliateButton
          href={href}
          label={ctaLabel}
          placement={placement}
          articleId={articleId}
          className="mt-5"
        />
      )}
    </article>
  );
}
