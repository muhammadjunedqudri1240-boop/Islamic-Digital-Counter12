let audioCtx: AudioContext | null = null;

async function getAudioCtx(): Promise<AudioContext | null> {
  try {
    if (!audioCtx) {
      const ACtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new ACtx();
    }
    if (audioCtx.state !== "running") {
      await audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

async function playTone(
  frequency: number,
  type: OscillatorType,
  duration: number,
  gainPeak: number,
  attackTime: number,
  decayTime: number,
  volume: number,
  detune?: number,
  filterFreq?: number
) {
  const ctx = await getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const masterGain = ctx.createGain();
    masterGain.gain.value = Math.min(1, volume / 100);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (detune) osc.detune.setValueAtTime(detune, ctx.currentTime);

    if (filterFreq) {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
      osc.connect(filter);
      filter.connect(gainNode);
    } else {
      osc.connect(gainNode);
    }
    gainNode.connect(masterGain);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(gainPeak, now + attackTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + attackTime + decayTime);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // silently ignore audio errors
  }
}

export const SOUND_NAMES = [
  "Classic Click",
  "Soft Digital",
  "Bead Tap",
  "Metallic Click",
  "Soft Bell",
  "Minimal Click",
  "Mechanical",
  "Silent",
];

export function playSound(soundType: number, volume: number) {
  if (soundType === 7 || volume === 0) return;
  const vol = Math.max(1, volume);
  switch (soundType) {
    case 0: void playTone(800, "square", 0.08, 0.3, 0.002, 0.07, vol, 0, 2000); break;
    case 1: void playTone(1200, "sine", 0.05, 0.15, 0.001, 0.04, vol); break;
    case 2:
      void playTone(180, "sine", 0.12, 0.5, 0.001, 0.11, vol, 0, 500);
      void playTone(120, "sine", 0.1, 0.3, 0.003, 0.09, vol);
      break;
    case 3:
      void playTone(2000, "sawtooth", 0.05, 0.4, 0.001, 0.04, vol, 0, 4000);
      void playTone(1000, "square", 0.04, 0.2, 0.002, 0.04, vol, 0, 3000);
      break;
    case 4:
      void playTone(660, "sine", 0.3, 0.2, 0.002, 0.28, vol);
      void playTone(990, "sine", 0.2, 0.1, 0.003, 0.2, vol);
      break;
    case 5: void playTone(1500, "sine", 0.03, 0.08, 0.001, 0.025, vol); break;
    case 6:
      void playTone(400, "square", 0.06, 0.4, 0.001, 0.05, vol, 0, 1200);
      void playTone(300, "square", 0.05, 0.3, 0.002, 0.04, vol, 0, 1000);
      break;
    default: break;
  }
}

export function vibrateDevice(enabled: boolean) {
  if (!enabled) return;
  if ("vibrate" in navigator) navigator.vibrate(30);
}

// Plays a short rising chime when a target is completed.
export function playCompletionChime(volume: number) {
  if (volume === 0) return;
  const vol = Math.max(1, volume);
  void playTone(523, "sine", 0.35, 0.3, 0.005, 0.3, vol, 0);
  void playTone(659, "sine", 0.35, 0.3, 0.005, 0.3, vol, 0.18);
  void playTone(784, "sine", 0.6, 0.3, 0.005, 0.55, vol, 0.36);
}
