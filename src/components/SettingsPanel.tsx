import { useState } from "react";
import { motion } from "framer-motion";
import type { CatColor, Settings } from "../lib/types";
import { ChevronIcon } from "./icons";

const COLORS: { id: CatColor; label: string; swatch: string }[] = [
  { id: "ginger", label: "Ginger", swatch: "#F2A65A" },
  { id: "tuxedo", label: "Tuxedo", swatch: "#2B2730" },
  { id: "calico", label: "Calico", swatch: "#FFD9B7" },
  { id: "siamese", label: "Siamese", swatch: "#F4E1C9" },
];

type Props = {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onReset: () => void;
};

function NumberRow({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
  disabled,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-3.5 ${
        disabled ? "opacity-45" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="stepper">
          <button
            className="stepper-btn"
            onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
            disabled={disabled}
            aria-label={`Decrease ${label}`}
          >
            −
          </button>
          <input
            type="number"
            className="w-12 bg-transparent py-2 text-center text-sm font-semibold tabular-nums outline-none"
            value={value}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n))
                onChange(Math.min(max, Math.max(min, +n.toFixed(2))));
            }}
          />
          <button
            className="stepper-btn"
            onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))}
            disabled={disabled}
            aria-label={`Increase ${label}`}
          >
            +
          </button>
        </div>
        {suffix && (
          <span className="w-8 text-xs text-zinc-400 dark:text-zinc-500">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between gap-4 py-3.5 text-left"
    >
      <div>
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</div>}
      </div>
      <div
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          value ? "bg-ginger" : "bg-zinc-200 dark:bg-zinc-700"
        }`}
      >
        <motion.div
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
          animate={{ x: value ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}

export function SettingsPanel({ settings, update, onReset }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="card">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Settings</h2>
        <button
          onClick={onReset}
          className="text-xs font-medium text-zinc-500 transition-colors hover:text-ginger dark:text-zinc-400"
        >
          Reset all
        </button>
      </div>

      {/* Primary timer settings — the flow a user reasons about first. */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
        <NumberRow
          label="Work duration"
          hint="How long to focus before a break appears."
          value={settings.workMinutes}
          min={1}
          max={180}
          onChange={(v) => update("workMinutes", v)}
          suffix="min"
        />
        <NumberRow
          label="Break duration"
          hint="How long the break screen stays active."
          value={settings.breakMinutes}
          min={1}
          max={5}
          onChange={(v) => update("breakMinutes", v)}
          suffix="min"
        />
        <NumberRow
          label="Heads-up warning"
          hint="Get notified this long before a break begins."
          value={settings.warnSeconds}
          min={0}
          max={120}
          step={5}
          onChange={(v) => update("warnSeconds", v)}
          suffix="sec"
        />
      </div>

      {/* Advanced — snooze, notifications, appearance, personalization. */}
      <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800/70">
        <button
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex w-full items-center justify-between py-1 text-left"
          aria-expanded={advancedOpen}
        >
          <span className="eyebrow">Advanced</span>
          <motion.span
            animate={{ rotate: advancedOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-zinc-400 dark:text-zinc-500"
          >
            <ChevronIcon size={16} />
          </motion.span>
        </button>

        {advancedOpen && (
          <div className="pt-1">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
              <Toggle
                label="Allow snooze"
                hint="Let yourself postpone a break (resets your streak)."
                value={settings.snoozeAllowed}
                onChange={(v) => update("snoozeAllowed", v)}
              />
              <NumberRow
                label="Snooze length"
                hint="Added each time you postpone."
                value={settings.snoozeMinutes}
                min={1}
                max={15}
                onChange={(v) => update("snoozeMinutes", v)}
                suffix="min"
                disabled={!settings.snoozeAllowed}
              />
              <Toggle
                label="Sound effects"
                hint="Purrs and warning chimes."
                value={settings.soundEnabled}
                onChange={(v) => update("soundEnabled", v)}
              />
              <Toggle
                label="Desktop notifications"
                hint="System alert when a break starts."
                value={settings.notifyDesktop}
                onChange={async (v) => {
                  if (v && "Notification" in window && Notification.permission === "default") {
                    try {
                      await Notification.requestPermission();
                    } catch {
                      /* ignore */
                    }
                  }
                  update("notifyDesktop", v);
                }}
              />
              <Toggle
                label="Dark mode"
                hint="Switch between light and dark themes."
                value={settings.darkMode}
                onChange={(v) => update("darkMode", v)}
              />
            </div>

            <div className="mt-4">
              <div className="eyebrow mb-2">Cat color</div>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => update("catColor", c.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      settings.catColor === c.id
                        ? "border-ginger/60 bg-ginger/5 text-zinc-900 dark:text-zinc-100"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/70"
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                      style={{ background: c.swatch }}
                    />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
