"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import PageIllustration from "@/components/page-illustration";
import BusinessCategories from "@/components/business-categories";

const WebsiteAnimation = dynamic(() => import("./websiteAnimation"), {
  ssr: false,
});

export default function HeroHome() {
  return (
    <section className="relative lg:mb-12 mb-16">
      <PageIllustration />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          {/* Section header */}
          <div className=" text-center">
            <h1
              className="mb-6 border-y text-5xl font-bold [border-image:linear-gradient(to_right,transparent,theme(colors.slate.300/.8),transparent)1] md:text-6xl"
              data-aos="zoom-y-out"
              data-aos-delay={150}
            >
              Your partner <br className="max-lg:hidden" />
              in digital creation
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className=" text-lg text-gray-700"
                data-aos="zoom-y-out"
                data-aos-delay={300}
              >
                Designing, building, and maintaining the digital platforms you
                need.
              </p>
              <div
                className="mx-auto max-w-md"
                data-aos="zoom-y-out"
                data-aos-delay={600}
              >
                <div className="aspect-video w-full relative">
                  <WebsiteAnimation />
                </div>
              </div>
              <div className="relative before:absolute before:inset-0 before:border-y before:[border-image:linear-gradient(to_right,transparent,theme(colors.slate.300/.8),transparent)1]">
                <div
                  className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center"
                  data-aos="zoom-y-out"
                  data-aos-delay={450}
                >
                  <Link
                    className="btn group mb-4 w-full bg-gradient-to-t from-black to-gray-900  bg-[length:100%_100%] bg-[bottom] text-white shadow hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                    href="/get-started"
                  >
                    <span className="relative inline-flex items-center ">
                      Get Started{" "}
                      <span className="ml-1 tracking-normal text-yellow-primary transition-transform group-hover:translate-x-0.5">
                        -&gt;
                      </span>
                    </span>
                  </Link>
                  <a
                    className="btn w-full bg-white text-gray-800 shadow hover:bg-gray-50 sm:ml-4 sm:w-auto"
                    href="#services"
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById("services");
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          </div>
          {/* Hero image */}
        </div>
      </div>
    </section>
  );
}
