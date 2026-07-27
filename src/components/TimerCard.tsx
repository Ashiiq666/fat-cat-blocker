import { motion } from "framer-motion";
import { fmt } from "../hooks/useTimer";
import type { Phase, Settings } from "../lib/types";
import { PlayIcon, PauseIcon, ResetIcon, SkipIcon, CoffeeIcon, ClockIcon } from "./icons";

type Props = {
  phase: Phase;
  running: boolean;
  remaining: number;
  settings: Settings;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
};

export function TimerCard({
  phase,
  running,
  remaining,
  settings,
  onStart,
  onPause,
  onReset,
  onSkip,
}: Props) {
  const isBreak = phase === "break";
  const total = isBreak ? settings.breakMinutes * 60 : settings.workMinutes * 60;
  const pct = ((total - remaining) / Math.max(1, total)) * 100;

  // Accent tracks the current phase: amber focus, green break, red warning.
  const accent = isBreak ? "#22C55E" : phase === "warning" ? "#EF4444" : "#F59E0B";

  const eyebrow = isBreak
    ? "Break active"
    : phase === "idle"
    ? "Next break in"
    : phase === "warning"
    ? "Break starting"
    : running
    ? "Focusing"
    : "Paused";

  // Kept short so it fits on one line inside the ring.
  const status = isBreak
    ? "Look away, relax"
    : phase === "idle"
    ? "Ready when you are"
    : phase === "warning"
    ? "Break incoming"
    : running
    ? "Focus in progress"
    : "Paused";

  // Circular progress geometry.
  const r = 82;
  const c = 2 * Math.PI * r;

  return (
    <div className="card">
      <div className="flex flex-col items-center gap-7 sm:flex-row sm:gap-8">
        {/* Progress ring */}
        <div className="relative h-52 w-52 shrink-0">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
            <circle
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-zinc-100 dark:text-zinc-800"
            />
            <motion.circle
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke={accent}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={c}
              animate={{ strokeDashoffset: c - (pct / 100) * c }}
              transition={{ ease: "linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="eyebrow max-w-[11rem]" style={{ color: accent }}>
              {eyebrow}
            </div>
            <div className="mt-1 font-semibold tabular-nums leading-none tracking-tight text-zinc-900 dark:text-zinc-50" style={{ fontSize: 52 }}>
              {fmt(remaining)}
            </div>
            <div className="mt-2 max-w-[11rem] text-xs leading-snug text-zinc-500 dark:text-zinc-400">
              {status}
            </div>
          </div>
        </div>

        {/* Details + controls */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight">
            {isBreak ? "Break time" : "Stay focused"}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {isBreak
              ? "The cat is on screen until the timer ends."
              : "A cat break appears when the timer runs out."}
          </p>

          {/* Session summary chips */}
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className="surface inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              <ClockIcon size={14} className="text-zinc-400 dark:text-zinc-500" />
              {settings.workMinutes} min focus
            </span>
            <span className="surface inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              <CoffeeIcon size={14} className="text-zinc-400 dark:text-zinc-500" />
              {settings.breakMinutes} min break
            </span>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
            {!running && !isBreak && (
              <button className="btn-primary" onClick={onStart}>
                <PlayIcon size={16} /> Start focus
              </button>
            )}
            {running && !isBreak && (
              <button className="btn-ghost" onClick={onPause}>
                <PauseIcon size={16} /> Pause
              </button>
            )}
            <button className="btn-ghost" onClick={onReset}>
              <ResetIcon size={16} /> Reset
            </button>
            {!isBreak && (
              <button className="btn-ghost" onClick={onSkip} title="Start a break now">
                <SkipIcon size={16} /> Break now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
