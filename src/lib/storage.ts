export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota issues */
  }
}

export const KEYS = {
  settings: "fatcat:settings",
  stats: "fatcat:stats",
} as const;

export const todayKey = () => new Date().toISOString().slice(0, 10);
