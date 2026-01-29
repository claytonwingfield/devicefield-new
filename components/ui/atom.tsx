"use client";

import { Atom } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface AtomIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AtomIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const AtomIcon = forwardRef<AtomIconHandle, AtomIconProps>(
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
          <Atom size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

AtomIcon.displayName = "AtomIcon";

export { AtomIcon };
