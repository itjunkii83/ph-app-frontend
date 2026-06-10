# Wisdom — Product Vision & Architecture Direction

> This document captures the strategic direction for Wisdom. It should be read alongside CLAUDE.md (which describes what exists today). This document describes where we're going.

## What We're Building

Wisdom is a **motivational presentation platform** where AI creates customized presentations on behalf of users. Users never build their own presentations — they provide goals, and the software generates personalized motivational presentations using predefined templates.

### User Experience (End State)
1. User provides their goals/intentions
2. AI selects an appropriate **Presentation Template**
3. AI fills content slots (quotes, motivational text) customized to the user
4. Software calculates slide duration based on content length (character count)
5. Presentation plays with cinematic effects and transitions
6. Optionally: user clicks to advance between slides (slide animates in → waits for click → animates out)

### Internal Team Goal
We are building **Canva for motivational presentations** on the backend — a Presentation Template Builder that draws from a library of predefined effects.

---

## Three Distinct Systems

### 1. Effect Workbench (Developer Tool)
Where effects are built, tested, and saved. Flow: edit code → refresh → see in sandbox → save → effect becomes available in the Template Builder.

**Reference material:** `tools/codepen/pens/` contains ~28 extracted CodePens representing the range of effects we want (text animations, Three.js backgrounds, particle effects, image transitions, GSAP text reveals, etc.)

### 2. Presentation Template Builder (Internal Team Tool)
The "Canva editor" — compose templates by arranging sections, slides, backgrounds, and effects. Templates have **content slots** (not hardcoded text) that the AI fills later. This is what the sandbox (`/sandbox`) evolves into.

### 3. AI Presentation Generator (User-Facing Product)
User goals → template selection → content generation → duration calculation → ready to play. Built last, simplest once systems 1 and 2 are solid.

---

## Core Architecture Decisions

### Effects Own Their Full Lifecycle
**This is the most important architectural principle.**

An effect is "all encompassing" — it answers:
- How does it **transition in**? (fade in, scale up, text reveal, etc.)
- What does it **do on screen**? (ken burns, slow bounce, heartbeat, particle drift, etc.)
- How does it **transition out**? (fade out, dissolve, etc.)

This means effects are NOT composed as "BasicText + separate enter animation + separate loop + separate exit." Instead, each effect is a self-contained unit like "TextRevealBounce" that handles everything internally.

**What this replaces:** The current `LayerAnimations` system (enter/loop/exit as separate configs in `lib/animations/`) gets absorbed INTO each effect. The effect component itself orchestrates its own GSAP timeline or CSS animations.

### Effects Take Zero or One Content Input
- **Zero inputs** (ambient): particle backgrounds, Three.js scenes, cloud animations — they just render
- **One input** (content): text effects take a string, image effects take an image URL

This keeps the model clean while supporting the full range of effects in our CodePen collection.

### Effect Config Schema = Template Builder Controls
Each effect exposes a `configSchema` that defines the ONLY settings available in the Template Builder. These are intentionally limited — determined during effect development. Internal animation parameters are NOT exposed.

Example for a "TextRevealBounce" effect:
- Exposed: `text`, `fontFamily`, `fontSize`, `color`, `speed` (slow/medium/fast)
- NOT exposed: individual GSAP tween values, easing curves, split-text character delays

### Presentation Structure
```
Presentation (parent)
├── Sections
│   ├── Background: image OR effect background (e.g., Three.js particles)
│   ├── Fit type: fill, cover, contain, etc.
│   ├── Effects applied to section level
│   └── Slides (children of sections)
│       ├── Text elements only
│       └── Effects applied to slide level
```

### Template vs. Content Separation (Future)
Templates define structure + effect assignments with **content slots**.
A "rendered presentation" = template + AI-generated content.
This separation is what makes AI generation possible.

---

## Effect Definition Schema (Target)

```typescript
interface EffectDefinition {
  id: string;                          // 'text-reveal-bounce'
  name: string;                        // 'Text Reveal Bounce'
  category: EffectCategory;            // 'text' | 'background' | 'image' | 'ambient'
  technology: RenderTechnology;        // 'css' | 'canvas' | 'webgl' | 'html'

  // What content does this effect accept?
  contentInput: 'none' | 'text' | 'image';

  // Only these settings are exposed in the Template Builder
  configSchema: ConfigSchema;

  // The component handles its own enter/active/exit lifecycle
  component: React.ComponentType<EffectProps>;

  // Lifecycle hooks for the playback engine
  // The engine calls: play() → effect runs enter → active → exit → onComplete
  // Duration is either fixed (ambient) or calculated from content (text)
  defaultDuration: number | 'auto';    // 'auto' = calculate from content

  performanceCost: 'low' | 'medium' | 'high';
}

interface EffectProps {
  config: Record<string, any>;         // Values from configSchema
  contentInput?: string;               // The text or image URL (if applicable)
  phase: 'enter' | 'active' | 'exit' | 'idle';  // Current lifecycle phase
  onPhaseComplete?: (phase: string) => void;      // Signal phase completion to engine
  containerRef?: React.RefObject<HTMLDivElement>;  // Parent container
}
```

---

## Implementation Phases

### Phase A: Effect Model (Current Priority)
Redesign the effect system so effects own their full lifecycle. Port 3-5 CodePens to prove the model. This is the hardest and most important phase.

### Phase B: Template Abstraction
Add content slots to the presentation model. Templates have structure + placeholders. Rendered presentations = template + content.

### Phase C: Playback Engine
Duration-per-slide from content length. Click-to-advance mode. Transition sequencing.

### Phase D: AI Generation
Template selection + content generation pipeline. Built on top of everything else.

---

## Key Reference Files
- `tools/codepen/pens/` — 28 CodePens showing the range of effects we want
- `tools/codepen/pens.json` — Index with tags (text, bg, three.js, gsap, img, etc.)
- `components/effects/registry.ts` — Current effect registry
- `lib/animations/` — Current animation system (being refactored INTO effects)
- `types/effects.ts` — Current effect types (being redesigned)
- `types/presentation.ts` — Presentation/Section/Slide/Layer types

---

*Last updated: February 5, 2026*
