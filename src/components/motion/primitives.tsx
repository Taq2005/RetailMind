import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import Lenis from "lenis";
import { cn } from "@/lib/utils";

export const ease = [0.22, 1, 0.36, 1] as const;

/** Global smooth scrolling. Skipped when the user prefers reduced motion. */
export function SmoothScroll() {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 3), smoothWheel: true, anchors: true });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [reduce]);
  return null;
}

/** Thin progress bar pinned to the top of the viewport. */
export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 32, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className={cn("fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-ink-500 via-ink-700 to-amber-signal", className)}
    />
  );
}

const stagger = (gap = 0.07, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});
const child: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

/** Container that staggers its <Item> children when scrolled into view. */
export function Stagger({ gap, delay, className, children, once = true, ...rest }: HTMLMotionProps<"div"> & { gap?: number; delay?: number; once?: boolean }) {
  return (
    <motion.div variants={stagger(gap, delay)} initial="hidden" whileInView="show" viewport={{ once, margin: "-8% 0px" }} className={className} {...rest}>
      {children}
    </motion.div>
  );
}
export function Item({ className, children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={child} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

/** Single-element reveal on scroll. */
export function Reveal({ className, children, delay = 0, y = 16, ...rest }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.6, ease, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Number that counts up when scrolled into view and re-tweens when `value` changes. */
export function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString("en-US"),
  duration = 1.4,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const [text, setText] = useState(() => format(0));
  const started = useRef(false);

  useEffect(() => {
    const unsub = mv.on("change", (v) => setText(format(v)));
    return unsub;
  }, [mv, format]);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      mv.set(value);
      setText(format(value));
      return;
    }
    const controls = animate(mv, value, { duration: started.current ? 0.7 : duration, ease });
    started.current = true;
    return () => controls.stop();
  }, [inView, value, duration, mv, reduce, format]);

  return (
    <span ref={ref} className={cn("num", className)}>
      {text}
    </span>
  );
}

/** Pulsing status dot. */
export function StatusDot({ tone, pulse = true }: { tone: "good" | "info" | "bad" | "idle"; pulse?: boolean }) {
  const colors = { good: "bg-emerald-500", info: "bg-ink-500", bad: "bg-rose-500", idle: "bg-slate-400" } as const;
  return (
    <span className="relative inline-flex h-2 w-2">
      {pulse && tone !== "idle" && <span className={cn("absolute inset-0 rounded-full animate-pulse-ring", colors[tone])} />}
      <span className={cn("relative h-2 w-2 rounded-full", colors[tone])} />
    </span>
  );
}

/** Skeleton shimmer block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-slate-100", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

/** Renders children after a short delay so charts get a skeleton on first paint. */
export function useReady(ms = 450) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return ready;
}
