"use client";

import { FolderCog } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface FolderCogIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FolderCogIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const FolderCogIcon = forwardRef<FolderCogIconHandle, FolderCogIconProps>(
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
          <FolderCog size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

FolderCogIcon.displayName = "FolderCogIcon";

export { FolderCogIcon };
