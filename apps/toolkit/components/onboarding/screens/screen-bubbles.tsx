import { BubblePit } from "@/components/onboarding/bubble-pit";
import type { Pick } from "@/components/onboarding/constants";
import styles from "@/components/onboarding/onboarding.module.css";
import { cn } from "@/lib/utils";

export function ScreenBubbles({
  picks,
  onPicksChange,
  onNext,
}: {
  picks: Pick[];
  onPicksChange: (picks: Pick[]) => void;
  onNext: () => void;
}) {
  return (
    <section className={cn(styles.screen, styles.screenBubbles)}>
      <div className={styles.eyebrow}>Find your direction</div>
      <h2 className={cn(styles.q, styles.qTight)}>
        What do you want <em>more of?</em>
      </h2>
      <BubblePit picks={picks} onPicksChange={onPicksChange} />
      <div className={styles.footerCta}>
        <button
          type="button"
          className={styles.cta}
          disabled={picks.length === 0}
          onClick={onNext}
        >
          That is me
        </button>
      </div>
    </section>
  );
}
