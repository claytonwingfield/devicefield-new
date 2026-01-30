import ProjectPlanner from "@/components/project-planner";
import QuoteVisual from "@/components/quote-visual";

export const metadata = {
  title: "Get a Quote - Devicefield",
  description: "Tell us about your project and get a custom quote",
};

export default function Pricing() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 1. Hero Section Wrapper */}
        {/* FIX: Added 'lg:overflow-visible' so the visual's tag isn't cut off on desktop */}
        <div className="relative overflow-hidden lg:overflow-visible pt-32 pb-12 md:pt-40 md:pb-20">
          {/* Gradient Overlay (Mobile Only) */}
          <div className="absolute inset-0 z-[5] pointer-events-none lg:hidden bg-gradient-to-t from-white via-white/80 to-transparent" />

          {/* Hero Grid */}
          <div className="relative grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            {/* Left: Text */}
            <div
              className="relative z-10 text-left mt-48 lg:mt-0"
              data-aos="fade-right"
            >
              <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl tracking-tight">
                Let's build <br className="hidden lg:block" />
                something great
              </h1>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed max-w-lg">
                Answer a few questions to help us understand your needs. We'll
                provide a custom strategy and quote tailored to your goals.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="#planner"
                  className="btn bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
                >
                  Start Project Planner
                </a>
              </div>
            </div>

            {/* Right: Visual */}
            <div
              className="absolute -right-40 -top-8 w-[90%] opacity-100 pointer-events-none z-0 sm:-right-28 sm:-top-40 sm:w-[70%] lg:static lg:w-full lg:max-w-full lg:opacity-100 lg:pointer-events-auto lg:right-auto lg:top-auto lg:z-auto"
              data-aos="fade-left"
            >
              <QuoteVisual />
            </div>
          </div>
        </div>

        {/* 2. Planner Section */}
        <div id="planner" className="scroll-mt-24 pb-12 md:pb-20">
          <ProjectPlanner />
        </div>
      </div>
    </section>
  );
}
