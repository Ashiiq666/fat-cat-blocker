import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, type Settings } from "../lib/types";
import { KEYS, load, save } from "../lib/storage";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() =>
    load<Settings>(KEYS.settings, DEFAULT_SETTINGS)
  );

  useEffect(() => save(KEYS.settings, settings), [settings]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [settings.darkMode]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const reset = () => setSettings(DEFAULT_SETTINGS);

  return { settings, setSettings, update, reset };
}
