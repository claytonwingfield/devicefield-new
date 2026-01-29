"use client";

import { PenTool } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface PenToolIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface PenToolIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const PenToolIcon = forwardRef<PenToolIconHandle, PenToolIconProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <div
        ref={ref as any}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <motion.div
          whileHover={{
            rotate: [0, 8, -3, 8, 0],
            transition: { duration: 0.5 },
          }}
          className="flex items-center justify-center"
        >
          <PenTool size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

PenToolIcon.displayName = "PenToolIcon";

export { PenToolIcon };
