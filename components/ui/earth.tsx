"use client";

import { Globe } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface EarthIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface EarthIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const EarthIcon = forwardRef<EarthIconHandle, EarthIconProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <div
        ref={ref as any}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <motion.div
          whileHover={{ rotate: 360, transition: { duration: 1 } }}
          className="flex items-center justify-center"
        >
          <Globe size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

EarthIcon.displayName = "EarthIcon";

export { EarthIcon };
