'use client';

import { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Side-effect import: registers all effects in the registry
import '@/components/effects';

import { SectionRenderer, PresentationStage, useFonts } from '@harbor/player';
import { PresentationToolbar } from '@/components/debug/PresentationToolbar';
import { DebugControlsV2 } from '@/components/debug/DebugControlsV2';
import { usePresentationEditor } from '@/hooks/usePresentationEditor';
import { StudioFontsProvider } from '@/components/fonts/studio-fonts-provider';

function SandboxEditor() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const editor = usePresentationEditor({
    presentationId: initialId,
    autoSaveDelay: 1000,
  });

  // Extract unique font families from all layers (stage + slide)
  const fontFamilies = useMemo(() => {
    const families = new Set<string>();
    [...editor.currentStageLayers, ...editor.currentSlideLayers].forEach((layer) => {
      if (layer.config?.fontFamily) {
        families.add(layer.config.fontFamily);
      }
    });
    return Array.from(families);
  }, [editor.currentStageLayers, editor.currentSlideLayers]);

  // Load fonts and track loading state
  const { loading: fontsLoading } = useFonts(fontFamilies);

  // Show loading state
  if (editor.isLoading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        Loading presentation...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <PresentationToolbar
        sections={editor.sections}
        currentSectionIndex={editor.currentSectionIndex}
        onNavigateToSection={editor.navigateToSection}
        onAddSection={editor.addSection}
        currentSlideIndex={editor.currentSlideIndex}
        onNavigateToSlide={editor.navigateToSlide}
        onNavigatePrevious={editor.navigatePrevious}
        onNavigateNext={editor.navigateNext}
        onAddSlide={editor.addSlide}
        onDuplicateSlide={editor.duplicateSlide}
        onRemoveSlide={editor.removeSlide}
        onReplay={editor.replay}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
          {!fontsLoading && editor.currentSection && (
            <PresentationStage>
              <SectionRenderer
                key={`section-${editor.currentSection.id}`}
                section={editor.currentSection}
                activeSlideIndex={editor.currentSlideIndex}
                isActive={true}
                playKey={editor.playKey}
              />
            </PresentationStage>
          )}
        </div>
        <DebugControlsV2
          stageLayers={editor.currentStageLayers}
          slideLayers={editor.currentSlideLayers}
          selectedLayerId={editor.selectedLayerId}
          onSelectLayer={editor.setSelectedLayerId}
          onAddLayer={editor.addLayer}
          onRemoveLayer={editor.removeLayer}
          onUpdateLayerConfig={editor.updateLayerConfig}
          onUpdateLayer={editor.updateLayer}
          onReorderLayers={editor.reorderLayers}
          onToggleVisibility={editor.toggleLayerVisibility}
          presentationId={editor.presentationId}
          onSave={editor.save}
          onLoad={editor.load}
          currentSectionName={editor.currentSection?.name}
          currentSlideIndex={editor.currentSlideIndex}
          currentSectionIndex={editor.currentSectionIndex}
        />
      </div>
    </div>
  );
}

export default function SandboxPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: '100vw',
            height: '100vh',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          Loading...
        </div>
      }
    >
      <StudioFontsProvider>
        <SandboxEditor />
      </StudioFontsProvider>
    </Suspense>
  );
}
