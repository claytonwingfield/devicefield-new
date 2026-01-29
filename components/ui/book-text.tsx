"use client";

import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface BookTextIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BookTextIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const BookTextIcon = forwardRef<BookTextIconHandle, BookTextIconProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <div
        ref={ref as any}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <motion.div
          whileHover={{
            rotateY: [0, 10, -10, 0],
            transition: { duration: 0.4 },
          }}
          className="flex items-center justify-center"
        >
          <BookOpen size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

BookTextIcon.displayName = "BookTextIcon";

export { BookTextIcon };
