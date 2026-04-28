import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Cat } from "./Cat";
import { fmt } from "../hooks/useTimer";
import type { Settings } from "../lib/types";
import { sounds } from "../lib/sound";

const ACTIVITIES = [
  { icon: "💧", title: "Hydrate", text: "Drink a full glass of water." },
  { icon: "👀", title: "20-20-20", text: "Look 20 ft away for 20 seconds." },
  { icon: "🤸", title: "Stretch", text: "Roll your shoulders & neck slowly." },
  { icon: "🌬️", title: "Breathe", text: "4 in · 7 hold · 8 out. Three rounds." },
  { icon: "🚶", title: "Walk", text: "Stand up. Take 30 steps anywhere." },
  { icon: "☀️", title: "Window", text: "Find natural light for a minute." },
];

const SASS = [
  "Sit. Stay. The code can wait.",
  "I am Loaf. I block your view.",
  "Tab? I don’t know her. Take your break.",
  "You wouldn’t skip a meal. Don’t skip a break.",
  "Your spine called. It says hi.",
  "Cute, but no. Break first.",
];

type Props = {
  open: boolean;
  remainingSec: number;
  totalSec: number;
  settings: Settings;
  petCount: number;
  feedCount: number;
  snoozedThisCycle: boolean;
  onPet: () => void;
  onFeed: () => void;
  onSnooze: () => void;
  onFinish: () => void;
};

export function BlockerOverlay({
  open,
  remainingSec,
  totalSec,
  settings,
  petCount,
  feedCount,
  snoozedThisCycle,
  onPet,
  onFeed,
  onSnooze,
  onFinish,
}: Props) {
  const [shake, setShake] = useState(0);
  const [sassIdx, setSassIdx] = useState(0);

  const activity = useMemo(
    () => ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)],
    [open]
  );

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(
      () => setSassIdx((i) => (i + 1) % SASS.length),
      6000
    );
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setShake((n) => n + 1);
        if (settings.soundEnabled) sounds.warning();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, settings.soundEnabled]);

  // Cat grows from small to fully blocking the screen as time progresses
  const grown = 1 - Math.max(0, Math.min(1, remainingSec / Math.max(1, totalSec)));
  const scale = 0.7 + grown * 0.55;

  const pct = ((totalSec - remainingSec) / Math.max(1, totalSec)) * 100;
  const expression = remainingSec > totalSec * 0.6 ? "smug" : remainingSec > totalSec * 0.2 ? "happy" : "sleepy";
  const finishable = remainingSec <= 0 || pct >= 99;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="blocker"
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-cocoa/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Floating sparkles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 18 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-2xl"
                initial={{
                  x: `${(i * 53) % 100}%`,
                  y: "110%",
                  opacity: 0,
                }}
                animate={{
                  y: "-10%",
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 8 + (i % 5),
                  delay: (i % 6) * 0.7,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ left: `${(i * 11) % 100}%` }}
              >
                {i % 3 === 0 ? "🐟" : i % 3 === 1 ? "✨" : "💤"}
              </motion.span>
            ))}
          </div>

          {/* Cat — slides in then expands */}
          <motion.div
            key={`cat-${shake}`}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ x: "-110%", scale: 0.6, rotate: -8 }}
            animate={{
              x: shake % 2 ? [-10, 10, -10, 10, 0] : 0,
              scale,
              rotate: 0,
            }}
            transition={{
              x: shake ? { duration: 0.4 } : { type: "spring", stiffness: 90, damping: 14 },
              scale: { duration: 1.2, ease: "easeOut" },
              rotate: { duration: 0.8 },
            }}
          >
            <Cat
              color={settings.catColor}
              expression={expression}
              size={Math.min(820, window.innerWidth * 0.85)}
              intensity={0.9}
              fed={feedCount}
              pets={petCount}
            />
          </motion.div>

          {/* Foreground UI */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative z-10 flex w-full max-w-2xl flex-col items-center px-4 text-center"
          >
            <div className="rounded-full bg-white/95 px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-toast shadow-soft">
              Break time · cat in charge
            </div>

            <motion.div
              key={remainingSec}
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              className="mt-4 select-none rounded-3xl bg-white/95 px-8 py-4 text-7xl font-black tabular-nums text-cocoa shadow-soft"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {fmt(remainingSec)}
            </motion.div>

            <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/40">
              <motion.div
                className="h-full bg-ginger"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ ease: "linear" }}
              />
            </div>

            <p className="mt-5 max-w-md text-lg font-bold text-cream drop-shadow">
              {SASS[sassIdx]}
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-3 text-cocoa shadow-soft">
              <span className="text-2xl">{activity.icon}</span>
              <div className="text-left">
                <div className="text-xs font-extrabold uppercase tracking-wider text-toast">
                  {activity.title}
                </div>
                <div className="text-sm font-semibold">{activity.text}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                className="btn bg-bubble text-cocoa shadow-soft hover:brightness-105"
                onClick={() => {
                  onPet();
                  if (settings.soundEnabled) sounds.purr();
                }}
              >
                🤚 Pet ({petCount})
              </button>
              <button
                className="btn bg-mint text-cocoa shadow-soft hover:brightness-105"
                onClick={() => {
                  onFeed();
                  if (settings.soundEnabled) sounds.ding();
                }}
              >
                🐟 Feed ({feedCount})
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {settings.snoozeAllowed && !finishable && (
                <button
                  className="btn bg-white/30 text-cream backdrop-blur hover:bg-white/40"
                  onClick={() => {
                    if (settings.soundEnabled) sounds.warning();
                    onSnooze();
                  }}
                  title="The cat will judge you."
                >
                  😾 I need {settings.snoozeMinutes} more min
                </button>
              )}
              <button
                className={`btn-primary ${finishable ? "" : "opacity-60"}`}
                onClick={onFinish}
                disabled={!finishable}
              >
                {finishable ? "Done — back to work" : `Wait ${fmt(remainingSec)}`}
              </button>
            </div>

            {snoozedThisCycle && (
              <p className="mt-3 text-xs font-bold text-bubble">
                streak reset · the cat saw that
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
