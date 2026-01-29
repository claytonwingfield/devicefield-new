"use client";

import { Video } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface CctvIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CctvIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const CctvIcon = forwardRef<CctvIconHandle, CctvIconProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <div
        ref={ref as any}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <motion.div
          whileHover={{ scale: [1, 1.1, 1], transition: { duration: 0.3 } }}
          className="flex items-center justify-center"
        >
          <Video size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

CctvIcon.displayName = "CctvIcon";

export { CctvIcon };
