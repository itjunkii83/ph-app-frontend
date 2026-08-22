import { registerEffect } from "./components/effects/registry";
import {
  backgroundImageDefinition,
  gradientBackgroundDefinition,
  liquidGradientBackgroundDefinition,
} from "./components/effects/backgrounds";
import {
  basicTextDefinition,
  dreamySmokeDefinition,
  maskedTextRevealDefinition,
  hardCutDefinition,
  pulseDefinition,
  bloomDefinition,
} from "./components/effects/text";
import { cloudyBackgroundDefinition } from "./components/effects/ambient";
import { kenBurnsImageDefinition } from "./components/effects/image";
import { oceanDefinition } from "./components/effects/webgl";

let registered = false;

/**
 * The single registration entry point. Idempotent: guarantees every bundled
 * effect is in the registry before first render. Called at the module top of
 * PresentationPlayer and by the studio editor before it reads the registry.
 */
export function registerEffects(): void {
  if (registered) return;
  registered = true;
  registerEffect(backgroundImageDefinition);
  registerEffect(gradientBackgroundDefinition);
  registerEffect(liquidGradientBackgroundDefinition);
  registerEffect(basicTextDefinition);
  registerEffect(dreamySmokeDefinition);
  registerEffect(cloudyBackgroundDefinition);
  registerEffect(kenBurnsImageDefinition);
  registerEffect(maskedTextRevealDefinition);
  registerEffect(hardCutDefinition);
  registerEffect(pulseDefinition);
  registerEffect(bloomDefinition);
  registerEffect(oceanDefinition);
}
