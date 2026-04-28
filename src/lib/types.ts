export type Phase = "idle" | "working" | "warning" | "break";

export type CatColor = "ginger" | "tuxedo" | "calico" | "siamese";

export type Settings = {
  workMinutes: number;
  breakMinutes: number;
  warnSeconds: number;
  soundEnabled: boolean;
  darkMode: boolean;
  catColor: CatColor;
  snoozeAllowed: boolean;
  snoozeMinutes: number;
  notifyDesktop: boolean;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlockedAt?: number;
};

export type Stats = {
  breaksTaken: number;
  breaksToday: number;
  lastBreakDay: string;
  totalBreakSeconds: number;
  streak: number;
  bestStreak: number;
  snoozesUsed: number;
  pets: number;
  feeds: number;
  achievements: Achievement[];
};

export const DEFAULT_SETTINGS: Settings = {
  workMinutes: 45,
  breakMinutes: 5,
  warnSeconds: 30,
  soundEnabled: true,
  darkMode: false,
  catColor: "ginger",
  snoozeAllowed: true,
  snoozeMinutes: 2,
  notifyDesktop: false,
};

export const ACHIEVEMENTS: Omit<Achievement, "unlockedAt">[] = [
  { id: "first-break", title: "First Nap", description: "Take your very first break." },
  { id: "streak-5", title: "Hot Streak", description: "5 breaks in a row, no snoozes." },
  { id: "streak-10", title: "Zen Mode", description: "10 breaks in a row, no snoozes." },
  { id: "perfect-day", title: "Perfect Day", description: "8 breaks in a single day." },
  { id: "well-fed", title: "Well-Fed", description: "Feed the cat 25 times." },
  { id: "best-friend", title: "Best Friend", description: "Pet the cat 100 times." },
  { id: "no-snooze", title: "Iron Will", description: "Complete a break without snoozing 20 times." },
];

export const DEFAULT_STATS: Stats = {
  breaksTaken: 0,
  breaksToday: 0,
  lastBreakDay: "",
  totalBreakSeconds: 0,
  streak: 0,
  bestStreak: 0,
  snoozesUsed: 0,
  pets: 0,
  feeds: 0,
  achievements: [],
};
