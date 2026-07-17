import AffiliateButton from "./AffiliateButton";

export type ComparisonTableRow = {
  product: string;
  bestFor: string;
  notes: string;
  href: string;
  ctaLabel?: string;
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
                </td>
                <td className="px-5 py-4 text-zinc-600">{row.bestFor}</td>
                <td className="px-5 py-4 text-zinc-600">{row.notes}</td>
                <td className="px-5 py-4">
                  <AffiliateButton
                    href={row.href}
                    label={row.ctaLabel ?? "Check price"}
                    placement={placement}
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

