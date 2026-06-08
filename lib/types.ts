export type Mood = "intense" | "calm";

export interface Workspace {
  name: string;
  style: string;
  greeting: string;
}

export interface Profile {
  goalText: string;
  bubbles: string[];
  freeText: string;
  derivedThemes: string[];
}

export interface MotivationConfig {
  mood: Mood;
  quote: string;
  attribution: string;
  backgroundTheme: string;
  filmPlaceholder: boolean;
  ctaLabel: string;
}

export interface ListConfig {
  prompt: string;
  itemCount: number;
  placeholder: string;
  addLabel: string;
}

export interface TimedConfig {
  prompt: string;
  durationSeconds: number;
  startLabel: string;
  doneLabel: string;
}

export interface StructuredField {
  key: string;
  label: string;
  placeholder: string;
}

export interface StructuredConfig {
  intro: string;
  fields: StructuredField[];
}

export interface TextConfig {
  prompt: string;
  placeholder: string;
  rows: number;
}

export interface TrackerConfig {
  habitLabel: string;
  checkLabel: string;
  streakModel: string;
  historyDays: number;
}

export interface JournalConfig {
  prompt: string;
  prefix: string;
  placeholder: string;
  rows: number;
}

export interface CommitmentConfig {
  label: string;
  note: string;
  keystone: boolean;
}

// A module's lane decides where it surfaces. Practice reps run inside the
// focused session; commitments live on Harbor and are checked off through the
// day. The motivation moment has no lane: it opens the session as step zero.
export type Lane = "practice" | "commitment";

interface ModuleBase {
  id: string;
  title: string;
  sourceTag: string;
  lane?: Lane;
}

export type Module =
  | (ModuleBase & { type: "motivation"; config: MotivationConfig })
  | (ModuleBase & { type: "list"; config: ListConfig })
  | (ModuleBase & { type: "timed"; config: TimedConfig })
  | (ModuleBase & { type: "structured"; config: StructuredConfig })
  | (ModuleBase & { type: "text"; config: TextConfig })
  | (ModuleBase & { type: "tracker"; config: TrackerConfig })
  | (ModuleBase & { type: "journal"; config: JournalConfig })
  | (ModuleBase & { type: "commitment"; config: CommitmentConfig });

export type ModuleOf<T extends Module["type"]> = Extract<Module, { type: T }>;

export interface DashboardConfig {
  schemaVersion: string;
  generatedBy: string;
  workspace: Workspace;
  profile: Profile;
  modules: Module[];
}
