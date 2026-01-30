"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import WebsiteAnimation from "./websiteAnimation";
import ScheduleModal from "@/components/calender-hero";

// Star configuration array
// r: radius (size), o: opacity, d: duration (animation speed)
const starData = [
  // --- LARGE STARS (Close/Bright) ---
  { cx: "10%", cy: "80%", r: 2.5, o: 1, d: "3s" },
  { cx: "35%", cy: "85%", r: 2.2, o: 0.9, d: "4s" },
  { cx: "65%", cy: "55%", r: 2.5, o: 1, d: "5s" },
  { cx: "75%", cy: "92%", r: 2.0, o: 0.8, d: "2s" },
  { cx: "90%", cy: "65%", r: 2.3, o: 0.9, d: "3.5s" },
  { cx: "5%", cy: "95%", r: 2.0, o: 0.8, d: "4.5s" },
  { cx: "48%", cy: "62%", r: 2.1, o: 1, d: "3s" },

  // --- MEDIUM STARS (Mid-distance) ---
  { cx: "20%", cy: "60%", r: 1.5, o: 0.7, d: "0s" }, // Static
  { cx: "50%", cy: "75%", r: 1.4, o: 0.6, d: "0s" }, // Static
  { cx: "80%", cy: "85%", r: 1.6, o: 0.7, d: "6s" },
  { cx: "15%", cy: "90%", r: 1.5, o: 0.6, d: "0s" },
  { cx: "45%", cy: "95%", r: 1.4, o: 0.7, d: "0s" },
  { cx: "95%", cy: "75%", r: 1.5, o: 0.7, d: "4s" },
  { cx: "25%", cy: "65%", r: 1.3, o: 0.6, d: "0s" },
  { cx: "60%", cy: "88%", r: 1.5, o: 0.8, d: "5s" },

  // --- SMALL STARS (Far away / Dust) ---
  { cx: "5%", cy: "70%", r: 0.8, o: 0.4, d: "0s" },
  { cx: "25%", cy: "50%", r: 0.6, o: 0.3, d: "0s" },
  { cx: "55%", cy: "60%", r: 0.7, o: 0.4, d: "0s" },
  { cx: "85%", cy: "55%", r: 0.8, o: 0.3, d: "0s" },
  { cx: "30%", cy: "95%", r: 0.7, o: 0.4, d: "0s" },
  { cx: "40%", cy: "55%", r: 0.6, o: 0.3, d: "0s" },
  { cx: "70%", cy: "70%", r: 0.9, o: 0.5, d: "0s" },
  { cx: "92%", cy: "90%", r: 0.7, o: 0.4, d: "0s" },
  { cx: "12%", cy: "55%", r: 0.8, o: 0.4, d: "0s" },
  { cx: "38%", cy: "75%", r: 0.6, o: 0.3, d: "0s" },
  { cx: "58%", cy: "52%", r: 0.7, o: 0.4, d: "0s" },
  { cx: "82%", cy: "62%", r: 0.8, o: 0.3, d: "0s" },
];

export default function HeroHome() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const { scrollY } = useScroll();

  // Animation Logic
  // Opacity: Fades out completely after scrolling 300px
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Movement: Clouds move outwards by 200px as you scroll
  const xLeft = useTransform(scrollY, [0, 400], [0, -200]);
  const xRight = useTransform(scrollY, [0, 400], [0, 200]);

  return (
    <section className="relative overflow-hidden min-h-[800px] bg-gradient-to-b from-blue-50 to-transparent">
      {/* --- BACKGROUND LAYERS --- */}

      {/* 1. Dark Fade from Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[100%] bg-gradient-to-t from-black via-blue-500/90 to-blue-500 -z-20" />

      {/* 2. Star Sprinkles (Visible in the dark area) */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] overflow-hidden -z-10 opacity-90 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="star-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Mapping through star data for varied sizes and animations */}
          {starData.map((star, i) => (
            <circle
              key={i}
              cx={star.cx}
              cy={star.cy}
              r={star.r} // Variable size
              fill="white"
              fillOpacity={star.o} // Variable opacity for depth
              className={star.d !== "0s" ? "animate-pulse" : ""}
              style={{
                animationDuration: star.d,
                animationDelay: `${i * 0.2}s`, // Staggered start times so they don't pulse together
              }}
            />
          ))}
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
            unoptimized
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
            unoptimized
          />
        </motion.div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        {/* Hero content */}
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          {/* Section header */}
          <div className="text-center">
            <h1
              className="mb-6 text-5xl font-space font-semibold md:text-6xl text-gray-900"
              data-aos="zoom-y-out"
              data-aos-delay={150}
            >
              Your partner <br className="max-lg:hidden" />
              in digital creation
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="text-lg text-gray-900 mb-8"
                data-aos="zoom-y-out"
                data-aos-delay={300}
              >
                Designing, building, and maintaining the digital platforms you
                need.
              </p>

              {/* Buttons / CTA Section */}
              <div
                className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8"
                data-aos="zoom-y-out"
                data-aos-delay={450}
              >
                {/* 1. Book an Intro Call Button (Animated Text) */}
                <motion.a
                  onClick={() => setIsScheduleOpen(true)}
                  initial="initial"
                  whileHover="hovered"
                  className="group flex items-center rounded-lg bg-black p-1.5 pr-6  transition-all duration-300 hover:ring-white hover:shadow-xl hover:-translate-y-0.5"
                >
                  {/* Avatar Image */}
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10">
                    <Image
                      src="/images/clayton.jpg"
                      alt="Clayton"
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Text Column */}
                  <div className="ml-3 flex flex-col text-left cursor-pointer">
                    {/* Main Label: "Book an intro call" with Snake Animation */}
                    <div
                      className="relative flex h-5 items-start overflow-hidden cursor-pointer"
                      onClick={() => setIsScheduleOpen(true)}
                    >
                      {"Book an intro call".split("").map((letter, i) => (
                        <motion.div
                          key={i}
                          className="relative flex flex-col"
                          variants={{
                            initial: { y: 0 },
                            hovered: { y: "-50%" },
                          }}
                          transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                            delay: 0.025 * i,
                          }}
                        >
                          <span className="flex h-5 items-center text-sm font-semibold text-white leading-tight">
                            {letter === " " ? "\u00A0" : letter}
                          </span>
                          <span className="flex h-5 items-center text-sm font-semibold text-white leading-tight">
                            {letter === " " ? "\u00A0" : letter}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Subtext: Static */}
                    <span className="text-[11px] font-normal text-gray-400">
                      Friendly chat, no pressure
                    </span>
                  </div>
                </motion.a>

                {/* 2. Learn More Text Link (Animated) */}
                <motion.a
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById("services");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  href="#services"
                  initial="initial"
                  whileHover="hovered"
                  className="relative flex h-6 items-start overflow-hidden font-medium text-gray-900"
                >
                  {"Learn More".split("").map((letter, i) => (
                    <motion.div
                      key={i}
                      className="relative flex flex-col"
                      variants={{
                        initial: { y: 0 },
                        hovered: { y: "-50%" },
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                        delay: 0.025 * i,
                      }}
                    >
                      <span className="flex h-6 items-center">
                        {letter === " " ? "\u00A0" : letter}
                      </span>
                      <span className="flex h-6 items-center">
                        {letter === " " ? "\u00A0" : letter}
                      </span>
                    </motion.div>
                  ))}
                </motion.a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
      />
    </section>
  );
}
