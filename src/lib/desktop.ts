// Bridge over the preload-exposed IPC. In a plain browser, all calls become
// no-ops so the app still runs (with the in-page BlockerOverlay fallback).

export type BlockerState = {
  remainingSec: number;
  totalSec: number;
  catColor: string;
  petCount: number;
  feedCount: number;
};

export type ControlAction = "done" | "snooze" | "pet" | "feed";

type FatcatBridge = {
  isDesktop: true;
  available: () => Promise<boolean>;
  startBlock: () => Promise<boolean>;
  endBlock: () => Promise<boolean>;
  tick: (payload: BlockerState) => Promise<boolean>;
  requestDone: () => Promise<boolean>;
  requestSnooze: () => Promise<boolean>;
  requestPet: () => Promise<boolean>;
  requestFeed: () => Promise<boolean>;
  onBlockerState: (cb: (s: BlockerState) => void) => () => void;
  onNudge: (cb: () => void) => () => void;
  onControlMessage: (cb: (action: ControlAction) => void) => () => void;
};

declare global {
  interface Window {
    fatcat?: FatcatBridge;
  }
}

const noopUnsub = () => undefined;

export const desktop = {
  get available() {
    return typeof window !== "undefined" && !!window.fatcat;
  },
  startBlock: () => window.fatcat?.startBlock() ?? Promise.resolve(false),
  endBlock: () => window.fatcat?.endBlock() ?? Promise.resolve(false),
  tick: (payload: BlockerState) =>
    window.fatcat?.tick(payload) ?? Promise.resolve(false),
  requestDone: () => window.fatcat?.requestDone() ?? Promise.resolve(false),
  requestSnooze: () => window.fatcat?.requestSnooze() ?? Promise.resolve(false),
  requestPet: () => window.fatcat?.requestPet() ?? Promise.resolve(false),
  requestFeed: () => window.fatcat?.requestFeed() ?? Promise.resolve(false),
  onBlockerState: (cb: (s: BlockerState) => void) =>
    window.fatcat?.onBlockerState(cb) ?? noopUnsub,
  onNudge: (cb: () => void) => window.fatcat?.onNudge(cb) ?? noopUnsub,
  onControlMessage: (cb: (action: ControlAction) => void) =>
    window.fatcat?.onControlMessage(cb) ?? noopUnsub,
};

export const isBlockerWindow = () =>
  typeof window !== "undefined" &&
  (window.location.hash === "#blocker" ||
    window.location.hash.startsWith("#blocker"));
