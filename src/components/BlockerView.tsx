// Renderer for the transparent overlay windows.
// The cat walks in from a side, sits in the centre, and walks out when done.
// Everything outside the cat + the floating timer pill is fully transparent
// (the user can SEE their own apps), but every click is absorbed by the
// Electron window above so they cannot interact with whatever is behind.

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cat } from "./Cat";
import { fmt } from "../hooks/useTimer";
import { desktop, type BlockerState } from "../lib/desktop";
import type { CatColor } from "../lib/types";

const SASS = [
  "Sit. Stay. The code can wait.",
  "I am Loaf. I block your view.",
  "Tab? I don’t know her. Take your break.",
  "You wouldn’t skip a meal. Don’t skip a break.",
  "Your spine called. It says hi.",
  "Cute, but no. Break first.",
];

const ACTIVITIES = [
  { icon: "💧", title: "Hydrate", text: "Drink a full glass of water." },
  { icon: "👀", title: "20-20-20", text: "Look 20 ft away for 20 seconds." },
  { icon: "🤸", title: "Stretch", text: "Roll your shoulders & neck slowly." },
  { icon: "🌬️", title: "Breathe", text: "4 in · 7 hold · 8 out. Three rounds." },
  { icon: "🚶", title: "Walk", text: "Stand up. Take 30 steps." },
  { icon: "☀️", title: "Window", text: "Find natural light for a minute." },
];

export function BlockerView() {
  const [state, setState] = useState<BlockerState>({
    remainingSec: 0,
    totalSec: 1,
    catColor: "ginger",
    petCount: 0,
    feedCount: 0,
  });
  const [exiting, setExiting] = useState(false);
  const [shake, setShake] = useState(0);
  const [sassIdx, setSassIdx] = useState(0);
  const initialised = useRef(false);

  // Walks in from the left or the right (chosen once per mount).
  const fromLeft = useMemo(() => Math.random() < 0.5, []);
  const activity = useMemo(
    () => ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)],
    []
  );

  // Make the body transparent so only what we draw shows through the
  // Electron transparent window.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlBg: html.style.background,
      bodyBg: body.style.background,
      bodyOverflow: body.style.overflow,
    };
    html.style.background = "transparent";
    body.style.background = "transparent";
    body.style.overflow = "hidden";
    body.classList.add("blocker-body");
    return () => {
      html.style.background = prev.htmlBg;
      body.style.background = prev.bodyBg;
      body.style.overflow = prev.bodyOverflow;
      body.classList.remove("blocker-body");
    };
  }, []);

  // Subscribe to state ticks broadcast by the control window.
  useEffect(() => {
    const off = desktop.onBlockerState((s) => {
      initialised.current = true;
      setState(s);
    });
    return () => {
      off?.();
    };
  }, []);

  // Rotate sass every 6 s.
  useEffect(() => {
    const id = window.setInterval(
      () => setSassIdx((i) => (i + 1) % SASS.length),
      6000
    );
    return () => window.clearInterval(id);
  }, []);

  // Nudge animation when the user attempts a blocked shortcut.
  useEffect(() => {
    const off = desktop.onNudge(() => setShake((n) => n + 1));
    return () => {
      off?.();
    };
  }, []);

  const finishable = initialised.current && state.remainingSec <= 0;
  const pct = Math.min(
    100,
    ((state.totalSec - state.remainingSec) / Math.max(1, state.totalSec)) * 100
  );

  const sideOff = fromLeft ? "-60vw" : "60vw";
  const exitOff = fromLeft ? "60vw" : "-60vw"; // exits the opposite way

  // Cat sizing — comfortably big but not eating the entire screen.
  const catSize = useMemo(
    () => Math.min(720, Math.max(380, window.innerWidth * 0.42)),
    []
  );

  function handleDone() {
    if (!finishable || exiting) return;
    setExiting(true);
    // Let the walk-out animation finish, then ask main to tear down overlays.
    window.setTimeout(() => {
      void desktop.requestDone();
    }, 1900);
  }

  function handleSnooze() {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(() => {
      void desktop.requestSnooze();
    }, 1900);
  }

  return (
    <div
      className="fixed inset-0 select-none overflow-hidden"
      // Near-opaque dark backdrop so macOS reliably captures every click
      // and we don't lose interaction events to whatever app is behind.
      // Backdrop-blur softens the underlying desktop into a "you're paused"
      // visual without hiding it completely — same look as Cat Gatekeeper.
      style={{
        background:
          "radial-gradient(ellipse at 50% 70%, rgba(15,12,22,0.62) 0%, rgba(15,12,22,0.86) 70%, rgba(15,12,22,0.94) 100%)",
        backdropFilter: "blur(6px) saturate(0.9)",
        WebkitBackdropFilter: "blur(6px) saturate(0.9)",
      }}
    >
      {/* Floating timer pill — sits near the top, fades in once the cat is in place */}
      <AnimatePresence>
        {!exiting && (
          <motion.div
            key="hud"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ delay: 1.6, duration: 0.5 }}
            className="pointer-events-none absolute left-1/2 top-[6vh] z-10 flex -translate-x-1/2 flex-col items-center gap-3"
          >
            <div className="rounded-full bg-cocoa/95 px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-cream shadow-soft">
              Break time · cat in charge
            </div>
            <div
              className="rounded-3xl bg-white/95 px-8 py-3 font-black tabular-nums text-cocoa shadow-soft"
              style={{ fontSize: 64, fontVariantNumeric: "tabular-nums" }}
            >
              {fmt(state.remainingSec)}
            </div>
            <div className="h-2 w-72 overflow-hidden rounded-full bg-white/40">
              <motion.div
                className="h-full bg-ginger"
                animate={{ width: `${pct}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
            <div className="rounded-full bg-cocoa/85 px-4 py-1 text-sm font-bold text-cream shadow-soft">
              {SASS[sassIdx]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The cat — walks in, sits with breathing, walks out on done/snooze */}
      <motion.div
        key={`cat-${shake}`}
        className="absolute left-1/2 z-20"
        style={{ bottom: "8vh", x: "-50%" }}
        initial={{
          x: `calc(-50% + ${sideOff})`,
          y: 0,
          rotate: fromLeft ? -2 : 2,
          opacity: 0,
        }}
        animate={
          exiting
            ? {
                x: `calc(-50% + ${exitOff})`,
                y: [0, -10, 0, -10, 0, -10, 0],
                rotate: fromLeft ? 2 : -2,
                opacity: [1, 1, 0],
              }
            : shake % 2
            ? { x: ["-50%", "-46%", "-54%", "-50%"], y: [0, -8, 0] }
            : {
                x: "-50%",
                y: [0, -14, 0, -14, 0, -10, 0],
                rotate: 0,
                opacity: 1,
              }
        }
        transition={
          exiting
            ? {
                x: { duration: 1.8, ease: [0.6, 0, 0.4, 1] },
                y: {
                  duration: 0.55,
                  repeat: 3,
                  ease: "easeInOut",
                  times: [0, 0.5, 1],
                },
                opacity: { duration: 1.8, times: [0, 0.7, 1] },
                rotate: { duration: 1.8 },
              }
            : shake
            ? { duration: 0.5 }
            : {
                x: { duration: 2.2, ease: [0.22, 0.61, 0.36, 1] },
                y: {
                  duration: 0.52,
                  repeat: 4,
                  ease: "easeInOut",
                },
                opacity: { duration: 0.4 },
                rotate: { duration: 1.2 },
              }
        }
      >
        {/* paw shadow */}
        <motion.div
          className="absolute left-1/2 top-full h-3 w-2/3 -translate-x-1/2 rounded-full bg-black/35 blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: exiting ? 0 : 0.6, scale: [0.9, 1, 0.9] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <Cat
          color={state.catColor as CatColor}
          expression={
            exiting ? "happy" : state.remainingSec > state.totalSec * 0.4 ? "smug" : "sleepy"
          }
          size={catSize}
          intensity={0.9}
          fed={state.feedCount}
          pets={state.petCount}
        />
      </motion.div>

      {/* Action panel — appears next to the seated cat */}
      <AnimatePresence>
        {!exiting && (
          <motion.div
            key="panel"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ delay: 1.8, duration: 0.5 }}
            className="pointer-events-auto absolute bottom-[5vh] left-1/2 z-30 flex w-[min(680px,92vw)] -translate-x-1/2 flex-col items-center gap-3 rounded-3xl bg-white/95 p-4 shadow-soft backdrop-blur dark:bg-plum/95"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-cream/80 px-3 py-2 text-cocoa dark:bg-white/10 dark:text-cream">
              <span className="text-2xl">{activity.icon}</span>
              <div className="text-left">
                <div className="text-xs font-extrabold uppercase tracking-wider text-toast">
                  {activity.title}
                </div>
                <div className="text-sm font-semibold">{activity.text}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                className="btn bg-bubble text-cocoa shadow-sm hover:brightness-105"
                onClick={() => {
                  void desktop.requestPet();
                  setState((s) => ({ ...s, petCount: s.petCount + 1 }));
                }}
              >
                🤚 Pet ({state.petCount})
              </button>
              <button
                className="btn bg-mint text-cocoa shadow-sm hover:brightness-105"
                onClick={() => {
                  void desktop.requestFeed();
                  setState((s) => ({ ...s, feedCount: s.feedCount + 1 }));
                }}
              >
                🐟 Feed ({state.feedCount})
              </button>
              <button
                className="btn bg-white/70 text-cocoa shadow-sm hover:bg-white dark:bg-white/10 dark:text-cream dark:hover:bg-white/20"
                onClick={handleSnooze}
                title="The cat will judge you."
              >
                😾 Snooze
              </button>
              <button
                className={`btn-primary ${finishable ? "" : "opacity-60"}`}
                onClick={handleDone}
                disabled={!finishable}
              >
                {finishable ? "Done — back to work" : `Wait ${fmt(state.remainingSec)}`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
