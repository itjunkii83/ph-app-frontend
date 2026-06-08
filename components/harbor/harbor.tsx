"use client";

import Link from "next/link";
import { Anchor, Check, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MomentCard } from "@/components/harbor/moment-card";
import { HarborCard } from "@/components/ui/harbor-card";
import { CURRENCY_NAME, MOMENT_AS_STEP_ZERO } from "@/lib/constants";
import { weekdayLetter } from "@/lib/date";
import {
  commitmentPoints,
  getMotivation,
  getSessionSteps,
  stepPoints,
} from "@/lib/session";
import type { DashboardConfig, Module, ModuleOf } from "@/lib/types";
import { useDayProgress } from "@/lib/use-day-progress";
import { useDayStreak } from "@/lib/use-day-streak";
import { usePoints } from "@/lib/use-points";
import { cn } from "@/lib/utils";

const TODAYS_RULE = "Make the next rep so small you cannot say no to it.";
const STREAK_HISTORY_DAYS = 7;

export function Harbor({ config }: { config: DashboardConfig }) {
  const { workspace, profile } = config;
  const motivation = getMotivation(config);
  const steps = getSessionSteps(config);

  const progress = useDayProgress(config);
  const {
    reps,
    repsDone,
    commitmentModules,
    commitmentsDone,
    total,
    done,
    percent,
    dayComplete,
    session,
    commitments,
  } = progress;

  const points = usePoints();
  const { streak, history } = useDayStreak(dayComplete, progress.hydrated);

  const hydrated = progress.hydrated && points.hydrated;
  const practiceComplete = reps.length > 0 && repsDone === reps.length;
  const commitmentsComplete =
    commitmentModules.length > 0 && commitmentsDone === commitmentModules.length;
  const days = history(STREAK_HISTORY_DAYS);

  function toggleCommitment(c: ModuleOf<"commitment">) {
    const wasDone = commitments.isComplete(c.id);
    commitments.toggle(c.id);
    points.addPoints(wasDone ? -commitmentPoints(c) : commitmentPoints(c));
  }

  const startLabel =
    repsDone === 0
      ? "Begin today's practice"
      : practiceComplete
        ? "Run it again"
        : "Resume the practice";

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-20 pt-8 lg:max-w-4xl">
      <header className="flex items-center gap-3 px-1">
        <div
          className="flex size-10 items-center justify-center rounded-xl"
          style={{ background: "var(--accent-gradient)" }}
        >
          <Anchor className="size-5 text-ink" strokeWidth={2.25} />
        </div>
        <div>
          <p className="font-display text-base text-paper">{workspace.name}</p>
          <p className="text-xs text-muted-foreground">Daily practice</p>
        </div>
      </header>

      <div className="mt-6 lg:grid lg:grid-cols-[1.4fr_0.8fr] lg:items-start lg:gap-5">
        <div className="flex flex-col gap-4">
          <HarborCard accentBar>
            <h1 className="text-accent-gradient font-display text-4xl">
              {workspace.greeting}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {profile.goalText}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <Button asChild className="h-11 rounded-full px-6">
                <Link href="/practice">
                  <Play className="size-4" />
                  {startLabel}
                </Link>
              </Button>
              <span
                className={cn(
                  "text-xs text-pewter transition-opacity duration-300",
                  hydrated && repsDone > 0 ? "opacity-100" : "opacity-0",
                )}
              >
                {repsDone} of {reps.length} reps done today
              </span>
            </div>
          </HarborCard>

          {!MOMENT_AS_STEP_ZERO && motivation && (
            <MomentCard module={motivation} />
          )}

          <div
            className={cn(
              "grid grid-cols-3 gap-3 transition-opacity duration-300",
              hydrated ? "opacity-100" : "opacity-0",
            )}
          >
            <HarborCard className="rounded-2xl">
              <p className="text-[11px] uppercase tracking-[0.14em] text-pewter">
                Streak
              </p>
              <p
                className={cn(
                  "mt-2 font-display text-3xl leading-none",
                  streak > 0 ? "text-accent-gradient" : "text-muted-foreground",
                )}
              >
                {streak}
              </p>
              <div className="mt-3 flex gap-1">
                {days.map((day, i) => (
                  <div
                    key={day.date}
                    title={weekdayLetter(day.date)}
                    className={cn(
                      "size-2 rounded-full border",
                      day.done ? "border-transparent" : "border-line bg-ink-2",
                      i === days.length - 1 && !day.done && "border-pewter",
                    )}
                    style={
                      day.done
                        ? { background: "var(--accent-gradient)" }
                        : undefined
                    }
                  />
                ))}
              </div>
            </HarborCard>
            <HarborCard className="rounded-2xl">
              <p className="text-[11px] uppercase tracking-[0.14em] text-pewter">
                {CURRENCY_NAME}
              </p>
              <p className="mt-2 font-display text-3xl leading-none text-paper">
                {points.total}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {points.earnedToday > 0
                  ? `+${points.earnedToday} today`
                  : "none yet today"}
              </p>
            </HarborCard>
            <HarborCard className="rounded-2xl">
              <p className="text-[11px] uppercase tracking-[0.14em] text-pewter">
                Today
              </p>
              <div className="mt-2">
                <Ring percent={hydrated ? percent : 0} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {done} of {total} done
              </p>
            </HarborCard>
          </div>

          <HarborCard title="Today's lesson path" sourceTag="Preview">
            <div className="flex flex-col gap-2.5">
              {steps.map((module) => (
                <PathRow
                  key={module.id}
                  module={module}
                  repNumber={reps.findIndex((r) => r.id === module.id) + 1}
                  done={hydrated && session.isComplete(module.id)}
                />
              ))}
            </div>
          </HarborCard>

          <HarborCard title="Commitments" sourceTag="Set out">
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Out in the world, on your time. The streak only ties when these are
              done too.
            </p>
            <div className="flex flex-col gap-2.5">
              {commitmentModules.map((c) => (
                <CommitmentRow
                  key={c.id}
                  module={c}
                  done={hydrated && commitments.isComplete(c.id)}
                  onToggle={() => toggleCommitment(c)}
                />
              ))}
            </div>
          </HarborCard>
        </div>

        <aside className="mt-4 flex flex-col gap-4 lg:mt-0">
          <HarborCard title="Daily quests">
            <div className="flex flex-col gap-2.5">
              <QuestRow
                label="Run the full practice"
                done={hydrated && practiceComplete}
              />
              <QuestRow
                label="Honor your commitments"
                done={hydrated && commitmentsComplete}
              />
              <QuestRow
                label="Close the day, grow the chain"
                done={hydrated && dayComplete}
              />
            </div>
          </HarborCard>

          <HarborCard title="Today's rule">
            <p className="font-display text-lg leading-snug text-silver">
              {TODAYS_RULE}
            </p>
          </HarborCard>

          {MOMENT_AS_STEP_ZERO && motivation && (
            <HarborCard title="The Moment" sourceTag={motivation.sourceTag}>
              <p className="font-display text-base leading-snug text-paper">
                {motivation.config.quote}
              </p>
              <p className="mt-2 text-xs text-pewter">
                {motivation.config.attribution}
              </p>
            </HarborCard>
          )}
        </aside>
      </div>
    </main>
  );
}

function Ring({ percent }: { percent: number }) {
  const deg = Math.max(0, Math.min(100, percent)) * 3.6;
  return (
    <div className="relative size-14">
      <div
        className="size-14 rounded-full"
        style={{
          background: `conic-gradient(from -90deg, #a8b3bd, #eef3f7 ${deg}deg, var(--ink-2) ${deg}deg)`,
        }}
      />
      <div className="absolute inset-[5px] flex items-center justify-center rounded-full bg-panel">
        <span className="font-display text-sm text-paper">{percent}%</span>
      </div>
    </div>
  );
}

function PathRow({
  module,
  repNumber,
  done,
}: {
  module: Module;
  repNumber: number;
  done: boolean;
}) {
  const isMoment = module.type === "motivation";
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-2xl border border-line bg-ink-2 p-3.5",
        done && "opacity-70",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl border text-sm",
          done
            ? "border-transparent text-ink"
            : "border-line bg-panel text-pewter",
        )}
        style={done ? { background: "var(--accent-gradient)" } : undefined}
      >
        {done ? (
          <Check className="size-4.5" strokeWidth={2.5} />
        ) : isMoment ? (
          <Play className="size-4" />
        ) : (
          <span className="font-display">{repNumber}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-paper">{module.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {module.sourceTag}
        </p>
      </div>
      <span className="shrink-0 text-xs text-pewter">
        {isMoment ? "Moment" : `+${stepPoints(module)} ${CURRENCY_NAME}`}
      </span>
    </div>
  );
}

function CommitmentRow({
  module,
  done,
  onToggle,
}: {
  module: ModuleOf<"commitment">;
  done: boolean;
  onToggle: () => void;
}) {
  const { label, note, keystone } = module.config;
  return (
    <button
      type="button"
      aria-pressed={done}
      onClick={onToggle}
      className={cn(
        "flex w-full items-start gap-3.5 rounded-2xl border bg-ink-2 p-3.5 text-left transition-colors",
        done ? "border-transparent" : "border-line hover:border-ring",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl border",
          done
            ? "border-transparent text-ink"
            : "border-line bg-panel text-pewter",
        )}
        style={done ? { background: "var(--accent-gradient)" } : undefined}
      >
        <Check className="size-4.5" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "text-sm text-paper",
              done && "line-through opacity-70",
            )}
          >
            {label}
          </p>
          {keystone && (
            <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-pewter">
              Keystone
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {note}
        </p>
      </div>
      <span className="mt-0.5 shrink-0 text-xs text-pewter">
        +{commitmentPoints(module)} {CURRENCY_NAME}
      </span>
    </button>
  );
}

function QuestRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-ink-2 p-3">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg border",
          done
            ? "border-transparent text-ink"
            : "border-line text-muted-foreground",
        )}
        style={done ? { background: "var(--accent-gradient)" } : undefined}
      >
        <Check className="size-4" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-paper">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {done ? "Done" : "Waiting"}
        </p>
      </div>
    </div>
  );
}
