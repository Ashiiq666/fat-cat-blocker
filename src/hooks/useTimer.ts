import { useCallback, useEffect, useRef, useState } from "react";
import type { Phase, Settings } from "../lib/types";
import { sounds } from "../lib/sound";

type Args = {
  settings: Settings;
  onBreakStart: () => void;
  onWarning: () => void;
};

export function useTimer({ settings, onBreakStart, onWarning }: Args) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(settings.workMinutes * 60);
  const phaseRef = useRef<Phase>("idle");
  const warnedRef = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase === "idle") {
      setRemaining(settings.workMinutes * 60);
    }
  }, [settings.workMinutes, settings.breakMinutes, phase]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        const next = r - 1;
        const cur = phaseRef.current;
        if (cur === "working" && next === settings.warnSeconds && !warnedRef.current) {
          warnedRef.current = true;
          if (settings.soundEnabled) sounds.warning();
          setPhase("warning");
          onWarning();
        }
        if (next <= 0) {
          if (cur === "working" || cur === "warning") {
            warnedRef.current = false;
            setPhase("break");
            if (settings.soundEnabled) sounds.meow();
            onBreakStart();
            return settings.breakMinutes * 60;
          }
          if (cur === "break") {
            if (settings.soundEnabled) sounds.chime();
            setPhase("idle");
            setRunning(false);
            return settings.workMinutes * 60;
          }
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [
    running,
    settings.warnSeconds,
    settings.soundEnabled,
    settings.workMinutes,
    settings.breakMinutes,
    onBreakStart,
    onWarning,
  ]);

  const start = useCallback(() => {
    if (phase === "idle") {
      setPhase("working");
      setRemaining(settings.workMinutes * 60);
    }
    setRunning(true);
  }, [phase, settings.workMinutes]);

  const pause = useCallback(() => setRunning(false), []);

  const reset = useCallback(() => {
    setRunning(false);
    setPhase("idle");
    warnedRef.current = false;
    setRemaining(settings.workMinutes * 60);
  }, [settings.workMinutes]);

  const finishBreakNow = useCallback(() => {
    if (settings.soundEnabled) sounds.chime();
    setPhase("idle");
    setRunning(false);
    warnedRef.current = false;
    setRemaining(settings.workMinutes * 60);
  }, [settings.workMinutes, settings.soundEnabled]);

  const snooze = useCallback(() => {
    setPhase("working");
    warnedRef.current = false;
    setRemaining(settings.snoozeMinutes * 60);
    setRunning(true);
  }, [settings.snoozeMinutes]);

  const skipToBreak = useCallback(() => {
    warnedRef.current = false;
    setPhase("break");
    setRemaining(settings.breakMinutes * 60);
    setRunning(true);
    if (settings.soundEnabled) sounds.meow();
    onBreakStart();
  }, [settings.breakMinutes, settings.soundEnabled, onBreakStart]);

  return {
    phase,
    running,
    remaining,
    start,
    pause,
    reset,
    finishBreakNow,
    snooze,
    skipToBreak,
  };
}

export function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}
