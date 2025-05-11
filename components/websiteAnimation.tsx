"use client";

import React, { useState, useEffect } from "react";
import { useLottie } from "lottie-react";

// Replace with the single animation you want to use
const SINGLE_ANIMATION_URL =
  "https://lottie.host/c6b9cb68-71c3-470c-87dc-e198392e6013/AFW3yfRBZi.json";

export default function WebsiteAnimation() {
  // Holds the downloaded JSON animation data
  const [animationData, setAnimationData] = useState<any | null>(null);

  // Fetch the JSON animation once on mount
  useEffect(() => {
    async function fetchAnimation() {
      try {
        const resp = await fetch(SINGLE_ANIMATION_URL);
        const data = await resp.json();
        setAnimationData(data);
      } catch (err) {
        console.error("Error fetching single Lottie animation:", err);
      }
    }
    fetchAnimation();
  }, []);

  // Lottie-react options
  const options = {
    animationData: animationData,
    loop: true, // loop indefinitely
    autoplay: true,
  };

  const lottieStyle = {
    width: "100%",
    height: "100%",
  };

  // Pass our options to the useLottie hook
  const { View } = useLottie(options, lottieStyle);

  // Don’t render anything until the JSON is fetched
  if (!animationData) return null;

  // Render the looping animation
  return <div style={{ width: "100%", height: "100%" }}>{View}</div>;
}
