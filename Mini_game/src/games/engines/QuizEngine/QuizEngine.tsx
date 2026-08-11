import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
} from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
  category?: string;
}

type Variant = 'classic' | 'sound' | 'spinner' | 'battle';

// ---------------------------------------------------------------------------
// Embedded question data
// ---------------------------------------------------------------------------

const soundQuestions: Question[] = [
  { id: 'sq1', question: 'Which animal says "Moo"? \uD83D\uDD0A', options: ['\uD83D\uDC04 Cow', '\uD83D\uDC15 Dog', '\uD83D\uDC31 Cat', '\uD83D\uDC14 Chicken'], answer: '\uD83D\uDC04 Cow' },
  { id: 'sq2', question: 'Which animal says "Woof"? \uD83D\uDD0A', options: ['\uD83D\uDC31 Cat', '\uD83D\uDC15 Dog', '\uD83D\uDC38 Frog', '\uD83D\uDC14 Chicken'], answer: '\uD83D\uDC15 Dog' },
  { id: 'sq3', question: 'Which animal says "Meow"? \uD83D\uDD0A', options: ['\uD83D\uDC15 Dog', '\uD83D\uDC31 Cat', '\uD83D\uDC04 Cow', '\uD83E\uDD81 Lion'], answer: '\uD83D\uDC31 Cat' },
  { id: 'sq4', question: 'Which animal says "Ribbit"? \uD83D\uDD0A', options: ['\uD83D\uDC38 Frog', '\uD83D\uDC0D Snake', '\uD83D\uDC1F Fish', '\uD83D\uDC14 Chicken'], answer: '\uD83D\uDC38 Frog' },
  { id: 'sq5', question: 'Which animal says "Roar"? \uD83D\uDD0A', options: ['\uD83D\uDC31 Cat', '\uD83D\uDC15 Dog', '\uD83E\uDD81 Lion', '\uD83D\uDC2D Mouse'], answer: '\uD83E\uDD81 Lion' },
];

const spinnerQuestions: Question[] = [
  { id: 'sp1', category: 'Science', question: 'What planet is closest to the Sun?', options: ['Mercury', 'Venus', 'Earth', 'Mars'], answer: 'Mercury' },
  { id: 'sp2', category: 'Nature', question: 'What do bees make?', options: ['Honey', 'Milk', 'Juice', 'Sugar'], answer: 'Honey' },
  { id: 'sp3', category: 'History', question: 'Who was the first person on the Moon?', options: ['Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'John Glenn'], answer: 'Neil Armstrong' },
  { id: 'sp4', category: 'Fun Facts', question: 'How many legs does a spider have?', options: ['6', '8', '10', '4'], answer: '8' },
  { id: 'sp5', category: 'Science', question: 'What gas do plants breathe in?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Helium'], answer: 'Carbon Dioxide' },
  { id: 'sp6', category: 'Nature', question: 'What is the tallest animal?', options: ['Elephant', 'Giraffe', 'Horse', 'Bear'], answer: 'Giraffe' },
];

const battleQuestions: Question[] = [
  { id: 'bq1', question: 'What is the largest ocean?', options: ['Atlantic', 'Pacific', 'Indian', 'Arctic'], answer: 'Pacific' },
  { id: 'bq2', question: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: '7' },
  { id: 'bq3', question: 'What color is an emerald?', options: ['Red', 'Blue', 'Green', 'Yellow'], answer: 'Green' },
  { id: 'bq4', question: 'What is the fastest land animal?', options: ['Lion', 'Cheetah', 'Horse', 'Eagle'], answer: 'Cheetah' },
  { id: 'bq5', question: 'Which planet has rings?', options: ['Mars', 'Jupiter', 'Saturn', 'Venus'], answer: 'Saturn' },
  { id: 'bq6', question: 'What is frozen water called?', options: ['Steam', 'Ice', 'Rain', 'Fog'], answer: 'Ice' },
  { id: 'bq7', question: 'How many colors in a rainbow?', options: ['5', '6', '7', '8'], answer: '7' },
  { id: 'bq8', question: 'What do caterpillars turn into?', options: ['Birds', 'Butterflies', 'Bees', 'Beetles'], answer: 'Butterflies' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Science: '#4CAF50',
  History: '#2196F3',
  Nature: '#FF9800',
  'Fun Facts': '#9C27B0',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Utility: shuffle an array (Fisher-Yates)
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===========================================================================
// CLASSIC VARIANT
// ===========================================================================

const ClassicQuiz: React.FC<{
  questions: Question[];
  onComplete: (score: number) => void;
  onExit: () => void;
  game: GameProps['game'];
}> = ({ questions, onComplete, onExit, game }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;
  const current = questions[currentIndex];

  const handleAnswer = useCallback(
    (option: string) => {
      if (selectedOption !== null) return;
      const correct = option === current.answer;
      setSelectedOption(option);
      setIsCorrect(correct);

      if (correct) {
        SoundManager.play('success');
      } else {
        SoundManager.play('fail');
      }

      const newScore = correct ? score + 10 : score;
      if (correct) setScore(newScore);

      // Brief pause to show feedback, then advance
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          // Fade out and in
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: false,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: false,
            }),
          ]).start();
          setCurrentIndex((i) => i + 1);
          setSelectedOption(null);
          setIsCorrect(null);
        } else {
          SoundManager.play('win');
          onComplete(newScore);
        }
      }, 700);
    },
    [selectedOption, current, score, currentIndex, questions, fadeAnim, onComplete],
  );

  if (!current) return null;

  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)}>
      <Animated.View style={[styles.classicCard, { opacity: fadeAnim }]}>
        <Text style={styles.classicQuestionNumber}>
          Question {currentIndex + 1} of {questions.length}
        </Text>
        <Text style={styles.classicQuestionText}>{current.question}</Text>

        <View style={styles.classicOptionsContainer}>
          {current.options.map((opt) => {
            let bg = '#E3F2FD';
            let border = '#90CAF9';
            let textColor = '#1565C0';
            if (selectedOption !== null) {
              if (opt === current.answer) {
                bg = '#C8E6C9';
                border = '#4CAF50';
                textColor = '#2E7D32';
              } else if (opt === selectedOption) {
                bg = '#FFCDD2';
                border = '#E53935';
                textColor = '#C62828';
              }
            }
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.classicOptionButton, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(opt)}
                activeOpacity={0.7}
              >
                <Text style={[styles.classicOptionText, { color: textColor }]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.classicScoreRow}>
          <Text style={styles.classicScoreText}>Score: {score}</Text>
        </View>
      </Animated.View>
    </GameShell>
  );
};

// ===========================================================================
// SOUND VARIANT
// ===========================================================================

const SoundQuiz: React.FC<{
  questions: Question[];
  onComplete: (score: number) => void;
  onExit: () => void;
  game: GameProps['game'];
}> = ({ questions, onComplete, onExit, game }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Animations for each card
  const cardAnims = useRef(questions[0]?.options.map(() => new Animated.Value(1)) ?? []).current;
  const shakeAnims = useRef(questions[0]?.options.map(() => new Animated.Value(0)) ?? []).current;

  const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;
  const current = questions[currentIndex];

  // Reset card animations when question changes
  useEffect(() => {
    cardAnims.forEach((a) => a.setValue(1));
    shakeAnims.forEach((a) => a.setValue(0));
  }, [currentIndex]);

  const handleAnswer = useCallback(
    (option: string, optionIndex: number) => {
      if (selectedOption !== null) return;
      const correct = option === current.answer;
      setSelectedOption(option);
      setIsCorrect(correct);

      if (correct) {
        SoundManager.play('success');
        // Bounce animation on the correct card
        Animated.sequence([
          Animated.timing(cardAnims[optionIndex], {
            toValue: 1.15,
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.timing(cardAnims[optionIndex], {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
          }),
        ]).start();
      } else {
        SoundManager.play('fail');
        // Shake animation on the wrong card
        Animated.sequence([
          Animated.timing(shakeAnims[optionIndex], { toValue: 10, duration: 50, useNativeDriver: false }),
          Animated.timing(shakeAnims[optionIndex], { toValue: -10, duration: 50, useNativeDriver: false }),
          Animated.timing(shakeAnims[optionIndex], { toValue: 8, duration: 50, useNativeDriver: false }),
          Animated.timing(shakeAnims[optionIndex], { toValue: -8, duration: 50, useNativeDriver: false }),
          Animated.timing(shakeAnims[optionIndex], { toValue: 0, duration: 50, useNativeDriver: false }),
        ]).start();
      }

      const newScore = correct ? score + 10 : score;
      if (correct) setScore(newScore);

      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((i) => i + 1);
          setSelectedOption(null);
          setIsCorrect(null);
        } else {
          SoundManager.play('win');
          onComplete(newScore);
        }
      }, 900);
    },
    [selectedOption, current, score, currentIndex, questions, cardAnims, shakeAnims, onComplete],
  );

  if (!current) return null;

  // Extract emoji and name from option string like "🐄 Cow"
  const parseOption = (opt: string) => {
    const parts = opt.split(' ');
    const emoji = parts[0];
    const name = parts.slice(1).join(' ');
    return { emoji, name };
  };

  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)}>
      <ScrollView
        contentContainerStyle={styles.soundScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.soundQuestionContainer}>
          <Text style={styles.soundQuestionText}>{current.question}</Text>
        </View>

        <View style={styles.soundGrid}>
          {current.options.map((opt, idx) => {
            const { emoji, name } = parseOption(opt);
            let borderColor = '#E0E0E0';
            let bgColor = '#FFFFFF';
            if (selectedOption !== null) {
              if (opt === current.answer) {
                borderColor = '#4CAF50';
                bgColor = '#E8F5E9';
              } else if (opt === selectedOption) {
                borderColor = '#E53935';
                bgColor = '#FFEBEE';
              }
            }
            return (
              <Animated.View
                key={opt}
                style={[
                  styles.soundCard,
                  {
                    borderColor,
                    backgroundColor: bgColor,
                    transform: [
                      { scale: cardAnims[idx] || new Animated.Value(1) },
                      { translateX: shakeAnims[idx] || new Animated.Value(0) },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.soundCardTouchable}
                  onPress={() => handleAnswer(opt, idx)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.soundCardEmoji}>{emoji}</Text>
                  <Text style={styles.soundCardName}>{name}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.soundScoreRow}>
          <Text style={styles.soundScoreText}>Score: {score}</Text>
        </View>
      </ScrollView>
    </GameShell>
  );
};

// ===========================================================================
// SPINNER VARIANT
// ===========================================================================

const SpinnerQuiz: React.FC<{
  questions: Question[];
  onComplete: (score: number) => void;
  onExit: () => void;
  game: GameProps['game'];
}> = ({ questions, onComplete, onExit, game }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'spinning' | 'category' | 'question'>('spinning');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const categoryOpacity = useRef(new Animated.Value(0)).current;
  const questionSlide = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;
  const current = questions[currentIndex];

  const categories = ['Science', 'History', 'Nature', 'Fun Facts'];
  const CATEGORY_EMOJIS: Record<string, string> = {
    Science: '🔬', History: '📜', Nature: '🌿', 'Fun Facts': '🎉',
  };

  // Calculate target rotation so the pointer (top) lands on the correct category.
  // Segments are laid out clockwise: Science=0°, History=90°, Nature=180°, Fun Facts=270°.
  // The pointer is at top (0°). To land on a category at angle A, the wheel must
  // rotate so that segment is at top → final rotation = 360 - A (mod 360).
  // We add 3 full spins (1080°) for visual effect.
  const targetCatIndex = categories.indexOf(current?.category || 'Science');
  const segAngle = (targetCatIndex / categories.length) * 360; // where the segment sits
  const targetDeg = 1080 + (360 - segAngle); // land pointer on that segment

  // Start spinning when phase is spinning
  useEffect(() => {
    if (phase === 'spinning') {
      spinAnim.setValue(0);
      categoryOpacity.setValue(0);
      questionSlide.setValue(SCREEN_WIDTH);

      // Spin for 2 seconds with deceleration
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        setPhase('category');
      });
    }
  }, [phase, currentIndex]);

  // Show category label then transition to question
  useEffect(() => {
    if (phase === 'category') {
      Animated.timing(categoryOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        setTimeout(() => {
          setPhase('question');
        }, 800);
      });
    }
  }, [phase]);

  // Slide question in from the right
  useEffect(() => {
    if (phase === 'question') {
      Animated.timing(questionSlide, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    }
  }, [phase]);

  const handleAnswer = useCallback(
    (option: string) => {
      if (selectedOption !== null) return;
      const correct = option === current.answer;
      setSelectedOption(option);

      if (correct) {
        SoundManager.play('success');
      } else {
        SoundManager.play('fail');
      }

      const newScore = correct ? score + 10 : score;
      if (correct) setScore(newScore);

      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setSelectedOption(null);
          setCurrentIndex((i) => i + 1);
          setPhase('spinning');
        } else {
          SoundManager.play('win');
          onComplete(newScore);
        }
      }, 800);
    },
    [selectedOption, current, score, currentIndex, questions, onComplete],
  );

  if (!current) return null;

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${targetDeg}deg`], // spins to land on correct category
  });

  const catColor = CATEGORY_COLORS[current.category || 'Science'] || '#4CAF50';

  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)}>
      <ScrollView
        contentContainerStyle={styles.spinnerScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Spinner Wheel */}
        {(phase === 'spinning' || phase === 'category') && (
          <View style={styles.spinnerWheelArea}>
            <Animated.View
              style={[
                styles.spinnerWheel,
                { transform: [{ rotate: spinRotation }] },
              ]}
            >
              {categories.map((cat, idx) => {
                const angle = (idx / categories.length) * 360;
                const color = CATEGORY_COLORS[cat] || '#999';
                const emoji = CATEGORY_EMOJIS[cat] || '⭐';
                return (
                  <View
                    key={cat}
                    style={[
                      styles.spinnerSegment,
                      {
                        backgroundColor: color,
                        transform: [
                          { rotate: `${angle}deg` },
                          { translateY: -60 },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.spinnerSegmentEmoji}>{emoji}</Text>
                    <Text style={styles.spinnerSegmentText} numberOfLines={1}>
                      {cat}
                    </Text>
                  </View>
                );
              })}
              <View style={styles.spinnerCenter}>
                <Text style={styles.spinnerCenterEmoji}>{'\u2B50'}</Text>
              </View>
            </Animated.View>

            {/* Pointer */}
            <View style={styles.spinnerPointer}>
              <Text style={styles.spinnerPointerText}>{'\u25BC'}</Text>
            </View>

            {/* Category reveal */}
            {phase === 'category' && (
              <Animated.View
                style={[styles.spinnerCategoryReveal, { opacity: categoryOpacity }]}
              >
                <View style={[styles.spinnerCategoryBadge, { backgroundColor: catColor }]}>
                  <Text style={styles.spinnerCategoryText}>{current.category}</Text>
                </View>
              </Animated.View>
            )}
          </View>
        )}

        {/* Question phase */}
        {phase === 'question' && (
          <Animated.View
            style={[
              styles.spinnerQuestionArea,
              { transform: [{ translateX: questionSlide }] },
            ]}
          >
            <View style={[styles.spinnerCategoryTag, { backgroundColor: catColor }]}>
              <Text style={styles.spinnerCategoryTagText}>{current.category}</Text>
            </View>
            <Text style={styles.spinnerQuestionText}>{current.question}</Text>

            <View style={styles.spinnerOptionsContainer}>
              {current.options.map((opt) => {
                let bg = '#F5F5F5';
                let border = '#E0E0E0';
                let textColor = '#333';
                if (selectedOption !== null) {
                  if (opt === current.answer) {
                    bg = '#C8E6C9';
                    border = '#4CAF50';
                    textColor = '#2E7D32';
                  } else if (opt === selectedOption) {
                    bg = '#FFCDD2';
                    border = '#E53935';
                    textColor = '#C62828';
                  }
                }
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.spinnerOptionButton,
                      { backgroundColor: bg, borderColor: border },
                    ]}
                    onPress={() => handleAnswer(opt)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.spinnerOptionText, { color: textColor }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        <View style={styles.spinnerScoreRow}>
          <Text style={styles.spinnerScoreText}>Score: {score}</Text>
        </View>
      </ScrollView>
    </GameShell>
  );
};

// ===========================================================================
// BATTLE VARIANT
// ===========================================================================

const BattleQuiz: React.FC<{
  questions: Question[];
  onComplete: (score: number) => void;
  onExit: () => void;
  game: GameProps['game'];
}> = ({ questions, onComplete, onExit, game }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [aiAnswered, setAiAnswered] = useState(false);
  const [roundResult, setRoundResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [roundActive, setRoundActive] = useState(true);

  const timerBarAnim = useRef(new Animated.Value(0)).current;
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerAnsweredRef = useRef(false);
  const aiAnsweredRef = useRef(false);

  const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;
  const current = questions[currentIndex];

  // Start round
  useEffect(() => {
    if (!current) return;
    startRound();
    return () => cleanupRound();
  }, [currentIndex]);

  const cleanupRound = () => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
  };

  const startRound = () => {
    playerAnsweredRef.current = false;
    aiAnsweredRef.current = false;
    setSelectedOption(null);
    setAiAnswered(false);
    setRoundResult(null);
    setShowResult(false);
    setTimeLeft(5);
    setRoundActive(true);

    // Timer bar animation: 5 seconds
    timerBarAnim.setValue(0);
    Animated.timing(timerBarAnim, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Countdown ticker
    let t = 5;
    tickRef.current = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) {
        if (tickRef.current) clearInterval(tickRef.current);
        // Time up - if player hasn't answered, they lose the round
        if (!playerAnsweredRef.current) {
          handleTimeUp();
        }
      }
    }, 1000);

    // AI answers after random 1-4 seconds
    const aiDelay = 1000 + Math.random() * 3000;
    aiTimerRef.current = setTimeout(() => {
      if (!playerAnsweredRef.current) {
        aiAnsweredRef.current = true;
        setAiAnswered(true);
        // AI gets it right ~60% of the time
        const aiCorrect = Math.random() < 0.6;
        if (aiCorrect) {
          setAiScore((s) => s + 10);
        }
      }
    }, aiDelay);
  };

  const handleTimeUp = () => {
    if (playerAnsweredRef.current) return;
    playerAnsweredRef.current = true;
    setRoundActive(false);
    cleanupRound();
    // Player didn't answer in time
    setRoundResult('lose');
    setShowResult(true);

    setTimeout(() => advanceRound(playerScore, aiScore), 1500);
  };

  const handleAnswer = useCallback(
    (option: string) => {
      if (!roundActive || selectedOption !== null) return;
      playerAnsweredRef.current = true;
      setSelectedOption(option);
      setRoundActive(false);
      cleanupRound();

      const correct = option === current.answer;
      let newPlayerScore = playerScore;
      let newAiScore = aiScore;

      if (correct) {
        SoundManager.play('success');
        newPlayerScore = playerScore + 10;
        setPlayerScore(newPlayerScore);
        // If player answered first and correctly, AI gets 0
        if (!aiAnsweredRef.current) {
          setRoundResult('win');
        } else {
          // Both answered, player correct
          setRoundResult('win');
        }
      } else {
        SoundManager.play('fail');
        setRoundResult('lose');
      }

      setShowResult(true);
      setTimeout(() => advanceRound(newPlayerScore, newAiScore), 1500);
    },
    [roundActive, selectedOption, current, playerScore, aiScore, questions, currentIndex, onComplete],
  );

  const advanceRound = (pScore: number, aScore: number) => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      SoundManager.play('win');
      onComplete(pScore);
    }
  };

  if (!current) return null;

  const timerBarWidth = timerBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(playerScore)}>
      <View style={styles.battleContainer}>
        {/* AI Area (top) */}
        <View style={styles.battleAiArea}>
          <View style={styles.battleAiHeader}>
            <Text style={styles.battleAiAvatar}>{'\uD83E\uDD16'}</Text>
            <View style={styles.battleAiInfo}>
              <Text style={styles.battleAiName}>Robo Quiz</Text>
              <Text style={styles.battleAiScoreText}>Score: {aiScore}</Text>
            </View>
            <View style={styles.battleAiStatus}>
              {aiAnswered && (
                <Text style={styles.battleAiStatusText}>{'\u2705'} Answered!</Text>
              )}
              {!aiAnswered && roundActive && (
                <Text style={styles.battleAiThinking}>Thinking...</Text>
              )}
            </View>
          </View>
          <View style={styles.battleAiProgressBar}>
            <View
              style={[
                styles.battleAiProgressFill,
                { width: `${questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0}%` },
              ]}
            />
          </View>
        </View>

        {/* Timer Bar */}
        <View style={styles.battleTimerContainer}>
          <Animated.View
            style={[
              styles.battleTimerBar,
              {
                width: timerBarWidth,
                backgroundColor: timeLeft <= 2 ? '#E53935' : '#4CAF50',
              },
            ]}
          />
          <Text style={styles.battleTimerText}>{timeLeft}s</Text>
        </View>

        {/* Round Result Overlay */}
        {showResult && (
          <View style={styles.battleResultOverlay}>
            <View style={styles.battleResultRow}>
              <View style={styles.battleResultSide}>
                <Text style={styles.battleResultEmoji}>
                  {roundResult === 'win' ? '\u2705' : '\u274C'}
                </Text>
                <Text style={styles.battleResultLabel}>You</Text>
              </View>
              <Text style={styles.battleResultVs}>VS</Text>
              <View style={styles.battleResultSide}>
                <Text style={styles.battleResultEmoji}>
                  {aiAnswered ? '\u2705' : '\u274C'}
                </Text>
                <Text style={styles.battleResultLabel}>{'\uD83E\uDD16'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Player Area (bottom) */}
        <View style={styles.battlePlayerArea}>
          <Text style={styles.battleQuestionNumber}>
            Round {currentIndex + 1} of {questions.length}
          </Text>
          <Text style={styles.battleQuestionText}>{current.question}</Text>

          <View style={styles.battleOptionsGrid}>
            {current.options.map((opt) => {
              let bg = '#FFF8E1';
              let border = '#FFD54F';
              let textColor = '#F57F17';
              if (selectedOption !== null) {
                if (opt === current.answer) {
                  bg = '#C8E6C9';
                  border = '#4CAF50';
                  textColor = '#2E7D32';
                } else if (opt === selectedOption) {
                  bg = '#FFCDD2';
                  border = '#E53935';
                  textColor = '#C62828';
                }
              }
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.battleOptionButton,
                    { backgroundColor: bg, borderColor: border },
                  ]}
                  onPress={() => handleAnswer(opt)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.battleOptionText, { color: textColor }]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.battlePlayerScoreRow}>
            <Text style={styles.battlePlayerScoreText}>Your Score: {playerScore}</Text>
          </View>
        </View>
      </View>
    </GameShell>
  );
};

// ===========================================================================
// MAIN QUIZ ENGINE - VARIANT ROUTER
// ===========================================================================

const QuizEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const variant: Variant = (game.initialData?.variant as Variant) || 'classic';

  const resolveQuestions = (): Question[] => {
    const provided = game.initialData?.questions;
    switch (variant) {
      case 'sound':
        return provided && provided.length > 0 ? provided : soundQuestions;
      case 'spinner':
        return provided && provided.length > 0 ? provided : spinnerQuestions;
      case 'battle':
        return provided && provided.length > 0 ? provided : battleQuestions;
      case 'classic':
      default:
        // Backward compatible: questions may be in initialData.questions or initialData itself (array)
        if (provided && provided.length > 0) return provided;
        if (Array.isArray(game.initialData) && game.initialData.length > 0) return game.initialData;
        return [];
    }
  };

  const questions = resolveQuestions();

  if (questions.length === 0) {
    return (
      <GameShell game={game} progress={0} onExit={onExit}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>{'\uD83E\uDD14'}</Text>
          <Text style={styles.emptyText}>No questions found!</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={onExit}>
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </GameShell>
    );
  }

  switch (variant) {
    case 'sound':
      return <SoundQuiz questions={questions} onComplete={onComplete} onExit={onExit} game={game} />;
    case 'spinner':
      return <SpinnerQuiz questions={questions} onComplete={onComplete} onExit={onExit} game={game} />;
    case 'battle':
      return <BattleQuiz questions={questions} onComplete={onComplete} onExit={onExit} game={game} />;
    case 'classic':
    default:
      return <ClassicQuiz questions={questions} onComplete={onComplete} onExit={onExit} game={game} />;
  }
};

// ===========================================================================
// STYLES
// ===========================================================================

const styles = StyleSheet.create({
  // -------------------------------------------------------------------------
  // Empty / fallback
  // -------------------------------------------------------------------------
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#555',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // -------------------------------------------------------------------------
  // Classic variant
  // -------------------------------------------------------------------------
  classicCard: {
    width: '100%',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  classicQuestionNumber: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    fontWeight: '600',
  },
  classicQuestionText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 28,
    color: '#333',
    lineHeight: 32,
  },
  classicOptionsContainer: {
    width: '100%',
    gap: 12,
  },
  classicOptionButton: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    minHeight: 60,
    justifyContent: 'center',
  },
  classicOptionText: {
    fontSize: 18,
    fontWeight: '700',
  },
  classicScoreRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  classicScoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },

  // -------------------------------------------------------------------------
  // Sound variant
  // -------------------------------------------------------------------------
  soundScrollContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  soundQuestionContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  soundQuestionText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#E65100',
    lineHeight: 34,
  },
  soundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  soundCard: {
    width: 120,
    height: 120,
    borderRadius: 20,
    borderWidth: 3,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  soundCardTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  soundCardEmoji: {
    fontSize: 50,
  },
  soundCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    marginTop: 4,
    textAlign: 'center',
  },
  soundScoreRow: {
    marginTop: 24,
    alignItems: 'center',
  },
  soundScoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6F00',
  },

  // -------------------------------------------------------------------------
  // Spinner variant
  // -------------------------------------------------------------------------
  spinnerScrollContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  spinnerWheelArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 340,
    marginBottom: 20,
  },
  spinnerWheel: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#FFFDE7',
    borderWidth: 6,
    borderColor: '#FFD54F',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  spinnerSegment: {
    position: 'absolute',
    width: 100,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  spinnerSegmentEmoji: {
    fontSize: 18,
    marginBottom: 1,
  },
  spinnerSegmentText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  spinnerCenter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFD54F',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    zIndex: 10,
    borderWidth: 3,
    borderColor: '#FFA000',
  },
  spinnerCenterEmoji: {
    fontSize: 28,
  },
  spinnerPointer: {
    position: 'absolute',
    top: -4,
    alignSelf: 'center',
    zIndex: 20,
  },
  spinnerPointerText: {
    fontSize: 36,
    color: '#E53935',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  spinnerCategoryReveal: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  spinnerCategoryBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 4,
  },
  spinnerCategoryText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  spinnerQuestionArea: {
    width: '100%',
    alignItems: 'center',
    padding: 8,
  },
  spinnerCategoryTag: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 12,
  },
  spinnerCategoryTagText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  spinnerQuestionText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 24,
    lineHeight: 30,
  },
  spinnerOptionsContainer: {
    width: '100%',
    gap: 12,
  },
  spinnerOptionButton: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    minHeight: 60,
    justifyContent: 'center',
  },
  spinnerOptionText: {
    fontSize: 18,
    fontWeight: '700',
  },
  spinnerScoreRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  spinnerScoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9C27B0',
  },

  // -------------------------------------------------------------------------
  // Battle variant
  // -------------------------------------------------------------------------
  battleContainer: {
    flex: 1,
    width: '100%',
  },
  battleAiArea: {
    backgroundColor: '#E8EAF6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  battleAiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  battleAiAvatar: {
    fontSize: 36,
    marginRight: 10,
  },
  battleAiInfo: {
    flex: 1,
  },
  battleAiName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3F51B5',
  },
  battleAiScoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C6BC0',
  },
  battleAiStatus: {
    alignItems: 'flex-end',
  },
  battleAiStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  battleAiThinking: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    fontStyle: 'italic',
  },
  battleAiProgressBar: {
    height: 6,
    backgroundColor: '#C5CAE9',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  battleAiProgressFill: {
    height: '100%',
    backgroundColor: '#3F51B5',
    borderRadius: 3,
  },
  battleTimerContainer: {
    height: 28,
    backgroundColor: '#E0E0E0',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    justifyContent: 'center',
  },
  battleTimerBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 14,
  },
  battleTimerText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    zIndex: 2,
  },
  battleResultOverlay: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  battleResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  battleResultSide: {
    alignItems: 'center',
  },
  battleResultEmoji: {
    fontSize: 36,
  },
  battleResultLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    marginTop: 4,
  },
  battleResultVs: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF6F00',
  },
  battlePlayerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  battleQuestionNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    marginBottom: 6,
  },
  battleQuestionText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
    lineHeight: 30,
    paddingHorizontal: 8,
  },
  battleOptionsGrid: {
    width: '100%',
    gap: 10,
  },
  battleOptionButton: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    minHeight: 60,
    justifyContent: 'center',
  },
  battleOptionText: {
    fontSize: 18,
    fontWeight: '700',
  },
  battlePlayerScoreRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  battlePlayerScoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6F00',
  },
});

export default QuizEngine;
