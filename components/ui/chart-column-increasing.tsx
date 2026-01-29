"use client";

import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface ChartColumnIncreasingIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ChartColumnIncreasingIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const ChartColumnIncreasingIcon = forwardRef<
  ChartColumnIncreasingIconHandle,
  ChartColumnIncreasingIconProps
>(({ className, size = 24, ...props }, ref) => {
  return (
    <div
      ref={ref as any}
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <motion.div
        whileHover={{ y: [0, -3, 0], transition: { duration: 0.4 } }}
        className="flex items-center justify-center"
      >
        <BarChart3 size={size} strokeWidth={2} />
      </motion.div>
    </div>
  );
});

ChartColumnIncreasingIcon.displayName = "ChartColumnIncreasingIcon";

export { ChartColumnIncreasingIcon };
