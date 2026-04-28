let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      (window.AudioContext as typeof AudioContext | undefined) ||
      ((window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext);
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

function tone(freq: number, durMs: number, type: OscillatorType = "sine", gain = 0.08, when = 0) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + when;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = 0;
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
  osc.stop(t0 + durMs / 1000 + 0.02);
}

export const sounds = {
  meow() {
    tone(620, 120, "triangle", 0.09, 0);
    tone(520, 200, "triangle", 0.09, 0.08);
  },
  warning() {
    tone(440, 80, "square", 0.06, 0);
    tone(660, 80, "square", 0.06, 0.12);
  },
  purr() {
    tone(180, 220, "sine", 0.05, 0);
  },
  chime() {
    tone(880, 180, "sine", 0.07, 0);
    tone(1320, 220, "sine", 0.06, 0.18);
  },
  ding() {
    tone(740, 120, "triangle", 0.07, 0);
  },
};
