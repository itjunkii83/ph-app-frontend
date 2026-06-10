// Shim: the effect registry now lives in @harbor/player. Importing this module
// guarantees the bundled effects are registered, then re-exports the registry
// API the studio editor (EffectPicker, EffectConfigurator) depends on.
import { registerEffects } from "@harbor/player";

registerEffects();

export {
  registerEffect,
  getEffect,
  getAllEffects,
  getEffectsByCategory,
  getEffectComponent,
} from "@harbor/player";
