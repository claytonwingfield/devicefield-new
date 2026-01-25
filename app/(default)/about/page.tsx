import AboutVisual from "@/components/about-visual";

export const metadata = {
  title: "About Us - Devicefield",
  description: "We are your partner in digital creation",
};

export default function About() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          {/* Split Hero Section */}
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center mb-20">
            {/* Left: Text */}
            <div className="text-left" data-aos="fade-right">
              <h1 className="h1 mb-6">We build the digital future</h1>
              <p className="text-xl text-gray-600 mb-8">
                At Devicefield, we believe that every vision deserves a
                world-class digital platform. From robust APIs to stunning
                mobile apps, we bridge the gap between idea and execution.
              </p>
              <div className="flex gap-4">
                <div className="rounded-lg bg-yellow-primary/10 px-4 py-2 text-yellow-800 font-medium">
                  Since 2020
                </div>
                <div className="rounded-lg bg-blue-50 px-4 py-2 text-blue-800 font-medium">
                  Global Team
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative w-full" data-aos="fade-left">
              <AboutVisual />
            </div>
          </div>

          {/* Mission & Vision Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <div
              className="group p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:border-yellow-primary/50"
              data-aos="fade-up"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-2xl mb-4 text-gray-900">
                Our Mission
              </h3>
              <p className="text-gray-600 leading-relaxed">
                To empower businesses worldwide by delivering seamless,
                high-performance digital experiences that connect and convert.
                We focus on speed, reliability, and user-centric design.
              </p>
            </div>

            <div
              className="group p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:border-blue-500/50"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-2xl mb-4 text-gray-900">
                Our Vision
              </h3>
              <p className="text-gray-600 leading-relaxed">
                To be the global standard for reliability and innovation in
                software development and digital infrastructure. We aim to
                define what's next in the digital landscape.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
