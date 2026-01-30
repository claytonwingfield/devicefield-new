import AboutVisual from "@/components/about-visual";
import ContactForm from "@/components/contact-form";

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
              <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl tracking-tight">
                We build the digital future
              </h1>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                At Devicefield, we believe that every vision deserves a
                world-class digital platform. From robust APIs to stunning
                mobile apps, we bridge the gap between idea and execution.
              </p>
              <div className="flex gap-4">
                <div className="rounded-lg bg-yellow-primary/10 px-4 py-2 text-yellow-800 font-medium">
                  Since 2020
                </div>
                {/* Changed Global Team to Oklahoma City */}
                <div className="rounded-lg bg-blue-50 px-4 py-2 text-blue-800 font-medium">
                  Oklahoma City
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
              className="group p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:border-blue-primary/50"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-primary text-white">
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
                To be the standard for reliability and innovation in software
                development. We aim to define what's next in the digital
                landscape.
              </p>
            </div>
          </div>

          {/* Contact Section */}
          <section
            id="contact-form"
            className="relative mb-20 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-primary via-blue-primary/95 to-yellow-primary/80 px-6 py-16 shadow-2xl sm:px-12 lg:px-20"
          >
            <div className="absolute -mt-20 -mr-20 right-0 top-0 h-64 w-64 rounded-full bg-yellow-primary opacity-10 blur-3xl"></div>
            <div className="absolute -mb-20 -ml-20 bottom-0 left-0 h-64 w-64 rounded-full bg-blue-primary opacity-10 blur-3xl"></div>

            <div className="relative mx-auto max-w-3xl">
              <div className="mb-10 text-center">
                <h2 className="mb-4 text-3xl font-bold text-white">
                  Ready to start?
                </h2>
                <p className="text-white">
                  Tell us about your requirements for your project.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 md:p-8">
                <ContactForm />
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
