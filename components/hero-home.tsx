"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import WebsiteAnimation from "./websiteAnimation";

export default function HeroHome() {
  const { scrollY } = useScroll();

  // Animation Logic
  // Opacity: Fades out completely after scrolling 300px
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Movement: Clouds move outwards by 200px as you scroll
  const xLeft = useTransform(scrollY, [0, 400], [0, -200]);
  const xRight = useTransform(scrollY, [0, 400], [0, 200]);

  return (
    // REMOVED: lg:mb-12 mb-16 (This was causing the white bar)
    // CHANGED: bg-gradient to be slightly stronger blue at the top
    <section className="relative overflow-hidden min-h-[800px] bg-gradient-to-b from-blue-50 to-transparent">
      {/* --- BACKGROUND LAYERS --- */}

      {/* 1. Dark Fade from Bottom
          CHANGED: Reduced height to h-[50%] so it fades to blue quicker.
          CHANGED: Adjusted gradient stops for a smoother but faster transition.
      */}
      <div className="absolute bottom-0 left-0 right-0 h-[100%] bg-gradient-to-t from-black via-blue-500/90 to-blue-500 -z-20" />

      {/* 2. Star Sprinkles (Visible in the dark area) */}
      <div className="absolute bottom-0 left-0 right-0 h-[50%] overflow-hidden -z-10 opacity-80 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="star-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Static random stars */}
          <circle
            cx="10%"
            cy="80%"
            r="2"
            fill="white"
            className="animate-pulse"
            style={{ animationDuration: "3s" }}
          />
          <circle cx="20%" cy="60%" r="1.5" fill="white" />
          <circle
            cx="35%"
            cy="85%"
            r="2"
            fill="white"
            className="animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <circle cx="50%" cy="75%" r="1" fill="white" />
          <circle
            cx="65%"
            cy="55%"
            r="1.5"
            fill="white"
            className="animate-pulse"
            style={{ animationDuration: "5s" }}
          />
          <circle cx="80%" cy="85%" r="2" fill="white" />
          <circle cx="90%" cy="65%" r="1.5" fill="white" />
          <circle cx="15%" cy="90%" r="1" fill="white" />
          <circle cx="45%" cy="95%" r="1.5" fill="white" />
          <circle
            cx="75%"
            cy="92%"
            r="2"
            fill="white"
            className="animate-pulse"
            style={{ animationDuration: "2s" }}
          />
          {/* Tiny dust sprinkles */}
          <circle cx="5%" cy="70%" r="0.5" fill="gray" />
          <circle cx="25%" cy="50%" r="0.5" fill="gray" />
          <circle cx="55%" cy="60%" r="0.5" fill="gray" />
          <circle cx="85%" cy="55%" r="0.5" fill="gray" />
        </svg>
      </div>

      {/* --- Cloud Background Layer --- */}
      <div className="absolute inset-0 w-full h-full pointer-events-none -z-10">
        {/* Left Cloud */}
        <motion.div
          style={{ opacity, x: xLeft }}
          className="absolute top-0 -left-20 md:left-0 w-[500px] md:w-[800px] h-full"
        >
          <Image
            src="/images/cloud_left.avif"
            alt="Cloud Background Left"
            fill
            className="object-contain object-left-top drop-shadow-2xl brightness-105 contrast-110"
            priority
          />
        </motion.div>

        {/* Right Cloud */}
        <motion.div
          style={{ opacity, x: xRight }}
          className="absolute top-0 -right-20 md:right-0 w-[500px] md:w-[800px] h-full"
        >
          <Image
            src="/images/cloud_right.avif"
            alt="Cloud Background Right"
            fill
            className="object-contain object-right-top drop-shadow-2xl brightness-105 contrast-110"
            priority
          />
        </motion.div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        {/* Hero content */}
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          {/* Section header */}
          <div className="text-center">
            <h1
              className="mb-6 text-5xl font-bold md:text-6xl text-gray-900"
              data-aos="zoom-y-out"
              data-aos-delay={150}
            >
              Your partner <br className="max-lg:hidden" />
              in digital creation
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="text-lg text-gray-700 mb-8"
                data-aos="zoom-y-out"
                data-aos-delay={300}
              >
                Designing, building, and maintaining the digital platforms you
                need.
              </p>

              {/* Lottie Animation Container */}
              {/* <div
                className="mx-auto max-w-md mt-8 relative"
                data-aos="zoom-y-out"
                data-aos-delay={600}
              >
                <div className="aspect-video w-full relative">
                  <WebsiteAnimation />
                </div>
              </div> */}

              {/* Buttons */}
              <div className="relative mt-8">
                <div
                  className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center"
                  data-aos="zoom-y-out"
                  data-aos-delay={450}
                >
                  <a
                    className="btn group mb-4 w-full bg-white text-black border border-gray-200 shadow hover:bg-gray-50 sm:mb-0 sm:w-auto"
                    href="#0"
                  >
                    <span className="relative inline-flex items-center">
                      Get Started{" "}
                      <span className="ml-1 tracking-normal text-yellow-500 transition-transform group-hover:translate-x-0.5">
                        -&gt;
                      </span>
                    </span>
                  </a>
                  <a
                    className="btn w-full bg-gray-900 text-white shadow hover:bg-gray-800 sm:ml-4 sm:w-auto md:mb-0 mb-24"
                    href="#0"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
