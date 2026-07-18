export const metadata = {
  title: "Unsubscribe from Devicefield",
  referrer: "no-referrer" as const,
  robots: { index: false, follow: false },
};

export default async function UnsubscribeNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const validToken = token.includes(".") && token.length < 300;

  return (
    <section className="bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
          Newsletter preferences
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
          Unsubscribe from Devicefield
        </h1>
        <p className="mt-4 leading-7 text-zinc-600">
          You will stop receiving Devicefield newsletter emails. This does not
          affect essential replies to messages you send us.
        </p>
        {validToken ? (
          <form
            action="/api/newsletter/unsubscribe"
            method="post"
            className="mt-7"
          >
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="w-full rounded-full bg-zinc-950 px-5 py-3 font-semibold text-white transition hover:bg-zinc-800"
            >
              Unsubscribe
            </button>
          </form>
        ) : (
          <p className="mt-7 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            This unsubscribe link is invalid or incomplete.
          </p>
        )}
      </div>
    </section>
  );
}
