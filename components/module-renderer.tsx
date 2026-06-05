import type { Module } from "@/lib/types";
import { JournalModule } from "@/components/modules/journal-module";
import { ListModule } from "@/components/modules/list-module";
import { MotivationModule } from "@/components/modules/motivation-module";
import { StructuredModule } from "@/components/modules/structured-module";
import { TextModule } from "@/components/modules/text-module";
import { TimedModule } from "@/components/modules/timed-module";
import { TrackerModule } from "@/components/modules/tracker-module";

export function ModuleRenderer({ module }: { module: Module }) {
  switch (module.type) {
    case "motivation":
      return <MotivationModule module={module} />;
    case "list":
      return <ListModule module={module} />;
    case "timed":
      return <TimedModule module={module} />;
    case "structured":
      return <StructuredModule module={module} />;
    case "text":
      return <TextModule module={module} />;
    case "tracker":
      return <TrackerModule module={module} />;
    case "journal":
      return <JournalModule module={module} />;
  }
}
