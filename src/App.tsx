import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "./hooks/useSettings";
import { useStats } from "./hooks/useStats";
import { useTimer } from "./hooks/useTimer";
import { TimerCard } from "./components/TimerCard";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatsPanel } from "./components/StatsPanel";
import { BlockerOverlay } from "./components/BlockerOverlay";
import { Toasts, type ToastItem } from "./components/Toast";
import { desktop } from "./lib/desktop";
import { sounds } from "./lib/sound";

export default function App() {
  const { settings, update, reset: resetSettings } = useSettings();
  const { stats, recordBreak, pet, feed, reset: resetStats } = useStats();

  const [breakSnapshot, setBreakSnapshot] = useState({ pets: 0, feeds: 0 });
  const [snoozedThisCycle, setSnoozedThisCycle] = useState(false);
  const breakStartRef = useRef<number | null>(null);
  const snoozedRef = useRef(false);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = useCallback((text: string, emoji?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, emoji }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const onWarning = useCallback(() => {
    pushToast("Cat incoming…", "😾");
  }, [pushToast]);

  const onBreakStart = useCallback(() => {
    breakStartRef.current = Date.now();
    setBreakSnapshot({ pets: stats.pets, feeds: stats.feeds });
    setSnoozedThisCycle(false);
    snoozedRef.current = false;
    if (desktop.available) void desktop.startBlock();
    if (
      settings.notifyDesktop &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("Fat Cat Blocker", {
          body: "Break time. The cat is on your screen.",
          icon: "/cat.svg",
        });
      } catch {
        /* no-op */
      }
    }
  }, [stats.pets, stats.feeds, settings.notifyDesktop]);

  const {
    phase,
    running,
    remaining,
    start,
    pause,
    reset: resetTimer,
    finishBreakNow,
    snooze,
    skipToBreak,
  } = useTimer({ settings, onBreakStart, onWarning });

  const handleFinish = useCallback(() => {
    const elapsed = breakStartRef.current
      ? (Date.now() - breakStartRef.current) / 1000
      : settings.breakMinutes * 60;
    const wasSnoozed = snoozedRef.current;
    recordBreak(elapsed, wasSnoozed);
    pushToast(
      wasSnoozed ? "Streak reset 😾" : "Nice. Streak +1",
      wasSnoozed ? "💔" : "🏆"
    );
    if (desktop.available) void desktop.endBlock();
    finishBreakNow();
  }, [recordBreak, pushToast, finishBreakNow, settings.breakMinutes]);

  const handleSnooze = useCallback(() => {
    setSnoozedThisCycle(true);
    snoozedRef.current = true;
    pushToast(
      `Cat: I see you. ${settings.snoozeMinutes} more minutes.`,
      "🙄"
    );
    if (desktop.available) void desktop.endBlock();
    snooze();
  }, [pushToast, settings.snoozeMinutes, snooze]);

  const handlePet = useCallback(() => {
    pet();
    if (Math.random() < 0.15) pushToast("purrrr…", "💗");
  }, [pet, pushToast]);

  const handleFeed = useCallback(() => {
    feed();
    if (Math.random() < 0.2) pushToast("nom nom nom", "🐟");
  }, [feed, pushToast]);

  // Listen for actions sent back from overlay windows.
  useEffect(() => {
    if (!desktop.available) return;
    const off = desktop.onControlMessage((action) => {
      if (action === "done") handleFinish();
      else if (action === "snooze") handleSnooze();
      else if (action === "pet") handlePet();
      else if (action === "feed") handleFeed();
    });
    return () => {
      off?.();
    };
  }, [handleFinish, handleSnooze, handlePet, handleFeed]);

  // Prevent accidentally leaving during a break (browser only).
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (phase === "break") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  // Document title
  useEffect(() => {
    const m = Math.floor(remaining / 60);
    const s = (remaining % 60).toString().padStart(2, "0");
    const tag =
      phase === "break"
        ? "🐱 break"
        : phase === "warning"
        ? "⚠ soon"
        : phase === "working"
        ? "● focus"
        : "Fat Cat";
    document.title = `${m}:${s} · ${tag} · Fat Cat Blocker`;
  }, [remaining, phase]);

  const breakSessionPets = Math.max(0, stats.pets - breakSnapshot.pets);
  const breakSessionFeeds = Math.max(0, stats.feeds - breakSnapshot.feeds);

  // Notify on newly unlocked achievements
  const lastAchCount = useRef(stats.achievements.length);
  useEffect(() => {
    if (stats.achievements.length > lastAchCount.current) {
      const latest = stats.achievements[stats.achievements.length - 1];
      pushToast(`Unlocked: ${latest.title}`, "🏆");
    }
    lastAchCount.current = stats.achievements.length;
  }, [stats.achievements, pushToast]);

  const breakTotal = settings.breakMinutes * 60;

  // Broadcast state to overlay windows on every tick.
  useEffect(() => {
    if (!desktop.available || phase !== "break") return;
    void desktop.tick({
      remainingSec: remaining,
      totalSec: breakTotal,
      catColor: settings.catColor,
      petCount: breakSessionPets,
      feedCount: breakSessionFeeds,
    });
  }, [
    phase,
    remaining,
    breakTotal,
    settings.catColor,
    breakSessionPets,
    breakSessionFeeds,
  ]);

  // React to "blocked exit attempts" — warning toast on next focus.
  useEffect(() => {
    if (!desktop.available) return;
    const off = desktop.onNudge(() => {
      if (settings.soundEnabled) sounds.warning();
    });
    return () => {
      off?.();
    };
  }, [settings.soundEnabled]);

  const sectionDots = useMemo(
    () => (
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dots opacity-60" />
    ),
    []
  );

  return (
    <div className="relative min-h-screen">
      {sectionDots}

      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ginger text-xl shadow-soft">
            🐱
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-toast">
              Fat Cat Blocker
            </div>
            <div className="text-sm opacity-70">
              Take your break. The cat insists.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip">
            {phase === "break"
              ? "🐱 Break"
              : phase === "working" || phase === "warning"
              ? running
                ? "● Focus"
                : "⏸ Paused"
              : "Idle"}
          </span>
          <button
            className="btn-ghost h-10 px-3 py-2 text-sm"
            onClick={() => update("darkMode", !settings.darkMode)}
            aria-label="toggle theme"
          >
            {settings.darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 pb-16 pt-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TimerCard
            phase={phase}
            running={running}
            remaining={remaining}
            settings={settings}
            onStart={start}
            onPause={pause}
            onReset={resetTimer}
            onSkip={skipToBreak}
          />
          <StatsPanel stats={stats} onReset={resetStats} />
        </div>
        <div className="space-y-6">
          <SettingsPanel
            settings={settings}
            update={update}
            onReset={resetSettings}
          />
          <div className="card">
            <h3 className="mb-2 text-sm font-extrabold uppercase tracking-widest opacity-70">
              Tips
            </h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li>
                • The cat walks in from the side and sits on every screen until
                the timer hits zero.
              </li>
              <li>
                • <span className="font-bold">Pet</span> &{" "}
                <span className="font-bold">Feed</span> the cat for stat
                bonuses & achievements.
              </li>
              <li>• Snoozing breaks your streak. The cat remembers.</li>
              <li>
                • Cmd+Q / Cmd+M / Cmd+W are blocked while a break is active.
              </li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="pb-8 text-center text-xs opacity-60">
        Made with 🐟 for backs that hurt. All data stays on your machine.
      </footer>

      {/* Browser fallback: in-page overlay only when not running in Electron. */}
      {!desktop.available && (
        <BlockerOverlay
          open={phase === "break"}
          remainingSec={remaining}
          totalSec={breakTotal}
          settings={settings}
          petCount={breakSessionPets}
          feedCount={breakSessionFeeds}
          snoozedThisCycle={snoozedThisCycle}
          onPet={handlePet}
          onFeed={handleFeed}
          onSnooze={handleSnooze}
          onFinish={handleFinish}
        />
      )}

      <Toasts items={toasts} />
    </div>
  );
}
