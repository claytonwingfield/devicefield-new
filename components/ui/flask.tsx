"use client";

import { FlaskConical } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface FlaskIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FlaskIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const FlaskIcon = forwardRef<FlaskIconHandle, FlaskIconProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <div
        ref={ref as any}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <motion.div
          whileHover={{ rotate: [0, 5, -5, 0], transition: { duration: 0.4 } }}
          className="flex items-center justify-center"
        >
          <FlaskConical size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

FlaskIcon.displayName = "FlaskIcon";

export { FlaskIcon };
