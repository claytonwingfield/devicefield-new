"use client";

import { ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface CartIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CartIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const CartIcon = forwardRef<CartIconHandle, CartIconProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <div
        ref={ref as any}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <motion.div
          whileHover={{
            rotate: [0, -10, 10, 0],
            transition: { duration: 0.4 },
          }}
          className="flex items-center justify-center"
        >
          <ShoppingCart size={size} strokeWidth={2} />
        </motion.div>
      </div>
    );
  },
);

CartIcon.displayName = "CartIcon";

export { CartIcon };
