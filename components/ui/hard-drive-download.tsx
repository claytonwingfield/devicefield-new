"use client";

import { HardDriveDownload } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface HardDriveDownloadIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface HardDriveDownloadIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const HardDriveDownloadIcon = forwardRef<
  HardDriveDownloadIconHandle,
  HardDriveDownloadIconProps
>(({ className, size = 24, ...props }, ref) => {
  return (
    <div
      ref={ref as any}
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <motion.div
        whileHover={{ y: [0, 3, 0], transition: { duration: 0.4 } }}
        className="flex items-center justify-center"
      >
        <HardDriveDownload size={size} strokeWidth={2} />
      </motion.div>
    </div>
  );
});

HardDriveDownloadIcon.displayName = "HardDriveDownloadIcon";

export { HardDriveDownloadIcon };
