"use client";

import { LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface GalleryThumbnailsIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface GalleryThumbnailsIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const GalleryThumbnailsIcon = forwardRef<
  GalleryThumbnailsIconHandle,
  GalleryThumbnailsIconProps
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
        <LayoutGrid size={size} strokeWidth={2} />
      </motion.div>
    </div>
  );
});

GalleryThumbnailsIcon.displayName = "GalleryThumbnailsIcon";

export { GalleryThumbnailsIcon };
