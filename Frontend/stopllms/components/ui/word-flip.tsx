"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type Props = {
  words: string[];
  interval?: number; // ms
  className?: string;
};

export default function WordFlip({ words, interval = 2500, className }: Props) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [interval, words.length]);

  const word = words[i];

  return (
    <span
      className={className}
      style={{ display: "inline-block", perspective: 1000 }}
      aria-live="polite"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={word}
          initial={reduce ? { opacity: 0 } : { rotateX: 90, opacity: 0, y: -4 }}
          animate={reduce ? { opacity: 1 } : { rotateX: 0, opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { rotateX: -90, opacity: 0, y: 4 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block bg-linear-to-r from-brand to-brand-foreground bg-clip-text text-transparent"
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
