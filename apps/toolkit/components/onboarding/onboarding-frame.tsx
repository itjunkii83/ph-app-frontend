import {
  PHASE,
  PROGRESS,
  type ScreenName,
} from "@/components/onboarding/constants";
import styles from "@/components/onboarding/onboarding.module.css";

function BackChevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

// The centered phone frame plus shared chrome (back, phase, progress meter).
// The frame scales up into a roomier column on desktop via the module CSS; the
// chrome hides on the welcome and reveal screens, matching the prototype.
export function OnboardingFrame({
  screen,
  onBack,
  children,
}: {
  screen: ScreenName;
  onBack: () => void;
  children: React.ReactNode;
}) {
  const hideChrome = screen === "welcome" || screen === "reveal";

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <div className={styles.chrome} style={{ opacity: hideChrome ? 0 : 1 }}>
          <div className={styles.topbar}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={onBack}
              aria-label="Back"
              style={{ visibility: hideChrome ? "hidden" : "visible" }}
            >
              <BackChevron />
            </button>
            <span className={styles.phase}>{PHASE[screen]}</span>
          </div>
          <div className={styles.meter}>
            <span
              className={styles.meterFill}
              style={{ width: `${PROGRESS[screen]}%` }}
            />
          </div>
        </div>
        <div className={styles.stage}>{children}</div>
      </div>
    </div>
  );
}
