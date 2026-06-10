// Shim: effects now live in @harbor/player and self-register via registerEffects.
// The studio imports this module (directly or for its side effect) to ensure all
// effects are registered, then re-exports the registry API.
import { registerEffects } from "@harbor/player";

registerEffects();

export {
  registerEffect,
  getEffect,
  getAllEffects,
  getEffectsByCategory,
  getEffectComponent,
} from "@harbor/player";
