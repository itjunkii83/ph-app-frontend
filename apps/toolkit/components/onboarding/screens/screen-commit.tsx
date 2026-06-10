import { COMMITS, DEFAULT_CAP } from "@/components/onboarding/constants";
import styles from "@/components/onboarding/onboarding.module.css";
import { cn } from "@/lib/utils";

const GAUGE_CIRC = 2 * Math.PI * 24; // gauge ring circumference (r=24)

export function ScreenCommit({
  commitMin,
  onSelect,
  onNext,
}: {
  commitMin: number | null;
  onSelect: (min: number) => void;
  onNext: () => void;
}) {
  const active = COMMITS.find((c) => c.min === commitMin);
  const cap = active?.cap ?? DEFAULT_CAP;

  return (
    <section className={styles.screen}>
      <div className={styles.eyebrow}>Set your rhythm</div>
      <h2 className={cn(styles.q, styles.qTight)}>
        How long is your <em>morning?</em>
      </h2>

      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#eef3f7" />
            <stop offset="0.55" stopColor="#a8b3bd" />
            <stop offset="1" stopColor="#cfd8df" />
          </linearGradient>
        </defs>
      </svg>

      <div className={styles.rgrid}>
        {COMMITS.map((o) => {
          const len = GAUGE_CIRC * (o.min / 60);
          const on = o.min === commitMin;
          return (
            <button
              key={o.min}
              type="button"
              className={cn(styles.rtile, on && styles.rtileOn)}
              onClick={() => onSelect(o.min)}
            >
              <svg viewBox="0 0 60 60">
                <circle className={styles.gaugeBg} cx="30" cy="30" r="24" />
                <circle
                  className={styles.gaugeFill}
                  cx="30"
                  cy="30"
                  r="24"
                  transform="rotate(-90 30 30)"
                  strokeDasharray={`${len.toFixed(2)} ${GAUGE_CIRC.toFixed(2)}`}
                />
              </svg>
              <div className={styles.num}>
                {o.num}
                <small> min</small>
              </div>
              <div className={styles.rl}>{o.label}</div>
            </button>
          );
        })}
      </div>

      <p className={styles.clockCap}>{cap}</p>

      <div className={styles.footerCta}>
        <button
          type="button"
          className={styles.cta}
          disabled={commitMin == null}
          onClick={onNext}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
