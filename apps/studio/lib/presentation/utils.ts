import { Presentation, Section, Slide } from "@/types/presentation";
import { usesSectionsFormat } from "@harbor/player";

// Read-only normalization moved into @harbor/player (shared with playback).
// Re-exported here so existing `@/lib/presentation/utils` imports keep working.
export {
  getSections,
  usesSectionsFormat,
  getAllSlides,
  getTotalSlideCount,
  findSlide,
  findSection,
  getPositionFromFlatIndex,
  getFlatIndex,
} from "@harbor/player";

// Authoring-only CRUD stays in the studio.

/** Convert a legacy flat-slides presentation to sections format. */
export function convertToSectionsFormat(presentation: Presentation): Presentation {
  if (usesSectionsFormat(presentation)) {
    return presentation;
  }
  return {
    ...presentation,
    sections: [
      {
        id: `section-${Date.now()}`,
        name: "Main",
        stageLayers: [],
        slides: presentation.slides || [],
      },
    ],
    // Keep slides for backward compat but sections is authoritative.
    slides: [],
  };
}

/** Generate a unique ID. */
export function generateId(prefix: string = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Create a new empty slide. */
export function createSlide(partialSlide?: Partial<Slide>): Slide {
  return {
    id: generateId("slide"),
    layers: [],
    duration: 5000,
    ...partialSlide,
  };
}

/** Create a new empty section. */
export function createSection(partialSection?: Partial<Section>): Section {
  return {
    id: generateId("section"),
    name: "New Section",
    stageLayers: [],
    slides: [createSlide()],
    ...partialSection,
  };
}
