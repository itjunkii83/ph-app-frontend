// Minimal ambient declarations for the untyped three.js addons we import
// dynamically. @types/three (DefinitelyTyped) does not declare the
// `three/addons/*` specifiers, and these are loose WebGL glue — `any` is
// intentional. An exact-match `declare module` short-circuits resolution so tsc
// neither errors on the missing types nor parses the heavy addon JS graph.

declare module 'three/addons/objects/Water.js' {
  export const Water: any;
}

declare module 'three/addons/postprocessing/UnrealBloomPass.js' {
  export const UnrealBloomPass: any;
}
