'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, FolderOpen } from 'lucide-react';
import { Section } from '@/types/presentation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface SectionManagerProps {
  sections: Section[];
  currentSectionIndex: number;
  onNavigateToSection: (index: number) => void;
  onAddSection: (name?: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onRenameSection: (sectionId: string, name: string) => void;
}

export function SectionManager({
  sections,
  currentSectionIndex,
  onNavigateToSection,
  onAddSection,
  onRemoveSection,
  onRenameSection,
}: SectionManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isOpen, setIsOpen] = useState(true); // Expanded by default

  const currentSection = sections[currentSectionIndex];

  const handleStartEdit = (section: Section) => {
    setEditingId(section.id);
    setEditValue(section.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      onRenameSection(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="space-y-2">
      {/* Current section indicator */}
      {currentSection && (
        <div className="px-2 py-1.5 bg-primary/10 border border-primary/20 rounded-md">
          <div className="text-xs text-muted-foreground">Current Section</div>
          <div className="text-sm font-medium text-foreground">{currentSection.name}</div>
        </div>
      )}

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
              <FolderOpen className="h-3 w-3" />
              All Sections
              <span className="text-[10px] font-normal normal-case">
                ({sections.length})
              </span>
            </button>
          </CollapsibleTrigger>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onAddSection()}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="dark z-250">Add section</TooltipContent>
          </Tooltip>
        </div>

      <CollapsibleContent>
        <ScrollArea className="max-h-[150px] mt-2">
          <div className="space-y-0.5">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={cn(
                  'group flex items-center gap-1 px-2 py-1.5 rounded-sm transition-colors',
                  index === currentSectionIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                )}
              >
                {editingId === section.id ? (
                  <>
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="h-6 text-xs flex-1"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={handleSaveEdit}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onNavigateToSection(index)}
                      className="flex-1 text-left text-sm truncate"
                    >
                      {section.name}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {section.slides.length} slide{section.slides.length !== 1 ? 's' : ''}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(section);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="dark z-250">Rename</TooltipContent>
                      </Tooltip>

                      {sections.length > 1 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveSection(section.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="dark z-250">Delete</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
    </div>
  );
}
