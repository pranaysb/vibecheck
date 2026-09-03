"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export function FlipWords({
  words,
  duration = 2400,
  className,
}: {
  words: string[];
  duration?: number;
  className?: string;
}) {
  const [currentWord, setCurrentWord] = useState(words[0]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % words.length;
      setCurrentWord(words[i]);
    }, duration);

    return () => clearInterval(interval);
  }, [words, duration]);

  return (
    <span className="inline-block relative overflow-hidden align-baseline">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentWord}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className={cn(
            "inline-block font-extrabold text-indigo-600 underline decoration-indigo-300 decoration-wavy decoration-2 underline-offset-4",
            className
          )}
        >
          {currentWord}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
