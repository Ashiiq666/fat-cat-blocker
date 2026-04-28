import { useCallback, useEffect, useState } from "react";
import { ACHIEVEMENTS, DEFAULT_STATS, type Stats } from "../lib/types";
import { KEYS, load, save, todayKey } from "../lib/storage";

export function useStats() {
  const [stats, setStats] = useState<Stats>(() => {
    const raw = load<Stats>(KEYS.stats, DEFAULT_STATS);
    if (raw.lastBreakDay !== todayKey()) {
      return { ...raw, breaksToday: 0, lastBreakDay: todayKey() };
    }
    return raw;
  });

  useEffect(() => save(KEYS.stats, stats), [stats]);

  const evaluateAchievements = useCallback((s: Stats): Stats => {
    const have = new Set(s.achievements.map((a) => a.id));
    const newly: Stats["achievements"] = [];
    const check = (id: string, cond: boolean) => {
      if (cond && !have.has(id)) {
        const meta = ACHIEVEMENTS.find((a) => a.id === id);
        if (meta) newly.push({ ...meta, unlockedAt: Date.now() });
      }
    };
    check("first-break", s.breaksTaken >= 1);
    check("streak-5", s.streak >= 5);
    check("streak-10", s.streak >= 10);
    check("perfect-day", s.breaksToday >= 8);
    check("well-fed", s.feeds >= 25);
    check("best-friend", s.pets >= 100);
    check("no-snooze", s.streak >= 20);
    if (!newly.length) return s;
    return { ...s, achievements: [...s.achievements, ...newly] };
  }, []);

  const recordBreak = useCallback(
    (durationSec: number, snoozed: boolean) => {
      setStats((s) => {
        const isToday = s.lastBreakDay === todayKey();
        const next: Stats = {
          ...s,
          breaksTaken: s.breaksTaken + 1,
          breaksToday: (isToday ? s.breaksToday : 0) + 1,
          lastBreakDay: todayKey(),
          totalBreakSeconds: s.totalBreakSeconds + Math.max(0, Math.round(durationSec)),
          streak: snoozed ? 0 : s.streak + 1,
          bestStreak: Math.max(s.bestStreak, snoozed ? s.bestStreak : s.streak + 1),
          snoozesUsed: s.snoozesUsed + (snoozed ? 1 : 0),
        };
        return evaluateAchievements(next);
      });
    },
    [evaluateAchievements]
  );

  const pet = useCallback(
    () => setStats((s) => evaluateAchievements({ ...s, pets: s.pets + 1 })),
    [evaluateAchievements]
  );
  const feed = useCallback(
    () => setStats((s) => evaluateAchievements({ ...s, feeds: s.feeds + 1 })),
    [evaluateAchievements]
  );
  const reset = useCallback(() => setStats(DEFAULT_STATS), []);

  return { stats, recordBreak, pet, feed, reset };
}

export function moodFor(stats: Stats): {
  label: string;
  emoji: string;
  hp: number;
} {
  const ratio =
    stats.breaksTaken === 0
      ? 0.5
      : (stats.breaksTaken - stats.snoozesUsed) /
        Math.max(1, stats.breaksTaken);
  const hp = Math.round(ratio * 100);
  if (ratio >= 0.95) return { label: "Blissful", emoji: "✨", hp };
  if (ratio >= 0.8) return { label: "Content", emoji: "😺", hp };
  if (ratio >= 0.6) return { label: "Neutral", emoji: "😐", hp };
  if (ratio >= 0.4) return { label: "Suspicious", emoji: "🙄", hp };
  return { label: "Disappointed", emoji: "😾", hp };
}
