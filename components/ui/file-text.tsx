"use client";

import { FileText } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface FileTextIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FileTextIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const FileTextIcon = forwardRef<FileTextIconHandle, FileTextIconProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <div
        ref={ref as any}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <motion.div
          whileHover={{ scale: [1, 1.05, 1], transition: { duration: 0.3 } }}
          className="flex items-center justify-center"
        >
          <FileText size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

FileTextIcon.displayName = "FileTextIcon";

export { FileTextIcon };
