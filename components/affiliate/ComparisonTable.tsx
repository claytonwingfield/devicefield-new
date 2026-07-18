import AffiliateButton from "./AffiliateButton";

export type ComparisonTableRow = {
  product: string;
  award?: string | null;
  bestFor: string;
  avoidIf?: string | null;
  notes: string;
  href: string;
  ctaLabel?: string;
  placement?: string;
};

export default function ComparisonTable({
  rows,
  placement = "comparison-table",
  articleId,
}: {
  rows: ComparisonTableRow[];
  placement?: string;
  articleId?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-zinc-950 text-white">
            <tr>
              <th className="px-5 py-4 font-semibold">Product</th>
              <th className="px-5 py-4 font-semibold">Best for</th>
              <th className="px-5 py-4 font-semibold">Notes</th>
              <th className="px-5 py-4 font-semibold">Current pricing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {rows.map((row) => (
              <tr key={row.product}>
                <td className="px-5 py-4 font-semibold text-zinc-950">
                  {row.product}
                  {row.award && (
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.14em] text-lime-700">
                      {row.award}
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-zinc-600">{row.bestFor}</td>
                <td className="px-5 py-4 text-zinc-600">
                  {row.notes}
                  {row.avoidIf && (
                    <span className="mt-2 block text-xs text-amber-800">
                      Avoid if: {row.avoidIf}
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <AffiliateButton
                    href={row.href}
                    label={row.ctaLabel ?? "Check price"}
                    placement={row.placement ?? placement}
                    articleId={articleId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
