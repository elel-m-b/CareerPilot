import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  type Variants,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Shared motion primitives for the marketing page.
 *
 * Everything here is deliberately cheap: transforms and opacity only, short
 * durations, and `once: true` on every viewport trigger so scroll animations
 * never re-run or fight the user for attention. Reduced-motion handling is
 * centralised in `<MotionConfig reducedMotion="user">` on the page plus an
 * explicit check in `CountUp`, which animates a value rather than a transform.
 */

/** One easing curve for every entrance, so the page feels like a single system. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Runs once, a little before the element is fully in view. */
export const VIEWPORT = { once: true, margin: "-80px" } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Container variants that hand control to its children in sequence. */
export function staggerContainer(stagger = 0.07, delay = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
}

/** Fades and lifts a block into view the first time it is scrolled to. */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 18,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Counts a number up the first time it scrolls into view, then animates from the
 * value already on screen whenever the number changes — so a live statistic
 * ticks to its new value instead of resetting to zero. Visitors who asked for
 * reduced motion see the final value immediately.
 */
export function CountUp({
  to,
  duration = 1.2,
  className,
}: {
  to: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  /** Where the next animation starts, so mid-flight updates stay continuous. */
  const from = useRef(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      from.current = to;
      setValue(to);
      return;
    }
    const controls = animate(from.current, to, {
      duration,
      ease: EASE,
      onUpdate: (latest) => {
        from.current = latest;
        setValue(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [inView, to, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}

/**
 * Hairline reading-progress bar for the sticky header. Driven by a spring, so it
 * settles smoothly instead of snapping on every wheel tick.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="absolute inset-x-0 bottom-0 h-px origin-left bg-foreground/40"
    />
  );
}
