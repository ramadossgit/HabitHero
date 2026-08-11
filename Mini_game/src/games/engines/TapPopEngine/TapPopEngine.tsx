import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Easing,
} from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_H = SH * 0.65;

// ═══════════════════════════════════════════════════════════════════════════════
// 15-LEVEL PROGRESSION TABLE
// ═══════════════════════════════════════════════════════════════════════════════
// Psychology: gradual challenge increase prevents frustration.
// Speed increase is gentle. Color similarity grows slowly.
// Minimum 5s per level enforced in timer logic.

interface LevelConfig {
  balloonCount: number;      // balloons spawned per wave
  colorCount: number;        // how many different colors (more = harder)
  riseDuration: number;      // ms for balloon to rise (lower = faster)
  levelDuration: number;     // seconds the level lasts (min 5s)
  driftAmount: number;       // horizontal drift in px (0 = straight up)
  spawnDelay: number;        // ms between balloon spawns (stagger)
  targetPerLevel: number;    // correct balloons to pop to complete level
}

const LEVELS: LevelConfig[] = [
  // L1-3: Very easy, slow, few balloons, 2 colors
  { balloonCount: 5,  colorCount: 2, riseDuration: 6000, levelDuration: 12, driftAmount: 0,  spawnDelay: 400, targetPerLevel: 2 },
  { balloonCount: 5,  colorCount: 2, riseDuration: 5500, levelDuration: 12, driftAmount: 0,  spawnDelay: 380, targetPerLevel: 2 },
  { balloonCount: 6,  colorCount: 2, riseDuration: 5000, levelDuration: 12, driftAmount: 0,  spawnDelay: 350, targetPerLevel: 3 },
  // L4-6: Easy-medium, slightly faster, 3 colors
  { balloonCount: 7,  colorCount: 3, riseDuration: 4800, levelDuration: 15, driftAmount: 10, spawnDelay: 320, targetPerLevel: 3 },
  { balloonCount: 7,  colorCount: 3, riseDuration: 4500, levelDuration: 15, driftAmount: 15, spawnDelay: 300, targetPerLevel: 3 },
  { balloonCount: 8,  colorCount: 3, riseDuration: 4200, levelDuration: 15, driftAmount: 20, spawnDelay: 280, targetPerLevel: 4 },
  // L7-9: Medium, 4 colors, moderate speed, some drift
  { balloonCount: 8,  colorCount: 4, riseDuration: 4000, levelDuration: 18, driftAmount: 25, spawnDelay: 260, targetPerLevel: 4 },
  { balloonCount: 9,  colorCount: 4, riseDuration: 3800, levelDuration: 18, driftAmount: 30, spawnDelay: 250, targetPerLevel: 4 },
  { balloonCount: 10, colorCount: 4, riseDuration: 3600, levelDuration: 20, driftAmount: 30, spawnDelay: 240, targetPerLevel: 5 },
  // L10-12: Medium-hard, 5 colors, faster, more drift
  { balloonCount: 10, colorCount: 5, riseDuration: 3400, levelDuration: 22, driftAmount: 35, spawnDelay: 220, targetPerLevel: 5 },
  { balloonCount: 11, colorCount: 5, riseDuration: 3200, levelDuration: 22, driftAmount: 40, spawnDelay: 200, targetPerLevel: 5 },
  { balloonCount: 12, colorCount: 5, riseDuration: 3000, levelDuration: 25, driftAmount: 40, spawnDelay: 180, targetPerLevel: 6 },
  // L13-15: Hard, 6 colors, fast, overlapping, time pressure
  { balloonCount: 12, colorCount: 6, riseDuration: 2800, levelDuration: 28, driftAmount: 45, spawnDelay: 160, targetPerLevel: 6 },
  { balloonCount: 14, colorCount: 6, riseDuration: 2600, levelDuration: 30, driftAmount: 50, spawnDelay: 150, targetPerLevel: 7 },
  { balloonCount: 15, colorCount: 6, riseDuration: 2400, levelDuration: 30, driftAmount: 55, spawnDelay: 140, targetPerLevel: 7 },
];

const TOTAL_LEVELS = LEVELS.length;

// ═══════════════════════════════════════════════════════════════════════════════
// BALLOON COLORS & NAMES
// ═══════════════════════════════════════════════════════════════════════════════
// Soft, child-safe pastel-ish colors (no harsh neon)

const ALL_COLORS = [
  { hex: '#EF5350', name: 'Red',    glow: '#FFCDD2' },
  { hex: '#42A5F5', name: 'Blue',   glow: '#BBDEFB' },
  { hex: '#66BB6A', name: 'Green',  glow: '#C8E6C9' },
  { hex: '#FFEE58', name: 'Yellow', glow: '#FFF9C4' },
  { hex: '#AB47BC', name: 'Purple', glow: '#E1BEE7' },
  { hex: '#FFA726', name: 'Orange', glow: '#FFE0B2' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Balloon {
  id: number;
  colorIdx: number;
  x: number;
  isTarget: boolean;
  popped: boolean;
  animY: Animated.Value;
  animX: Animated.Value;
  animScale: Animated.Value;
  animOpacity: Animated.Value;
  riseDuration: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
// Correct pop: +10 base × combo multiplier
// Wrong pop: -5 (resets combo)
// Combo: 1x, 1.5x, 2x, 2.5x, 3x (at streaks 0, 2, 4, 6, 8+)

const BASE_POINTS = 10;
const WRONG_PENALTY = 5;
const COMBO_THRESHOLDS = [0, 2, 4, 6, 8];
const COMBO_MULTIPLIERS = [1, 1.5, 2, 2.5, 3];

function getComboMultiplier(streak: number): number {
  for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
    if (streak >= COMBO_THRESHOLDS[i]) return COMBO_MULTIPLIERS[i];
  }
  return 1;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENCOURAGING MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

const LEVEL_MSGS = [
  'Great Start! 🌟', 'Super! 💫', 'Amazing! ⭐', 'Fantastic! 🎉',
  'Brilliant! 💎', 'Incredible! 🌈', 'Outstanding! 🦋', 'Phenomenal! 👑',
  'Legendary! 🔥', 'Spectacular! 🚀', 'Magnificent! 🎊', "You're a Star! ✨",
  'Mind-blowing! 💖', 'Unstoppable! 🏆', 'Champion! 🥇',
];

const COMBO_MSGS = ['Nice! 🔥', 'Combo! ⚡', 'On Fire! 🌟', 'Superb! 💫', 'MEGA! 🚀'];
const WRONG_MSGS = ['Oops! Try the right color 💪', 'Almost! 🌈', 'Keep going! 💖'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BALLOON SIZE (responsive, min touch target 60px)
// ═══════════════════════════════════════════════════════════════════════════════

const BALLOON_W = Math.max(60, Math.min(SW * 0.18, 80));
const BALLOON_H = BALLOON_W * 1.25;

// ═══════════════════════════════════════════════════════════════════════════════
// BALLOON VIEW
// ═══════════════════════════════════════════════════════════════════════════════

interface BalloonViewProps {
  balloon: Balloon;
  color: typeof ALL_COLORS[0];
  onTap: (id: number) => void;
}

const BalloonView: React.FC<BalloonViewProps> = React.memo(({ balloon, color, onTap }) => {
  if (balloon.popped) return null;

  return (
    <Animated.View
      style={[
        st.balloonWrap,
        {
          left: balloon.x,
          transform: [
            { translateY: balloon.animY },
            { translateX: balloon.animX },
            { scale: balloon.animScale },
          ],
          opacity: balloon.animOpacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onTap(balloon.id)}
        style={st.balloonTouch}
      >
        {/* Balloon body - glossy oval */}
        <View style={[st.balloonBody, { backgroundColor: color.hex }]}>
          {/* Glossy highlight */}
          <View style={st.balloonShine} />
          <View style={st.balloonShine2} />
        </View>
        {/* Knot */}
        <View style={[st.balloonKnot, { borderTopColor: color.hex }]} />
        {/* String */}
        <View style={[st.balloonString, { backgroundColor: color.hex + '66' }]} />
      </TouchableOpacity>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

let balloonId = 0;

const TapPopEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [correctPops, setCorrectPops] = useState(0);
  const [targetColorIdx, setTargetColorIdx] = useState(0);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [timeLeft, setTimeLeft] = useState(LEVELS[0].levelDuration);
  const [showTransition, setShowTransition] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [comboMsg, setComboMsg] = useState<string | null>(null);

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const levelRef = useRef(level);
  levelRef.current = level;
  const correctPopsRef = useRef(correctPops);
  correctPopsRef.current = correctPops;

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const elapsedRef = useRef(0);

  const levelConfig = LEVELS[Math.min(level - 1, LEVELS.length - 1)];

  // ── Pick available colors for this level ──
  const availableColors = ALL_COLORS.slice(0, levelConfig.colorCount);

  // ── Feedback ──
  const showFeedbackMsg = (msg: string, duration = 800) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedbackMsg(msg);
    feedbackTimerRef.current = setTimeout(() => setFeedbackMsg(null), duration);
  };

  // ── Spawn balloons for current level ──
  const spawnBalloons = useCallback((config: LevelConfig, targetIdx: number) => {
    const newBalloons: Balloon[] = [];
    const count = config.balloonCount;
    const targetCount = Math.max(2, config.targetPerLevel);

    for (let i = 0; i < count; i++) {
      const isTarget = i < targetCount;
      const colorIdx = isTarget
        ? targetIdx
        : (() => {
            let c;
            do { c = Math.floor(Math.random() * config.colorCount); } while (c === targetIdx);
            return c;
          })();

      const x = 10 + Math.random() * (SW - BALLOON_W - 20);
      newBalloons.push({
        id: ++balloonId,
        colorIdx,
        x,
        isTarget,
        popped: false,
        animY: new Animated.Value(GAME_H + 50),
        animX: new Animated.Value(0),
        animScale: new Animated.Value(1),
        animOpacity: new Animated.Value(1),
        riseDuration: config.riseDuration + Math.random() * 800 - 400,
      });
    }

    // Shuffle so targets aren't always first
    const shuffled = newBalloons.sort(() => Math.random() - 0.5);
    setBalloons(shuffled);

    // Animate rise with stagger
    shuffled.forEach((b, idx) => {
      setTimeout(() => {
        Animated.timing(b.animY, {
          toValue: -BALLOON_H - 30,
          duration: b.riseDuration,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start();

        // Horizontal drift (gentle sway)
        if (config.driftAmount > 0) {
          Animated.loop(
            Animated.sequence([
              Animated.timing(b.animX, {
                toValue: config.driftAmount * (Math.random() > 0.5 ? 1 : -1),
                duration: 1500 + Math.random() * 1000,
                easing: Easing.inOut(Easing.sine),
                useNativeDriver: false,
              }),
              Animated.timing(b.animX, {
                toValue: config.driftAmount * (Math.random() > 0.5 ? -1 : 1),
                duration: 1500 + Math.random() * 1000,
                easing: Easing.inOut(Easing.sine),
                useNativeDriver: false,
              }),
            ])
          ).start();
        }
      }, idx * config.spawnDelay);
    });
  }, []);

  // ── Start a level ──
  const startLevel = useCallback((lvl: number) => {
    const config = LEVELS[Math.min(lvl - 1, LEVELS.length - 1)];
    const targetIdx = Math.floor(Math.random() * config.colorCount);
    setTargetColorIdx(targetIdx);
    setCorrectPops(0);
    setCombo(0);
    setTimeLeft(config.levelDuration);
    setShowTransition(false);
    setFeedbackMsg(null);
    setComboMsg(null);
    elapsedRef.current = 0;

    spawnBalloons(config, targetIdx);

    // Countdown timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Level time's up - advance
          advanceLevel(levelRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [spawnBalloons]);

  // ── Advance to next level ──
  const advanceLevel = useCallback((currentLvl: number) => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (currentLvl >= TOTAL_LEVELS) {
      // Game complete
      setShowComplete(true);
      SoundManager.play('win');
      setTimeout(() => onComplete(scoreRef.current), 2000);
    } else {
      setShowTransition(true);
      SoundManager.play('success');
      setTimeout(() => {
        const next = currentLvl + 1;
        setLevel(next);
        startLevel(next);
      }, 1500);
    }
  }, [onComplete, startLevel]);

  // ── Initial mount ──
  useEffect(() => {
    startLevel(1);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    };
  }, []);

  // ── Handle balloon tap ──
  const handleTap = useCallback((id: number) => {
    setBalloons(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1 || prev[idx].popped) return prev;

      const balloon = { ...prev[idx], popped: true };
      const updated = [...prev];
      updated[idx] = balloon;

      if (balloon.isTarget) {
        // ── CORRECT POP ──
        SoundManager.play('success');
        const newCombo = combo + 1;
        setCombo(newCombo);
        const mult = getComboMultiplier(newCombo);
        const pts = Math.round(BASE_POINTS * mult);
        setScore(s => s + pts);
        setCorrectPops(c => {
          const newC = c + 1;
          correctPopsRef.current = newC;

          // Show combo message for streaks
          if (newCombo >= 3) {
            setComboMsg(`${pickRandom(COMBO_MSGS)} x${mult}`);
            setTimeout(() => setComboMsg(null), 800);
          }

          // Check if enough correct pops AND minimum 5 seconds elapsed
          const config = LEVELS[Math.min(levelRef.current - 1, LEVELS.length - 1)];
          if (newC >= config.targetPerLevel && elapsedRef.current >= 5) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeout(() => advanceLevel(levelRef.current), 600);
          }

          return newC;
        });

        // Pop animation
        Animated.parallel([
          Animated.timing(prev[idx].animScale, {
            toValue: 1.5,
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.timing(prev[idx].animOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start();
      } else {
        // ── WRONG POP ──
        SoundManager.play('fail');
        setCombo(0);
        setScore(s => Math.max(0, s - WRONG_PENALTY));
        showFeedbackMsg(pickRandom(WRONG_MSGS));

        // Gentle shake instead of pop
        Animated.sequence([
          Animated.timing(prev[idx].animScale, { toValue: 1.2, duration: 60, useNativeDriver: false }),
          Animated.timing(prev[idx].animScale, { toValue: 0.85, duration: 60, useNativeDriver: false }),
          Animated.spring(prev[idx].animScale, { toValue: 1, friction: 4, useNativeDriver: false }),
        ]).start();
        // Un-pop wrong balloon (let them try again)
        setTimeout(() => {
          setBalloons(p => {
            const u = [...p];
            const uIdx = u.findIndex(b => b.id === id);
            if (uIdx !== -1) u[uIdx] = { ...u[uIdx], popped: false };
            return u;
          });
        }, 300);
      }

      return updated;
    });
  }, [combo, advanceLevel]);

  // ── Derived ──
  const progress = (level - 1 + (correctPops / Math.max(1, levelConfig.targetPerLevel))) / TOTAL_LEVELS;
  const targetColor = availableColors[targetColorIdx] || ALL_COLORS[0];
  const comboMult = getComboMultiplier(combo);

  // ── Completion screen ──
  if (showComplete) {
    return (
      <GameShell game={game} progress={1} onExit={onExit} onTimeUp={() => onComplete(score)}>
        <View style={st.completeBg}>
          <Text style={st.completeEmoji}>🎉</Text>
          <Text style={st.completeTitle}>Champion! 🏆</Text>
          <Text style={st.completeSub}>You completed all {TOTAL_LEVELS} levels!</Text>
          <View style={st.completeScoreBox}>
            <Text style={st.completeScoreLabel}>Final Score</Text>
            <Text style={st.completeScoreVal}>{score}</Text>
          </View>
          <View style={st.sparkleRow}>
            {'🎈⭐🎈⭐🎈'.split('').map((s, i) => (
              <Text key={i} style={st.sparkleText}>{s}</Text>
            ))}
          </View>
        </View>
      </GameShell>
    );
  }

  // ── Main game ──
  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)}>
      <View style={st.gameArea}>
        {/* Sky */}
        <View style={st.skyTop} />
        <View style={st.skyBottom} />

        {/* Prompt banner */}
        <View style={st.promptBanner}>
          <Text style={st.promptText}>Pop all</Text>
          <View style={[st.colorSwatch, { backgroundColor: targetColor.hex }]} />
          <Text style={[st.promptColorName, { color: targetColor.hex }]}>
            {targetColor.name}
          </Text>
          <Text style={st.promptText}>balloons!</Text>
        </View>

        {/* Stats row */}
        <View style={st.statsRow}>
          <View style={st.levelBadge}>
            <Text style={st.levelText}>Lv {level}/{TOTAL_LEVELS}</Text>
          </View>
          <View style={st.timeBadge}>
            <Text style={[st.timeText, timeLeft <= 5 && st.timeWarning]}>
              ⏱ {timeLeft}s
            </Text>
          </View>
          <View style={st.scoreBadge}>
            <Text style={st.scoreText}>⭐ {score}</Text>
          </View>
        </View>

        {/* Combo indicator */}
        {combo >= 2 && (
          <View style={st.comboBadge}>
            <Text style={st.comboText}>🔥 x{comboMult}</Text>
          </View>
        )}

        {/* Combo message */}
        {comboMsg && (
          <View style={st.comboMsgBubble}>
            <Text style={st.comboMsgText}>{comboMsg}</Text>
          </View>
        )}

        {/* Feedback message */}
        {feedbackMsg && (
          <View style={st.feedbackBubble}>
            <Text style={st.feedbackText}>{feedbackMsg}</Text>
          </View>
        )}

        {/* Progress within level */}
        <View style={st.levelProgressRow}>
          <Text style={st.levelProgressText}>
            {correctPops}/{levelConfig.targetPerLevel} popped
          </Text>
          <View style={st.levelProgressBar}>
            <View style={[st.levelProgressFill, {
              width: `${Math.min(100, (correctPops / levelConfig.targetPerLevel) * 100)}%`,
              backgroundColor: targetColor.hex,
            }]} />
          </View>
        </View>

        {/* Level transition overlay */}
        {showTransition && (
          <View style={st.transitionOverlay}>
            <Text style={st.transitionEmoji}>🌟</Text>
            <Text style={st.transitionTitle}>
              {LEVEL_MSGS[level - 1] || 'Great Job!'}
            </Text>
            <Text style={st.transitionSub}>Get ready for Level {level + 1}!</Text>
          </View>
        )}

        {/* Balloons */}
        <View style={st.balloonField} pointerEvents="box-none">
          {balloons.map(b => (
            <BalloonView
              key={b.id}
              balloon={b}
              color={availableColors[b.colorIdx] || ALL_COLORS[0]}
              onTap={handleTap}
            />
          ))}
        </View>
      </View>
    </GameShell>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const st = StyleSheet.create({
  // Game area
  gameArea: {
    flex: 1, width: '100%', overflow: 'hidden', borderRadius: 20, position: 'relative',
  },
  skyTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    backgroundColor: '#B3E5FC', borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  skyBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
    backgroundColor: '#E1F5FE', borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },

  // Prompt
  promptBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFFDD', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 30, marginTop: 6, marginHorizontal: 16, zIndex: 50, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
  },
  promptText: { fontSize: 16, fontWeight: 'bold', color: '#37474F' },
  promptColorName: { fontSize: 18, fontWeight: '900' },
  colorSwatch: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#FFF',
    elevation: 2,
  },

  // Stats
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 12, marginTop: 6, zIndex: 50,
  },
  levelBadge: {
    backgroundColor: '#FF9800DD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14,
  },
  levelText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  timeBadge: {
    backgroundColor: '#FFFFFFCC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14,
  },
  timeText: { fontSize: 14, fontWeight: '800', color: '#37474F' },
  timeWarning: { color: '#E53935' },
  scoreBadge: {
    backgroundColor: '#7C4DFFDD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14,
  },
  scoreText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

  // Combo
  comboBadge: {
    position: 'absolute', top: 88, right: 12, zIndex: 60,
    backgroundColor: '#FF6D00EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14,
  },
  comboText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  comboMsgBubble: {
    position: 'absolute', top: '40%', alignSelf: 'center', zIndex: 200,
    backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24,
    elevation: 8,
  },
  comboMsgText: { fontSize: 20, fontWeight: '900', color: '#FF6D00' },

  // Feedback
  feedbackBubble: {
    position: 'absolute', bottom: 40, alignSelf: 'center', zIndex: 200,
    backgroundColor: '#FFF', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    elevation: 6,
  },
  feedbackText: { fontSize: 15, fontWeight: '700', color: '#5D4037' },

  // Level progress
  levelProgressRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    marginTop: 6, zIndex: 50, gap: 8,
  },
  levelProgressText: { fontSize: 11, fontWeight: '700', color: '#FFF', minWidth: 60 },
  levelProgressBar: {
    flex: 1, height: 8, backgroundColor: '#FFFFFF55', borderRadius: 4, overflow: 'hidden',
  },
  levelProgressFill: { height: '100%', borderRadius: 4 },

  // Transition
  transitionOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 300,
    backgroundColor: '#FFFFFFEE', alignItems: 'center', justifyContent: 'center',
    borderRadius: 20,
  },
  transitionEmoji: { fontSize: 56, marginBottom: 8 },
  transitionTitle: { fontSize: 28, fontWeight: '900', color: '#388E3C', marginBottom: 4 },
  transitionSub: { fontSize: 16, fontWeight: '600', color: '#666' },

  // Balloons
  balloonField: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  balloonWrap: {
    position: 'absolute', width: BALLOON_W,
    height: BALLOON_H + 28, alignItems: 'center', zIndex: 10,
  },
  balloonTouch: { alignItems: 'center' },
  balloonBody: {
    width: BALLOON_W, height: BALLOON_H,
    borderRadius: BALLOON_W / 2, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 5, elevation: 5, overflow: 'hidden',
  },
  balloonShine: {
    position: 'absolute', top: 8, left: BALLOON_W * 0.18,
    width: BALLOON_W * 0.22, height: BALLOON_H * 0.28,
    borderRadius: BALLOON_W * 0.12,
    backgroundColor: '#FFFFFF55', transform: [{ rotate: '-25deg' }],
  },
  balloonShine2: {
    position: 'absolute', top: BALLOON_H * 0.15, left: BALLOON_W * 0.15,
    width: BALLOON_W * 0.12, height: BALLOON_H * 0.15,
    borderRadius: BALLOON_W * 0.06,
    backgroundColor: '#FFFFFF33',
  },
  balloonKnot: {
    width: 0, height: 0,
    borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    marginTop: -1,
  },
  balloonString: { width: 1.5, height: 16, borderRadius: 1 },

  // Completion
  completeBg: {
    flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 24, padding: 30,
  },
  completeEmoji: { fontSize: 64, marginBottom: 12 },
  completeTitle: { fontSize: 32, fontWeight: '900', color: '#2E7D32', marginBottom: 4 },
  completeSub: { fontSize: 18, fontWeight: '600', color: '#558B2F', marginBottom: 20 },
  completeScoreBox: {
    backgroundColor: '#FFF', paddingHorizontal: 30, paddingVertical: 16,
    borderRadius: 20, alignItems: 'center', elevation: 3, marginBottom: 20,
  },
  completeScoreLabel: { fontSize: 14, color: '#9E9E9E', fontWeight: '600', marginBottom: 4 },
  completeScoreVal: { fontSize: 42, fontWeight: '900', color: '#FF6D00' },
  sparkleRow: { flexDirection: 'row', gap: 8 },
  sparkleText: { fontSize: 28 },
});

export default TapPopEngine;
