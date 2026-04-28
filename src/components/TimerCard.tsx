import { motion } from "framer-motion";
import { fmt } from "../hooks/useTimer";
import type { Phase, Settings } from "../lib/types";
import { Cat } from "./Cat";

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
  const total =
    phase === "break"
      ? settings.breakMinutes * 60
      : settings.workMinutes * 60;
  const pct = ((total - remaining) / Math.max(1, total)) * 100;
  const status =
    phase === "idle"
      ? "Ready when you are."
      : phase === "warning"
      ? "Cat incoming…"
      : phase === "break"
      ? "Break in progress · check the cat 🙂"
      : running
      ? "Working — the cat is napping."
      : "Paused.";

  // Circular progress
  const r = 110;
  const c = 2 * Math.PI * r;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative h-64 w-64 shrink-0">
          <svg viewBox="0 0 260 260" className="h-full w-full -rotate-90">
            <circle
              cx="130"
              cy="130"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              className="text-cocoa/10 dark:text-white/10"
            />
            <motion.circle
              cx="130"
              cy="130"
              r={r}
              fill="none"
              stroke={phase === "break" ? "#9BE3C0" : phase === "warning" ? "#FFB1C8" : "#F2A65A"}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={c}
              animate={{ strokeDashoffset: c - (pct / 100) * c }}
              transition={{ ease: "linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xs font-extrabold uppercase tracking-widest text-toast">
              {phase === "break" ? "Break" : phase === "idle" ? "Next break" : "Working"}
            </div>
            <div className="font-black tabular-nums leading-none text-cocoa dark:text-cream"
              style={{ fontSize: 56 }}>
              {fmt(remaining)}
            </div>
            <div className="mt-1 text-xs opacity-70">{status}</div>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <Cat
              size={92}
              color={settings.catColor}
              expression={phase === "break" ? "happy" : phase === "warning" ? "smug" : "sleepy"}
              intensity={running ? 0.6 : 0.2}
            />
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-toast">
                Fat Cat Blocker
              </div>
              <h1 className="text-2xl font-black leading-tight">
                {phase === "break" ? "It’s break o’clock." : "Stay focused, stay round."}
              </h1>
              <div className="text-sm opacity-75">
                {settings.workMinutes}-min focus · {settings.breakMinutes}-min cat
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!running && phase !== "break" && (
              <button className="btn-primary" onClick={onStart}>
                ▶ Start focus
              </button>
            )}
            {running && phase !== "break" && (
              <button className="btn-ghost" onClick={onPause}>
                ⏸ Pause
              </button>
            )}
            <button className="btn-ghost" onClick={onReset}>
              ⟲ Reset
            </button>
            {phase !== "break" && (
              <button className="btn-ghost" onClick={onSkip} title="Send the cat now">
                😼 Break now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
