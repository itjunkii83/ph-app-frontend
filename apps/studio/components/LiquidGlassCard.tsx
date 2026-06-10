'use client';

import { ReactNode } from 'react';

interface LiquidGlassCardProps {
  children?: ReactNode;
  width?: number;
  height?: number;
  borderRadius?: number;
}

export default function LiquidGlassCard({
  children,
  width = 800,
  height = 800,
  borderRadius = 28,
}: LiquidGlassCardProps) {
  return (
    <>
      <svg style={{ display: 'none' }}>
        <filter id="displacementFilter">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.01"
            numOctaves="2"
            result="turbulence"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="200"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <div
        className="liquid-glass-card"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${width}px`,
          height: `${height}px`,
          zIndex: 100,
        }}
      >
        {children}
      </div>

      <style jsx>{`
        .liquid-glass-card {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow: hidden;
          border-radius: ${borderRadius}px;
          transition: opacity 0.26s ease-out;
          filter: drop-shadow(-8px -10px 46px rgba(0, 0, 0, 0.37));
          backdrop-filter: brightness(1.1) blur(20px) url(#displacementFilter);
          -webkit-backdrop-filter: brightness(1.1) blur(20px) url(#displacementFilter);
        }

        .liquid-glass-card::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          overflow: hidden;
          border-radius: ${borderRadius}px;
          box-shadow: inset 6px 6px 0px -6px rgba(255, 255, 255, 0.7),
            inset 0 0 8px 1px rgba(255, 255, 255, 0.7);
          -webkit-box-shadow: inset 2px 2px 0px -2px rgba(255, 255, 255, 0.7),
            inset 0 0 3px 1px rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </>
  );
}
