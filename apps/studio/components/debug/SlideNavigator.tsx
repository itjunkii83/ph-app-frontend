'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Copy, Trash2 } from 'lucide-react';
import { Section, Slide } from '@/types/presentation';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SlideNavigatorProps {
  sections: Section[];
  currentSectionIndex: number;
  currentSlideIndex: number;
  onNavigateToSlide: (sectionIndex: number, slideIndex: number) => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onAddSlide: () => void;
  onDuplicateSlide?: (slideId: string) => void;
  onRemoveSlide?: (slideId: string) => void;
}

export function SlideNavigator({
  sections,
  currentSectionIndex,
  currentSlideIndex,
  onNavigateToSlide,
  onNavigatePrevious,
  onNavigateNext,
  onAddSlide,
  onDuplicateSlide,
  onRemoveSlide,
}: SlideNavigatorProps) {
  const currentSection = sections[currentSectionIndex];
  const slides = currentSection?.slides || [];
  const currentSlide = slides[currentSlideIndex];

  // Calculate total slides across all sections for display
  const totalSlides = sections.reduce((sum, s) => sum + s.slides.length, 0);

  // Calculate global slide number
  let globalSlideNumber = currentSlideIndex + 1;
  for (let i = 0; i < currentSectionIndex; i++) {
    globalSlideNumber += sections[i].slides.length;
  }

  const canGoPrevious = currentSlideIndex > 0 || currentSectionIndex > 0;
  const canGoNext =
    currentSlideIndex < slides.length - 1 ||
    currentSectionIndex < sections.length - 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Slides
        </h4>
        <span className="text-xs text-muted-foreground">
          {globalSlideNumber} / {totalSlides}
        </span>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onNavigatePrevious}
              disabled={!canGoPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="dark z-250">Previous slide</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onNavigateNext}
              disabled={!canGoNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="dark z-250">Next slide</TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onAddSlide}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="dark z-250">Add slide</TooltipContent>
        </Tooltip>

        {currentSlide && onDuplicateSlide && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDuplicateSlide(currentSlide.id)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="dark z-250">Duplicate slide</TooltipContent>
          </Tooltip>
        )}

        {currentSlide && onRemoveSlide && slides.length > 1 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onRemoveSlide(currentSlide.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="dark z-250">Delete slide</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Slide Thumbnails */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => onNavigateToSlide(currentSectionIndex, index)}
              className={cn(
                'shrink-0 w-16 h-10 rounded border-2 transition-colors',
                'bg-zinc-900 hover:bg-zinc-800',
                'flex items-center justify-center text-xs font-medium',
                index === currentSlideIndex
                  ? 'border-primary text-primary'
                  : 'border-border text-muted-foreground hover:border-muted-foreground'
              )}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Section indicator (if multiple sections) */}
      {sections.length > 1 && (
        <div className="text-xs text-muted-foreground">
          Section: {currentSection?.name || 'Untitled'} ({currentSectionIndex + 1}/{sections.length})
        </div>
      )}
    </div>
  );
}
