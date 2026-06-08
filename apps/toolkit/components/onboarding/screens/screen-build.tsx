"use client";

import { useEffect, useState } from "react";
import styles from "@/components/onboarding/onboarding.module.css";
import { cn } from "@/lib/utils";

const BUILD_ROWS = [
  "Reading your direction",
  "Choosing your morning",
  "Shaping the first action",
  "Setting today's opening scene",
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

// Humane labor illusion: rows check in one at a time, then it advances itself.
export function ScreenBuild({ onDone }: { onDone: () => void }) {
  const [onCount, setOnCount] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BUILD_ROWS.forEach((_, i) => {
      timers.push(
        setTimeout(() => setOnCount((c) => Math.max(c, i + 1)), 500 + i * 620),
      );
    });
    timers.push(setTimeout(onDone, 500 + BUILD_ROWS.length * 620 + 700));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <section className={styles.screen}>
      <div className={styles.build}>
        <div className={styles.eyebrow}>Almost there</div>
        <h2 className={styles.q}>
          Your harbor is <em>taking shape.</em>
        </h2>
        <div className={styles.blist}>
          {BUILD_ROWS.map((row, i) => (
            <div
              key={row}
              className={cn(styles.brow, i < onCount && styles.browOn)}
            >
              <span className={styles.dot}>
                <CheckIcon />
              </span>
              <span>{row}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
