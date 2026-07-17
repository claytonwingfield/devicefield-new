import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="relative isolate flex grow items-center justify-center overflow-hidden bg-zinc-50 px-4 py-32 sm:px-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(190,242,100,0.36),transparent_28%),linear-gradient(180deg,#fafafa,#f4f4f5)]" />
        <div className="w-full max-w-md rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_80px_rgba(24,24,27,0.08)]">
          {children}
        </div>
      </main>
      <Footer border />
    </>
  );
}
