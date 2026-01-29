"use client";

import { useState } from "react";
import Link from "next/link";
import ContactForm from "@/components/contact-form";

export default function Integrations() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tools = [
    {
      name: "Supabase",
      description: "Real-time database and authentication built-in.",
      color: "bg-gray-900",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="none"
          className="h-8 w-8 text-[#3ECF8E]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.8 2.05926C12.8 1.44299 12.0837 1.10427 11.609 1.49635L2.94236 8.71857C2.42777 9.14739 2.65287 9.98822 3.31389 10.1084L10.4 11.3967L10.4 21.1407C10.4 21.757 11.1163 22.0957 11.591 21.7036L20.2576 14.4814C20.7722 14.0526 20.5471 13.2118 19.8861 13.0916L12.8 11.8033L12.8 2.05926Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      name: "Stripe",
      description: "Seamless payments and subscription management.",
      color: "bg-[#635BFF]/10",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-8 w-8 text-[#635BFF]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.9763 8.35821C13.9763 7.52554 13.3039 6.88371 12.0392 6.88371C10.9996 6.88371 9.9987 7.23075 9.15783 7.62283V3.82916C10.1555 3.39221 11.4031 3.19067 12.6331 3.19067C15.9385 3.19067 18.2351 4.79233 18.2351 8.16788V17.923H14.1555V15.7508C13.2479 17.1508 11.5375 18.1022 9.60601 18.1022C6.73783 18.1022 4.67651 15.986 4.67651 13.1179C4.67651 10.1825 6.9507 7.97738 10.3678 7.97738C11.8288 7.97738 13.0909 8.52621 13.9763 9.32163V8.35821ZM13.9763 11.8533C13.3375 11.1363 12.333 10.8338 11.3313 10.8338C9.42675 10.8338 8.14955 12.0325 8.14955 13.566C8.14955 14.8879 9.14666 15.8625 10.7487 15.8625C12.445 15.8625 13.5393 14.9327 13.9763 14.07V11.8533Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      name: "Vercel",
      description: "Optimized for edge deployment and speed.",
      color: "bg-black",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-8 w-8 text-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 1L24 22H0L12 1Z" fill="currentColor" />
        </svg>
      ),
    },
    {
      name: "GitHub",
      description: "Code hosting and collaboration.",
      color: "bg-gray-100",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-8 w-8 text-black"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.339 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      name: "Slack",
      description: "Team communication and notifications.",
      color: "bg-white border border-gray-100",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-8 w-8"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.52V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.522-2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.166 0a2.528 2.528 0 0 1 2.522 2.522v6.312zM15.166 18.956a2.528 2.528 0 0 1 2.522 2.522A2.528 2.528 0 0 1 15.166 24a2.527 2.527 0 0 1-2.522-2.522v-2.522h2.522zM15.166 17.688a2.527 2.527 0 0 1-2.522-2.522 2.527 2.527 0 0 1 2.52-2.52h6.312A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.312z"
            fill="#E01E5A"
          />
        </svg>
      ),
    },
    {
      name: "Twilio",
      description: "SMS and communication APIs.",
      color: "bg-[#F22F46]/10",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-8 w-8 text-[#F22F46]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm2 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
            fill="currentColor"
          />
        </svg>
      ),
    },
  ];

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          {/* Header */}
          <div className="text-center mb-16" data-aos="fade-down">
            <h1 className="h1 mb-6">Integrations</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Devicefield plays nice with your favorite tools. Connect your
              existing tech stack seamlessly.
            </p>
          </div>

          {/* Integration Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, index) => (
              <div
                key={index}
                className="group relative flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-gray-300"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {/* Icon Container with Hover Animation */}
                <div
                  className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full ${tool.color} shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
                >
                  {tool.icon}
                </div>

                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  {tool.name}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {tool.description}
                </p>

                <Link
                  href="#"
                  className="inline-flex items-center text-sm font-medium text-blue-primary hover:text-blue-primary/90"
                >
                  Learn more{" "}
                  <span className="ml-1 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div
            className="mt-20 rounded-2xl bg-gray-900 p-8 text-center shadow-xl md:p-12"
            data-aos="zoom-y-out"
          >
            <h2 className="mb-4 text-3xl font-bold text-white">
              Don't see your tool?
            </h2>
            <p className="mb-8 text-gray-400">
              Our API is flexible enough to connect with almost any modern
              software.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn bg-white text-gray-900 hover:bg-gray-100"
              >
                Request Integration
              </button>
              <Link
                href="/services/api-development"
                className="btn border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                View API Docs
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/70 backdrop-blur-sm p-4 md:p-6">
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl md:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Request Integration
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Let us know which tool you'd like to see next.
              </p>
            </div>

            <ContactForm
              serviceName="Integration Request"
              onSubmit={() => {
                // Optional: Close modal after success (ContactForm handles its own success message)
                // setTimeout(() => setIsModalOpen(false), 2000);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
