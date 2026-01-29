"use client";

import { useState, useEffect } from "react";
import Lottie from "lottie-react";

interface LoadingAnimationProps {
  className?: string;
  fallback?: React.ReactNode;
}

export default function LoadingAnimation({
  className = "h-12 w-12",
  fallback = null,
}: LoadingAnimationProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    fetch("/images/loading.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(() => {});
  }, []);

  if (!animationData) return <>{fallback}</>;
  return (
    <Lottie
      animationData={animationData}
      loop
      className={className}
      aria-hidden
    />
  );
}
