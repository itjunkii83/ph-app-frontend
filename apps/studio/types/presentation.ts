export interface LayerPosition {
  x: number;
  y: number;
  unit: 'px' | '%' | 'vw' | 'vh';
}

export interface LayerSize {
  width: number;
  height: number;
  unit: 'px' | '%' | 'vw' | 'vh';
}

export interface TransitionConfig {
  type: string;
  duration: number;
  easing: string;
}

export interface Layer {
  id: string;
  effectType: string;
  config: Record<string, any>;
  position: LayerPosition;
  size: LayerSize;
  opacity: number;
  blendMode: string;
  zIndex: number;
  visible: boolean;
  locked: boolean;
}

export interface Slide {
  id: string;
  layers: Layer[];
  duration: number;
  transition?: TransitionConfig;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Section {
  id: string;
  name: string;
  stageLayers: Layer[];      // Persistent background/effects for this section
  slides: Slide[];           // Content slides within section
  transition?: TransitionConfig;
}

export interface PresentationSettings {
  defaultTransition: TransitionConfig;
  autoPlay: boolean;
  loop: boolean;
  baseWidth: number;
  baseHeight: number;
}

export interface Presentation {
  id: string;
  title: string;
  description?: string;
  sections?: Section[];      // NEW: Section-based (preferred)
  slides: Slide[];           // LEGACY: Flat array (backward compat)
  settings: PresentationSettings;
  fonts: string[];
  createdAt?: any;
  updatedAt?: any;
  ownerId?: string;
}
