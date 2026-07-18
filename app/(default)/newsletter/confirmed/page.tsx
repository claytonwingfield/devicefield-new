import Link from "next/link";

export const metadata = {
  title: "Newsletter confirmation - Devicefield",
  robots: { index: false, follow: false },
};

export default async function NewsletterConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const confirmed = status === "success";

  return (
    <section className="bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
          Newsletter
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
          {confirmed ? "Subscription confirmed" : "Confirmation unavailable"}
        </h1>
        <p className="mt-4 leading-7 text-zinc-600">
          {confirmed
            ? "You are subscribed. A confirmation message with your unsubscribe link is on its way."
            : "This link is invalid, expired, or has already been used. Submit the newsletter form again if you still want to subscribe."}
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex rounded-full bg-zinc-950 px-5 py-3 font-semibold text-white"
        >
          Return home
        </Link>
      </div>
    </section>
  );
}
