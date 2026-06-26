export type Category = "ui" | "navigation" | "feedback";

export type SoundEvent =
  | "hover"
  | "click"
  | "toggle-on"
  | "toggle-off"
  | "select"
  | "deselect"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "navigate-start"
  | "navigate-end"
  | "navigate-cancel"
  | "upload-start"
  | "upload-progress"
  | "upload-complete"
  | "new-job"
  | "job-status-change"
  | "notification"
  | "print-start"
  | "complete"
  | "level-up"
  | "drum-roll"
  | "swipe"
  | "appear"
  | "disappear";

interface SoundConfig {
  volume?: number;
  speed?: number;
}

type SoundBank = Record<SoundEvent, SoundConfig>;

const DEFAULT_BANK: SoundBank = {
  hover:          { volume: 0.08, speed: 1 },
  click:          { volume: 0.15, speed: 1 },
  "toggle-on":    { volume: 0.12, speed: 1 },
  "toggle-off":   { volume: 0.08, speed: 1 },
  select:         { volume: 0.1,  speed: 1 },
  deselect:       { volume: 0.06, speed: 1 },
  success:        { volume: 0.2,  speed: 1 },
  error:          { volume: 0.2,  speed: 1 },
  warning:        { volume: 0.15, speed: 1 },
  info:           { volume: 0.12, speed: 1 },
  "navigate-start": { volume: 0.12, speed: 1 },
  "navigate-end":   { volume: 0.18, speed: 1 },
  "navigate-cancel":{ volume: 0.06, speed: 1 },
  "upload-start":   { volume: 0.1,  speed: 1 },
  "upload-progress": { volume: 0.04, speed: 1 },
  "upload-complete": { volume: 0.25, speed: 1 },
  "new-job":        { volume: 0.2,  speed: 1 },
  "job-status-change": { volume: 0.15, speed: 1 },
  notification:    { volume: 0.2,  speed: 1 },
  "print-start":   { volume: 0.15, speed: 1 },
  complete:        { volume: 0.25, speed: 1 },
  "level-up":      { volume: 0.28, speed: 1 },
  "drum-roll":     { volume: 0.08, speed: 1 },
  swipe:           { volume: 0.06, speed: 1 },
  appear:          { volume: 0.04, speed: 1 },
  disappear:       { volume: 0.03, speed: 1 },
};

const SOUND_CATEGORY: Record<SoundEvent, Category> = {
  hover: "ui",
  click: "ui",
  "toggle-on": "ui",
  "toggle-off": "ui",
  select: "ui",
  deselect: "ui",
  success: "feedback",
  error: "feedback",
  warning: "feedback",
  info: "feedback",
  "navigate-start": "navigation",
  "navigate-end": "navigation",
  "navigate-cancel": "navigation",
  "upload-start": "feedback",
  "upload-progress": "feedback",
  "upload-complete": "feedback",
  "new-job": "feedback",
  "job-status-change": "feedback",
  notification: "feedback",
  "print-start": "feedback",
  complete: "feedback",
  "level-up": "feedback",
  "drum-roll": "feedback",
  swipe: "ui",
  appear: "ui",
  disappear: "ui",
};

const CRITICAL_SOUNDS: SoundEvent[] = [
  "error",
  "new-job",
  "success",
  "notification",
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private categoryGains: Record<Category, GainNode> = {} as Record<Category, GainNode>;
  private muted = false;
  private reducedMotion = false;
  private bank: SoundBank = { ...DEFAULT_BANK };

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ps-sound-muted");
      this.muted = saved === "true";
      const cat = localStorage.getItem("ps-sound-categories");
      if (cat) {
        try {
          const parsed = JSON.parse(cat);
          for (const c of Object.keys(parsed)) {
            if (c in this.categoryGains) {
              this.categoryGains[c as Category].gain.value = parsed[c];
            }
          }
        } catch {}
      }
      try {
        const bank = localStorage.getItem("ps-sound-bank");
        if (bank) {
          const parsed = JSON.parse(bank);
          Object.assign(this.bank, parsed);
        }
      } catch {}
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.reducedMotion = mq.matches;
      mq.addEventListener("change", (e) => {
        this.reducedMotion = e.matches;
      });
    }
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC!();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);
      const cats: Category[] = ["ui", "navigation", "feedback"];
      for (const c of cats) {
        this.categoryGains[c] = this.ctx.createGain();
        this.categoryGains[c].gain.value = 1;
        this.categoryGains[c].connect(this.masterGain);
      }
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private connectThrough(source: AudioNode, gain: GainNode, output: AudioNode) {
    source.connect(gain);
    try {
      gain.connect(output);
    } catch {
      // Some hot-reload/browser states can leave stale AudioNodes around;
      // fall back to the current context destination instead of crashing UI.
      gain.connect(this.ctx?.destination ?? output);
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(m: boolean) {
    this.muted = m;
    localStorage.setItem("ps-sound-muted", String(m));
  }

  setCategoryVolume(category: Category, vol: number) {
    if (this.categoryGains[category]) {
      this.categoryGains[category].gain.value = Math.max(0, Math.min(1, vol));
    }
    const cat = localStorage.getItem("ps-sound-categories");
    const parsed = cat ? JSON.parse(cat) : {};
    parsed[category] = vol;
    localStorage.setItem("ps-sound-categories", JSON.stringify(parsed));
  }

  setSoundConfig(event: SoundEvent, config: Partial<SoundConfig>) {
    this.bank[event] = { ...this.bank[event], ...config };
    localStorage.setItem("ps-sound-bank", JSON.stringify(this.bank));
  }

  play(event: SoundEvent) {
    if (this.muted) return;
    if (!this.reducedMotion && CRITICAL_SOUNDS.includes(event)) {
      // always play critical even in reduced motion
    } else if (this.reducedMotion && !CRITICAL_SOUNDS.includes(event)) {
      return;
    }

    const cfg = this.bank[event];
    if (!cfg) return;

    const category = SOUND_CATEGORY[event];
    const ctx = this.ensureContext();
    const output = this.categoryGains[category]?.context === ctx
      ? this.categoryGains[category]
      : this.masterGain?.context === ctx
        ? this.masterGain
        : ctx.destination;
    const now = ctx.currentTime;
    const vol = cfg.volume ?? 0.15;
    switch (event) {
      case "hover": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(800, now);
        o.frequency.exponentialRampToValueAtTime(1200, now + 0.03);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.04);
        break;
      }
      case "click": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(600, now);
        o.frequency.exponentialRampToValueAtTime(200, now + 0.06);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.002);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.08);
        break;
      }
      case "toggle-on": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(300, now);
        o.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.12);
        break;
      }
      case "toggle-off": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(600, now);
        o.frequency.exponentialRampToValueAtTime(300, now + 0.06);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.1);
        break;
      }
      case "select": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(440, now);
        o.frequency.setValueAtTime(660, now + 0.04);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.1);
        break;
      }
      case "deselect": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(660, now);
        o.frequency.setValueAtTime(440, now + 0.04);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.08);
        break;
      }
      case "success": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(523.25, now);
        o.frequency.setValueAtTime(659.25, now + 0.12);
        o.frequency.setValueAtTime(783.99, now + 0.24);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.02);
        g.gain.setValueAtTime(vol, now + 0.28);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.5);
        break;
      }
      case "error": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(180, now);
        o.frequency.linearRampToValueAtTime(120, now + 0.3);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.35);
        break;
      }
      case "warning": {
        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const g = ctx.createGain();
        o1.type = "square"; o2.type = "square";
        o1.frequency.setValueAtTime(220, now);
        o2.frequency.setValueAtTime(233.08, now);
        o1.frequency.setValueAtTime(233.08, now + 0.15);
        o2.frequency.setValueAtTime(220, now + 0.15);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol * 0.3, now + 0.02);
        g.gain.setValueAtTime(vol * 0.3, now + 0.28);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        this.connectThrough(o1, g, output); this.connectThrough(o2, g, output);
        o1.start(now); o2.start(now);
        o1.stop(now + 0.35); o2.stop(now + 0.35);
        break;
      }
      case "info": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(880, now);
        o.frequency.exponentialRampToValueAtTime(660, now + 0.08);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.15);
        break;
      }
      case "navigate-start": {
        const o = ctx.createOscillator();
        const n = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine"; n.type = "sine";
        o.frequency.setValueAtTime(300, now);
        o.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        n.frequency.setValueAtTime(450, now);
        n.frequency.exponentialRampToValueAtTime(900, now + 0.1);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        this.connectThrough(o, g, output); this.connectThrough(n, g, output);
        o.start(now); n.start(now);
        o.stop(now + 0.15); n.stop(now + 0.15);
        break;
      }
      case "navigate-end": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(500, now);
        o.frequency.setValueAtTime(700, now + 0.05);
        o.frequency.exponentialRampToValueAtTime(1000, now + 0.15);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.01);
        g.gain.setValueAtTime(vol, now + 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.3);
        break;
      }
      case "navigate-cancel": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(400, now);
        o.frequency.exponentialRampToValueAtTime(200, now + 0.08);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.1);
        break;
      }
      case "upload-start": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(350, now);
        o.frequency.exponentialRampToValueAtTime(550, now + 0.12);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.18);
        break;
      }
      case "upload-progress": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(500 + Math.random() * 200, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol * 0.3, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.03);
        break;
      }
      case "upload-complete": {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          const t = now + i * 0.08;
          o.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(vol, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          this.connectThrough(o, g, output);
          o.start(t);
          o.stop(t + 0.3);
        });
        break;
      }
      case "new-job": {
        for (let i = 0; i < 3; i++) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          const t = now + i * 0.08;
          o.frequency.setValueAtTime(600 + i * 100, t);
          o.frequency.exponentialRampToValueAtTime(800 + i * 100, t + 0.06);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(vol, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          this.connectThrough(o, g, output);
          o.start(t);
          o.stop(t + 0.12);
        }
        break;
      }
      case "job-status-change": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(400, now);
        o.frequency.setValueAtTime(600, now + 0.08);
        o.frequency.setValueAtTime(800, now + 0.16);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.01);
        g.gain.setValueAtTime(vol, now + 0.2);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.35);
        break;
      }
      case "notification": {
        for (let i = 0; i < 2; i++) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          const t = now + i * 0.12;
          o.frequency.setValueAtTime(800, t);
          o.frequency.setValueAtTime(1000, t + 0.06);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(vol, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          this.connectThrough(o, g, output);
          o.start(t);
          o.stop(t + 0.1);
        }
        break;
      }
      case "print-start": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(200, now);
        o.frequency.setValueAtTime(250, now + 0.1);
        o.frequency.setValueAtTime(300, now + 0.2);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.02);
        g.gain.setValueAtTime(vol, now + 0.25);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.5);
        break;
      }
      case "complete": {
        const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
        notes.forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          const t = now + i * 0.1;
          o.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(vol, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          this.connectThrough(o, g, output);
          o.start(t);
          o.stop(t + 0.35);
        });
        break;
      }
      case "level-up": {
        const notes = [440, 554.37, 659.25, 880, 1046.5, 1318.5];
        notes.forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          const t = now + i * 0.07;
          o.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(vol, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          this.connectThrough(o, g, output);
          o.start(t);
          o.stop(t + 0.4);
        });
        break;
      }
      case "drum-roll": {
        for (let i = 0; i < 8; i++) {
          const n = ctx.createOscillator();
          const g = ctx.createGain();
          n.type = "triangle";
          const t = now + i * 0.04;
          n.frequency.setValueAtTime(100 + Math.random() * 50, t);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(vol * 0.5, t + 0.005);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
          this.connectThrough(n, g, output);
          n.start(t);
          n.stop(t + 0.04);
        }
        break;
      }
      case "swipe": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(200, now);
        o.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.12);
        break;
      }
      case "appear": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(900, now);
        o.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.06);
        break;
      }
      case "disappear": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(600, now);
        o.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        this.connectThrough(o, g, output);
        o.start(now);
        o.stop(now + 0.08);
        break;
      }
    }
  }
}

export const soundEngine = new SoundEngine();
