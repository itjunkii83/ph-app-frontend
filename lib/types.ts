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

interface ModuleBase {
  id: string;
  title: string;
  sourceTag: string;
}

export type Module =
  | (ModuleBase & { type: "motivation"; config: MotivationConfig })
  | (ModuleBase & { type: "list"; config: ListConfig })
  | (ModuleBase & { type: "timed"; config: TimedConfig })
  | (ModuleBase & { type: "structured"; config: StructuredConfig })
  | (ModuleBase & { type: "text"; config: TextConfig })
  | (ModuleBase & { type: "tracker"; config: TrackerConfig })
  | (ModuleBase & { type: "journal"; config: JournalConfig });

export type ModuleOf<T extends Module["type"]> = Extract<Module, { type: T }>;

export interface DashboardConfig {
  schemaVersion: string;
  generatedBy: string;
  workspace: Workspace;
  profile: Profile;
  modules: Module[];
}
