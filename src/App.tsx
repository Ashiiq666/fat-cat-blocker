import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "./hooks/useSettings";
import { useStats } from "./hooks/useStats";
import { useTimer } from "./hooks/useTimer";
import { TimerCard } from "./components/TimerCard";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatsPanel } from "./components/StatsPanel";
import { BlockerOverlay } from "./components/BlockerOverlay";
import { Toasts, type ToastItem } from "./components/Toast";
import { BrandMark, SunIcon, MoonIcon } from "./components/icons";
import { desktop } from "./lib/desktop";
import { sounds } from "./lib/sound";

export default function App() {
  const { settings, update, reset: resetSettings } = useSettings();
  const { stats, recordBreak, pet, feed, reset: resetStats } = useStats();

  const [breakSnapshot, setBreakSnapshot] = useState({ pets: 0, feeds: 0 });
  const [snoozedThisCycle, setSnoozedThisCycle] = useState(false);
  const breakStartRef = useRef<number | null>(null);
  const snoozedRef = useRef(false);
  // Guards against finalizing the same break twice (e.g. the natural-expiry
  // path and an overlay "done" click racing). Reset when a new break starts.
  const finalizedRef = useRef(false);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = useCallback((text: string, emoji?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, emoji }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const onWarning = useCallback(() => {
    const secs = settings.warnSeconds;
    const when =
      secs >= 60
        ? `${Math.round(secs / 60)} minute${secs >= 120 ? "s" : ""}`
        : `${secs} seconds`;
    pushToast(`Break in ${when}`, "😾");
    // Fire a real OS notification so the heads-up reaches the user even while
    // they're working in another app (the in-app toast alone is invisible
    // then). Setting a warn time is itself the opt-in, so this doesn't depend
    // on the separate "Desktop notifications" toggle.
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Break coming up", {
          body: `Your cat break starts in ${when}.`,
        });
      } catch {
        /* no-op */
      }
    }
  }, [pushToast, settings.warnSeconds]);

  // Records a completed break and tears down the cat overlay. Shared by the
  // natural-expiry path (onBreakEnd) and the manual "done" path (handleFinish),
  // guarded so it runs at most once per break cycle. Does NOT reset the timer —
  // the manual path resets it separately; on natural expiry useTimer already
  // reset itself to idle.
  const finalizeBreak = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    const elapsed = breakStartRef.current
      ? (Date.now() - breakStartRef.current) / 1000
      : settings.breakMinutes * 60;
    const wasSnoozed = snoozedRef.current;
    recordBreak(elapsed, wasSnoozed);
    pushToast(
      wasSnoozed ? "Streak reset" : "Nice. Streak +1",
      wasSnoozed ? "💔" : "🏆"
    );
    if (desktop.available) void desktop.endBlock();
  }, [recordBreak, pushToast, settings.breakMinutes]);

  // Fired by useTimer when the break timer runs to zero on its own.
  const handleBreakEnd = useCallback(() => {
    finalizeBreak();
  }, [finalizeBreak]);

  const onBreakStart = useCallback(() => {
    breakStartRef.current = Date.now();
    finalizedRef.current = false;
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
  } = useTimer({ settings, onBreakStart, onWarning, onBreakEnd: handleBreakEnd });

  // Manual finish (overlay "done" button / auto-dismiss): record + tear down
  // the overlay, then reset the still-running break timer back to idle.
  const handleFinish = useCallback(() => {
    finalizeBreak();
    finishBreakNow();
  }, [finalizeBreak, finishBreakNow]);

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

  const statusMeta =
    phase === "break"
      ? { label: "Break active", dot: "bg-mint" }
      : phase === "warning"
      ? { label: "Break soon", dot: "bg-ginger" }
      : phase === "working"
      ? running
        ? { label: "Focusing", dot: "bg-ginger" }
        : { label: "Paused", dot: "bg-zinc-400" }
      : { label: "Idle", dot: "bg-zinc-400" };

  return (
    <div className="relative min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 pt-7">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-ginger shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
            <BrandMark size={20} />
          </div>
          <div>
            <div className="text-[15px] font-semibold leading-tight tracking-tight">
              Fat Cat Blocker
            </div>
            <div className="text-[13px] text-zinc-500 dark:text-zinc-400">
              Focus timer with enforced breaks
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip">
            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </span>
          <button
            className="btn-icon"
            onClick={() => update("darkMode", !settings.darkMode)}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {settings.darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-5 px-4 pb-16 pt-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
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
        <div className="space-y-5">
          <SettingsPanel
            settings={settings}
            update={update}
            onReset={resetSettings}
          />
        </div>
      </main>

      <footer className="pb-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
        All data stays on your machine.
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
