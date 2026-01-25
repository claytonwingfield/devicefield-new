import ProjectPlanner from "@/components/project-planner";
import QuoteVisual from "@/components/quote-visual";

export const metadata = {
  title: "Get Started - Devicefield",
  description: "Start your project with Devicefield",
};

export default function GetStarted() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          {/* Split Hero Section */}
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center mb-20">
            {/* Left: Text */}
            <div className="text-left" data-aos="fade-right">
              <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl tracking-tight">
                Let's build <br className="hidden lg:block" />
                your vision
              </h1>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed max-w-lg">
                Tell us a bit about what you need. We'll help you map out the
                perfect solution, from concept to launch.
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
            <div className="relative w-full" data-aos="fade-left">
              <QuoteVisual />
            </div>
          </div>

          {/* Interactive Planner Section */}
          <div id="planner" className="scroll-mt-24">
            <ProjectPlanner />
          </div>
        </div>
      </div>
    </section>
  );
}
