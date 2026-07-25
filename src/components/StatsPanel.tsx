import { ACHIEVEMENTS, type Stats } from "../lib/types";
import { moodFor } from "../hooks/useStats";
import { TrophyIcon, LockIcon } from "./icons";

function formatHM(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h > 0) return `${h}h ${rem}m`;
  return `${m}m`;
}

export function StatsPanel({ stats, onReset }: { stats: Stats; onReset: () => void }) {
  const mood = moodFor(stats);
  const unlocked = new Set(stats.achievements.map((a) => a.id));

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Stats</h2>
        <button
          onClick={onReset}
          className="text-xs font-medium text-zinc-500 transition-colors hover:text-ginger dark:text-zinc-400"
        >
          Reset stats
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Today" value={String(stats.breaksToday)} sub="breaks" />
        <Stat label="Streak" value={String(stats.streak)} sub={`best ${stats.bestStreak}`} />
        <Stat label="Rested" value={formatHM(stats.totalBreakSeconds)} sub="total" />
        <Stat label="All-time" value={String(stats.breaksTaken)} sub="breaks" />
      </div>

      {/* Cat mood / HP */}
      <div className="surface mt-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow">Cat mood</div>
            <div className="mt-0.5 text-sm font-semibold">{mood.label}</div>
          </div>
          <div className="text-right">
            <div className="eyebrow">HP</div>
            <div className="mt-0.5 text-sm font-semibold tabular-nums">{mood.hp}%</div>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-ginger to-mint"
            style={{ width: `${mood.hp}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 sm:grid-cols-4">
          <MoodStat label="Pets" value={stats.pets} />
          <MoodStat label="Fed" value={stats.feeds} />
          <MoodStat label="Snoozes" value={stats.snoozesUsed} />
          <MoodStat label="Unlocks" value={stats.achievements.length} />
        </div>
      </div>

      {/* Achievements */}
      <div className="mt-5">
        <div className="eyebrow mb-2.5">Achievements</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked.has(a.id);
            return (
              <div
                key={a.id}
                className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                  got
                    ? "border-ginger/30 bg-ginger/5"
                    : "border-zinc-200/70 bg-zinc-50/40 dark:border-zinc-800/70 dark:bg-zinc-800/20"
                }`}
              >
                <div
                  className={`mt-0.5 shrink-0 ${
                    got ? "text-ginger" : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {got ? <TrophyIcon size={18} /> : <LockIcon size={18} />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {a.title}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {a.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="surface px-3 py-3 text-center">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">{sub}</div>}
    </div>
  );
}

function MoodStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="tabular-nums font-semibold text-zinc-700 dark:text-zinc-200">{value}</span>
      <span>{label}</span>
    </div>
  );
}
