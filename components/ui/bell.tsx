"use client";

import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface BellIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BellIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const BellIcon = forwardRef<BellIconHandle, BellIconProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <div
        ref={ref as any}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <motion.div
          whileHover={{
            rotate: [0, -10, 10, -10, 0],
            transition: { duration: 0.5 },
          }}
          className="flex items-center justify-center"
        >
          <Bell size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

BellIcon.displayName = "BellIcon";

export { BellIcon };
