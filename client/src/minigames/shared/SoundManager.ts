// Web implementation of the mini-game SoundManager.
// Keeps the same API as the original expo-av version so the game
// engines (ported from the React Native app) work unchanged.

const soundFiles: Record<string, string> = {
  success: "/sounds/success.wav",
  fail: "/sounds/fail.wav",
  win: "/sounds/win.wav",
  tap: "/sounds/tap.wav",
};

const cache: Record<string, HTMLAudioElement> = {};

function getAudio(name: string): HTMLAudioElement | undefined {
  const src = soundFiles[name];
  if (!src) {
    console.warn("[SoundManager] Unknown sound:", name);
    return undefined;
  }
  if (!cache[name]) {
    cache[name] = new Audio(src);
    cache[name].preload = "auto";
  }
  return cache[name];
}

export const SoundManager = {
  play: async (name: string) => {
    try {
      const audio = getAudio(name);
      if (!audio) return;
      // Clone so rapid repeats (e.g. fast taps) can overlap
      const instance = audio.cloneNode(true) as HTMLAudioElement;
      instance.volume = 1.0;
      await instance.play();
    } catch {
      // Autoplay may be blocked until first user interaction; safe to ignore
    }
  },

  preload: async () => {
    Object.keys(soundFiles).forEach((name) => getAudio(name));
  },
};
