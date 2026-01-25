export const metadata = {
  title: "Devicefield",
  description: "Your partner in digital creation",
};

import Hero from "@/components/hero-home";

import FeaturesPlanet from "@/components/features-planet";
import LargeTestimonial from "@/components/large-testimonial";

export default function Home() {
  return (
    <>
      {/* <div className="snap-y snap-mandatory overflow-y-scroll overflow-x-hidden h-screen w-full scroll-smooth"> */}
      {/* Hero Section - Snaps on Scroll Up */}
      {/* <div className="snap-end w-full"> */}
      <Hero />
      {/* </div> */}

      {/* FeaturesPlanet Section - Snaps on Scroll Down */}
      {/* <div className="snap-start w-full"> */}
      <FeaturesPlanet />
      {/* </div> */}

      {/* Business Categories Section - No Snap */}

      {/* <LargeTestimonial /> */}
      {/* </div> */}
    </>
  );
}
