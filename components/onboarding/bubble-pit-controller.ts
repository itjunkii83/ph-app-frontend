// The bubble pit: a small physics layer ported verbatim (in behavior) from
// tmp/onboard_demo.html. Matter.js runs the pool physics (gravity, walls,
// snug pyramid stacking, drag/fling); the orbit and dock states are our own
// kinematics. Every global from the prototype is now an instance field, so the
// controller is fully self contained and its teardown is idempotent: React 19
// Strict Mode mounts, unmounts, and remounts effects, and an unmount can land
// before the async Matter import resolves. start() bails if disposed, and
// stop() cancels the RAF, removes listeners, disconnects the observer, and
// clears the Matter world. Nothing survives a remount.

import type { Body, Engine, World } from "matter-js";
import {
  GRAVITY_Y,
  ORBIT_SPEED,
  PARENT_R_CAP,
  POSITION_ITERATIONS,
  PYRAMID_GAP,
  SPAWN_GAP,
  type Pick,
  type Theme,
  VELOCITY_ITERATIONS,
} from "@/components/onboarding/constants";

type MatterModule = typeof import("matter-js");

type BubbleMode = "pool" | "dock" | "orbit";

interface Bubble {
  label: string;
  kind: "parent" | "child";
  parent: string | null;
  mode: BubbleMode;
  open: boolean;
  dying: boolean;
  born: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  targetR: number;
  poolR: number;
  seed: number;
  body: Body | null;
  slotIndex: number | null;
  slotX: number;
  slotY: number;
  dockX: number;
  dockY: number;
  orbitPhase: number;
  orbitR: number;
  orbitRt: number;
  orbitIdx: number;
  orbitCount: number;
  orbitChildR?: number;
}

interface DragState {
  b: Bubble;
  ox: number;
  oy: number;
  sx: number;
  sy: number;
  t: number;
  moved: boolean;
  lx: number;
  ly: number;
  pointerId: number;
}

export interface BubblePitOptions {
  canvas: HTMLCanvasElement;
  wrap: HTMLElement;
  themes: Theme[];
  initialSelection: string[];
  onSelectionChange: (picks: Pick[]) => void;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class BubblePitController {
  private canvas: HTMLCanvasElement;
  private wrap: HTMLElement;
  private ctx: CanvasRenderingContext2D;
  private themes: Theme[];
  private emit: (picks: Pick[]) => void;

  private kindMap = new Map<string, "parent" | "child">();
  private selected = new Set<string>();

  private Matter: MatterModule | null = null;
  private engine: Engine | null = null;
  private world: World | null = null;
  private walls: Body[] | null = null;
  private openP: Bubble | null = null;

  private bubbles: Bubble[] | null = null;
  private raf = 0;
  private spawnQueue: string[] = [];
  private lastSpawn = 0;

  private w = 0;
  private h = 0;
  private dpr = 1;
  private parentR = 38;
  private childR = 30;
  private slots: { x: number; y: number }[] = [];

  private drag: DragState | null = null;
  private disposed = false;
  private ro: ResizeObserver | null = null;
  private listeners = new AbortController();

  private fontDisplay = "Georgia, serif";
  private fontBody = "sans-serif";

  constructor(opts: BubblePitOptions) {
    this.canvas = opts.canvas;
    this.wrap = opts.wrap;
    this.themes = opts.themes;
    this.emit = opts.onSelectionChange;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;

    this.themes.forEach((t) => {
      this.kindMap.set(t.label, "parent");
      t.kids.forEach((k) => this.kindMap.set(k, "child"));
    });
    for (const label of opts.initialSelection) this.selected.add(label);
  }

  async start() {
    try {
      this.Matter = await import("matter-js");
    } catch {
      this.Matter = null;
    }
    if (this.disposed) return; // unmounted during the async import

    const cs = getComputedStyle(document.documentElement);
    this.fontDisplay =
      cs.getPropertyValue("--font-fraunces").trim() || "Georgia, serif";
    this.fontBody =
      cs.getPropertyValue("--font-archivo").trim() || "sans-serif";

    this.attachListeners();

    // Defer one frame so the wrapper has laid out before measuring.
    this.raf = requestAnimationFrame(() => {
      if (this.disposed) return;
      this.sizePit();
      this.buildWalls();
      this.relayoutSlots();
      if (!this.bubbles) this.initBubbles();
      this.syncSelection();
      this.raf = requestAnimationFrame(this.step);
    });
  }

  stop() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.listeners.abort();
    this.ro?.disconnect();
    this.ro = null;
    if (this.Matter && this.engine && this.world) {
      try {
        this.Matter.World.clear(this.world, false);
        this.Matter.Engine.clear(this.engine);
      } catch {
        // Best effort: clearing a partially built world should never throw up.
      }
    }
    this.engine = null;
    this.world = null;
    this.walls = null;
    this.bubbles = null;
    this.openP = null;
    this.drag = null;
    this.spawnQueue = [];
    try {
      this.ctx.clearRect(0, 0, this.w, this.h);
    } catch {
      // Ignore.
    }
  }

  // Imperative command from React: remove a pick (tray chip close button).
  deselect(label: string) {
    this.selected.delete(label);
    const pb =
      this.bubbles?.find((b) => b.label === label && b.kind === "parent") ??
      null;
    if (pb && pb.open) this.closeParent(pb, false);
    this.syncSelection();
  }

  private attachListeners() {
    const signal = this.listeners.signal;
    this.canvas.addEventListener("pointerdown", this.onPointerDown, { signal });
    this.canvas.addEventListener("pointermove", this.onPointerMove, { signal });
    this.canvas.addEventListener("pointerup", this.onPointerUp, { signal });
    this.canvas.addEventListener("pointercancel", this.onPointerUp, { signal });
    window.addEventListener("resize", this.onResize, { signal });
    if (typeof ResizeObserver !== "undefined") {
      this.ro = new ResizeObserver(() => {
        if (this.bubbles) this.onResize();
      });
      this.ro.observe(this.wrap);
    }
  }

  private onResize = () => {
    this.sizePit();
    this.buildWalls();
    this.relayoutSlots();
  };

  private sizePit() {
    const r = this.wrap.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.computeGeometry();
  }

  // Pyramid math: four across the base sets the size, kept to ~92% of the pit.
  // r = (0.92*W - 3*gap) / 8, capped so bubbles stay tasteful on wide desktops.
  private computeGeometry() {
    const g = PYRAMID_GAP;
    this.parentR = Math.max(
      26,
      Math.min(PARENT_R_CAP, (this.w * 0.92 - 3 * g) / 8),
    );
    this.childR = Math.max(24, this.parentR * 0.74);
    const r = this.parentR;
    const cell = 2 * r + g;
    const cx = this.w / 2;
    const baseY = this.h - r - 14;
    const dyRow = (cell * Math.sqrt(3)) / 2; // row height for nestled packing
    const topY = baseY - dyRow;
    this.slots = [];
    for (let k = 0; k < 4; k++)
      this.slots.push({ x: cx - 1.5 * cell + k * cell, y: baseY }); // base: 4
    for (let k = 0; k < 3; k++)
      this.slots.push({ x: cx - cell + k * cell, y: topY }); // top: 3
  }

  private relayoutSlots() {
    if (!this.bubbles) return;
    this.bubbles.forEach((b) => {
      if (b.kind === "parent" && b.slotIndex != null && this.slots[b.slotIndex]) {
        const s = this.slots[b.slotIndex];
        b.slotX = s.x;
        b.slotY = s.y;
      }
    });
  }

  private setupMatter() {
    if (!this.Matter) return;
    this.engine = this.Matter.Engine.create();
    this.engine.enableSleeping = true;
    this.engine.gravity.y = GRAVITY_Y;
    this.engine.positionIterations = POSITION_ITERATIONS;
    this.engine.velocityIterations = VELOCITY_ITERATIONS;
    this.world = this.engine.world;
    this.buildWalls();
  }

  private buildWalls() {
    if (!this.Matter || !this.engine || !this.world) return;
    if (this.walls) {
      for (const w of this.walls) this.Matter.Composite.remove(this.world, w);
    }
    const t = 240;
    const opt = { isStatic: true, friction: 0.4 };
    const M = 14;
    const SM = 4;
    const B = this.Matter.Bodies;
    const floor = B.rectangle(this.w / 2, this.h + t / 2 - M, this.w + t * 2, t, opt);
    const ceil = B.rectangle(this.w / 2, -t / 2, this.w + t * 2, t, opt);
    const left = B.rectangle(-t / 2 + SM, this.h / 2, t, this.h * 4, opt);
    const right = B.rectangle(this.w + t / 2 - SM, this.h / 2, t, this.h * 4, opt);
    this.walls = [floor, ceil, left, right];
    for (const w of this.walls) this.Matter.Composite.add(this.world, w);
  }

  private makePoolBody(b: Bubble): Body | null {
    if (!this.Matter || !this.world) return null;
    const body = this.Matter.Bodies.circle(b.x, b.y, b.r, {
      restitution: 0.1,
      friction: 0.1,
      frictionStatic: 0.2,
      frictionAir: 0.01,
    });
    b.body = body;
    this.Matter.Composite.add(this.world, body);
    return body;
  }

  private makeBubble(
    label: string,
    kind: "parent" | "child",
    parent: string | null,
    x: number,
    y: number,
  ): Bubble {
    const baseR = kind === "parent" ? this.parentR || 38 : this.childR || 30;
    return {
      label,
      kind,
      parent: parent || null,
      mode: kind === "parent" ? "pool" : "orbit",
      open: false,
      dying: false,
      born: performance.now(),
      x,
      y,
      vx: rand(-0.2, 0.2),
      vy: rand(-0.2, 0.2),
      r: baseR,
      targetR: baseR,
      poolR: baseR,
      seed: rand(-1, 1),
      body: null,
      slotIndex: null,
      slotX: 0,
      slotY: 0,
      dockX: 0,
      dockY: 0,
      orbitPhase: 0,
      orbitR: 0,
      orbitRt: 0,
      orbitIdx: 0,
      orbitCount: 1,
    };
  }

  private initBubbles() {
    this.sizePit();
    this.bubbles = [];
    this.spawnQueue = this.themes.map((t) => t.label);
    this.lastSpawn = 0;
    if (this.Matter) this.setupMatter();
    else this.layoutFallback();
  }

  // No-library fallback: drop bubbles straight into the computed slots.
  private layoutFallback() {
    if (!this.bubbles) return;
    this.spawnQueue = [];
    this.themes.forEach((t, i) => {
      const b = this.makeBubble(t.label, "parent", null, 0, 0);
      const s = this.slots[i] || { x: this.w / 2, y: this.h / 2 };
      b.slotIndex = i;
      b.slotX = s.x;
      b.slotY = s.y;
      b.x = s.x;
      b.y = s.y;
      this.bubbles!.push(b);
    });
  }

  private spawnNext(now: number) {
    if (!this.bubbles || !this.spawnQueue.length) return;
    if (now - this.lastSpawn < SPAWN_GAP) return;
    this.lastSpawn = now;
    const label = this.spawnQueue.shift()!;
    const idx = this.bubbles.filter((b) => b.kind === "parent").length;
    const s = this.slots[idx] || { x: this.w / 2, y: this.h / 2 };
    const b = this.makeBubble(label, "parent", null, s.x, this.parentR + 8);
    b.slotIndex = idx;
    b.slotX = s.x;
    b.slotY = s.y;
    this.bubbles.push(b);
    const body = this.makePoolBody(b);
    if (body && this.Matter) this.Matter.Body.setVelocity(body, { x: 0, y: 3 });
  }

  private bloomOrbit(p: Bubble) {
    if (!this.bubbles) return;
    const theme = this.themes.find((t) => t.label === p.label);
    if (!theme) return;
    if (
      this.bubbles.some(
        (b) => b.kind === "child" && b.parent === p.label && !b.dying,
      )
    )
      return;
    const n = theme.kids.length;
    theme.kids.forEach((k, i) => {
      const b = this.makeBubble(k, "child", p.label, p.x, p.y);
      b.mode = "orbit";
      b.r = 2;
      b.targetR = p.orbitChildR || b.targetR;
      b.orbitIdx = i;
      b.orbitCount = n;
      this.bubbles!.push(b);
    });
  }

  private collapseOrbit(parentLabel: string) {
    if (!this.bubbles) return;
    for (const b of this.bubbles) {
      if (b.kind === "child" && b.parent === parentLabel && !b.dying)
        b.dying = true;
    }
  }

  private openParent(p: Bubble) {
    if (this.openP && this.openP !== p) this.closeParent(this.openP, true);
    if (p.body && this.Matter && this.world) {
      this.Matter.Composite.remove(this.world, p.body);
      p.body = null;
    }
    const focusR = p.poolR * 1.4;
    const childR = focusR * 0.68;
    p.mode = "dock";
    p.open = true;
    this.openP = p;
    p.targetR = focusR;
    p.orbitChildR = childR;
    p.orbitRt = focusR + childR + 14;
    p.dockX = this.w / 2;
    p.dockY = p.orbitRt + childR + 14;
    p.orbitPhase = 0;
    p.orbitR = 0;
    this.selected.add(p.label);
    this.bloomOrbit(p);
  }

  private closeParent(p: Bubble, keepSelected: boolean) {
    this.collapseOrbit(p.label);
    p.mode = "pool";
    p.open = false;
    p.r = p.poolR;
    p.targetR = p.poolR;
    if (this.openP === p) this.openP = null;
    if (!keepSelected) this.selected.delete(p.label);
    p.x = p.slotX;
    p.y = p.poolR + 8;
    const body = this.makePoolBody(p);
    if (body && this.Matter) this.Matter.Body.setVelocity(body, { x: 0, y: 3 });
  }

  private syncSelection() {
    const picks: Pick[] = [...this.selected].map((l) => ({
      label: l,
      kind: this.kindMap.get(l) || "child",
    }));
    this.emit(picks);
  }

  private step = () => {
    const bs = this.bubbles;
    if (!bs) {
      this.raf = requestAnimationFrame(this.step);
      return;
    }
    const now = performance.now();

    this.spawnNext(now);

    if (this.Matter && this.engine) this.Matter.Engine.update(this.engine, 1000 / 60);

    const parentOf: Record<string, Bubble> = {};
    for (const b of bs) if (b.kind === "parent") parentOf[b.label] = b;

    for (const b of bs) {
      if (b.dying) {
        const p = parentOf[b.parent ?? ""];
        if (p) {
          b.x += (p.x - b.x) * 0.28;
          b.y += (p.y - b.y) * 0.28;
        }
        b.r += (0 - b.r) * 0.28;
        continue;
      }
      if (b.r < b.targetR) b.r = Math.min(b.targetR, b.r + b.targetR * 0.16);

      if (b.mode === "orbit") {
        const p = parentOf[b.parent ?? ""];
        if (p) {
          const a = p.orbitPhase + (b.orbitIdx / b.orbitCount) * Math.PI * 2;
          b.x = p.x + Math.cos(a) * p.orbitR;
          b.y = p.y + Math.sin(a) * p.orbitR;
        }
        continue;
      }

      if (b.mode === "dock") {
        b.x += (b.dockX - b.x) * 0.13;
        b.y += (b.dockY - b.y) * 0.13;
        b.orbitPhase += ORBIT_SPEED;
        b.orbitR += (b.orbitRt - b.orbitR) * 0.08;
        continue;
      }

      if (b.body) {
        b.x = b.body.position.x;
        b.y = b.body.position.y;
      }
    }

    if (bs.some((b) => b.dying && b.r < 3))
      this.bubbles = bs.filter((b) => !(b.dying && b.r < 3));

    this.draw(now);
    this.raf = requestAnimationFrame(this.step);
  };

  private wrapText(text: string, maxW: number): string[] {
    const ctx = this.ctx;
    const words = text.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
  }

  private draw(now: number) {
    const ctx = this.ctx;
    if (!this.bubbles) return;
    ctx.clearRect(0, 0, this.w, this.h);
    for (const b of this.bubbles) {
      const sel = this.selected.has(b.label);
      const pop = b.dying
        ? Math.max(0, b.r / 30)
        : Math.min(1, (now - b.born) / 280);
      ctx.save();
      ctx.globalAlpha = b.dying ? Math.max(0, b.r / 24) : 1;
      ctx.beginPath();
      ctx.arc(b.x, b.y, Math.max(b.r, 0.1), 0, Math.PI * 2);

      if (sel) {
        const g = ctx.createLinearGradient(
          b.x - b.r,
          b.y - b.r,
          b.x + b.r,
          b.y + b.r,
        );
        g.addColorStop(0, "#eef3f7");
        g.addColorStop(0.55, "#a8b3bd");
        g.addColorStop(1, "#cfd8df");
        ctx.fillStyle = g;
        ctx.shadowColor = "rgba(190,205,218,.55)";
        ctx.shadowBlur = 24;
        ctx.fill();
      } else {
        ctx.fillStyle =
          b.kind === "parent" ? "rgba(22,26,31,.92)" : "rgba(17,19,23,.86)";
        ctx.shadowColor = "rgba(0,0,0,.4)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = b.kind === "parent" ? 1.4 : 1;
        ctx.strokeStyle =
          b.kind === "parent"
            ? "rgba(214,224,232,.45)"
            : "rgba(154,165,175,.32)";
        ctx.stroke();
      }
      ctx.restore();

      if (b.kind === "parent" && b.open && !b.dying) {
        ctx.save();
        ctx.globalAlpha = sel ? 0.5 : 0.25;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r - 7, 0, Math.PI * 2);
        ctx.strokeStyle = sel ? "rgba(10,11,13,.5)" : "rgba(214,224,232,.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.restore();
      }

      const fs = Math.max(10, b.r * (b.kind === "parent" ? 0.3 : 0.28)) + 2;
      ctx.font = `500 ${fs}px ${b.kind === "parent" ? this.fontDisplay : this.fontBody}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = sel
        ? "#0a0b0d"
        : b.kind === "parent"
          ? "#e7ecf1"
          : "#c5cdd5";
      ctx.globalAlpha = pop;
      const lines = this.wrapText(b.label, b.r * 1.7);
      const lh = fs * 1.12;
      const startY = b.y - ((lines.length - 1) * lh) / 2;
      lines.forEach((ln, i) => ctx.fillText(ln, b.x, startY + i * lh));
      ctx.globalAlpha = 1;
    }
  }

  // ---- pointer interaction (tap vs drag) ----
  private pointPos(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private hit(p: { x: number; y: number }): Bubble | null {
    if (!this.bubbles) return null;
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (Math.hypot(p.x - b.x, p.y - b.y) <= b.r) return b;
    }
    return null;
  }

  private onPointerDown = (e: PointerEvent) => {
    if (!this.bubbles) return;
    this.canvas.setPointerCapture(e.pointerId);
    const p = this.pointPos(e);
    const b = this.hit(p);
    if (b) {
      this.drag = {
        b,
        ox: p.x - b.x,
        oy: p.y - b.y,
        sx: p.x,
        sy: p.y,
        t: performance.now(),
        moved: false,
        lx: p.x,
        ly: p.y,
        pointerId: e.pointerId,
      };
      if (b.body && this.Matter) this.Matter.Sleeping.set(b.body, false);
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.drag) return;
    const p = this.pointPos(e);
    const d = this.drag;
    if (Math.hypot(p.x - d.sx, p.y - d.sy) > 6) d.moved = true;
    if (d.b.mode === "pool" && d.b.body && this.Matter) {
      this.Matter.Body.setPosition(d.b.body, { x: p.x - d.ox, y: p.y - d.oy });
      this.Matter.Body.setVelocity(d.b.body, { x: p.x - d.lx, y: p.y - d.ly });
    }
    d.lx = p.x;
    d.ly = p.y;
  };

  private onPointerUp = () => {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    if (d.b.mode === "pool" && d.b.body && this.Matter) {
      const v = d.b.body.velocity;
      const cap = 22;
      const sp = Math.hypot(v.x, v.y);
      if (sp > cap)
        this.Matter.Body.setVelocity(d.b.body, {
          x: (v.x / sp) * cap,
          y: (v.y / sp) * cap,
        });
    }
    const dt = performance.now() - d.t;
    if (!d.moved && dt < 400) {
      const b = d.b;
      if (b.kind === "parent") {
        if (!b.open) this.openParent(b);
        else this.closeParent(b, true);
      } else {
        if (this.selected.has(b.label)) this.selected.delete(b.label);
        else this.selected.add(b.label);
      }
      this.syncSelection();
    }
  };
}
