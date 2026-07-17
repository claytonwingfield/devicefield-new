export default function AffiliateDisclosure({
  className = "",
}: {
  className?: string;
}) {
  return (
    <p className={`text-sm leading-6 text-zinc-500 ${className}`}>
      Disclosure: Some links may be partner links. Devicefield may earn a
      commission at no extra cost to you.
    </p>
  );
}

