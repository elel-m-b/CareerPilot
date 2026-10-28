import { cn } from "@/lib/utils";
import { motion, stagger, useAnimate, useInView, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

/**
 * Reveals a block of text word by word.
 *
 * Each word starts fully transparent and blurred, then `useAnimate` fades it in
 * and clears the blur, staggered by a fraction of a second so the sentence reads
 * as it resolves. The animation is triggered the first time the block scrolls
 * into view rather than blindly on mount, so text sitting below the fold does not
 * finish animating before anyone can see it.
 *
 * Visitors who asked for reduced motion get the words immediately, unblurred.
 * Colour and typography are left to the caller via `className`, so the effect
 * inherits the current theme instead of assuming a black-on-white layout.
 */
export function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.5,
}: {
  words: string;
  className?: string;
  /** Blur the words in as they appear. Set `false` to fade opacity only. */
  filter?: boolean;
  duration?: number;
}) {
  const [scope, animate] = useAnimate();
  const inView = useInView(scope, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  const wordsArray = words.split(" ");

  useEffect(() => {
    if (!inView) return;
    animate(
      "span",
      { opacity: 1, filter: filter ? "blur(0px)" : "none" },
      {
        duration: reduced ? 0 : duration,
        delay: reduced ? 0 : stagger(0.2),
      },
    );
  }, [inView, animate, filter, duration, reduced]);

  return (
    <motion.div ref={scope} className={className}>
      {wordsArray.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className={cn(
            "inline-block",
            index < wordsArray.length - 1 && "mr-[0.25em]",
          )}
          style={{
            opacity: reduced ? 1 : 0,
            filter: filter && !reduced ? "blur(10px)" : "none",
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}
