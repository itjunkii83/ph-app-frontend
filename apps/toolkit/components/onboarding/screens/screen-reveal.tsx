"use client";

import { useEffect, useRef, useState } from "react";
import {
  REVEAL_AUTHOR,
  REVEAL_QUOTE,
} from "@/components/onboarding/constants";
import styles from "@/components/onboarding/onboarding.module.css";
import { cn } from "@/lib/utils";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function ScreenReveal({
  onEnter,
  onReset,
}: {
  onEnter: () => void;
  onReset: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [playLabel, setPlayLabel] = useState("Play today's hype");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function play() {
    setPlaying(true);
    setPlayLabel("Now playing");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPlaying(false);
      setPlayLabel("Play again");
    }, 8000);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <section className={cn(styles.screen, styles.reveal)}>
      <div className={cn(styles.film, playing && styles.filmPlaying)}>
        <div className={styles.filmBg} />
        <div className={styles.filmVeil} />
        <div className={styles.filmInner}>
          <div className={styles.filmQ}>
            <div className={styles.mk}>Your first moment</div>
            <blockquote className={styles.quote}>{REVEAL_QUOTE}</blockquote>
            <cite className={styles.cite}>{REVEAL_AUTHOR}</cite>
            <button type="button" className={styles.play} onClick={play}>
              <span className={styles.ring}>
                <PlayIcon />
              </span>
              <span className={styles.lbl}>{playLabel}</span>
            </button>
            <p className={styles.filmNote}>
              {
                "This is the opening scene. Tomorrow it builds itself around you, then hands you today's move."
              }
            </p>
          </div>
          <div className={styles.footerCta}>
            <button type="button" className={styles.cta} onClick={onEnter}>
              Enter Daily Harbor
            </button>
            <button type="button" className={styles.ghost} onClick={onReset}>
              Start over
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
