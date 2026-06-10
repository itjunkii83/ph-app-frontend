"use client";

import {
  DEFAULT_ANSWERS,
  type OnboardingAnswers,
} from "@/components/onboarding/constants";
import { useLocalStorage } from "@/lib/use-local-storage";

// Onboarding answers persist through the same store seam as everything else, so
// they survive sessions and pin to the signed in user. Editing onboarding reads
// these back; completing it flips `completed`.
export function useOnboarding() {
  return useLocalStorage<OnboardingAnswers>(
    "harbor:v1:onboarding",
    DEFAULT_ANSWERS,
  );
}
