import { motion } from "framer-motion";
import type { CatColor, Settings } from "../lib/types";

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
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="font-bold">{label}</div>
        {hint && <div className="text-xs opacity-70">{hint}</div>}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="h-9 w-9 rounded-xl bg-white/70 font-bold shadow-sm hover:bg-white dark:bg-white/10"
          onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
          aria-label={`decrease ${label}`}
        >
          −
        </button>
        <input
          type="number"
          className="w-20 rounded-xl bg-white/70 px-3 py-2 text-center font-bold tabular-nums shadow-sm dark:bg-white/10"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n))
              onChange(Math.min(max, Math.max(min, +n.toFixed(2))));
          }}
        />
        <button
          className="h-9 w-9 rounded-xl bg-white/70 font-bold shadow-sm hover:bg-white dark:bg-white/10"
          onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))}
          aria-label={`increase ${label}`}
        >
          +
        </button>
        {suffix && <span className="text-sm opacity-70">{suffix}</span>}
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
      className="flex w-full items-center justify-between gap-4 py-3 text-left"
    >
      <div>
        <div className="font-bold">{label}</div>
        {hint && <div className="text-xs opacity-70">{hint}</div>}
      </div>
      <div
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          value ? "bg-ginger" : "bg-cocoa/20 dark:bg-white/15"
        }`}
      >
        <motion.div
          className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow"
          animate={{ x: value ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}

export function SettingsPanel({ settings, update, onReset }: Props) {
  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Settings</h2>
        <button onClick={onReset} className="text-xs font-bold text-toast hover:underline">
          Reset all
        </button>
      </div>

      <div className="divide-y divide-cocoa/10 dark:divide-white/10">
        <NumberRow
          label="Work interval"
          hint="How long until the cat shows up"
          value={settings.workMinutes}
          min={1}
          max={180}
          onChange={(v) => update("workMinutes", v)}
          suffix="min"
        />
        <NumberRow
          label="Break duration"
          hint="How long the cat stays on top of you"
          value={settings.breakMinutes}
          min={1}
          max={60}
          onChange={(v) => update("breakMinutes", v)}
          suffix="min"
        />
        <NumberRow
          label="Pre-break warning"
          hint="Heads-up before the cat appears"
          value={settings.warnSeconds}
          min={0}
          max={120}
          step={5}
          onChange={(v) => update("warnSeconds", v)}
          suffix="sec"
        />
        <NumberRow
          label="Snooze length"
          hint="Each ‘more time’ button press"
          value={settings.snoozeMinutes}
          min={1}
          max={15}
          onChange={(v) => update("snoozeMinutes", v)}
          suffix="min"
        />
        <Toggle
          label="Allow snooze"
          hint="Lets you guilt-postpone a break"
          value={settings.snoozeAllowed}
          onChange={(v) => update("snoozeAllowed", v)}
        />
        <Toggle
          label="Sound effects"
          hint="Meows, purrs, and warning chimes"
          value={settings.soundEnabled}
          onChange={(v) => update("soundEnabled", v)}
        />
        <Toggle
          label="Desktop notifications"
          hint="System notification when break starts"
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
          value={settings.darkMode}
          onChange={(v) => update("darkMode", v)}
        />
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-extrabold uppercase tracking-widest opacity-70">
          Cat color
        </div>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => update("catColor", c.id)}
              className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-bold transition ${
                settings.catColor === c.id
                  ? "border-ginger bg-white shadow-soft dark:bg-plum"
                  : "border-transparent bg-white/60 dark:bg-white/5"
              }`}
            >
              <span
                className="h-4 w-4 rounded-full ring-2 ring-white"
                style={{ background: c.swatch }}
              />
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
