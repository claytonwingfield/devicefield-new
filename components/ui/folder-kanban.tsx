"use client";

import { FolderKanban } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface FolderKanbanIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FolderKanbanIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const FolderKanbanIcon = forwardRef<
  FolderKanbanIconHandle,
  FolderKanbanIconProps
>(({ className, size = 24, ...props }, ref) => {
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
        <FolderKanban size={size} strokeWidth={2} />
      </motion.div>
    </div>
  );
});

FolderKanbanIcon.displayName = "FolderKanbanIcon";

export { FolderKanbanIcon };
