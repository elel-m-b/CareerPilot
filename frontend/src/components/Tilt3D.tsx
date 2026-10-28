import { cn } from "@/lib/utils";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

/** Springy, but not bouncy: the lean trails the cursor instead of snapping. */
const SPRING = { stiffness: 150, damping: 20, mass: 0.7 } as const;

/**
 * Turns a flat panel into a softly-lit 3D object.
 *
 * The panel sits in its own perspective context and leans toward the pointer on
 * a spring. Depth is sold by a few stacked planes behind the face (they read as
 * the material's thickness at the edges), a specular sheen that trails the
 * pointer, a contact shadow that slides the opposite way, and an optional idle
 * float.
 *
 * Everything is tunable because the right numbers depend on the shape: a small
 * portrait card can lean 7° into a 1200px perspective, while a wide, text-heavy
 * slab needs a gentler lean and a longer perspective or the far edge shears and
 * the type softens. Keep `maxTilt` small for anything the visitor has to read.
 *
 * Only `transform` and `opacity` are animated, so the work stays on the
 * compositor and the panel never triggers layout. The effect is disabled for
 * touch-only devices and for visitors who asked for reduced motion, and because
 * the panel's contents remain ordinary DOM (no canvas), it renders exactly as
 * before on anything without 3D transform support.
 */
export function Tilt3DStage({
  children,
  className,
  maxTilt = 7,
  perspective = 1200,
  depth = 36,
  float = 6,
  lift = 28,
  hoverScale = 1.012,
}: {
  children: ReactNode;
  className?: string;
  /** Peak lean, in degrees, at the edge of the panel. */
  maxTilt?: number;
  /** CSS perspective distance in px. Larger is flatter and less distorted. */
  perspective?: number;
  /** Farthest thickness plane, in px. `0` drops the stacked planes entirely. */
  depth?: number;
  /** Idle float amplitude in px. `0` keeps the panel still. */
  float?: number;
  /** Forward travel on hover, in px. */
  lift?: number;
  hoverScale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);

  // Pointer-driven tilt is only meaningful with a precise, hovering cursor.
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFinePointer(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Pointer position normalised to -1…1 across the panel.
  const px = useSpring(0, SPRING);
  const py = useSpring(0, SPRING);

  const rotateY = useTransform(px, [-1, 1], [-maxTilt, maxTilt]);
  const rotateX = useTransform(py, [-1, 1], [maxTilt, -maxTilt]);
  const sheenX = useTransform(px, [-1, 1], [-34, 34]);
  const sheenY = useTransform(py, [-1, 1], [-26, 26]);
  const shadowX = useTransform(px, [-1, 1], [18, -18]);

  const interactive = finePointer && !reduced;
  const showThickness = depth > 0;

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!interactive || !node) return;
    const rect = node.getBoundingClientRect();
    px.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    py.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const reset = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      className={cn("relative", className)}
      style={{ perspective: `${perspective}px` }}
    >
      {/* Reflection pool cast onto the surface the panel floats above. */}
      <motion.div
        aria-hidden
        style={{ x: shadowX }}
        className="pointer-events-none absolute inset-x-10 -bottom-7 h-10 rounded-[50%] bg-foreground/[0.05] blur-2xl"
      />
      {/* Contact shadow — always dark, so it stays a shadow in dark mode too. */}
      <motion.div
        aria-hidden
        style={{ x: shadowX }}
        className="pointer-events-none absolute inset-x-16 -bottom-4 h-6 rounded-[50%] bg-black/25 blur-xl dark:bg-black/60"
      />

      <motion.div
        animate={reduced || float <= 0 ? { y: 0 } : { y: [0, -float, 0] }}
        whileHover={interactive ? { z: lift, scale: hoverScale } : undefined}
        transition={{
          y: { duration: 7, repeat: reduced || float <= 0 ? 0 : Infinity, ease: "easeInOut" },
          default: { type: "spring", stiffness: 170, damping: 22 },
        }}
        style={{
          rotateX: interactive ? rotateX : 0,
          rotateY: interactive ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        className="relative [transform-style:preserve-3d]"
      >
        {/* Material thickness. The offsets stay larger than the depth so a sliver
            remains visible after the perspective foreshortens each plane. */}
        {showThickness && (
          <>
            <div
              aria-hidden
              className="absolute inset-0 rounded-md border border-border bg-card/80"
              style={{
                transform: `translate3d(${depth * 0.28}px, ${depth * 0.28}px, ${-depth / 2}px)`,
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 rounded-md border border-border/60 bg-card/45"
              style={{
                transform: `translate3d(${depth * 0.56}px, ${depth * 0.56}px, ${-depth}px)`,
              }}
            />
          </>
        )}

        <div className="relative overflow-hidden rounded-md [transform:translateZ(0px)]">
          {children}

          {/* Specular sheen that trails the pointer. */}
          <motion.div
            aria-hidden
            style={{ x: sheenX, y: sheenY }}
            className="pointer-events-none absolute -left-10 -top-12 h-44 w-44 rounded-full bg-foreground/[0.06] blur-3xl"
          />
          {/* Hairline catch-light along the top edge. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-foreground/25 to-transparent"
          />
        </div>
      </motion.div>
    </div>
  );
}
