import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

// ---------------------------------------------------------------------------
// Word Data
// ---------------------------------------------------------------------------
interface WordEntry {
  word: string;
  hint: string;
  extraLetters: string;
}

const wordSets: Record<string, WordEntry[]> = {
  easy: [
    { word: 'CAT', hint: '\uD83D\uDC31 A furry pet', extraLetters: 'DOG' },
    { word: 'SUN', hint: '\u2600\uFE0F Shines in the sky', extraLetters: 'MBR' },
    { word: 'DOG', hint: '\uD83D\uDC15 Man\'s best friend', extraLetters: 'CAT' },
    { word: 'FISH', hint: '\uD83D\uDC1F Lives in water', extraLetters: 'BKR' },
    { word: 'BIRD', hint: '\uD83D\uDC26 Has wings', extraLetters: 'MPS' },
    { word: 'TREE', hint: '\uD83C\uDF33 Grows tall', extraLetters: 'BPN' },
  ],
  medium: [
    { word: 'HAPPY', hint: '\uD83D\uDE0A Feeling good', extraLetters: 'BRXZ' },
    { word: 'WATER', hint: '\uD83D\uDCA7 You drink it', extraLetters: 'BFKM' },
    { word: 'HOUSE', hint: '\uD83C\uDFE0 You live in it', extraLetters: 'BKWZ' },
    { word: 'PLANT', hint: '\uD83C\uDF31 Grows from seed', extraLetters: 'BFRX' },
    { word: 'MUSIC', hint: '\uD83C\uDFB5 You listen to it', extraLetters: 'BDFX' },
    { word: 'BEACH', hint: '\uD83C\uDFD6\uFE0F Sand and sea', extraLetters: 'DKMW' },
  ],
  hard: [
    { word: 'RAINBOW', hint: '\uD83C\uDF08 After the rain', extraLetters: 'DCFMP' },
    { word: 'DOLPHIN', hint: '\uD83D\uDC2C Smart ocean animal', extraLetters: 'BCKWX' },
    { word: 'VOLCANO', hint: '\uD83C\uDF0B Hot mountain', extraLetters: 'BDFWX' },
    { word: 'GIRAFFE', hint: '\uD83E\uDD92 Tallest animal', extraLetters: 'BCDKM' },
    { word: 'PENGUIN', hint: '\uD83D\uDC27 Antarctic bird', extraLetters: 'BDFMX' },
    { word: 'THUNDER', hint: '\u26A1 Loud sky sound', extraLetters: 'BFKMX' },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
interface PlacedLetter {
  letter: string;
  tileIndex: number; // index in the available tiles array
}

const PASTEL_COLORS = [
  '#FF8A80', '#FF80AB', '#EA80FC', '#B388FF',
  '#82B1FF', '#80D8FF', '#84FFFF', '#A7FFEB',
  '#B9F6CA', '#CCFF90', '#F4FF81', '#FFE57F',
  '#FFD180', '#FF9E80',
];

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const WordBuilderEngine = ({ game, onComplete, onExit }: GameProps) => {
  const difficulty = game.difficulty || 'easy';
  const colors = game.themeColors || {
    primary: '#4A90E2',
    secondary: '#E3F2FD',
    background: '#F5FCFF',
    accent: '#4CAF50',
  };

  // Pick words for this session
  const allWords = useRef<WordEntry[]>(
    shuffleArray(wordSets[difficulty] || wordSets.easy),
  ).current;
  const totalWords = allWords.length;

  // -- State ----------------------------------------------------------------
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Per-word state
  const [targetWord, setTargetWord] = useState('');
  const [hint, setHint] = useState('');
  const [placedLetters, setPlacedLetters] = useState<(PlacedLetter | null)[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [usedTileIndices, setUsedTileIndices] = useState<Set<number>>(new Set());
  const [checking, setChecking] = useState(false);
  const [wordResult, setWordResult] = useState<'correct' | 'wrong' | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // -- Animated values ------------------------------------------------------
  const slotAnims = useRef<Animated.Value[]>([]);
  const slotColorAnims = useRef<Animated.Value[]>([]);
  const tileScaleAnims = useRef<Animated.Value[]>([]);
  const successBannerOpacity = useRef(new Animated.Value(0)).current;
  const successBannerScale = useRef(new Animated.Value(0.5)).current;
  const hintSlideX = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scorePopOpacity = useRef(new Animated.Value(0)).current;
  const scorePopY = useRef(new Animated.Value(0)).current;

  // -- Load word ------------------------------------------------------------
  const loadWord = useCallback(
    (index: number) => {
      const entry = allWords[index];
      const word = entry.word;
      setTargetWord(word);
      setHint(entry.hint);

      const wordLetters = word.split('');
      const extraLetters = entry.extraLetters.split('');
      const allLetters = shuffleArray([...wordLetters, ...extraLetters]);

      setAvailableLetters(allLetters);
      setPlacedLetters(new Array(word.length).fill(null));
      setUsedTileIndices(new Set());
      setChecking(false);
      setWordResult(null);

      // Reset animations for new word
      slotAnims.current = word.split('').map(() => new Animated.Value(1));
      slotColorAnims.current = word.split('').map(() => new Animated.Value(0));
      tileScaleAnims.current = allLetters.map(() => new Animated.Value(1));

      // Slide-in hint
      hintSlideX.setValue(300);
      Animated.spring(hintSlideX, {
        toValue: 0,
        speed: 14,
        bounciness: 8,
        useNativeDriver: false,
      }).start();
    },
    [allWords, hintSlideX],
  );

  useEffect(() => {
    loadWord(0);
  }, [loadWord]);

  // -- Place a letter -------------------------------------------------------
  const handleTileTap = (letter: string, tileIndex: number) => {
    if (checking || usedTileIndices.has(tileIndex)) return;

    // Find next empty slot
    const emptySlotIndex = placedLetters.findIndex((l) => l === null);
    if (emptySlotIndex === -1) return;

    // Animate tile press
    Animated.sequence([
      Animated.timing(tileScaleAnims.current[tileIndex], {
        toValue: 0.8,
        duration: 60,
        useNativeDriver: false,
      }),
      Animated.spring(tileScaleAnims.current[tileIndex], {
        toValue: 1,
        speed: 20,
        bounciness: 12,
        useNativeDriver: false,
      }),
    ]).start();

    // Animate slot bounce
    Animated.sequence([
      Animated.timing(slotAnims.current[emptySlotIndex], {
        toValue: 1.15,
        duration: 80,
        useNativeDriver: false,
      }),
      Animated.spring(slotAnims.current[emptySlotIndex], {
        toValue: 1,
        speed: 20,
        bounciness: 10,
        useNativeDriver: false,
      }),
    ]).start();

    const newPlaced = [...placedLetters];
    newPlaced[emptySlotIndex] = { letter, tileIndex };
    setPlacedLetters(newPlaced);

    const newUsed = new Set(usedTileIndices);
    newUsed.add(tileIndex);
    setUsedTileIndices(newUsed);

    SoundManager.play('tap');

    // Check if all slots filled
    const allFilled = newPlaced.every((l) => l !== null);
    if (allFilled) {
      checkWord(newPlaced);
    }
  };

  // -- Remove a placed letter -----------------------------------------------
  const handleSlotTap = (slotIndex: number) => {
    if (checking) return;
    const placed = placedLetters[slotIndex];
    if (!placed) return;

    const newPlaced = [...placedLetters];
    newPlaced[slotIndex] = null;
    setPlacedLetters(newPlaced);

    const newUsed = new Set(usedTileIndices);
    newUsed.delete(placed.tileIndex);
    setUsedTileIndices(newUsed);
  };

  // -- Check word -----------------------------------------------------------
  const checkWord = (letters: (PlacedLetter | null)[]) => {
    setChecking(true);
    const built = letters.map((l) => l?.letter || '').join('');

    if (built === targetWord) {
      // Correct! Cascade green glow
      setWordResult('correct');
      SoundManager.play('success');

      // Cascade animation left to right
      letters.forEach((_, i) => {
        setTimeout(() => {
          Animated.spring(slotAnims.current[i], {
            toValue: 1.2,
            speed: 18,
            bounciness: 14,
            useNativeDriver: false,
          }).start(() => {
            Animated.spring(slotAnims.current[i], {
              toValue: 1,
              speed: 16,
              bounciness: 8,
              useNativeDriver: false,
            }).start();
          });
        }, i * 120);
      });

      // Score pop
      const newScore = score + 20;
      setScore(newScore);
      scorePopOpacity.setValue(1);
      scorePopY.setValue(0);
      Animated.parallel([
        Animated.timing(scorePopY, {
          toValue: -40,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(scorePopOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ]).start();

      // Success banner
      setShowSuccessBanner(true);
      successBannerOpacity.setValue(0);
      successBannerScale.setValue(0.5);
      Animated.parallel([
        Animated.spring(successBannerScale, {
          toValue: 1,
          speed: 14,
          bounciness: 10,
          useNativeDriver: false,
        }),
        Animated.timing(successBannerOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();

      // Move to next word after delay
      setTimeout(() => {
        Animated.timing(successBannerOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start(() => setShowSuccessBanner(false));

        const nextIndex = currentWordIndex + 1;
        if (nextIndex >= totalWords) {
          // All words done
          setIsComplete(true);
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          }).start();
        } else {
          setCurrentWordIndex(nextIndex);
          loadWord(nextIndex);
        }
      }, 1400);
    } else {
      // Wrong -- shake and clear
      setWordResult('wrong');
      SoundManager.play('fail');

      // Shake all slots
      const shakeAnimations = slotAnims.current.map((anim) =>
        Animated.sequence([
          Animated.timing(anim, { toValue: 1.08, duration: 50, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0.92, duration: 50, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 1.05, duration: 50, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0.95, duration: 50, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 1, duration: 50, useNativeDriver: false }),
        ]),
      );
      Animated.parallel(shakeAnimations).start();

      // Clear after brief red display
      setTimeout(() => {
        setPlacedLetters(new Array(targetWord.length).fill(null));
        setUsedTileIndices(new Set());
        setChecking(false);
        setWordResult(null);
      }, 800);
    }
  };

  // -- Finish handler -------------------------------------------------------
  const handleFinish = () => {
    onComplete(score);
  };

  // -- Progress -------------------------------------------------------------
  const progress = totalWords > 0 ? currentWordIndex / totalWords : 0;

  // -- Tile color by index --------------------------------------------------
  const getTileColor = (index: number) => PASTEL_COLORS[index % PASTEL_COLORS.length];

  // -- Slot border / bg based on result -------------------------------------
  const getSlotStyle = (slotIndex: number) => {
    const filled = placedLetters[slotIndex] !== null;
    if (wordResult === 'correct') {
      return {
        borderColor: '#4CAF50',
        backgroundColor: '#C8E6C9',
        borderStyle: 'solid' as const,
      };
    }
    if (wordResult === 'wrong') {
      return {
        borderColor: '#F44336',
        backgroundColor: '#FFCDD2',
        borderStyle: 'solid' as const,
      };
    }
    if (filled) {
      return {
        borderColor: colors.primary,
        backgroundColor: colors.secondary,
        borderStyle: 'solid' as const,
      };
    }
    return {
      borderColor: '#BDBDBD',
      backgroundColor: '#FAFAFA',
      borderStyle: 'dashed' as const,
    };
  };

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------
  return (
    <GameShell
      game={game}
      progress={progress}
      onExit={onExit}
      onTimeUp={() => onComplete(score)}
    >
      <View style={styles.wrapper}>
        {/* ---- Score ---- */}
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreLabel, { color: colors.primary }]}>Score</Text>
          <Text style={[styles.scoreValue, { color: colors.primary }]}>{score}</Text>
          <Animated.Text
            style={[
              styles.scorePop,
              {
                opacity: scorePopOpacity,
                transform: [{ translateY: scorePopY }],
                color: colors.accent,
              },
            ]}
          >
            +20
          </Animated.Text>
        </View>

        {/* ---- Hint card ---- */}
        <Animated.View
          style={[
            styles.hintCard,
            {
              backgroundColor: colors.secondary,
              transform: [{ translateX: hintSlideX }],
            },
          ]}
        >
          <Text style={styles.hintEmoji}>
            {hint.split(' ')[0] || ''}
          </Text>
          <Text style={[styles.hintText, { color: colors.primary }]}>
            {hint.substring(hint.indexOf(' ') + 1)}
          </Text>
          <Text style={styles.wordCounter}>
            Word {currentWordIndex + 1} of {totalWords}
          </Text>
        </Animated.View>

        {/* ---- Letter slots ---- */}
        <View style={styles.slotsRow}>
          {placedLetters.map((placed, slotIndex) => {
            const slotStyle = getSlotStyle(slotIndex);
            const animScale = slotAnims.current[slotIndex] || new Animated.Value(1);
            return (
              <Animated.View
                key={`slot-${slotIndex}`}
                style={{ transform: [{ scale: animScale }] }}
              >
                <TouchableOpacity
                  style={[
                    styles.slot,
                    {
                      borderColor: slotStyle.borderColor,
                      backgroundColor: slotStyle.backgroundColor,
                      borderStyle: slotStyle.borderStyle,
                    },
                  ]}
                  onPress={() => handleSlotTap(slotIndex)}
                  disabled={checking || !placed}
                  activeOpacity={0.7}
                >
                  {placed && (
                    <Text style={[styles.slotLetter, { color: colors.primary }]}>
                      {placed.letter}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* ---- Success banner ---- */}
        {showSuccessBanner && (
          <Animated.View
            style={[
              styles.successBanner,
              {
                opacity: successBannerOpacity,
                transform: [{ scale: successBannerScale }],
              },
            ]}
          >
            <Text style={styles.successText}>
              {'\u2728'} Correct! +20
            </Text>
          </Animated.View>
        )}

        {/* ---- Available letter tiles ---- */}
        <View style={styles.tilesContainer}>
          {availableLetters.map((letter, tileIndex) => {
            const isUsed = usedTileIndices.has(tileIndex);
            const scaleAnim =
              tileScaleAnims.current[tileIndex] || new Animated.Value(1);
            return (
              <Animated.View
                key={`tile-${tileIndex}`}
                style={{ transform: [{ scale: scaleAnim }] }}
              >
                <TouchableOpacity
                  style={[
                    styles.tile,
                    {
                      backgroundColor: isUsed
                        ? '#E0E0E0'
                        : getTileColor(tileIndex),
                    },
                    isUsed && styles.tileUsed,
                  ]}
                  onPress={() => handleTileTap(letter, tileIndex)}
                  disabled={isUsed || checking}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tileLetter,
                      isUsed && styles.tileLetterUsed,
                    ]}
                  >
                    {letter}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* ---- Completion overlay ---- */}
        {isComplete && (
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <View style={styles.overlayCard}>
              <Text style={styles.overlayEmoji}>{'\uD83C\uDF89'}</Text>
              <Text style={styles.overlayTitle}>All Words Complete!</Text>
              <Text style={styles.overlayScore}>Final Score: {score}</Text>
              <Text style={styles.overlaySubtext}>
                You built {totalWords} words!
              </Text>
              <TouchableOpacity
                style={[styles.overlayButton, { backgroundColor: colors.accent }]}
                onPress={handleFinish}
                activeOpacity={0.8}
              >
                <Text style={styles.overlayButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </GameShell>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },

  // -- Score --
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 8,
    gap: 6,
    position: 'relative',
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  scorePop: {
    position: 'absolute',
    top: -14,
    right: -30,
    fontSize: 18,
    fontWeight: 'bold',
  },

  // -- Hint card --
  hintCard: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hintEmoji: {
    fontSize: 60,
    marginBottom: 6,
  },
  hintText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  wordCounter: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontWeight: '600',
  },

  // -- Slots --
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  slot: {
    width: 55,
    height: 55,
    borderRadius: 12,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  slotLetter: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  // -- Success banner --
  successBanner: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    zIndex: 100,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  successText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // -- Tiles --
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  tile: {
    width: 55,
    height: 55,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  tileUsed: {
    elevation: 0,
    shadowOpacity: 0,
    opacity: 0.4,
  },
  tileLetter: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tileLetterUsed: {
    color: '#9E9E9E',
  },

  // -- Overlay --
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    borderRadius: 16,
  },
  overlayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 40,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    width: '85%',
  },
  overlayEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  overlayScore: {
    fontSize: 22,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  overlaySubtext: {
    fontSize: 15,
    color: '#777',
    marginBottom: 20,
    textAlign: 'center',
  },
  overlayButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 30,
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    minHeight: 60,
    justifyContent: 'center',
  },
  overlayButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default WordBuilderEngine;
