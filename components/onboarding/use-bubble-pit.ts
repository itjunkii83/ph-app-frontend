"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  BubblePitController,
} from "@/components/onboarding/bubble-pit-controller";
import type { Pick, Theme } from "@/components/onboarding/constants";

// Owns the imperative physics controller's lifecycle. The effect mounts once;
// Strict Mode's mount/unmount/remount is handled by the controller's idempotent
// stop(). The latest onSelectionChange is read through a ref so the long lived
// controller never holds a stale callback. initialSelection is captured once at
// mount, so re-entering the bubbles screen re-seeds picks from saved state.
export function useBubblePit(opts: {
  wrapRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  themes: Theme[];
  initialSelection: string[];
  onSelectionChange: (picks: Pick[]) => void;
}) {
  const { wrapRef, canvasRef, themes } = opts;
  const controllerRef = useRef<BubblePitController | null>(null);
  const onChangeRef = useRef(opts.onSelectionChange);
  const initialRef = useRef(opts.initialSelection);

  // Keep the controller's callback fresh without recreating it each render.
  useEffect(() => {
    onChangeRef.current = opts.onSelectionChange;
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const controller = new BubblePitController({
      canvas,
      wrap,
      themes,
      initialSelection: initialRef.current,
      onSelectionChange: (picks) => onChangeRef.current(picks),
    });
    controllerRef.current = controller;
    void controller.start();

    return () => {
      controller.stop();
      controllerRef.current = null;
    };
    // Mount once: refs and themes are stable, the callback flows through a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    deselect: (label: string) => controllerRef.current?.deselect(label),
  };
}
