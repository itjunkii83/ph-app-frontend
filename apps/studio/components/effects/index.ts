import { registerEffect } from './registry';
import { backgroundImageDefinition } from './backgrounds';
import { basicTextDefinition, dreamySmokeDefinition, maskedTextRevealDefinition } from './text';
import { cloudyBackgroundDefinition } from './ambient';
import { kenBurnsImageDefinition } from './image';

// Register all effects (side-effect import)
registerEffect(backgroundImageDefinition);
registerEffect(basicTextDefinition);
registerEffect(dreamySmokeDefinition);
registerEffect(cloudyBackgroundDefinition);
registerEffect(kenBurnsImageDefinition);
registerEffect(maskedTextRevealDefinition);

// Re-export registry functions
export {
  registerEffect,
  getEffect,
  getAllEffects,
  getEffectsByCategory,
  getEffectComponent,
} from './registry';
