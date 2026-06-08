import type { Pick } from "@/components/onboarding/constants";
import styles from "@/components/onboarding/onboarding.module.css";

function joinNice(arr: string[]): string {
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return arr[0] + " and " + arr[1];
  return arr.slice(0, -1).join(", ") + ", and " + arr[arr.length - 1];
}

export function ScreenReflect({
  picks,
  onNext,
  onBack,
}: {
  picks: Pick[];
  onNext: () => void;
  onBack: () => void;
}) {
  const top = picks.slice(0, 3).map((p) => p.label.toLowerCase());

  const seen = new Set<string>();
  const tags = picks.filter((p) => {
    if (seen.has(p.label)) return false;
    seen.add(p.label);
    return true;
  });

  return (
    <section className={styles.screen} style={{ paddingBottom: 0 }}>
      <div className={styles.reflectBody}>
        <div className={styles.eyebrow}>Here is what we heard</div>
        <p className={styles.mirror}>
          So here is what we heard.
          {top.length > 0 && (
            <>
              {" "}
              You are reaching for <em>{joinNice(top)}</em>.
            </>
          )}{" "}
          Underneath the list, this is really about becoming someone who follows
          through. We can build your mornings around exactly that.
        </p>
        <div className={styles.reflabel}>What we will build around</div>
        <div className={styles.themes}>
          {tags.map((p) => (
            <span key={p.label} className={styles.theme}>
              {p.label}
            </span>
          ))}
        </div>
      </div>
      <div
        className={styles.footerCta}
        style={{ marginTop: 0, padding: "14px 0 26px" }}
      >
        <button type="button" className={styles.cta} onClick={onNext}>
          Yes, that is it
        </button>
        <button type="button" className={styles.ghost} onClick={onBack}>
          Not quite, let me adjust
        </button>
      </div>
    </section>
  );
}
