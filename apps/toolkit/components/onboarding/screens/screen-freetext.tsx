import styles from "@/components/onboarding/onboarding.module.css";
import { cn } from "@/lib/utils";

export function ScreenFreetext({
  freeText,
  onChange,
  onNext,
}: {
  freeText: string;
  onChange: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <section className={cn(styles.screen, styles.screenScroll)}>
      <div className={styles.eyebrow}>In your own words</div>
      <h2 className={styles.q}>
        Anything else <em>on your mind?</em>
      </h2>
      <p className={styles.lede}>
        Optional. A book that hit you, a season you are in, a line you keep
        coming back to. We read it to tune your mornings. We never show it back
        to anyone.
      </p>
      <textarea
        className={styles.textarea}
        value={freeText}
        onChange={(e) => onChange(e.target.value)}
        placeholder="I keep starting and quitting. I want the mornings to finally stick, and that fired up feeling to carry the whole day."
      />
      <div className={styles.footerCta}>
        <button type="button" className={styles.cta} onClick={onNext}>
          Continue
        </button>
        <button type="button" className={styles.ghost} onClick={onNext}>
          Skip for now
        </button>
      </div>
    </section>
  );
}
