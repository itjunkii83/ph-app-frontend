import styles from "@/components/onboarding/onboarding.module.css";

export function ScreenWelcome({ onNext }: { onNext: () => void }) {
  return (
    <section className={styles.screen}>
      <div className={styles.spacer} />
      <div className={styles.eyebrow}>Welcome aboard</div>
      <h1 className={styles.big}>
        Still water.
        <br />
        Then you <em>set out.</em>
      </h1>
      <p className={styles.lede}>
        Ninety seconds to point your mornings somewhere that matters. No rush.
        Just tell us what you are reaching for.
      </p>
      <div className={styles.spacer} />
      <div className={styles.footerCta}>
        <button type="button" className={styles.cta} onClick={onNext}>
          Begin
        </button>
        <p className={styles.tiny} style={{ textAlign: "center" }}>
          You can change any of this later.
        </p>
      </div>
    </section>
  );
}
