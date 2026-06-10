"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  COMMITS,
  DEFAULT_ANSWERS,
  FLOW,
  type Pick,
} from "@/components/onboarding/constants";
import { OnboardingFrame } from "@/components/onboarding/onboarding-frame";
import { ScreenBubbles } from "@/components/onboarding/screens/screen-bubbles";
import { ScreenBuild } from "@/components/onboarding/screens/screen-build";
import { ScreenCommit } from "@/components/onboarding/screens/screen-commit";
import { ScreenFreetext } from "@/components/onboarding/screens/screen-freetext";
import { ScreenReflect } from "@/components/onboarding/screens/screen-reflect";
import { ScreenReveal } from "@/components/onboarding/screens/screen-reveal";
import { ScreenTrigger } from "@/components/onboarding/screens/screen-trigger";
import { ScreenWelcome } from "@/components/onboarding/screens/screen-welcome";
import { useOnboarding } from "@/lib/use-onboarding";

// The onboarding state machine. The current screen is local (not persisted), so
// editing always re-enters at the start with answers pre-filled. All answers
// flow through the store, so they save as you go and survive sessions.
export function OnboardingFlow() {
  const router = useRouter();
  const { value: answers, setValue: setAnswers } = useOnboarding();
  const [idx, setIdx] = useState(0);
  const screen = FLOW[idx];

  const next = useCallback(
    () => setIdx((i) => Math.min(FLOW.length - 1, i + 1)),
    [],
  );

  const back = useCallback(() => {
    setIdx((i) => {
      let j = i - 1;
      if (FLOW[j] === "build") j -= 1; // skip the transient loader going back
      return Math.max(0, j);
    });
  }, []);

  const toggleTrigger = useCallback(
    (trigger: string) =>
      setAnswers((prev) => ({
        ...prev,
        triggers: prev.triggers.includes(trigger)
          ? prev.triggers.filter((t) => t !== trigger)
          : [...prev.triggers, trigger],
      })),
    [setAnswers],
  );

  const onPicksChange = useCallback(
    (picks: Pick[]) => setAnswers((prev) => ({ ...prev, picks })),
    [setAnswers],
  );

  const setFreeText = useCallback(
    (freeText: string) => setAnswers((prev) => ({ ...prev, freeText })),
    [setAnswers],
  );

  const setCommit = useCallback(
    (min: number) => {
      const o = COMMITS.find((c) => c.min === min);
      setAnswers((prev) => ({
        ...prev,
        commit: o ? o.label : null,
        commitMin: min,
      }));
    },
    [setAnswers],
  );

  const complete = useCallback(() => {
    setAnswers((prev) => ({ ...prev, completed: true }));
    router.push("/");
  }, [setAnswers, router]);

  const reset = useCallback(() => {
    setAnswers(DEFAULT_ANSWERS);
    setIdx(0);
  }, [setAnswers]);

  function renderScreen() {
    switch (screen) {
      case "welcome":
        return <ScreenWelcome onNext={next} />;
      case "trigger":
        return (
          <ScreenTrigger
            triggers={answers.triggers}
            onToggle={toggleTrigger}
            onNext={next}
          />
        );
      case "bubbles":
        return (
          <ScreenBubbles
            picks={answers.picks}
            onPicksChange={onPicksChange}
            onNext={next}
          />
        );
      case "reflect":
        return (
          <ScreenReflect picks={answers.picks} onNext={next} onBack={back} />
        );
      case "freetext":
        return (
          <ScreenFreetext
            freeText={answers.freeText}
            onChange={setFreeText}
            onNext={next}
          />
        );
      case "commit":
        return (
          <ScreenCommit
            commitMin={answers.commitMin}
            onSelect={setCommit}
            onNext={next}
          />
        );
      case "build":
        return <ScreenBuild onDone={next} />;
      case "reveal":
        return <ScreenReveal onEnter={complete} onReset={reset} />;
    }
  }

  return (
    <OnboardingFrame screen={screen} onBack={back}>
      {/* Key by screen so each entry remounts: replays the enter animation and
          gives the bubble pit a clean controller lifecycle. */}
      <div key={screen} style={{ position: "absolute", inset: 0 }}>
        {renderScreen()}
      </div>
    </OnboardingFrame>
  );
}
