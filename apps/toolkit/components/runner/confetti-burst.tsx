"use client";

import { useEffect } from "react";

// Restrained, filmic confetti: silver and paper sparks, not a rainbow.
const COLORS = ["#d6dde4", "#e7ecf1", "#9aa5af", "#eef3f7"];

export interface ConfettiPiece {
  id: string;
  left: number;
  color: string;
  delay: number;
  duration: number;
  rotate: number;
}

// Called from event handlers, where randomness is safe.
export function makeConfetti(count: number, seed: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${seed}-${i}`,
    left: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 180,
    duration: 1000 + Math.random() * 700,
    rotate: Math.random() * 180,
  }));
}

export function ConfettiBurst({
  pieces,
  onDone,
}: {
  pieces: ConfettiPiece[];
  onDone: () => void;
}) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 2100);
    return () => window.clearTimeout(id);
  }, [pieces, onDone]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[55] overflow-hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute -top-4 block h-3 w-1.5 rounded-[2px] opacity-90"
          style={{
            left: `${p.left}%`,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `knot-fall ${p.duration}ms linear ${p.delay}ms forwards`,
          }}
        />
      ))}
    </div>
  );
}
