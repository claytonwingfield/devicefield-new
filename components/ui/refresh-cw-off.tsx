"use client";

import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface RefreshCWOffIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface RefreshCWOffIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const RefreshCWOffIcon = forwardRef<
  RefreshCWOffIconHandle,
  RefreshCWOffIconProps
>(({ className, size = 24, ...props }, ref) => {
  return (
    <div
      ref={ref as any}
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <motion.div
        whileHover={{ rotate: 180, transition: { duration: 0.5 } }}
        className="flex items-center justify-center"
      >
        <RefreshCw size={size} strokeWidth={2} />
      </motion.div>
    </div>
  );
});

RefreshCWOffIcon.displayName = "RefreshCWOffIcon";

export { RefreshCWOffIcon };
