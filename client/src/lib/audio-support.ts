// Audio capability helpers.
//
// Browsers only expose the microphone on secure origins (HTTPS or
// localhost). During the pilot the app is often opened via
// http://<lan-ip>:5000 on phones, where getUserMedia simply doesn't
// exist — recording must degrade gracefully instead of erroring.

export function canRecordAudio(): boolean {
  return Boolean(
    typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function",
  );
}

export function recordingUnavailableReason(): string {
  if (canRecordAudio()) return "";
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Voice recording needs a secure (HTTPS) connection. On a phone using the local address it isn't available — record voice messages on the computer at http://localhost:5000 instead.";
  }
  return "This browser doesn't support voice recording.";
}

// ── Ringtone previews ───────────────────────────────────────────────────────
// No audio files ship with the app, so previews are synthesized with
// WebAudio: each ringtone gets a distinct little melody.

type Note = [frequency: number, durationMs: number];

const MELODIES: Record<string, Note[]> = {
  "default":        [[523, 150], [659, 150], [784, 300]],
  "gentle-chime":   [[880, 200], [1047, 200], [1319, 400]],
  "playful-bells":  [[784, 120], [988, 120], [784, 120], [1175, 300]],
  "magic-sparkle":  [[1047, 100], [1319, 100], [1568, 100], [2093, 350]],
  "hero-fanfare":   [[523, 150], [523, 150], [784, 300], [1047, 400]],
  "soft-melody":    [[440, 250], [494, 250], [523, 400]],
  "classic-ring":   [[880, 180], [0, 80], [880, 180], [0, 80], [880, 300]],
  "digital-beep":   [[988, 120], [0, 60], [988, 120]],
  "marimba":        [[659, 140], [784, 140], [880, 140], [1047, 300]],
};

const FALLBACK: Note[] = [[660, 180], [880, 320]];

/** Play a short audible preview for a ringtone id. Resolves when done. */
export async function playRingtonePreviewTone(ringtoneValue: string): Promise<void> {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) throw new Error("Audio not supported in this browser");

  const ctx = new AudioCtx();
  // Some browsers create the context suspended until a user gesture
  if (ctx.state === "suspended") await ctx.resume();

  const notes = MELODIES[ringtoneValue] ?? FALLBACK;
  let at = ctx.currentTime;
  for (const [freq, ms] of notes) {
    if (freq > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + ms / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + ms / 1000 + 0.05);
    }
    at += ms / 1000;
  }

  const total = notes.reduce((s, [, ms]) => s + ms, 0);
  await new Promise((r) => setTimeout(r, total + 150));
  await ctx.close();
}
