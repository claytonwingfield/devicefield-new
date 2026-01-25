"use client";

import ContactForm from "./contact-form";

interface ServiceLayoutProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  visual?: React.ReactNode;
  features: string[];
  benefits: string[];
  useCases?: string[];
  children?: React.ReactNode;
}

export default function ServiceLayout({
  title,
  description,
  icon,
  visual,
  features,
  benefits,
  useCases,
  children,
}: ServiceLayoutProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero Section */}
      <div className="pb-12 pt-32 md:pb-20 md:pt-40">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left Column: Text */}
          <div className="text-left" data-aos="fade-right">
            {icon && <div className="mb-4 inline-flex lg:hidden">{icon}</div>}
            <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl tracking-tight">
              {title}
            </h1>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              {description}
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() =>
                  document
                    .getElementById("contact-form")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="btn bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
              >
                Start Project
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic Visual */}
          <div
            className="relative mx-auto w-full max-w-md lg:max-w-full"
            data-aos="fade-left"
          >
            {visual ? (
              visual
            ) : (
              <div className="flex items-center justify-center rounded-3xl bg-gray-100 p-12">
                {icon}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="mb-20">
        <h2 className="mb-12 text-3xl font-bold text-center">Key Features</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-yellow-primary/50"
              data-aos="fade-up"
              data-aos-delay={index * 50}
            >
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-primary/20 text-yellow-600 group-hover:bg-yellow-primary group-hover:text-black transition-colors">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900">{feature}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="mb-20">
        <h2 className="mb-12 text-3xl font-bold text-center">Benefits</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start space-x-4 rounded-2xl bg-gray-50 p-6 transition hover:bg-white hover:shadow-lg border border-transparent hover:border-gray-100"
              data-aos="zoom-y-out"
            >
              <div className="mt-1 flex-shrink-0 rounded-full bg-white p-2 shadow-sm text-yellow-primary">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-700 font-medium leading-relaxed">
                {benefit}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases Section */}
      {useCases && useCases.length > 0 && (
        <section className="mb-20">
          <h2 className="mb-12 text-3xl font-bold text-center">
            Common Use Cases
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="rounded-full border border-gray-200 bg-white px-6 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-400 hover:text-gray-900"
              >
                {useCase}
              </div>
            ))}
          </div>
        </section>
      )}

      {children}

      {/* Contact Section */}
      <section
        id="contact-form"
        className="mb-20 overflow-hidden rounded-3xl bg-gray-900 px-6 py-16 shadow-2xl sm:px-12 lg:px-20 relative"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-yellow-primary opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-blue-500 opacity-10 blur-3xl"></div>

        <div className="relative mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Ready to start?
            </h2>
            <p className="text-gray-400">
              Tell us about your requirements for {title}.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 md:p-8">
            <ContactForm serviceName={title} />
          </div>
        </div>
      </section>
    </div>
  );
}
