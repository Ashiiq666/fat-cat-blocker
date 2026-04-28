import { ACHIEVEMENTS, type Stats } from "../lib/types";
import { moodFor } from "../hooks/useStats";

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
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Stats</h2>
        <button onClick={onReset} className="text-xs font-bold text-toast hover:underline">
          Reset stats
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Today" value={String(stats.breaksToday)} sub="breaks" />
        <Stat label="Streak" value={String(stats.streak)} sub={`best ${stats.bestStreak}`} />
        <Stat label="Rested" value={formatHM(stats.totalBreakSeconds)} sub="total" />
        <Stat label="All-time" value={String(stats.breaksTaken)} sub="breaks" />
      </div>

      <div className="mt-5 rounded-2xl bg-white/60 p-4 dark:bg-white/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest opacity-70">
              Cat mood
            </div>
            <div className="text-lg font-extrabold">
              {mood.emoji} {mood.label}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-extrabold uppercase tracking-widest opacity-70">HP</div>
            <div className="text-lg font-extrabold tabular-nums">{mood.hp}%</div>
          </div>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-cocoa/10 dark:bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-bubble via-ginger to-mint"
            style={{ width: `${mood.hp}%` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold opacity-80">
          <div>🤚 pets · {stats.pets}</div>
          <div>🐟 fed · {stats.feeds}</div>
          <div>😾 snoozes · {stats.snoozesUsed}</div>
          <div>🏆 unlocks · {stats.achievements.length}</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-xs font-extrabold uppercase tracking-widest opacity-70">
          Achievements
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked.has(a.id);
            return (
              <div
                key={a.id}
                className={`flex items-start gap-3 rounded-2xl p-3 transition ${
                  got
                    ? "bg-mint/40 dark:bg-mint/15"
                    : "bg-white/40 opacity-60 dark:bg-white/5"
                }`}
              >
                <div className="text-2xl">{got ? "🏆" : "🔒"}</div>
                <div>
                  <div className="text-sm font-extrabold">{a.title}</div>
                  <div className="text-xs opacity-80">{a.description}</div>
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
    <div className="rounded-2xl bg-white/60 p-3 text-center dark:bg-white/5">
      <div className="text-xs font-extrabold uppercase tracking-widest opacity-70">{label}</div>
      <div className="text-2xl font-black tabular-nums">{value}</div>
      {sub && <div className="text-xs opacity-70">{sub}</div>}
    </div>
  );
}
