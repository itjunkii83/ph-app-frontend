'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import StaticBackground from '@/components/StaticBackground';
import WebGLLiquidGlass, { DEFAULT_GLASS_SETTINGS, GlassSettings } from '@/components/WebGLLiquidGlass';
import GlassControlPanel, { DimensionSettings } from '@/components/GlassControlPanel';
import BackgroundSelector from '@/components/BackgroundSelector';

export default function Home() {
  const [settings, setSettings] = useState<GlassSettings>({ ...DEFAULT_GLASS_SETTINGS });
  const [dimensions, setDimensions] = useState<DimensionSettings>({
    width: 800,
    height: 800,
    borderRadius: 28,
  });
  const [bouncing, setBouncing] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('/effects/bg.jpg');
  const [position, setPosition] = useState<{ x: number; y: number } | undefined>(undefined);

  // Bounce animation state stored in refs to avoid re-renders every frame
  const bounceRef = useRef({
    x: 0,
    y: 0,
    vx: 4,
    vy: 3,
    active: false,
  });
  const rafRef = useRef<number | null>(null);

  const startBounce = useCallback(() => {
    const b = bounceRef.current;
    // Initialize position at center of screen
    b.x = (window.innerWidth - dimensions.width) / 2;
    b.y = (window.innerHeight - dimensions.height) / 2;
    // Random initial velocity direction
    const speed = 4;
    const angle = Math.random() * Math.PI * 2;
    b.vx = Math.cos(angle) * speed;
    b.vy = Math.sin(angle) * speed;
    b.active = true;

    function tick() {
      const b = bounceRef.current;
      if (!b.active) return;

      b.x += b.vx;
      b.y += b.vy;

      // Bounce off edges
      const maxX = window.innerWidth - dimensions.width;
      const maxY = window.innerHeight - dimensions.height;

      if (b.x <= 0) {
        b.x = 0;
        b.vx = Math.abs(b.vx);
      } else if (b.x >= maxX) {
        b.x = maxX;
        b.vx = -Math.abs(b.vx);
      }

      if (b.y <= 0) {
        b.y = 0;
        b.vy = Math.abs(b.vy);
      } else if (b.y >= maxY) {
        b.y = maxY;
        b.vy = -Math.abs(b.vy);
      }

      setPosition({ x: b.x, y: b.y });
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [dimensions.width, dimensions.height]);

  const stopBounce = useCallback(() => {
    bounceRef.current.active = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setPosition(undefined); // Back to centered
  }, []);

  const handleBounceToggle = useCallback(() => {
    if (bouncing) {
      stopBounce();
      setBouncing(false);
    } else {
      setBouncing(true);
      startBounce();
    }
  }, [bouncing, startBounce, stopBounce]);

  // Stop bounce on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Full-screen background */}
      <StaticBackground src={backgroundImage} alt="Background" />

      {/* Background image selector */}
      <BackgroundSelector
        currentImage={backgroundImage}
        onImageChange={setBackgroundImage}
      />

      {/* WebGL Liquid Glass Card */}
      <WebGLLiquidGlass
        width={dimensions.width}
        height={dimensions.height}
        borderRadius={dimensions.borderRadius}
        settings={settings}
        position={position}
        backgroundImage={backgroundImage}
      >
        <div className="text-white text-center" style={{ position: 'relative', zIndex: 10 }}>
          <h1 className="text-6xl font-bold mb-4">Wisdom</h1>
          <p className="text-xl opacity-80">Liquid Glass Effect</p>
        </div>
      </WebGLLiquidGlass>

      {/* Control Panel */}
      <GlassControlPanel
        settings={settings}
        onChange={setSettings}
        dimensions={dimensions}
        onDimensionsChange={setDimensions}
        bouncing={bouncing}
        onBounceToggle={handleBounceToggle}
      />
    </>
  );
}
