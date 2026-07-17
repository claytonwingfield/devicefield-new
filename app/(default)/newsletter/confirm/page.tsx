export const metadata = {
  title: "Confirm newsletter subscription - Devicefield",
  referrer: "no-referrer" as const,
  robots: { index: false, follow: false },
};

export default async function ConfirmNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const validToken = /^[A-Za-z0-9_-]{40,100}$/.test(token);

  return (
    <section className="bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
          Newsletter
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
          Confirm your subscription
        </h1>
        <p className="mt-4 leading-7 text-zinc-600">
          Confirm that you want Devicefield buying guides, troubleshooting
          notes, and business technology updates.
        </p>
        {validToken ? (
          <form action="/api/newsletter/confirm" method="post" className="mt-7">
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="w-full rounded-full bg-zinc-950 px-5 py-3 font-semibold text-white transition hover:bg-zinc-800"
            >
              Confirm subscription
            </button>
          </form>
        ) : (
          <p className="mt-7 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            This confirmation link is invalid or incomplete.
          </p>
        )}
      </div>
    </section>
  );
}
