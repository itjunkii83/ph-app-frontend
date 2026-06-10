export function isWebGPUAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Dynamic require to avoid SSR issues
    const WebGPU = require('three/examples/jsm/capabilities/WebGPU.js').default;
    return WebGPU.isAvailable();
  } catch {
    return false;
  }
}
