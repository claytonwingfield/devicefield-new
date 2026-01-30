"use client";

import React, { useState } from "react";
import Link from "next/link";
import ServiceLayout, { FeatureItem } from "@/components/service-layout";
import { IntegrationsVisual } from "@/components/service-visuals";
import ContactForm from "@/components/contact-form";

export default function Integrations() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const features: FeatureItem[] = [
    {
      title: "Supabase",
      description: "Real-time database and authentication built-in.",
      icon: (
        <div className="flex h-full w-full items-center justify-center rounded-2xl !bg-gray-900">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="none"
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.8 2.05926C12.8 1.44299 12.0837 1.10427 11.609 1.49635L2.94236 8.71857C2.42777 9.14739 2.65287 9.98822 3.31389 10.1084L10.4 11.3967L10.4 21.1407C10.4 21.757 11.1163 22.0957 11.591 21.7036L20.2576 14.4814C20.7722 14.0526 20.5471 13.2118 19.8861 13.0916L12.8 11.8033L12.8 2.05926Z"
              fill="#3ECF8E"
            />
          </svg>
        </div>
      ),
    },
    {
      title: "Stripe",
      description: "Seamless payments and subscription management.",
      icon: (
        // Updated: White background with the specific colored 'S' vector you provided
        <div className="flex h-full w-full items-center justify-center rounded-2xl !bg-white border border-gray-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"
              fill="#635BFF"
            />
          </svg>
        </div>
      ),
    },
    {
      title: "Vercel",
      description: "Optimized for edge deployment and speed.",
      icon: (
        <div className="flex h-full w-full items-center justify-center rounded-2xl !bg-black">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 1L24 22H0L12 1Z" fill="white" />
          </svg>
        </div>
      ),
    },
    {
      title: "GitHub",
      description: "Code hosting and collaboration.",
      icon: (
        <div className="flex h-full w-full items-center justify-center rounded-2xl !bg-gray-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.339 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"
              fill="black"
            />
          </svg>
        </div>
      ),
    },
    {
      title: "Slack",
      description: "Team communication and notifications.",
      icon: (
        <div className="flex h-full w-full items-center justify-center rounded-2xl !bg-white border border-gray-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.52V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.522-2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.166 0a2.528 2.528 0 0 1 2.522 2.522v6.312zM15.166 18.956a2.528 2.528 0 0 1 2.522 2.522A2.528 2.528 0 0 1 15.166 24a2.527 2.527 0 0 1-2.522-2.522v-2.522h2.522zM15.166 17.688a2.527 2.527 0 0 1-2.522-2.522 2.527 2.527 0 0 1 2.52-2.52h6.312A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.312z"
              fill="#E01E5A"
            />
          </svg>
        </div>
      ),
    },
    {
      title: "Twilio",
      description: "SMS and communication APIs.",
      icon: (
        // Updated: White background with the specific colored Twilio vector you provided
        <div className="flex h-full w-full items-center justify-center rounded-2xl !bg-white border border-gray-100">
          <svg
            viewBox="0 0 256 256"
            fill="none"
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <path
                d="M128,0 C198.656,0 256,57.344 256,128 C256,198.656 198.656,256 128,256 C57.344,256 0,198.656 0,128 C0,57.344 57.344,0 128,0 Z M128,33.792 C75.776,33.792 33.792,75.776 33.792,128 C33.792,180.224 75.776,222.208 128,222.208 C180.224,222.208 222.208,180.224 222.208,128 C222.208,75.776 180.224,33.792 128,33.792 Z M159.744,133.12 C174.448029,133.12 186.368,145.039971 186.368,159.744 C186.368,174.448029 174.448029,186.368 159.744,186.368 C145.039971,186.368 133.12,174.448029 133.12,159.744 C133.12,145.039971 145.039971,133.12 159.744,133.12 Z M96.256,133.12 C110.960029,133.12 122.88,145.039971 122.88,159.744 C122.88,174.448029 110.960029,186.368 96.256,186.368 C81.5519708,186.368 69.632,174.448029 69.632,159.744 C69.632,145.039971 81.5519708,133.12 96.256,133.12 Z M159.744,69.632 C174.448029,69.632 186.368,81.5519708 186.368,96.256 C186.368,110.960029 174.448029,122.88 159.744,122.88 C145.039971,122.88 133.12,110.960029 133.12,96.256 C133.12,81.5519708 145.039971,69.632 159.744,69.632 Z M96.256,69.632 C110.960029,69.632 122.88,81.5519708 122.88,96.256 C122.88,110.960029 110.960029,122.88 96.256,122.88 C81.5519708,122.88 69.632,110.960029 69.632,96.256 C69.632,81.5519708 81.5519708,69.632 96.256,69.632 Z"
                fill="#F12E45"
              />
            </g>
          </svg>
        </div>
      ),
    },
  ];

  return (
    <ServiceLayout
      title="Integrations"
      description="Devicefield plays nice with your favorite tools. Connect your existing tech stack seamlessly with our robust and flexible plugins."
      visual={<IntegrationsVisual />}
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={48}
          height={48}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-yellow-primary"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      }
      features={features}
      benefits={[
        "Unified data ecosystem across all your tools",
        "Real-time synchronization for instant updates",
        "Secure authentication with enterprise-grade standards",
        "Plug-and-play setup for popular services",
        "Automated workflows triggered by external events",
        "Developer-first API for custom integrations",
      ]}
      useCases={[
        "CRM Sync",
        "Payment Processing",
        "Team Notifications",
        "Deployment Triggers",
        "Customer Messaging",
      ]}
    >
      {/* Call to Action for Custom Integrations */}
      <div
        className="mb-20 rounded-3xl bg-gray-900 p-8 text-center shadow-xl md:p-12"
        data-aos="zoom-y-out"
      >
        <h2 className="mb-4 text-3xl font-bold text-white">
          Don't see your tool?
        </h2>
        <p className="mb-8 text-gray-400 max-w-2xl mx-auto">
          Our API is flexible enough to connect with almost any modern software.
          Request a specific integration or build your own using our docs.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
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
                // Optional: Close modal logic could go here
              }}
            />
          </div>
        </div>
      )}
    </ServiceLayout>
  );
}
