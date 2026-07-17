import Link from "next/link";
import Footer from "@/components/ui/footer";
import Header from "@/components/ui/header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="grow bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
        <section className="mx-auto grid min-h-[60vh] max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
              404
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-7xl">
              This guide is not in the field notes.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              The page may have moved, or the device/system guide has not been
              published yet. Start with the latest buying guides instead.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/blog"
                className="rounded-full bg-zinc-950 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Browse Buying Guides
              </Link>
              <Link
                href="/"
                className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-center text-sm font-semibold text-zinc-950 transition hover:border-zinc-950"
              >
                Back to Devicefield
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-[0_20px_70px_rgba(24,24,27,0.06)]">
            <div className="rounded-[1.5rem] bg-zinc-950 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-300">
                Popular paths
              </p>
              <div className="mt-6 grid gap-3">
                {[
                  "Barcode & Inventory",
                  "Receipt & Label Printing",
                  "POS Hardware",
                  "Networking & Uptime",
                  "Business Software",
                  "Troubleshooting",
                ].map((topic) => (
                  <Link
                    key={topic}
                    href="/blog"
                    className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-lime-300/60 hover:bg-white/[0.09]"
                  >
                    {topic}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
