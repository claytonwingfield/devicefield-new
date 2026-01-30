import Image from "next/image";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import AuthBg from "@/public/images/auth-bg.svg";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />

      <main className="relative flex grow pt-24 md:pt-28">
        {/* 1. REMOVE GRADIENT ON MOBILE 
           Added 'hidden md:block' so this only shows on medium screens and up.
        */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 -translate-x-1/3 hidden md:block"
          aria-hidden="true"
        >
          <div className="h-80 w-80 rounded-full bg-gradient-to-tr from-blue-primary opacity-70 blur-[160px]"></div>
        </div>

        {/* Content */}
        <div className="w-full">
          {/* 2. MOVE TITLE HIGHER
             - Changed 'justify-center' to 'justify-start md:justify-center' (aligns top on mobile).
             - Changed 'before:min-h-[4rem]' to 'before:min-h-[1rem] md:before:min-h-[5rem]' (reduces top spacer).
          */}
          <div className="flex h-full flex-col justify-start md:justify-center before:min-h-[1rem] before:flex-1 after:flex-1 md:before:min-h-[5rem]">
            <div className="px-4 sm:px-6">
              <div className="mx-auto w-full max-w-sm">
                {/* - Changed 'py-16' to 'py-10 md:py-20' to reduce padding around the form on mobile.
                 */}
                <div className="py-10 md:py-20">{children}</div>
              </div>
            </div>
          </div>
        </div>

        <>
          {/* Right side */}
          <div className="relative my-6 mr-6 hidden w-[572px] shrink-0 overflow-hidden rounded-2xl lg:block">
            {/* */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -ml-24 -translate-x-1/2 -translate-y-1/2 bg-yellow-primary/20 blur-3xl"
              aria-hidden="true"
            >
              <Image
                src={AuthBg}
                className="max-w-none"
                width={1285}
                height={1684}
                alt="Auth bg"
              />
            </div>
            {/* Illustration */}
            <div className="absolute left-32 top-1/2 w-[500px] -translate-y-1/2">
              <div className="aspect-video w-full rounded-2xl bg-gray-900 px-5 py-3 shadow-xl transition duration-300">
                <div className="relative mb-8 flex items-center justify-between before:block before:h-[9px] before:w-[41px] before:bg-[length:16px_9px] before:[background-image:radial-gradient(circle_at_4.5px_4.5px,_theme(colors.gray.600)_4.5px,_transparent_0)] after:w-[41px]">
                  <span className="text-[13px] font-medium text-white">
                    devicefield.com
                  </span>
                </div>
                <div className="font-mono text-sm text-gray-500 transition duration-300 [&_span]:opacity-0">
                  <span className="animate-[code-1_10s_infinite] text-gray-200">
                    npm login
                  </span>{" "}
                  <span className="animate-[code-2_10s_infinite]">
                    --registry=https://npm.pkg.github.com
                  </span>
                  <br />
                  <span className="animate-[code-3_10s_infinite]">
                    --scope=@phanatic
                  </span>{" "}
                  <span className="animate-[code-4_10s_infinite]">
                    Successfully logged-in.
                  </span>
                  <br />
                  <br />
                  <span className="animate-[code-5_10s_infinite] text-gray-200">
                    npm publish
                  </span>
                  <br />
                  <span className="animate-[code-6_10s_infinite]">
                    Package published.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      </main>

      <Footer border={true} />
    </>
  );
}
