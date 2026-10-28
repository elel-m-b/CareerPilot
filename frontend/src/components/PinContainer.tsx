import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";

/**
 * An interactive 3D "pin" card.
 *
 * The card sits inside a perspective plane and tilts back (`rotateX`) when the
 * pointer enters, springing flat again on leave. A set of perspective rings and
 * light beams animate behind it to sell the depth. The whole surface is a single
 * link, so a click anywhere on the card opens `href` in a new tab.
 *
 * Colour is drawn entirely from the theme tokens (`foreground`, `border`,
 * `success`), so the effect reads correctly in both the light and dark themes
 * instead of assuming a black background. Framer's `MotionConfig
 * reducedMotion="user"` (set at the app root) governs the animations.
 */
export function PinContainer({
  children,
  title,
  href = "/",
  className,
  containerClassName,
}: {
  children: ReactNode;
  title?: string;
  href?: string;
  className?: string;
  containerClassName?: string;
}) {
  const [transform, setTransform] = useState("translate(-50%,-50%) rotateX(0deg) scale(1)");

  const onMouseEnter = () => setTransform("translate(-50%,-50%) rotateX(40deg) scale(0.8)");
  const onMouseLeave = () => setTransform("translate(-50%,-50%) rotateX(0deg) scale(1)");

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn("group/pin relative z-50 cursor-pointer", containerClassName)}
    >
      <div
        style={{ perspective: "1000px", transform: "rotateX(70deg) translateZ(0deg)" }}
        className="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2"
      >
        <div
          style={{ transform }}
          className="absolute left-1/2 top-1/2 flex items-start justify-start overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[0_8px_16px_rgb(0_0_0/0.15)] transition duration-700 ease-out group-hover/pin:border-foreground/25 dark:shadow-[0_8px_16px_rgb(0_0_0/0.5)]"
        >
          <div className={cn("relative z-50", className)}>{children}</div>
        </div>
      </div>
      <PinPerspective title={title} />
    </a>
  );
}

/**
 * The decorative layer behind the pin: the label pill that announces the link,
 * three staggered rings that pulse outward on the perspective plane, and the
 * vertical light beams rising from the base. Purely visual — the clickable
 * surface is the parent link.
 */
export function PinPerspective({ title }: { title?: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none z-[60] flex h-80 w-96 items-center justify-center opacity-0 transition duration-500 group-hover/pin:opacity-100"
    >
      <div className="inset-0 -mt-7 h-full w-full flex-none">
        {/* Link label */}
        <div className="absolute inset-x-0 top-0 flex justify-center">
          <span className="relative z-10 flex items-center space-x-2 rounded-full bg-foreground px-4 py-0.5 ring-1 ring-border">
            <span className="relative z-20 inline-block py-0.5 text-xs font-bold text-background">
              {title}
            </span>
            <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-linear-to-r from-success/0 via-success to-success/0 transition-opacity duration-500" />
          </span>
        </div>

        {/* Pulsing perspective rings */}
        <div
          style={{ perspective: "1000px", transform: "rotateX(70deg) translateZ(0)" }}
          className="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2"
        >
          {[0, 2, 4].map((delay) => (
            <motion.div
              key={delay}
              initial={{ opacity: 0, scale: 0, x: "-50%", y: "-50%" }}
              animate={{ opacity: [0, 1, 0.5, 0], scale: 1, z: 0 }}
              transition={{ duration: 6, repeat: Infinity, delay }}
              className="absolute left-1/2 top-1/2 h-[11.25rem] w-[11.25rem] rounded-[50%] bg-foreground/[0.06] shadow-[0_8px_16px_rgb(0_0_0/0.2)]"
            />
          ))}
        </div>

        {/* Base light beams */}
        <div className="absolute bottom-1/2 right-1/2 h-20 w-px translate-y-[14px] bg-linear-to-b from-transparent to-success/60 blur-[2px] transition-all duration-500 group-hover/pin:h-40" />
        <div className="absolute bottom-1/2 right-1/2 h-20 w-px translate-y-[14px] bg-linear-to-b from-transparent to-success/60 transition-all duration-500 group-hover/pin:h-40" />
        <div className="absolute bottom-1/2 right-1/2 h-[4px] w-[4px] translate-x-[1.5px] translate-y-[14px] rounded-full bg-success/80 blur-[3px]" />
        <div className="absolute bottom-1/2 right-1/2 h-[2px] w-[2px] translate-x-[0.5px] translate-y-[14px] rounded-full bg-success" />
      </div>
    </div>
  );
}
