import Link from "next/link";

export const metadata = {
  title: "Newsletter preferences - Devicefield",
  robots: { index: false, follow: false },
};

export default async function NewsletterUnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const unsubscribed = status === "success";

  return (
    <section className="bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
          Newsletter preferences
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
          {unsubscribed ? "You are unsubscribed" : "Request unavailable"}
        </h1>
        <p className="mt-4 leading-7 text-zinc-600">
          {unsubscribed
            ? "Devicefield newsletter emails have been stopped for this address."
            : "This unsubscribe link is invalid, expired, or has already been used."}
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex rounded-full border border-zinc-300 px-5 py-3 font-semibold text-zinc-950"
        >
          Return home
        </Link>
      </div>
    </section>
  );
}
