# Effect System Guide

Reference document for building and maintaining visual effects in the Wisdom presentation engine. **Read this before creating, modifying, or debugging any effect.**

> **Effects now live in `@harbor/player`, not in this app.** The concepts below
> (lifecycle, SplitText, duration/speed, config schema, CodePen porting) still
> apply, but the source paths moved: effects are under
> `packages/player/src/components/effects/`, the registry is
> `packages/player/src/components/effects/registry.ts`, and registration is
> `packages/player/src/registerEffects.ts` (the old `components/effects/index.ts`
> here is a re-export shim). Effect internal sizes use the responsive helpers in
> `packages/player/src/lib/responsive.ts`. See
> [PLAYBACK.md](../../../packages/player/docs/PLAYBACK.md).

## Architecture Overview

Effects are self-registering React components that plug into the rendering pipeline:

```
Slide { layers[] }
  → SlideRenderer (sorts by zIndex)
    → LayerRenderer (position, size, opacity, blendMode)
      → EffectRenderer (registry lookup, duration calculation)
        → EffectComponent (renders the visual, owns its lifecycle)
```

Each effect exports an `EffectDefinition` and registers via `registerEffect()` in `components/effects/index.ts`.

### Key Files

| File | Purpose |
|------|---------|
| `types/effects.ts` | `EffectProps`, `EffectDefinition`, `ConfigSchema` types |
| `components/effects/registry.ts` | Map-based registry (`registerEffect`, `getEffect`, `getAllEffects`) |
| `components/effects/index.ts` | Registration hub — all effects imported and registered here |
| `hooks/useEffectLifecycle.ts` | GSAP-based lifecycle state machine (enter → active → exit) |
| `lib/effects/speed.ts` | Speed multipliers: slow=1.5, medium=1.0, fast=0.6 |
| `lib/duration.ts` | Auto reading duration calculator (200 wpm, min 3s, max 30s) |
| `components/engine/EffectRenderer.tsx` | Resolves effect, computes `durationMs`, renders component |

## Creating a New Effect

### Step 1: Create the Component File

Place it in the appropriate category folder under `components/effects/`:
- `text/` — Text-based effects
- `backgrounds/` — Static or animated backgrounds
- `ambient/` — Environmental/atmospheric effects
- `image/` — Image-based effects

### Step 2: Define the Config Schema

The `configSchema` drives the sandbox debug panel UI automatically. Each field maps to a shadcn form control.

```typescript
const configSchema: ConfigSchema = {
  text:       { type: 'string',  label: 'Text',        default: '' },
  fontFamily: { type: 'font',    label: 'Font Family',  default: 'Lato' },
  fontSize:   { type: 'number',  label: 'Font Size',    default: 48, min: 12, max: 200, step: 1 },
  color:      { type: 'color',   label: 'Color',        default: '#ffffff' },
  speed:      { type: 'select',  label: 'Speed',        default: 'medium',
    options: [
      { label: 'Slow', value: 'slow' },
      { label: 'Medium', value: 'medium' },
      { label: 'Fast', value: 'fast' },
    ],
  },
};
```

Available field types: `string`, `number`, `boolean`, `color`, `select`, `image`, `font`, `range`.

### Step 3: Implement the Component

The component receives `EffectProps`:

```typescript
interface EffectProps {
  config: Record<string, any>;  // Values from configSchema
  isActive: boolean;            // Whether the effect should be playing
  onComplete?: () => void;      // Signal lifecycle completion
  durationMs?: number;          // Auto-calculated or fixed duration
}
```

**For static effects** (no animation): just render JSX. See `BasicText.tsx`.

**For animated effects**: use the `useEffectLifecycle` hook. See `DreamySmoke.tsx` (most complete example).

### Step 4: Export the Definition

```typescript
export const myEffectDefinition: EffectDefinition = {
  id: 'my-effect',              // Unique kebab-case ID
  name: 'My Effect',            // Display name in sandbox
  category: 'text',             // Controls which category it appears under
  technology: 'html',           // css | canvas | webgl | svg | html
  contentInput: 'text',         // none | text | image
  configSchema,
  component: MyEffect,
  duration: { type: 'auto' },   // auto | fixed | indefinite
  performanceCost: 'medium',    // low | medium | high
  description: 'What this effect does',
};
```

### Step 5: Register It

1. Add export to the category's `index.ts` (e.g., `components/effects/text/index.ts`)
2. Import and call `registerEffect()` in `components/effects/index.ts`

## Effect Lifecycle

The `useEffectLifecycle` hook manages a state machine:

```
idle → enter → active → exit → complete
```

You provide GSAP timeline/tween builder callbacks:

| Callback | When | Purpose |
|----------|------|---------|
| `buildEnter(el)` | `isActive` becomes true | Intro animation (fade in, reveal, etc.) |
| `buildActive(el, durationSec)` | Enter completes | Ongoing animation (zoom, drift, etc.) |
| `buildExit(el)` | Duration expires or `isActive` becomes false | Outro animation (fade out, dissolve, etc.) |
| `resetToIdle(el)` | After exit completes, or before re-entering | Clear GSAP props, revert SplitText |
| `onDispose()` | Component unmounts | Final cleanup |

**Exit triggering**: When `durationMs` is provided and no `buildActive` is supplied, the hook auto-triggers exit after the duration expires. If `buildActive` is provided, it manages its own timing. For `indefinite` effects, exit only triggers when `isActive` changes to `false`.

### Container Pattern

Always start the container invisible and reveal in `buildEnter`:

```tsx
<div ref={containerRef} style={{ opacity: 0, width: '100%', height: '100%', /* ... */ }}>
  {/* content */}
</div>
```

```typescript
const buildEnter = useCallback((el: HTMLElement) => {
  const tl = gsap.timeline();
  tl.set(el, { opacity: 1 });
  // ... enter animation
  return tl;
}, []);
```

## Duration Modes

| Mode | Behavior | Use For |
|------|----------|---------|
| `{ type: 'auto' }` | Calculated from text length (200 wpm, 3–30s range) | Text effects |
| `{ type: 'fixed', ms: 8000 }` | Exact milliseconds | Image effects, timed sequences |
| `{ type: 'indefinite' }` | No timeout, stays until `isActive` flips | Backgrounds, ambient loops |

Effects can override the auto-calculated duration via a user-facing config field (see DreamySmoke's `duration` field).

## Speed System

All animated effects should support the speed config field. Apply the multiplier to all GSAP durations and staggers:

```typescript
const multiplier = SPEED_MULTIPLIERS[speed] ?? 1;

// In animations:
{ duration: 0.8 * multiplier }
{ stagger: { each: 0.06 * multiplier } }
```

| Speed | Multiplier | Effect |
|-------|-----------|--------|
| slow | 1.5 | 50% slower |
| medium | 1.0 | Normal |
| fast | 0.6 | 40% faster |

## Critical Rules for Text Effects

### SplitText: Always Split Before Visible

When using GSAP `SplitText` for per-character or per-word animations:

**Split during `buildEnter`**, not during `buildExit`. SplitText wraps characters/words in `inline-block` elements which changes how the browser calculates line breaks. If you split at exit time, the text reflows visibly and causes a jarring shift.

```typescript
// CORRECT: Split in buildEnter (before text is visible)
const buildEnter = useCallback((el: HTMLElement) => {
  splitRef.current = new SplitText(textEl, { type: 'words,chars' });
  // ... enter animation on the whole text element
  return tl;
}, []);

const buildExit = useCallback((el: HTMLElement) => {
  const chars = splitRef.current?.chars;  // Use already-split chars
  // ... animate individual chars
  return tl;
}, []);
```

```typescript
// WRONG: Split in buildExit (causes visible reflow)
const buildExit = useCallback((el: HTMLElement) => {
  const split = new SplitText(textEl, { type: 'chars' });  // Text jumps!
  // ...
}, []);
```

### SplitText: Never Break Words Across Lines

When splitting into characters, **always include `words` in the split type** so characters are nested inside word-level wrappers. Without word wrappers, each character is an independent `inline-block` element and the browser can line-break between any two characters — splitting words across lines.

```typescript
// CORRECT: Words stay together
new SplitText(textEl, {
  type: 'words,chars',         // Characters nested inside word wrappers
  charsClass: 'smoke-char',
  wordsClass: 'smoke-word',
});

// WRONG: Words can break across lines
new SplitText(textEl, {
  type: 'chars',               // No word wrappers — "dreamy" can become "drea" / "my"
  charsClass: 'smoke-char',
});
```

### Use `overflowWrap`, Not `wordBreak`

For text containers, prefer `overflowWrap: 'break-word'` over `wordBreak: 'break-word'`. The `wordBreak` property is more aggressive and can break words mid-character even when SplitText word wrappers are present.

```typescript
// CORRECT
style={{ overflowWrap: 'break-word' }}

// AVOID for text effects
style={{ wordBreak: 'break-word' }}
```

### Always Revert SplitText

SplitText modifies the DOM by wrapping text in spans. Always revert in `resetToIdle` and `onDispose`:

```typescript
const resetToIdle = useCallback((el: HTMLElement) => {
  if (splitRef.current) {
    splitRef.current.revert();
    splitRef.current = null;
  }
  gsap.set(el, { clearProps: 'opacity' });
}, []);
```

## Porting Effects from CodePen References

Reference pens are stored in `tools/codepen/pens/`. They get there via the CodePen extractor — see [docs/CODEPEN.md](../../../docs/CODEPEN.md) for how a pen is downloaded, compiled to standalone HTML, and cataloged. When adapting a CodePen into a Wisdom effect:

### Process

1. **Read the pen** — understand the HTML structure, CSS animations, and JS logic
2. **Identify the core technique** — what makes it visually distinctive (CSS keyframes? GSAP timeline? Canvas? WebGL?)
3. **Map to Wisdom patterns**:
   - CSS `@keyframes` → GSAP timelines in lifecycle callbacks (or dynamic `<style>` injection like CloudyBackground)
   - Hover/click triggers → lifecycle phases (enter on activate, exit on duration expiry)
   - Hardcoded values → `configSchema` fields for the sandbox UI
   - Fixed fonts/colors → configurable via `font` and `color` field types
4. **Use `fromTo` instead of `from`** — GSAP `from` tweens revert to inline CSS when done, which may not have the values you want. `fromTo` explicitly sets both start and end states.
5. **Wrap in the lifecycle** — use `useEffectLifecycle` for enter/exit control
6. **Test the full cycle** — enter, hold, exit, replay. Watch for reflow, stuck animations, or leftover DOM modifications.

### Available CodePen References

```
tools/codepen/pens/
├── Text Effects
│   ├── dream_dangerously_smoky_text_on_hover.html  → DreamySmoke (implemented)
│   ├── masked_text_reveal_gsap_splittext.html       → MaskedTextReveal (implemented)
│   ├── splittext_scrambletext.html
│   ├── splittext_random_order.html
│   ├── gsap_animate_text.html
│   ├── text_animation.html
│   ├── glow_sparks_text.html
│   ├── hyperspace_text.html
│   ├── css_glitchy_text_reveal_w_splittingjs.html
│   ├── course_clear_splittingjs_demo.html
│   ├── robust_cssonly_typewriter_effect_steps_vars.html
│   ├── circular_text_effect_1.html
│   ├── circular_text_effect_2.html
│   └── circular_text_effect_3.html
├── Background/Ambient
│   ├── cloudy_animated_background.html              → CloudyBackground (implemented)
│   ├── live_clouds.html
│   ├── scss_cloud.html
│   ├── horizon.html
│   └── crystals.html
├── Image Effects
│   ├── shattering_images.html
│   └── three_image_transition.html
├── 3D / WebGL
│   ├── three_text_animation_1.html
│   ├── three_text_animation_2.html
│   ├── three_text_animation_3.html
│   ├── three_text_animation_4.html
│   └── three_text_animation_5.html
├── Interactive / Particle
│   ├── interactive_particle_logo.html
│   └── apple_liquid_glass_switcher.html
└── GSAP Utility
    └── flip_for_gsap.html
```

### Common Gotchas When Porting

- **Hover-triggered animations** → Convert to lifecycle phases. Hover start = `buildEnter`, hover end = `buildExit`.
- **Viewport units (vw/vh/vmin)** → Usually fine as-is since effects render in a full-viewport container. Convert to px for configurable values.
- **External assets (images, fonts)** → Use the `image` config field type for images, `font` field type for fonts (loads from Google Fonts via `useFonts` hook).
- **CSS-only animations** → Can inject via `<style>` + `dangerouslySetInnerHTML` (see CloudyBackground) or convert to GSAP timelines.
- **SplitText vs Splitting.js** — Some pens use Splitting.js. We use GSAP's SplitText plugin exclusively. The API differs but the concept is the same.
- **Canvas/WebGL pens** — Set `technology: 'canvas'` or `'webgl'` in the definition. Handle cleanup in `onDispose`. Use refs for the canvas element.

## Existing Effects Reference

| Effect | Category | Duration | Lifecycle | Technology | Key Feature |
|--------|----------|----------|-----------|------------|-------------|
| BasicText | text | auto | None | css | Static text display |
| DreamySmoke | text | auto | enter + exit | html | Per-char smoke dissipation via SplitText |
| MaskedTextReveal | text | auto | enter + exit | html | Line/word/char masked reveal via SplitText |
| BackgroundImage | background | indefinite | None | css | Static image with CSS filters |
| CloudyBackground | ambient | indefinite | enter + exit | css | Drifting cloud layers via CSS keyframes |
| KenBurnsImage | image | fixed (8s) | enter + active + exit | css | Slow zoom on image |
