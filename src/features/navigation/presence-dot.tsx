"use client";

import { motion, useReducedMotion } from "framer-motion";
import { memo } from "react";

export const PresenceDot = memo(function PresenceDot({ className = "" }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      animate={reduceMotion ? undefined : { scale: [1, 1.16, 1], opacity: [0.8, 1, 0.8] }}
      aria-hidden="true"
      className={`inline-block size-2 rounded-full bg-accent ${className}`}
      transition={
        reduceMotion
          ? undefined
          : { type: "spring", stiffness: 100, damping: 20, duration: 2.4, repeat: Infinity }
      }
    />
  );
});
