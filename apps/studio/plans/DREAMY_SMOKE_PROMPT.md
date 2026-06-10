# Dreamy Smoke Effect — Claude Code Implementation Prompt

Read `CLAUDE.md` and `VISION.md` for project context.

## Task

Build a new text effect called "Dreamy Smoke" based on the CodePen at `tools/codepen/pens/dream_dangerously_smoky_text_on_hover.html`. Read that file first to understand the visual.

This effect displays text that fades in as a whole unit (with blur), holds visible for a calculated reading duration, then each character individually "smokes away" — rotating, translating, skewing, scaling up, blurring, and fading to 0. The smoke-out has a shuffled stagger so characters dissipate in a random-ish order, not left-to-right.

## File Location

`components/effects/text/DreamySmoke.tsx`

Also update `components/effects/text/index.ts` to export the definition, and `components/effects/index.ts` to register it.

## Effect Definition

```typescript
{
  id: 'dreamy-smoke',
  name: 'Dreamy Smoke',
  category: 'text',
  technology: 'html',
  contentInput: 'text',
  duration: { type: 'auto' },
  performanceCost: 'medium',
  description: 'Text fades in with a soft blur, holds for reading time, then each character smokes away in a shuffled order',
}
```

## Config Schema

Expose these settings only:

- `text` — string, default `''`
- `fontFamily` — font picker, default `'Playfair Display'`
- `fontSize` — number, min 12 max 200, default 64
- `fontWeight` — select: 300, 400, 500, 600, 700, 800. Default `'700'`
- `fontStyle` — select: normal, italic. Default `'italic'` (matches the pen's aesthetic)
- `color` — color, default `'#f5f5f5'`
- `speed` — select: slow/medium/fast. Default `'medium'`
- `textAlign` — select: left/center/right. Default `'center'`

Do NOT expose: glow color, smoke rotation angle, skew amount, blur values, stagger timing details. These are internal.

## Lifecycle Behavior

Use `useEffectLifecycle` hook from `hooks/useEffectLifecycle.ts`. Use `SPEED_MULTIPLIERS` from `lib/effects/speed.ts`. Study the existing `MaskedTextReveal.tsx` for patterns — this effect follows the same structure.

### Enter Phase (buildEnter)

Fade the entire container in as one unit. Replicate the pen's `fade-in` keyframe:
- From: `opacity: 0`, `y: 20px` (slight upward drift), `filter: blur(8px)`
- To: `opacity: 1`, `y: 0`, `filter: blur(0.5px)` (the pen keeps a tiny residual blur for atmosphere)
- Duration: `0.8s * speedMultiplier`
- Ease: `power2.out`

Also apply a text-shadow glow. Derive the glow color from the text `color` config — use the same color at reduced opacity (e.g., `text-shadow: 0 0 20px rgba(r, g, b, 0.5)`). Don't expose this as a setting. You can use a simple hex-to-rgba helper function inline.

### Active Phase

Text stays visible with the subtle text-shadow glow. The `durationMs` is passed in by the engine (calculated from reading time). No animation during this phase — just hold.

Don't use `buildActive` — let the hook's internal timer handle the hold duration. The active phase ends when the engine sets `isActive=false`.

### Exit Phase (buildExit)

This is the signature part. When exit triggers:

1. **Split the text into individual characters** using GSAP SplitText (already available, see MaskedTextReveal for the import pattern). Split type: `chars`. Wrap each character in an inline-block span.

2. **Shuffle the stagger order.** The pen's magic is that characters don't smoke out left-to-right — they go in a pseudo-random order. Use GSAP's stagger with `from: "random"` to achieve this. This gives the organic dissipation feel without us manually assigning delays.

3. **Animate each character** with the pen's `smoke` keyframe translated to GSAP:
   - `rotation: 15`
   - `x: "85%"` 
   - `y: "-75%"`
   - `skewX: -30`
   - `scale: 2`
   - `opacity: 0`
   - `filter: "blur(10px)"`
   - Duration per character: `1.2s * speedMultiplier`
   - Stagger: `0.06s * speedMultiplier` (with `from: "random"`)
   - Ease: `power1.in`

4. The total exit duration scales naturally with character count because of the stagger — more characters = longer total dissipation. This is correct behavior.

### Cleanup (resetToIdle / onDispose)

- Revert SplitText (same pattern as MaskedTextReveal)
- Clear GSAP-set properties on the container
- Kill any active tweens

## Important Implementation Notes

- The SplitText split should happen at the START of buildExit, not during enter or mount. During enter and active phases, the text is just normal unsplit DOM. Only split when we need per-character control for the smoke-out.
- `useFonts([fontFamily])` to load the Google Font dynamically (same as BasicText and MaskedTextReveal).
- The container should start at `opacity: 0` in the JSX (same pattern as MaskedTextReveal) so there's no flash before enter runs.
- Text should be centered in the container with flexbox, with `maxWidth: 80%` and `whiteSpace: pre-wrap` for multiline support.
- The `filter: blur(0.5px)` residual during active phase gives the text a soft dreamy quality — it's subtle but important for the aesthetic. Set this in `buildEnter`'s `to` state so it persists through the active phase.

## Verify

1. `pnpm build` passes
2. In sandbox, add a "Dreamy Smoke" effect from the Text category
3. Enter short text (e.g., "Dream") — should fade in softly, hold, smoke away
4. Enter long text (e.g., a full motivational quote, 2-3 sentences) — should fade in, hold longer (auto duration), smoke away over a longer period due to more characters
5. Toggle speed between slow/medium/fast — visible difference in all phases
6. Change font, color, alignment — all respond correctly
7. Text glow color automatically matches the text color
8. Replay button triggers full lifecycle again cleanly (no leftover split spans or stuck animations)
