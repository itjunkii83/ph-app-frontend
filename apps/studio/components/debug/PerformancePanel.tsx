'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Layer } from '@/types/presentation';
import { checkSceneCompatibility } from '@/lib/effects/compatibility';
import { Badge } from '@/components/ui/badge';

interface PerformancePanelProps {
  layers: Layer[];
}

export function PerformancePanel({ layers }: PerformancePanelProps) {
  const [fps, setFps] = useState(0);
  const frameTimesRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    let lastTime = performance.now();

    function tick(now: number) {
      const delta = now - lastTime;
      lastTime = now;

      if (delta > 0) {
        frameTimesRef.current.push(delta);
        if (frameTimesRef.current.length > 60) {
          frameTimesRef.current.shift();
        }
      }

      if (now - lastUpdateRef.current > 1000) {
        lastUpdateRef.current = now;
        const times = frameTimesRef.current;
        if (times.length > 0) {
          const avg = times.reduce((a, b) => a + b, 0) / times.length;
          setFps(Math.round(1000 / avg));
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const compat = checkSceneCompatibility(layers);

  const fpsVariant: 'default' | 'secondary' | 'destructive' =
    fps >= 50 ? 'default' : fps >= 30 ? 'secondary' : 'destructive';
  const fpsClassName =
    fps >= 50
      ? 'bg-green-600 hover:bg-green-600'
      : fps >= 30
        ? 'bg-yellow-600 hover:bg-yellow-600'
        : '';

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Performance
      </h4>

      <div className="flex items-center gap-3 text-sm tabular-nums">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">FPS</span>
          <Badge variant={fpsVariant} className={`text-xs px-1.5 py-0 h-5 ${fpsClassName}`}>
            {fps}
          </Badge>
        </div>
        <span className="text-muted-foreground">
          Layers: <span className="text-foreground">{compat.layerCount}</span>
        </span>
        <span className="text-muted-foreground">
          WebGL: <span className="text-foreground">{compat.webglCount}</span>
        </span>
      </div>

      {(compat.warnings.length > 0 || compat.errors.length > 0) && (
        <div className="space-y-0.5 text-xs">
          {compat.errors.map((err, i) => (
            <div key={`e-${i}`} className="text-destructive">
              {err}
            </div>
          ))}
          {compat.warnings.map((warn, i) => (
            <div key={`w-${i}`} className="text-yellow-500">
              {warn}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
