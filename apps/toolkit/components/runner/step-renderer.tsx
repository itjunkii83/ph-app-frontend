"use client";

import { JournalStep } from "@/components/steps/journal-step";
import { ListStep } from "@/components/steps/list-step";
import { MotivationStep } from "@/components/steps/motivation-step";
import { StructuredStep } from "@/components/steps/structured-step";
import { TextStep } from "@/components/steps/text-step";
import { TimedStep } from "@/components/steps/timed-step";
import { TrackerStep } from "@/components/steps/tracker-step";
import type { Module } from "@/lib/types";

export function StepRenderer({ module }: { module: Module }) {
  switch (module.type) {
    case "motivation":
      return <MotivationStep module={module} />;
    case "list":
      return <ListStep module={module} />;
    case "timed":
      return <TimedStep module={module} />;
    case "structured":
      return <StructuredStep module={module} />;
    case "text":
      return <TextStep module={module} />;
    case "tracker":
      return <TrackerStep module={module} />;
    case "journal":
      return <JournalStep module={module} />;
    case "commitment":
      // Commitments live on Harbor, never inside the runner.
      return null;
  }
}
