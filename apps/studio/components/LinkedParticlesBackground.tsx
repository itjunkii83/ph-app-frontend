'use client';

import { useEffect, useRef, useState } from 'react';
import WebGPUFallback from './WebGPUFallback';

export default function LinkedParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasWebGPU, setHasWebGPU] = useState<boolean | null>(null);
  const rootInstanceRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function initThree() {
      if (!canvasRef.current) return;

      try {
        // Dynamic import - CRITICAL for avoiding SSR issues
        const [
          { Root },
          { default: WebGPU }
        ] = await Promise.all([
          import('@/lib/three/Root'),
          import('three/examples/jsm/capabilities/WebGPU.js')
        ]);

        if (!mounted) return;

        // Check WebGPU support
        const supported = WebGPU.isAvailable();
        setHasWebGPU(supported);

        if (!supported) {
          return;
        }

        // Initialize Three.js scene
        const root = new Root(canvasRef.current);
        await root.init();

        rootInstanceRef.current = root;

      } catch (error) {
        console.error('Failed to initialize Three.js:', error);
        setHasWebGPU(false);
      }
    }

    initThree();

    return () => {
      mounted = false;
      // Cleanup Three.js resources
      if (rootInstanceRef.current) {
        rootInstanceRef.current = null;
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    if (!rootInstanceRef.current) return;

    const handleResize = () => {
      if (rootInstanceRef.current) {
        rootInstanceRef.current.onResize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // WebGPU not supported
  if (hasWebGPU === false) {
    return <WebGPUFallback />;
  }

  return (
    <canvas
      ref={canvasRef}
      id="particles-canvas"
      className="fixed inset-0 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}
