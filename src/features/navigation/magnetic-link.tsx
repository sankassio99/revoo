"use client";

import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { type PointerEvent, type ReactNode, useRef } from "react";

export function MagneticLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduceMotion = useReducedMotion();
  const x = useSpring(0, { stiffness: 100, damping: 20 });
  const y = useSpring(0, { stiffness: 100, damping: 20 });
  const rotate = useTransform(y, [-6, 6], [1.5, -1.5]);

  function handlePointerMove(event: PointerEvent<HTMLAnchorElement>) {
    if (reduceMotion || !ref.current || event.pointerType !== "mouse") return;
    const bounds = ref.current.getBoundingClientRect();
    x.set((event.clientX - bounds.left - bounds.width / 2) * 0.08);
    y.set((event.clientY - bounds.top - bounds.height / 2) * 0.08);
  }

  function resetPosition() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.a
      className={className}
      href={href}
      onPointerLeave={resetPosition}
      onPointerMove={handlePointerMove}
      ref={ref}
      style={{ x, y, rotate }}
    >
      {children}
    </motion.a>
  );
}
