// Onboarding flow data and tuning knobs, ported from tmp/onboard_demo.html.
// Copy is the prototype's verbatim; no em dashes anywhere.

export const FLOW = [
  "welcome",
  "trigger",
  "bubbles",
  "reflect",
  "freetext",
  "commit",
  "build",
  "reveal",
] as const;

export type ScreenName = (typeof FLOW)[number];

export const PHASE: Record<ScreenName, string> = {
  welcome: "Arrival",
  trigger: "Arrival",
  bubbles: "Direction",
  reflect: "Direction",
  freetext: "Direction",
  commit: "Rhythm",
  build: "Your Harbor",
  reveal: "Your Harbor",
};

export const PROGRESS: Record<ScreenName, number> = {
  welcome: 4,
  trigger: 22,
  bubbles: 55,
  reflect: 64,
  freetext: 72,
  commit: 86,
  build: 100,
  reveal: 100,
};

// Trigger options: the emotional why, not skills.
export const TRIGGERS: string[] = [
  "A fresh start I want to keep this time",
  "Tired of starting and quitting",
  "A big change is coming",
  "I want my energy back",
  "Proving something to myself",
  "Becoming the person I keep picturing",
  "Something shook me up",
  "Just ready for more",
];

// Bubble taxonomy: parents are feelings/identity, children are facets.
export interface Theme {
  label: string;
  kids: string[];
}

export const THEMES: Theme[] = [
  {
    label: "Follow through",
    kids: [
      "Finish what I start",
      "Beat the snooze",
      "Keep my word to me",
      "Past week two",
    ],
  },
  {
    label: "Energy that lasts",
    kids: [
      "A morning spark",
      "Through the slump",
      "No caffeine crash",
      "Strong till evening",
    ],
  },
  {
    label: "Quiet confidence",
    kids: [
      "Trust my gut",
      "Speak up calmly",
      "Stop second guessing",
      "Solid walking in",
    ],
  },
  {
    label: "Calm under pressure",
    kids: [
      "Breathe first",
      "Less doom scrolling",
      "Steady hands",
      "Let small stuff go",
    ],
  },
  {
    label: "Show up for myself",
    kids: ["Put me on the list", "Boundaries that hold", "Rest, guilt free"],
  },
  {
    label: "Sharper focus",
    kids: ["One thing at a time", "Deep work mornings", "Quiet the noise"],
  },
  {
    label: "Feel grounded",
    kids: ["Start on purpose", "Less rushing", "A body that feels good"],
  },
];

// Commitment rhythm tiles (self set, honest, no lazy option).
export interface Commit {
  min: number;
  num: string;
  label: string;
  cap: string;
}

export const COMMITS: Commit[] = [
  { min: 2, num: "2", label: "Spark", cap: "A spark. The moment, and one small move." },
  {
    min: 5,
    num: "5",
    label: "Real start",
    cap: "A real start. The sweet spot for most people.",
  },
  {
    min: 10,
    num: "10",
    label: "Dialed in",
    cap: "Dialed in. Motivation plus a full action.",
  },
  {
    min: 15,
    num: "15+",
    label: "All in",
    cap: "All the way. The complete morning ritual.",
  },
];

export const DEFAULT_CAP =
  "Pick what you will actually keep. You can change it any day.";

export const REVEAL_QUOTE =
  "Waste no more time arguing about what a good person should be. Be one.";
export const REVEAL_AUTHOR = "Marcus Aurelius";

// ---- Physics knobs (ported values; PARENT_R_CAP is new for desktop) ----
export const GRAVITY_Y = 1.4;
export const POSITION_ITERATIONS = 12;
export const VELOCITY_ITERATIONS = 8;
export const ORBIT_SPEED = 0.0072; // shared angular speed for the orbit ring
export const PYRAMID_GAP = 6;
export const SPAWN_GAP = 230; // faucet: ms between dropping parents
// Caps the parent bubble radius so bubbles stay tasteful as the frame grows on
// desktop. At phone width (430px) the computed radius (~47px) is under the cap,
// so the layout is identical to the prototype; the cap only engages wider.
export const PARENT_R_CAP = 56;

// What the onboarding collects. Persisted per user through the store.
export type PickKind = "parent" | "child";

export interface Pick {
  label: string;
  kind: PickKind;
}

export interface OnboardingAnswers {
  completed: boolean;
  triggers: string[];
  picks: Pick[];
  commit: string | null;
  commitMin: number | null;
  freeText: string;
}

export const DEFAULT_ANSWERS: OnboardingAnswers = {
  completed: false,
  triggers: [],
  picks: [],
  commit: null,
  commitMin: null,
  freeText: "",
};
