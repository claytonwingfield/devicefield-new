"use client";

import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface BadgeAlertIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BadgeAlertIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const BadgeAlertIcon = forwardRef<BadgeAlertIconHandle, BadgeAlertIconProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <div
        ref={ref as any}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <motion.div
          whileHover={{
            scale: [1, 1.2, 1],
            rotate: [0, -5, 5, 0],
            transition: { duration: 0.4 },
          }}
          className="flex items-center justify-center"
        >
          <AlertCircle size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

BadgeAlertIcon.displayName = "BadgeAlertIcon";

export { BadgeAlertIcon };
