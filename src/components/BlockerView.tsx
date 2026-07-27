// Renderer for the transparent overlay windows.
// The cat walks in from a side, sits in the centre, and walks out when done.
// Everything outside the cat + the floating timer pill is fully transparent
// (the user can SEE their own apps), but every click is absorbed by the
// Electron window above so they cannot interact with whatever is behind.

import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChromaKeyVideo } from "./ChromaKeyVideo";
import { fmt } from "../hooks/useTimer";
import { desktop, type BlockerState } from "../lib/desktop";

// Memoized cat container — re-renders only when its own props change
// (exiting / shake). The parent BlockerView re-renders every
// second on timer ticks; this component's referential equality on props
// stops React from re-rendering the cat or framer-motion from re-evaluating
// its animation, so the cat just sits and plays the looped video.
// Must be base-relative, not "/catvideo.mp4". Packaged builds are loaded over
// file://, where a root-absolute path resolves against the *filesystem* root
// rather than the app bundle, so the video silently 404s and the break shows
// an empty screen. A dev server hides this, because there "/" is the web root.
const CAT_VIDEO_SRC = `${import.meta.env.BASE_URL}catvideo.mp4`;

const CAT_VIDEO_STYLE: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
  pointerEvents: "none",
  // `contain` (not `cover`) keeps the whole cat in frame so the head isn't
  // clipped when the cat sits up at the end of the clip.
  objectFit: "contain",
  objectPosition: "50% 100%",
};
// Gentle rest reminders that rotate under the timer through the break.
const REST_MESSAGES = [
  "Drink some water",
  "Take a walk around the office",
  "Stretch your body — slowly",
  "Calm down. It’s your time to rest.",
  "I’m not disturbing you, just take a rest",
  "Look out the window for a minute",
  "Close your eyes. Breathe deep.",
  "Roll your shoulders & neck",
  "Stand up. Move. Reset.",
  "Your screen will wait. You won’t.",
];

const CatContainer = memo(function CatContainer({
  exiting,
  shake,
}: {
  exiting: boolean;
  shake: number;
}) {
  // Cat fades in 1 s after the overlay opens, fades out on dismiss.
  // Shake jiggles the container briefly when a blocked shortcut is pressed.
  const animate = exiting
    ? { opacity: 0 }
    : shake % 2
    ? { x: ["0vw", "-0.6vw", "0.6vw", "0vw"], opacity: 1 }
    : { opacity: 1, x: 0 };
  const transition = exiting
    ? { opacity: { duration: 0.8 } }
    : shake
    ? { duration: 0.4 }
    : { opacity: { delay: 1.0, duration: 0.6 } };
  return (
    <motion.div
      key={`cat-${shake}`}
      className="fixed inset-0 z-0"
      style={{ pointerEvents: "none" }}
      initial={{ opacity: 0 }}
      animate={animate}
      transition={transition}
    >
      {/* The clip runs once (cat walks in from the left, settles, lies down)
          and then loops its last few seconds, where the cat is asleep and
          only breathing — so a long break doesn't replay the walk-in over
          and over. Any tail from ~3 s up loops without a visible seam. */}
      <ChromaKeyVideo src={CAT_VIDEO_SRC} style={CAT_VIDEO_STYLE} tailLoopSeconds={4} />
    </motion.div>
  );
});

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
  const [restIdx, setRestIdx] = useState(() =>
    Math.floor(Math.random() * REST_MESSAGES.length)
  );
  const initialised = useRef(false);


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

  // Rotate the rest reminder every 6 s.
  useEffect(() => {
    const id = window.setInterval(
      () => setRestIdx((i) => (i + 1) % REST_MESSAGES.length),
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

  // Auto-dismiss the moment the break timer hits zero — no user click needed.
  // The slide-out animation runs (1.8 s) before main tears down the overlays.
  useEffect(() => {
    if (!finishable || exiting) return;
    setExiting(true);
    const id = window.setTimeout(() => {
      void desktop.requestDone();
    }, 1900);
    return () => window.clearTimeout(id);
  }, [finishable, exiting]);

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
      style={{
        background:
          "radial-gradient(ellipse at 50% 70%, rgba(15,12,22,0.45) 0%, rgba(15,12,22,0.72) 70%, rgba(15,12,22,0.86) 100%)",
        backdropFilter: "blur(6px) saturate(0.9)",
        WebkitBackdropFilter: "blur(6px) saturate(0.9)",
      }}
    >
      {/* The cat — full-screen chroma-keyed video. Fades in 1 s after open.
          Lives in a memoized child so it doesn't re-render on per-second
          timer ticks. */}
      <CatContainer exiting={exiting} shake={shake} />

      {/* Big timer + rotating rest message — top-left corner */}
      <AnimatePresence>
        {!exiting && (
          <motion.div
            key="timer"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            className="pointer-events-none absolute left-[5vw] top-[5vh] z-20 select-none text-white"
            style={{
              textShadow: "0 4px 24px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.45)",
            }}
          >
            <div
              className="font-black tabular-nums"
              style={{
                fontSize: "clamp(72px, 12vw, 200px)",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fmt(state.remainingSec)}
            </div>
            <div
              className="mt-3 max-w-[40vw] font-semibold text-white/90"
              style={{ fontSize: "clamp(18px, 1.6vw, 28px)", lineHeight: 1.3 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={restIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {REST_MESSAGES[restIdx]}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tiny corner controls — Snooze + Done */}
      <AnimatePresence>
        {!exiting && (
          <motion.div
            key="corner-controls"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 1.6, duration: 0.4 }}
            className="pointer-events-auto absolute right-[2vw] top-[3vh] z-30 flex items-center gap-2"
          >
            <button
              onClick={handleSnooze}
              className="rounded-full border border-white/20 bg-black/35 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/90 backdrop-blur transition hover:bg-black/55 hover:text-white"
            >
              Snooze
            </button>
            <button
              onClick={handleDone}
              disabled={!finishable}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider backdrop-blur transition ${
                finishable
                  ? "bg-white text-cocoa shadow hover:brightness-105"
                  : "border border-white/15 bg-black/25 text-white/40"
              }`}
            >
              {finishable ? "Done" : fmt(state.remainingSec)}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
