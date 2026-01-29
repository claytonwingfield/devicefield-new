"use client";

import React from "react";
import ContactForm from "./contact-form";

// Update the interface to allow features to be strings OR objects with icons
export interface FeatureItem {
  title: string;
  icon?: React.ReactNode;
}

interface ServiceLayoutProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  visual?: React.ReactNode;
  features: (string | FeatureItem)[];
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
      <div className="relative overflow-hidden pb-12 pt-32 md:pb-20 md:pt-40">
        <div className="absolute inset-0 z-[5] pointer-events-none lg:hidden bg-gradient-to-t from-white via-white/80 to-transparent" />

        <div className="relative grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left Column: Text */}
          <div
            className="relative z-10 text-left mt-48 lg:mt-0"
            data-aos="fade-right"
          >
            <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl tracking-tight">
              {title}
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-gray-700">
              {description}
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() =>
                  document
                    .getElementById("contact-form")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="btn shadow-lg bg-gray-900 text-white hover:bg-gray-800"
              >
                Start Project
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic Visual */}
          <div
            className="absolute -right-16 -top-16 w-[90%] opacity-100 pointer-events-none z-0 sm:-right-28 sm:-top-40 sm:w-[70%] lg:static lg:w-full lg:max-w-full lg:opacity-100 lg:pointer-events-auto lg:right-auto lg:top-auto lg:z-auto"
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

      {/* Features Section - Bento Grid Style */}
      <section className="mb-32">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Key Capabilities
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const isString = typeof feature === "string";
            const featureTitle = isString ? feature : feature.title;
            const featureIcon =
              !isString && feature.icon ? (
                feature.icon
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              );

            return (
              <div
                key={index}
                className="group relative flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                data-aos="fade-up"
                data-aos-delay={index * 50}
              >
                <div>
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-900 group-hover:bg-yellow-primary group-hover:text-black transition-colors">
                    {featureIcon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {featureTitle}
                  </h3>
                </div>
                {/* Decorative dots from inspiration image */}
                <div className="mt-8 flex gap-2 opacity-20">
                  <div className="h-2 w-2 rounded-full bg-gray-900"></div>
                  <div className="h-2 w-2 rounded-full bg-gray-900"></div>
                  <div className="h-2 w-2 rounded-full bg-gray-900"></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* NEW: Sticky Stacking Benefits Section */}
      <section className="mb-32">
        <div className="mb-16 text-center">
          <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-yellow-800 uppercase bg-yellow-100 rounded-full">
            Outcomes
          </div>
          <h2 className="text-3xl font-bold md:text-5xl">Why Choose This?</h2>
        </div>

        <div className="relative space-y-8 lg:space-y-0">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="sticky top-24 lg:top-32"
              style={{
                // Create a slight offset so they stack nicely but don't completely hide the one behind
                paddingTop: `${index * 1.5}rem`,
                zIndex: index + 1,
              }}
            >
              <div className="relative overflow-hidden rounded-[2.5rem] border border-gray-200 bg-white shadow-2xl transition-transform hover:scale-[1.01] duration-500">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-0">
                  {/* Left Side: Content */}
                  <div className="flex flex-col justify-between p-8 md:p-12 lg:p-16">
                    <div>
                      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm text-2xl font-bold text-gray-300">
                        {index + 1}
                      </div>
                      <h3 className="mb-4 text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                        {benefit}
                      </h3>
                      <p className="text-lg text-gray-500">
                        We focus on clarity, positioning, and performance. No
                        filler, no fluff. Just results that move the needle.
                      </p>
                    </div>

                    {/* Card Footer from Inspiration */}
                    <div className="mt-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                      <span>Process + Deliverables</span>
                      <div className="flex gap-0.5">
                        <div className="h-0.5 w-0.5 rounded-full bg-gray-400"></div>
                        <div className="h-0.5 w-0.5 rounded-full bg-gray-400"></div>
                        <div className="h-0.5 w-0.5 rounded-full bg-gray-400"></div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Visual/Abstract */}
                  <div className="relative min-h-[300px] bg-gray-50 lg:min-h-full flex items-center justify-center overflow-hidden border-t lg:border-t-0 lg:border-l border-gray-100">
                    {/* Dynamic Geometric Pattern based on index to give variety */}
                    {index % 3 === 0 && (
                      <div className="relative w-64 h-64">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-primary/20 to-yellow-primary/20 rounded-full blur-3xl"></div>
                        <div className="absolute inset-4 border border-gray-200 rounded-full flex items-center justify-center">
                          <div className="w-32 h-32 bg-white shadow-lg rounded-2xl rotate-12"></div>
                        </div>
                      </div>
                    )}
                    {index % 3 === 1 && (
                      <div className="relative w-full h-full p-12">
                        <div className="h-full w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
                          <div className="h-8 w-1/3 bg-gray-100 rounded-lg"></div>
                          <div className="h-32 w-full bg-gray-50 rounded-lg border border-dashed border-gray-200"></div>
                          <div className="flex gap-2">
                            <div className="h-8 w-8 rounded-full bg-yellow-primary/20"></div>
                            <div className="h-8 w-full bg-gray-100 rounded-lg"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    {index % 3 === 2 && (
                      <div className="relative flex gap-4">
                        <div className="w-16 h-32 bg-gray-900 rounded-lg shadow-xl translate-y-4"></div>
                        <div className="w-16 h-32 bg-yellow-primary rounded-lg shadow-xl -translate-y-4"></div>
                        <div className="w-16 h-32 bg-gray-200 rounded-lg shadow-xl translate-y-4"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Spacer div to ensure enough scroll space for the sticky effect */}
              <div className="h-8 lg:h-12 w-full"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases Section */}
      {useCases && useCases.length > 0 && (
        <section className="mb-20">
          <h2 className="mb-12 text-center text-3xl font-bold">
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
              Tell us about your requirements for {title}.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 md:p-8">
            <ContactForm serviceName={title} />
          </div>
        </div>
      </section>
    </div>
  );
}
