import { TRIGGERS } from "@/components/onboarding/constants";
import styles from "@/components/onboarding/onboarding.module.css";
import { cn } from "@/lib/utils";

export function ScreenTrigger({
  triggers,
  onToggle,
  onNext,
}: {
  triggers: string[];
  onToggle: (trigger: string) => void;
  onNext: () => void;
}) {
  return (
    <section className={cn(styles.screen, styles.screenScroll)}>
      <div className={styles.eyebrow}>The reason it is now</div>
      <h2 className={styles.q}>
        What brought you here, <em>right now?</em>
      </h2>
      <p className={styles.lede}>
        There is usually a reason the timing landed today. Pick whatever fits.
        More than one is fine.
      </p>
      <div className={styles.chips}>
        {TRIGGERS.map((t) => (
          <button
            key={t}
            type="button"
            className={cn(styles.chip, triggers.includes(t) && styles.chipOn)}
            onClick={() => onToggle(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className={styles.footerCta}>
        <button
          type="button"
          className={styles.cta}
          disabled={triggers.length === 0}
          onClick={onNext}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
