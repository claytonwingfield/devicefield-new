"use client";

import { GitBranch } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface GitBranchIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface GitBranchIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const GitBranchIcon = forwardRef<GitBranchIconHandle, GitBranchIconProps>(
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
          <GitBranch size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

GitBranchIcon.displayName = "GitBranchIcon";

export { GitBranchIcon };
