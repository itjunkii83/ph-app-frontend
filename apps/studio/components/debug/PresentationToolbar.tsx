'use client';

import React, { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { Section, Slide } from '@/types/presentation';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FlatSlide {
  slide: Slide;
  sectionIndex: number;
  slideIndex: number;
  globalIndex: number;
}

interface PresentationToolbarProps {
  sections: Section[];
  currentSectionIndex: number;
  currentSlideIndex: number;
  onNavigateToSlide: (sectionIndex: number, slideIndex: number) => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onAddSection: (name?: string) => void;
  onNavigateToSection: (index: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (slideId: string) => void;
  onRemoveSlide: (slideId: string) => void;
  onReplay: () => void;
}

export function PresentationToolbar({
  sections,
  currentSectionIndex,
  currentSlideIndex,
  onNavigateToSlide,
  onNavigatePrevious,
  onNavigateNext,
  onAddSlide,
  onDuplicateSlide,
  onRemoveSlide,
  onReplay,
}: PresentationToolbarProps) {
  // Flatten all slides across sections into a single timeline
  const flatSlides = useMemo(() => {
    const result: FlatSlide[] = [];
    sections.forEach((section, sectionIdx) => {
      section.slides.forEach((slide, slideIdx) => {
        result.push({
          slide,
          sectionIndex: sectionIdx,
          slideIndex: slideIdx,
          globalIndex: result.length,
        });
      });
    });
    return result;
  }, [sections]);

  // Find current position in flat list
  const currentGlobalIndex = useMemo(() => {
    return flatSlides.findIndex(
      (f) => f.sectionIndex === currentSectionIndex && f.slideIndex === currentSlideIndex
    );
  }, [flatSlides, currentSectionIndex, currentSlideIndex]);

  const currentSlide = flatSlides[currentGlobalIndex]?.slide || null;
  const totalSlides = flatSlides.length;
  const canGoPrevious = currentGlobalIndex > 0;
  const canGoNext = currentGlobalIndex < totalSlides - 1;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="dark shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-border bg-background text-foreground h-11">
        {/* Prev */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onNavigatePrevious}
              disabled={!canGoPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="dark z-250">Previous slide</TooltipContent>
        </Tooltip>

        {/* Flat slide thumbnails */}
        <ScrollArea className="max-w-[400px]">
          <div className="flex gap-1 py-0.5">
            {flatSlides.map((f) => (
              <button
                key={`${f.sectionIndex}-${f.slideIndex}`}
                onClick={() => onNavigateToSlide(f.sectionIndex, f.slideIndex)}
                className={cn(
                  'shrink-0 w-10 h-6 rounded border transition-colors',
                  'bg-zinc-900 hover:bg-zinc-800',
                  'flex items-center justify-center text-[10px] font-medium',
                  f.globalIndex === currentGlobalIndex
                    ? 'border-primary text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                )}
              >
                {f.globalIndex + 1}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Next */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onNavigateNext}
              disabled={!canGoNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="dark z-250">Next slide</TooltipContent>
        </Tooltip>

        {/* Counter */}
        <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
          {currentGlobalIndex + 1}/{totalSlides}
        </span>

        <div className="w-px h-5 bg-border" />

        {/* Slide Actions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddSlide()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="dark z-250">Add slide</TooltipContent>
        </Tooltip>

        {currentSlide && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onDuplicateSlide(currentSlide.id)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="dark z-250">Duplicate slide</TooltipContent>
          </Tooltip>
        )}

        {currentSlide && totalSlides > 1 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onRemoveSlide(currentSlide.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="dark z-250">Delete slide</TooltipContent>
          </Tooltip>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Replay */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReplay}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="dark z-250">Replay animations</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
