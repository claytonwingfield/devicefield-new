"use client";

import { AtSign } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface AtSignIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AtSignIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const AtSignIcon = forwardRef<AtSignIconHandle, AtSignIconProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <div
        ref={ref as any}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <motion.div
          whileHover={{ rotate: 360, transition: { duration: 0.6 } }}
          className="flex items-center justify-center"
        >
          <AtSign size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

AtSignIcon.displayName = "AtSignIcon";

export { AtSignIcon };
