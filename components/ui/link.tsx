"use client";

import { Link } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface LinkIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface LinkIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const LinkIcon = forwardRef<LinkIconHandle, LinkIconProps>(
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
          <Link size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

LinkIcon.displayName = "LinkIcon";

export { LinkIcon };
