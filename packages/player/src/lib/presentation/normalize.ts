import { Presentation, Section, Slide } from "../../types/presentation";

// Read-only normalization shared by the player and the studio editor. The CRUD
// helpers (createSlide, createSection, generateId, convertToSectionsFormat) stay
// in the studio; this file holds only the pure read helpers playback needs.

/**
 * Get sections from a presentation, handling legacy flat slide arrays. If the
 * presentation has sections, return them; otherwise wrap the flat slides in a
 * single section.
 */
export function getSections(presentation: Presentation): Section[] {
  if (presentation.sections && presentation.sections.length > 0) {
    return presentation.sections;
  }
  return [
    {
      id: "legacy-section",
      name: "Presentation",
      stageLayers: [],
      slides: presentation.slides || [],
    },
  ];
}

/** Check if a presentation uses the new sections format. */
export function usesSectionsFormat(presentation: Presentation): boolean {
  return !!(presentation.sections && presentation.sections.length > 0);
}

/** Get all slides from a presentation (flattened from all sections). */
export function getAllSlides(presentation: Presentation): Slide[] {
  return getSections(presentation).flatMap((section) => section.slides);
}

/** Get total slide count across all sections. */
export function getTotalSlideCount(presentation: Presentation): number {
  return getSections(presentation).reduce(
    (total, section) => total + section.slides.length,
    0,
  );
}

/** Find a slide by ID across all sections. */
export function findSlide(
  presentation: Presentation,
  slideId: string,
): { section: Section; slide: Slide; sectionIndex: number; slideIndex: number } | null {
  const sections = getSections(presentation);
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
    const section = sections[sectionIndex];
    const slideIndex = section.slides.findIndex((s) => s.id === slideId);
    if (slideIndex !== -1) {
      return { section, slide: section.slides[slideIndex], sectionIndex, slideIndex };
    }
  }
  return null;
}

/** Find a section by ID. */
export function findSection(
  presentation: Presentation,
  sectionId: string,
): { section: Section; index: number } | null {
  const sections = getSections(presentation);
  const index = sections.findIndex((s) => s.id === sectionId);
  if (index !== -1) {
    return { section: sections[index], index };
  }
  return null;
}

/** Get the section and slide indices for a flat slide index. */
export function getPositionFromFlatIndex(
  presentation: Presentation,
  flatIndex: number,
): { sectionIndex: number; slideIndex: number } | null {
  const sections = getSections(presentation);
  let currentIndex = 0;
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
    const section = sections[sectionIndex];
    if (flatIndex < currentIndex + section.slides.length) {
      return { sectionIndex, slideIndex: flatIndex - currentIndex };
    }
    currentIndex += section.slides.length;
  }
  return null;
}

/** Get a flat index from section and slide indices. */
export function getFlatIndex(
  presentation: Presentation,
  sectionIndex: number,
  slideIndex: number,
): number {
  const sections = getSections(presentation);
  let flatIndex = 0;
  for (let i = 0; i < sectionIndex && i < sections.length; i++) {
    flatIndex += sections[i].slides.length;
  }
  return flatIndex + slideIndex;
}
