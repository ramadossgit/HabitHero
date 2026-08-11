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
// Problem Generator
// ---------------------------------------------------------------------------
interface MathProblem {
  question: string;
  answer: number;
  options: number[];
}

function generateProblem(difficulty: string): MathProblem {
  const ops =
    difficulty === 'easy'
      ? ['+']
      : difficulty === 'medium'
      ? ['+', '-']
      : ['+', '-', '\u00D7'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  const max = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 12;
  let a = Math.floor(Math.random() * max) + 1;
  let b = Math.floor(Math.random() * max) + 1;
  if (op === '-' && b > a) [a, b] = [b, a]; // no negatives
  const answer =
    op === '+' ? a + b : op === '-' ? a - b : a * b;
  const question = `${a} ${op} ${b} = ?`;

  // Generate 2 wrong answers close to correct but never equal
  let wrong1 =
    answer + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
  let wrong2 =
    answer + (Math.random() > 0.5 ? 2 : -2) * (Math.floor(Math.random() * 2) + 1);

  // Ensure no duplicates and no negative wrong answers for kids
  if (wrong1 === answer) wrong1 = answer + 3;
  if (wrong2 === answer || wrong2 === wrong1) wrong2 = answer - 3;
  if (wrong1 < 0) wrong1 = answer + 2;
  if (wrong2 < 0) wrong2 = answer + 4;
  if (wrong2 === wrong1) wrong2 = wrong1 + 1;
  if (wrong2 === answer) wrong2 = answer + 5;

  const options = [answer, wrong1, wrong2].sort(() => Math.random() - 0.5);
  return { question, answer, options };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOTAL_PROBLEMS = 15;
const INITIAL_LIVES = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const MathRunnerEngine = ({ game, onComplete, onExit }: GameProps) => {
  const difficulty = game.difficulty || 'easy';
  const colors = game.themeColors || {
    primary: '#4A90E2',
    secondary: '#E3F2FD',
    background: '#F5FCFF',
    accent: '#4CAF50',
  };

  // -- State ----------------------------------------------------------------
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [currentProblem, setCurrentProblem] = useState<MathProblem>(
    generateProblem(difficulty),
  );
  const [problemIndex, setProblemIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showStreak, setShowStreak] = useState(false);
  const [victory, setVictory] = useState(false);

  // -- Animated values ------------------------------------------------------
  const characterY = useRef(new Animated.Value(0)).current;
  const obstacleX = useRef(new Animated.Value(SCREEN_WIDTH * 0.5)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const streakOpacity = useRef(new Animated.Value(0)).current;
  const streakScale = useRef(new Animated.Value(0.5)).current;
  const buttonScales = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scorePopOpacity = useRef(new Animated.Value(0)).current;
  const scorePopY = useRef(new Animated.Value(0)).current;

  // Obstacle animation ref (so we can stop it)
  const obstacleAnim = useRef<Animated.CompositeAnimation | null>(null);

  // -- Obstacle slide animation ---------------------------------------------
  const startObstacleSlide = useCallback(() => {
    obstacleX.setValue(SCREEN_WIDTH * 0.5);
    const anim = Animated.loop(
      Animated.timing(obstacleX, {
        toValue: -60,
        duration: 3000,
        useNativeDriver: false,
      }),
    );
    obstacleAnim.current = anim;
    anim.start();
  }, [obstacleX]);

  useEffect(() => {
    if (!gameOver && !victory) {
      startObstacleSlide();
    }
    return () => {
      obstacleAnim.current?.stop();
    };
  }, [problemIndex, gameOver, victory, startObstacleSlide]);

  // -- Animations -----------------------------------------------------------
  const animateJump = () => {
    Animated.sequence([
      Animated.spring(characterY, {
        toValue: -80,
        speed: 20,
        bounciness: 14,
        useNativeDriver: false,
      }),
      Animated.spring(characterY, {
        toValue: 0,
        speed: 16,
        bounciness: 8,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animateShake = () => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 10, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeX, { toValue: -10, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeX, { toValue: 8, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeX, { toValue: -8, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: false }),
    ]).start();
  };

  const animateStreak = () => {
    setShowStreak(true);
    streakOpacity.setValue(0);
    streakScale.setValue(0.5);
    Animated.parallel([
      Animated.spring(streakScale, {
        toValue: 1.2,
        speed: 14,
        bounciness: 10,
        useNativeDriver: false,
      }),
      Animated.timing(streakOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(streakOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }).start(() => setShowStreak(false));
      }, 800);
    });
  };

  const animateScorePop = (points: number) => {
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
  };

  const animateButtonPress = (index: number) => {
    Animated.sequence([
      Animated.timing(buttonScales[index], {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: false,
      }),
      Animated.spring(buttonScales[index], {
        toValue: 1,
        speed: 20,
        bounciness: 10,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const showOverlay = () => {
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  // -- Answer handler -------------------------------------------------------
  const handleAnswer = (selected: number, buttonIndex: number) => {
    if (answered || gameOver || victory) return;
    setAnswered(true);
    setSelectedAnswer(selected);
    animateButtonPress(buttonIndex);

    const correct = selected === currentProblem.answer;
    setIsCorrect(correct);

    // Stop obstacle
    obstacleAnim.current?.stop();

    if (correct) {
      SoundManager.play('success');
      animateJump();

      const newStreak = streak + 1;
      setStreak(newStreak);

      let earnedPoints = 10;
      if (newStreak >= 3) {
        earnedPoints += 5;
        animateStreak();
      }
      setScore((prev) => prev + earnedPoints);
      animateScorePop(earnedPoints);
    } else {
      SoundManager.play('fail');
      animateShake();
      setStreak(0);
      const newLives = lives - 1;
      setLives(newLives);

      if (newLives <= 0) {
        setTimeout(() => {
          setGameOver(true);
          showOverlay();
        }, 600);
        return;
      }
    }

    // Next problem after a short pause
    setTimeout(() => {
      const nextIndex = problemIndex + 1;
      if (nextIndex >= TOTAL_PROBLEMS) {
        // All problems answered -> victory
        setVictory(true);
        showOverlay();
        return;
      }
      setProblemIndex(nextIndex);
      setCurrentProblem(generateProblem(difficulty));
      setAnswered(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }, 900);
  };

  // -- Complete callback (from overlay) -------------------------------------
  const handleFinish = () => {
    onComplete(score);
  };

  // -- If game over or victory triggered from lives, call onComplete --------
  useEffect(() => {
    // We do NOT auto-call here -- user taps the overlay button
  }, [gameOver, victory]);

  // -- Progress -------------------------------------------------------------
  const progress = TOTAL_PROBLEMS > 0 ? problemIndex / TOTAL_PROBLEMS : 0;

  // -- Render lives ---------------------------------------------------------
  const renderLives = () => {
    const hearts: React.ReactNode[] = [];
    for (let i = 0; i < INITIAL_LIVES; i++) {
      hearts.push(
        <Text
          key={i}
          style={[
            styles.heart,
            i >= lives && styles.heartLost,
          ]}
        >
          {i < lives ? '\u2764\uFE0F' : '\u1F5A4'}
        </Text>,
      );
    }
    return hearts;
  };

  // -- Button color helper --------------------------------------------------
  const btnColors = ['#4A90E2', '#FF8C42', '#4CAF50'];

  const getButtonStyle = (option: number, index: number) => {
    if (answered && selectedAnswer === option) {
      return isCorrect ? styles.correctButton : styles.wrongButton;
    }
    if (answered && option === currentProblem.answer) {
      return styles.correctButton;
    }
    return { backgroundColor: btnColors[index % btnColors.length] };
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
      <Animated.View
        style={[styles.wrapper, { transform: [{ translateX: shakeX }] }]}
      >
        {/* ---- Top bar: Lives, Score, Streak ---- */}
        <View style={styles.topBar}>
          <View style={styles.livesRow}>{renderLives()}</View>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreLabel, { color: colors.primary }]}>Score</Text>
            <Text style={[styles.scoreValue, { color: colors.primary }]}>{score}</Text>
            {/* Score pop animation */}
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
              +{streak >= 3 ? 15 : 10}
            </Animated.Text>
          </View>
          <View style={styles.streakContainer}>
            {streak >= 2 && (
              <Text style={styles.streakCount}>
                {'\u26A1'} {streak}
              </Text>
            )}
          </View>
        </View>

        {/* ---- Streak banner ---- */}
        {showStreak && (
          <Animated.View
            style={[
              styles.streakBanner,
              {
                opacity: streakOpacity,
                transform: [{ scale: streakScale }],
              },
            ]}
          >
            <Text style={styles.streakText}>
              {'\uD83D\uDD25'} Streak!
            </Text>
          </Animated.View>
        )}

        {/* ---- Track area ---- */}
        <View style={styles.trackContainer}>
          <View style={styles.track}>
            {/* Character */}
            <Animated.View
              style={[
                styles.character,
                { transform: [{ translateY: characterY }] },
              ]}
            >
              <Text style={styles.characterEmoji}>{'\uD83C\uDFC3'}</Text>
            </Animated.View>

            {/* Obstacle */}
            <Animated.View
              style={[
                styles.obstacle,
                { transform: [{ translateX: obstacleX }] },
              ]}
            >
              <Text style={styles.obstacleEmoji}>{'\uD83E\uDEA8'}</Text>
            </Animated.View>

            {/* Track line */}
            <View style={[styles.trackLine, { backgroundColor: colors.primary + '40' }]} />
          </View>
        </View>

        {/* ---- Problem display ---- */}
        <View style={[styles.problemCard, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.problemText, { color: colors.primary }]}>
            {currentProblem.question}
          </Text>
          <Text style={styles.problemCounter}>
            {problemIndex + 1} / {TOTAL_PROBLEMS}
          </Text>
        </View>

        {/* ---- Answer buttons ---- */}
        <View style={styles.answersRow}>
          {currentProblem.options.map((option, index) => (
            <Animated.View
              key={`${problemIndex}-${index}`}
              style={{ transform: [{ scale: buttonScales[index] }] }}
            >
              <TouchableOpacity
                style={[styles.answerButton, getButtonStyle(option, index)]}
                onPress={() => handleAnswer(option, index)}
                disabled={answered}
                activeOpacity={0.7}
              >
                <Text style={styles.answerText}>{option}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* ---- Game Over / Victory Overlay ---- */}
        {(gameOver || victory) && (
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <View style={styles.overlayCard}>
              <Text style={styles.overlayEmoji}>
                {victory ? '\uD83C\uDF89' : '\uD83D\uDE22'}
              </Text>
              <Text style={styles.overlayTitle}>
                {victory ? 'Victory!' : 'Game Over!'}
              </Text>
              <Text style={styles.overlayScore}>Final Score: {score}</Text>
              {victory && (
                <Text style={styles.overlaySubtext}>
                  You answered all {TOTAL_PROBLEMS} problems!
                </Text>
              )}
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
      </Animated.View>
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
  },

  // -- Top bar --
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  livesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  heart: {
    fontSize: 24,
  },
  heartLost: {
    opacity: 0.25,
  },
  scoreContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scorePop: {
    position: 'absolute',
    top: -10,
    right: -30,
    fontSize: 18,
    fontWeight: 'bold',
  },
  streakContainer: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  streakCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B00',
  },

  // -- Streak banner --
  streakBanner: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 100,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  streakText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // -- Track area --
  trackContainer: {
    marginVertical: 12,
    height: 120,
    justifyContent: 'flex-end',
  },
  track: {
    height: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  character: {
    position: 'absolute',
    bottom: 12,
    left: 30,
    zIndex: 10,
  },
  characterEmoji: {
    fontSize: 60,
  },
  obstacle: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    zIndex: 5,
  },
  obstacleEmoji: {
    fontSize: 50,
  },
  trackLine: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },

  // -- Problem card --
  problemCard: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  problemText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  problemCounter: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
    fontWeight: '600',
  },

  // -- Answer buttons --
  answersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  answerButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  answerText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  correctButton: {
    backgroundColor: '#4CAF50',
  },
  wrongButton: {
    backgroundColor: '#F44336',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
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

export default MathRunnerEngine;
