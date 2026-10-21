import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { formatNumber } from "../lib/format";

export function CountUp({ value, digits = 0, suffix = "" }: { value: number; digits?: number; suffix?: string }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const duration = 900;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduce, value]);

  return (
    <span ref={ref}>
      {formatNumber(display, digits)}
      {suffix}
    </span>
  );
}
