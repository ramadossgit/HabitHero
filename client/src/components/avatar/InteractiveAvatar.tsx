// Makes a kid's hero feel ALIVE and playful. Wrap any avatar visual
// (<ChildAvatar/> or <AvatarRenderer/>) and it gains:
//   • a gentle idle "breathing" bob so it never looks frozen
//   • a happy squash-stretch jump when tapped (or via the `trigger` prop)
//   • a burst of flying sparkles/hearts
//   • a cycling encouraging speech bubble
//   • a soft, cheerful chime (Web Audio — no asset needed)
// Everything is pure CSS/JS, theme-friendly, and safe on any device.
import { useCallback, useEffect, useRef, useState } from "react";

// One shared AudioContext, created lazily on the first tap (a user gesture).
let sharedAudio: AudioContext | null = null;
function playChime() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    sharedAudio = sharedAudio || new Ctx();
    const ctx = sharedAudio;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    // A little C–E–G "ta-da!" arpeggio.
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = now + i * 0.06;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  } catch {
    /* audio is a nice-to-have — never let it break the tap */
  }
}

const DEFAULT_MESSAGES = [
  "Yay! 🎉", "You're awesome!", "Let's do this! 💪", "High five! ✋",
  "I believe in you!", "So cool! 😎", "Woohoo!", "You rock! 🤘",
  "Great job, hero!", "Hehe, that tickles! 😄", "Ready for adventure!", "Best buddy! 💖",
];
const SPARKLES = ["✨", "⭐", "💫", "🌟", "💖"];

export default function InteractiveAvatar({
  children,
  size = 240,
  className = "",
  messages = DEFAULT_MESSAGES,
  idle = true,
  sound = true,
  bubble = true,
  trigger,
  ariaLabel = "Play with your hero",
}: {
  children: React.ReactNode;
  size?: number;
  className?: string;
  messages?: string[];
  idle?: boolean;
  sound?: boolean;
  bubble?: boolean;
  /** Change this number (e.g. on habit completion) to fire a reaction. */
  trigger?: number;
  ariaLabel?: string;
}) {
  const [reacting, setReacting] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const msgTimer = useRef<number>();
  const onTimer = useRef<number>();
  const offTimer = useRef<number>();

  const react = useCallback(
    (withSound = true) => {
      // Restart the jump animation reliably, even on rapid repeat taps:
      // clear the class, then re-apply it on the next macrotask, then auto-
      // clear it so the idle bob resumes.
      setReacting(false);
      window.clearTimeout(onTimer.current);
      window.clearTimeout(offTimer.current);
      onTimer.current = window.setTimeout(() => {
        setReacting(true);
        offTimer.current = window.setTimeout(() => setReacting(false), 650);
      }, 0);

      setBurstKey((k) => k + 1);
      if (bubble) {
        setMsg(messages[Math.floor(Math.random() * messages.length)]);
        window.clearTimeout(msgTimer.current);
        msgTimer.current = window.setTimeout(() => setMsg(null), 1600);
      }
      if (withSound && sound) playChime();
    },
    [messages, bubble, sound],
  );

  // Fire a reaction when the parent bumps `trigger` (no sound = it's automatic).
  const firstTrigger = useRef(true);
  useEffect(() => {
    if (trigger === undefined) return;
    if (firstTrigger.current) {
      firstTrigger.current = false;
      return;
    }
    react(false);
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      window.clearTimeout(msgTimer.current);
      window.clearTimeout(onTimer.current);
      window.clearTimeout(offTimer.current);
    },
    [],
  );

  const spinnerClass = reacting ? "avatar-react" : idle ? "avatar-idle" : "";

  return (
    <div
      className={`relative inline-block cursor-pointer active:scale-95 transition-transform ${className}`}
      style={{ width: size, height: size }}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={() => react(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          react(true);
        }
      }}
      data-testid="interactive-avatar"
    >
      {/* Speech bubble */}
      {bubble && msg && (
        <div
          className="avatar-bubble absolute left-1/2 -translate-x-1/2 -top-2 z-30 whitespace-nowrap
                     bg-white text-gray-800 font-fredoka text-sm px-3 py-1.5 rounded-2xl shadow-lg border-2 border-purple/30"
          data-testid="avatar-speech"
        >
          {msg}
          <span className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-white border-b-2 border-r-2 border-purple/30 rotate-45" />
        </div>
      )}

      {/* Sparkle burst (re-mounts each tap so it re-animates) */}
      {burstKey > 0 && (
        <div key={burstKey} className="pointer-events-none absolute inset-0 z-20 overflow-visible">
          {SPARKLES.map((s, i) => (
            <span
              key={i}
              className="avatar-spark absolute text-xl"
              style={{
                left: `${15 + i * 17}%`,
                top: `${20 + (i % 2) * 15}%`,
                animationDelay: `${i * 0.05}s`,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* The avatar visual itself */}
      <div className={spinnerClass} style={{ width: size, height: size }}>
        {children}
      </div>
    </div>
  );
}
