"use client";

import { CloudCog } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface CloudCogIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CloudCogIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const CloudCogIcon = forwardRef<CloudCogIconHandle, CloudCogIconProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <div
        ref={ref as any}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <motion.div
          whileHover={{ rotate: 180, transition: { duration: 0.6 } }}
          className="flex items-center justify-center"
        >
          <CloudCog size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

CloudCogIcon.displayName = "CloudCogIcon";

export { CloudCogIcon };
