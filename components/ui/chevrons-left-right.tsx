"use client";

import { ChevronsLeftRight } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface ChevronsLeftRightIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ChevronsLeftRightIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const ChevronsLeftRightIcon = forwardRef<
  ChevronsLeftRightIconHandle,
  ChevronsLeftRightIconProps
>(({ className, size = 24, ...props }, ref) => {
  return (
    <div
      ref={ref as any}
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <motion.div
        whileHover={{ x: [0, -3, 3, 0], transition: { duration: 0.4 } }}
        className="flex items-center justify-center"
      >
        <ChevronsLeftRight size={size} strokeWidth={2} />
      </motion.div>
    </div>
  );
});

ChevronsLeftRightIcon.displayName = "ChevronsLeftRightIcon";

export { ChevronsLeftRightIcon };
