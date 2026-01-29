"use client";

import { Files } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface FileStackIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FileStackIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const FileStackIcon = forwardRef<FileStackIconHandle, FileStackIconProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <div
        ref={ref as any}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <motion.div
          whileHover={{ y: [0, -2, 0], transition: { duration: 0.4 } }}
          className="flex items-center justify-center"
        >
          <Files size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

FileStackIcon.displayName = "FileStackIcon";

export { FileStackIcon };
