"use client";

import dynamic from "next/dynamic";

const Hero = dynamic(() => import("@/components/hero-home"), { ssr: false });
const FeaturesPlanet = dynamic(() => import("@/components/features-planet"), {
  ssr: false,
});

export default function HomeContent() {
  return (
    <>
      <Hero />
      <FeaturesPlanet />
    </>
  );
}
