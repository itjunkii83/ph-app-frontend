'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Presentation, Section, Slide, Layer } from '@/types/presentation';
import { getEffect } from '@/components/effects/registry';
import {
  getSections,
  createSlide,
  createSection,
  generateId,
} from '@/lib/presentation/utils';

export interface NavigationPosition {
  sectionIndex: number;
  slideIndex: number;
}

interface UsePresentationEditorOptions {
  presentationId?: string | null;
  autoSaveDelay?: number;
}

interface UsePresentationEditorReturn {
  // Presentation data
  presentation: Presentation | null;
  presentationId: string | null;
  presentationTitle: string;
  isLoading: boolean;
  isDirty: boolean;

  // Navigation
  sections: Section[];
  currentSectionIndex: number;
  currentSlideIndex: number;
  currentSection: Section | null;
  currentSlide: Slide | null;
  currentStageLayers: Layer[];
  currentSlideLayers: Layer[];

  // Navigation actions
  navigateToSlide: (sectionIndex: number, slideIndex: number) => void;
  navigateNext: () => boolean;
  navigatePrevious: () => boolean;
  navigateToSection: (sectionIndex: number) => void;

  // Section CRUD
  addSection: (name?: string) => string;
  removeSection: (sectionId: string) => void;
  updateSection: (sectionId: string, updates: Partial<Section>) => void;
  renameSection: (sectionId: string, name: string) => void;

  // Slide CRUD
  addSlide: (afterIndex?: number) => string;
  removeSlide: (slideId: string) => void;
  duplicateSlide: (slideId: string) => string | null;
  updateSlide: (slideId: string, updates: Partial<Slide>) => void;

  // Layer operations
  addLayer: (effectType: string, target: 'slide' | 'stage') => string | null;
  removeLayer: (layerId: string) => void;
  updateLayerConfig: (layerId: string, config: Record<string, any>) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  reorderLayers: (orderedIds: string[], target: 'slide' | 'stage') => void;
  toggleLayerVisibility: (layerId: string) => void;

  // Selected layer
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  selectedLayer: Layer | null;

  // Replay
  playKey: number;
  replay: () => void;

  // Persistence
  save: () => Promise<void>;
  load: (id: string) => Promise<void>;
  setTitle: (title: string) => void;
}

const defaultSettings = {
  defaultTransition: { type: 'fade', duration: 500, easing: 'ease' },
  autoPlay: false,
  loop: false,
  baseWidth: 1920,
  baseHeight: 1080,
};

export function usePresentationEditor({
  presentationId: initialPresentationId,
  autoSaveDelay = 1000,
}: UsePresentationEditorOptions = {}): UsePresentationEditorReturn {
  // Core state
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [presentationId, setPresentationId] = useState<string | null>(initialPresentationId || null);
  const [presentationTitle, setPresentationTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Navigation state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Selection state
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Replay state
  const [playKey, setPlayKey] = useState(0);

  // Refs for auto-save
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCreatingRef = useRef(false);

  // Debounced auto-replay on config changes
  const configReplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Computed values
  const sections = useMemo(() => {
    if (!presentation) return [];
    return getSections(presentation);
  }, [presentation]);

  const currentSection = useMemo(() => {
    return sections[currentSectionIndex] || null;
  }, [sections, currentSectionIndex]);

  const currentSlide = useMemo(() => {
    return currentSection?.slides[currentSlideIndex] || null;
  }, [currentSection, currentSlideIndex]);

  const currentStageLayers = useMemo(() => {
    return currentSection?.stageLayers || [];
  }, [currentSection]);

  const currentSlideLayers = useMemo(() => {
    return currentSlide?.layers || [];
  }, [currentSlide]);

  const selectedLayer = useMemo(() => {
    // Search in both stage and slide layers
    const allLayers = [...currentStageLayers, ...currentSlideLayers];
    return allLayers.find((l) => l.id === selectedLayerId) || null;
  }, [selectedLayerId, currentStageLayers, currentSlideLayers]);

  // Hard reset selection to first slide layer on any slide/section change
  const prevSlideRef = useRef(currentSlideIndex);
  const prevSectionRef = useRef(currentSectionIndex);
  useEffect(() => {
    if (prevSlideRef.current !== currentSlideIndex || prevSectionRef.current !== currentSectionIndex) {
      prevSlideRef.current = currentSlideIndex;
      prevSectionRef.current = currentSectionIndex;
      setSelectedLayerId(currentSlideLayers.length > 0 ? currentSlideLayers[0].id : null);
    }
  });

  // Initialize with empty presentation if no ID
  useEffect(() => {
    if (!initialPresentationId && !presentation) {
      const newSection = createSection({ name: 'Main' });
      setPresentation({
        id: '',
        title: 'Untitled',
        sections: [newSection],
        slides: [],
        settings: defaultSettings,
        fonts: [],
      });
    }
  }, [initialPresentationId, presentation]);

  // Load presentation from API
  useEffect(() => {
    if (initialPresentationId) {
      loadPresentation(initialPresentationId);
    }
  }, [initialPresentationId]);

  const loadPresentation = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/presentations/${id}`);
      if (res.ok) {
        const data = await res.json();
        // Convert legacy format if needed
        let sections: Section[];
        if (data.sections && data.sections.length > 0) {
          sections = data.sections;
        } else if (data.slides && data.slides.length > 0) {
          // Legacy: wrap in single section
          sections = [
            {
              id: 'legacy-section',
              name: 'Main',
              stageLayers: [],
              slides: data.slides,
            },
          ];
        } else {
          // Empty: create default section with one slide
          sections = [createSection({ name: 'Main' })];
        }

        setPresentation({
          ...data,
          sections,
        });
        setPresentationId(id);
        setPresentationTitle(data.title || '');
        setCurrentSectionIndex(0);
        setCurrentSlideIndex(0);
        setSelectedLayerId(null);
        setIsDirty(false);
        isInitialMount.current = true;
      }
    } catch (e) {
      console.error('Load failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save when presentation changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!presentation) return;

    setIsDirty(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (presentationId) {
        await savePresentation();
      } else {
        await autoCreatePresentation();
      }
    }, autoSaveDelay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [presentation, presentationId, autoSaveDelay]);

  const savePresentation = async () => {
    if (!presentation) return;

    try {
      const payload = {
        title: presentationTitle || presentation.title,
        sections: sections,
        slides: [], // Clear legacy slides when using sections
        settings: presentation.settings,
        fonts: presentation.fonts,
      };

      if (presentationId) {
        await fetch(`/api/presentations/${presentationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        const title = presentationTitle || prompt('Presentation title:') || 'Untitled';
        const res = await fetch('/api/presentations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, title }),
        });
        if (res.ok) {
          const data = await res.json();
          setPresentationId(data.id);
          setPresentationTitle(title);
          window.history.replaceState(null, '', `?id=${data.id}`);
        }
      }
      setIsDirty(false);
    } catch (e) {
      console.error('Save failed', e);
    }
  };

  const autoCreatePresentation = async () => {
    if (!presentation || isCreatingRef.current) return;
    isCreatingRef.current = true;
    try {
      const payload = {
        title: presentationTitle || presentation.title || 'Untitled',
        sections: getSections(presentation),
        slides: [],
        settings: presentation.settings,
        fonts: presentation.fonts,
      };
      const res = await fetch('/api/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setPresentationId(data.id);
        setPresentationTitle(payload.title);
        window.history.replaceState(null, '', `?id=${data.id}`);
        setIsDirty(false);
      }
    } catch (e) {
      console.error('Auto-create failed', e);
    } finally {
      isCreatingRef.current = false;
    }
  };

  // Helper to update sections immutably
  const updateSections = useCallback((updater: (sections: Section[]) => Section[]) => {
    setPresentation((prev) => {
      if (!prev) return prev;
      const currentSections = getSections(prev);
      const newSections = updater(currentSections);
      return {
        ...prev,
        sections: newSections,
      };
    });
  }, []);

  // Navigation actions
  const navigateToSlide = useCallback((sectionIndex: number, slideIndex: number) => {
    setCurrentSectionIndex(sectionIndex);
    setCurrentSlideIndex(slideIndex);
    setPlayKey((k) => k + 1);
  }, []);

  const navigateToSection = useCallback((sectionIndex: number) => {
    setCurrentSectionIndex(sectionIndex);
    setCurrentSlideIndex(0);
    setPlayKey((k) => k + 1);
  }, []);

  const navigateNext = useCallback(() => {
    const section = sections[currentSectionIndex];
    if (!section) return false;

    if (currentSlideIndex < section.slides.length - 1) {
      setCurrentSlideIndex((i) => i + 1);
      setPlayKey((k) => k + 1);
      return true;
    } else if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex((i) => i + 1);
      setCurrentSlideIndex(0);
      setPlayKey((k) => k + 1);
      return true;
    }
    return false;
  }, [sections, currentSectionIndex, currentSlideIndex]);

  const navigatePrevious = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((i) => i - 1);
      setPlayKey((k) => k + 1);
      return true;
    } else if (currentSectionIndex > 0) {
      const prevSection = sections[currentSectionIndex - 1];
      setCurrentSectionIndex((i) => i - 1);
      setCurrentSlideIndex(prevSection ? prevSection.slides.length - 1 : 0);
      setPlayKey((k) => k + 1);
      return true;
    }
    return false;
  }, [sections, currentSectionIndex, currentSlideIndex]);

  // Section CRUD
  const addSection = useCallback((name?: string) => {
    const newSection = createSection({ name: name || 'New Section' });
    updateSections((sections) => [...sections, newSection]);
    return newSection.id;
  }, [updateSections]);

  const removeSection = useCallback((sectionId: string) => {
    updateSections((sections) => {
      const filtered = sections.filter((s) => s.id !== sectionId);
      // Ensure at least one section exists
      if (filtered.length === 0) {
        return [createSection({ name: 'Main' })];
      }
      return filtered;
    });
    // Adjust current index if needed
    setCurrentSectionIndex((i) => Math.max(0, Math.min(i, sections.length - 2)));
    setCurrentSlideIndex(0);
  }, [updateSections, sections.length]);

  const updateSection = useCallback((sectionId: string, updates: Partial<Section>) => {
    updateSections((sections) =>
      sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))
    );
  }, [updateSections]);

  const renameSection = useCallback((sectionId: string, name: string) => {
    updateSection(sectionId, { name });
  }, [updateSection]);

  // Slide CRUD
  const addSlide = useCallback((afterIndex?: number) => {
    const newSlide = createSlide();
    const insertIndex = afterIndex !== undefined ? afterIndex + 1 : currentSlideIndex + 1;

    updateSections((sections) =>
      sections.map((s, i) => {
        if (i !== currentSectionIndex) return s;
        const newSlides = [...s.slides];
        newSlides.splice(insertIndex, 0, newSlide);
        return { ...s, slides: newSlides };
      })
    );

    setCurrentSlideIndex(insertIndex);
    setPlayKey((k) => k + 1);
    return newSlide.id;
  }, [updateSections, currentSectionIndex, currentSlideIndex]);

  const removeSlide = useCallback((slideId: string) => {
    const section = sections[currentSectionIndex];
    if (!section) return;

    const isLastSlideInSection = section.slides.length <= 1;
    const isLastSection = sections.length <= 1;

    if (isLastSlideInSection && !isLastSection) {
      // Remove the entire section if it only has one slide
      updateSections((prev) => prev.filter((_, i) => i !== currentSectionIndex));
      setCurrentSectionIndex((i) => Math.max(0, i - 1));
      setCurrentSlideIndex(0);
    } else if (isLastSlideInSection && isLastSection) {
      // Last slide in last section — replace with empty slide
      updateSections((prev) =>
        prev.map((s, i) => {
          if (i !== currentSectionIndex) return s;
          return { ...s, slides: [createSlide()] };
        })
      );
      setCurrentSlideIndex(0);
    } else {
      // Normal case: remove slide from section
      updateSections((prev) =>
        prev.map((s, i) => {
          if (i !== currentSectionIndex) return s;
          return { ...s, slides: s.slides.filter((slide) => slide.id !== slideId) };
        })
      );
      setCurrentSlideIndex((i) => Math.max(0, Math.min(i, section.slides.length - 2)));
    }
    setPlayKey((k) => k + 1);
  }, [updateSections, currentSectionIndex, sections]);

  const duplicateSlide = useCallback((slideId: string) => {
    const section = sections[currentSectionIndex];
    if (!section) return null;

    const slideIndex = section.slides.findIndex((s) => s.id === slideId);
    if (slideIndex === -1) return null;

    const originalSlide = section.slides[slideIndex];

    // Deep clone slide with fresh layer IDs
    const clonedSlide = JSON.parse(JSON.stringify(originalSlide));
    clonedSlide.id = generateId('slide');
    if (clonedSlide.layers) {
      clonedSlide.layers = clonedSlide.layers.map((l: any) => ({
        ...l,
        id: generateId('layer'),
      }));
    }

    // Deep clone stage layers with fresh IDs for true independence
    const clonedStageLayers = JSON.parse(JSON.stringify(section.stageLayers || [])).map((l: any) => ({
      ...l,
      id: generateId('layer'),
    }));

    // Create new section so stage layers are fully independent
    const newSection = createSection({
      name: section.name,
      stageLayers: clonedStageLayers,
      slides: [clonedSlide],
    });

    const newIdx = currentSectionIndex + 1;
    updateSections((prev) => {
      const result = [...prev];
      result.splice(newIdx, 0, newSection);
      return result;
    });

    setCurrentSectionIndex(newIdx);
    setCurrentSlideIndex(0);
    setPlayKey((k) => k + 1);
    return clonedSlide.id;
  }, [sections, currentSectionIndex, updateSections]);

  const updateSlide = useCallback((slideId: string, updates: Partial<Slide>) => {
    updateSections((sections) =>
      sections.map((s) => ({
        ...s,
        slides: s.slides.map((slide) =>
          slide.id === slideId ? { ...slide, ...updates } : slide
        ),
      }))
    );
  }, [updateSections]);

  // Layer operations
  const addLayer = useCallback((effectType: string, target: 'slide' | 'stage') => {
    const effect = getEffect(effectType);
    if (!effect) return null;

    const config: Record<string, any> = {};
    for (const [key, schema] of Object.entries(effect.configSchema)) {
      config[key] = schema.default;
    }

    const targetLayers = target === 'stage' ? currentStageLayers : currentSlideLayers;
    const maxZ = targetLayers.reduce((max, l) => Math.max(max, l.zIndex), 0);

    const newLayer: Layer = {
      id: generateId('layer'),
      effectType,
      config,
      position: { x: 0, y: 0, unit: '%' },
      size: { width: 100, height: 100, unit: '%' },
      opacity: 1,
      blendMode: 'normal',
      zIndex: maxZ + 1,
      visible: true,
      locked: false,
    };

    if (target === 'stage') {
      updateSections((sections) =>
        sections.map((s, i) => {
          if (i !== currentSectionIndex) return s;
          return { ...s, stageLayers: [...s.stageLayers, newLayer] };
        })
      );
    } else {
      updateSections((sections) =>
        sections.map((s, i) => {
          if (i !== currentSectionIndex) return s;
          return {
            ...s,
            slides: s.slides.map((slide, j) => {
              if (j !== currentSlideIndex) return slide;
              return { ...slide, layers: [...slide.layers, newLayer] };
            }),
          };
        })
      );
    }

    setSelectedLayerId(newLayer.id);
    return newLayer.id;
  }, [currentStageLayers, currentSlideLayers, currentSectionIndex, currentSlideIndex, updateSections]);

  const removeLayer = useCallback((layerId: string) => {
    // Check if it's a stage layer or slide layer
    const isStageLayer = currentStageLayers.some((l) => l.id === layerId);

    if (isStageLayer) {
      updateSections((sections) =>
        sections.map((s, i) => {
          if (i !== currentSectionIndex) return s;
          return { ...s, stageLayers: s.stageLayers.filter((l) => l.id !== layerId) };
        })
      );
    } else {
      updateSections((sections) =>
        sections.map((s, i) => {
          if (i !== currentSectionIndex) return s;
          return {
            ...s,
            slides: s.slides.map((slide, j) => {
              if (j !== currentSlideIndex) return slide;
              return { ...slide, layers: slide.layers.filter((l) => l.id !== layerId) };
            }),
          };
        })
      );
    }

    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  }, [currentStageLayers, currentSectionIndex, currentSlideIndex, selectedLayerId, updateSections]);

  const updateLayerConfig = useCallback((layerId: string, config: Record<string, any>) => {
    const isStageLayer = currentStageLayers.some((l) => l.id === layerId);

    if (isStageLayer) {
      updateSections((sections) =>
        sections.map((s, i) => {
          if (i !== currentSectionIndex) return s;
          return {
            ...s,
            stageLayers: s.stageLayers.map((l) =>
              l.id === layerId ? { ...l, config } : l
            ),
          };
        })
      );
    } else {
      updateSections((sections) =>
        sections.map((s, i) => {
          if (i !== currentSectionIndex) return s;
          return {
            ...s,
            slides: s.slides.map((slide, j) => {
              if (j !== currentSlideIndex) return slide;
              return {
                ...slide,
                layers: slide.layers.map((l) =>
                  l.id === layerId ? { ...l, config } : l
                ),
              };
            }),
          };
        })
      );
    }

    // Debounced auto-replay: restart effect animations after config changes settle
    if (configReplayTimeoutRef.current) {
      clearTimeout(configReplayTimeoutRef.current);
    }
    configReplayTimeoutRef.current = setTimeout(() => {
      configReplayTimeoutRef.current = null;
      setPlayKey((k) => k + 1);
    }, 750);
  }, [currentStageLayers, currentSectionIndex, currentSlideIndex, updateSections]);

  const updateLayer = useCallback((layerId: string, updates: Partial<Layer>) => {
    const isStageLayer = currentStageLayers.some((l) => l.id === layerId);

    if (isStageLayer) {
      updateSections((sections) =>
        sections.map((s, i) => {
          if (i !== currentSectionIndex) return s;
          return {
            ...s,
            stageLayers: s.stageLayers.map((l) =>
              l.id === layerId ? { ...l, ...updates } : l
            ),
          };
        })
      );
    } else {
      updateSections((sections) =>
        sections.map((s, i) => {
          if (i !== currentSectionIndex) return s;
          return {
            ...s,
            slides: s.slides.map((slide, j) => {
              if (j !== currentSlideIndex) return slide;
              return {
                ...slide,
                layers: slide.layers.map((l) =>
                  l.id === layerId ? { ...l, ...updates } : l
                ),
              };
            }),
          };
        })
      );
    }
  }, [currentStageLayers, currentSectionIndex, currentSlideIndex, updateSections]);

  const reorderLayers = useCallback((orderedIds: string[], target: 'slide' | 'stage') => {
    const maxZ = orderedIds.length;
    const zMap = new Map<string, number>();
    orderedIds.forEach((id, index) => {
      zMap.set(id, maxZ - index);
    });

    if (target === 'stage') {
      updateSections((sections) =>
        sections.map((s, i) => {
          if (i !== currentSectionIndex) return s;
          return {
            ...s,
            stageLayers: s.stageLayers.map((l) => {
              const newZ = zMap.get(l.id);
              return newZ !== undefined ? { ...l, zIndex: newZ } : l;
            }),
          };
        })
      );
    } else {
      updateSections((sections) =>
        sections.map((s, i) => {
          if (i !== currentSectionIndex) return s;
          return {
            ...s,
            slides: s.slides.map((slide, j) => {
              if (j !== currentSlideIndex) return slide;
              return {
                ...slide,
                layers: slide.layers.map((l) => {
                  const newZ = zMap.get(l.id);
                  return newZ !== undefined ? { ...l, zIndex: newZ } : l;
                }),
              };
            }),
          };
        })
      );
    }
  }, [currentSectionIndex, currentSlideIndex, updateSections]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    const layer = [...currentStageLayers, ...currentSlideLayers].find((l) => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { visible: !layer.visible });
    }
  }, [currentStageLayers, currentSlideLayers, updateLayer]);

  const replay = useCallback(() => {
    setPlayKey((k) => k + 1);
  }, []);

  const load = useCallback(async (id: string) => {
    await loadPresentation(id);
    window.history.replaceState(null, '', `?id=${id}`);
  }, []);

  const setTitle = useCallback((title: string) => {
    setPresentationTitle(title);
    setPresentation((prev) => (prev ? { ...prev, title } : prev));
  }, []);

  return {
    // Presentation data
    presentation,
    presentationId,
    presentationTitle,
    isLoading,
    isDirty,

    // Navigation
    sections,
    currentSectionIndex,
    currentSlideIndex,
    currentSection,
    currentSlide,
    currentStageLayers,
    currentSlideLayers,

    // Navigation actions
    navigateToSlide,
    navigateNext,
    navigatePrevious,
    navigateToSection,

    // Section CRUD
    addSection,
    removeSection,
    updateSection,
    renameSection,

    // Slide CRUD
    addSlide,
    removeSlide,
    duplicateSlide,
    updateSlide,

    // Layer operations
    addLayer,
    removeLayer,
    updateLayerConfig,
    updateLayer,
    reorderLayers,
    toggleLayerVisibility,

    // Selected layer
    selectedLayerId,
    setSelectedLayerId,
    selectedLayer,

    // Replay
    playKey,
    replay,

    // Persistence
    save: savePresentation,
    load,
    setTitle,
  };
}
